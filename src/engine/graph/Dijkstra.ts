import { Graph } from './Graph';

export interface PathResult {
  path: string[]; // List of node IDs from origin to target
  edgeIds: string[]; // List of edge IDs traversed
  totalDistanceM: number;
}

interface HeapItem<T> {
  key: number;
  secondaryKey: string;
  value: T;
}

class MinPriorityQueue<T> {
  private heap: HeapItem<T>[] = [];

  public push(key: number, secondaryKey: string, value: T): void {
    this.heap.push({ key, secondaryKey, value });
    this.bubbleUp(this.heap.length - 1);
  }

  public pop(): HeapItem<T> | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  public get isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private compare(a: HeapItem<T>, b: HeapItem<T>): number {
    if (Math.abs(a.key - b.key) > 1e-9) {
      return a.key - b.key;
    }
    return a.secondaryKey.localeCompare(b.secondaryKey);
  }

  private bubbleUp(index: number): void {
    const item = this.heap[index];
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIdx];
      if (this.compare(item, parent) < 0) {
        this.heap[index] = parent;
        index = parentIdx;
      } else {
        break;
      }
    }
    this.heap[index] = item;
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    const item = this.heap[index];
    while (true) {
      const leftIdx = 2 * index + 1;
      const rightIdx = 2 * index + 2;
      let swapIdx: number | null = null;

      if (leftIdx < length) {
        if (this.compare(this.heap[leftIdx], item) < 0) {
          swapIdx = leftIdx;
        }
      }

      if (rightIdx < length) {
        const compareWith = swapIdx === null ? item : this.heap[leftIdx];
        if (this.compare(this.heap[rightIdx], compareWith) < 0) {
          swapIdx = rightIdx;
        }
      }

      if (swapIdx === null) break;
      this.heap[index] = this.heap[swapIdx];
      index = swapIdx;
    }
    this.heap[index] = item;
  }
}

export class Dijkstra {
  /**
   * Find shortest path from origin to any exit in the graph (Baseline)
   */
  public static findShortestPathToExit(graph: Graph, originNodeId: string): PathResult | null {
    const originNode = graph.getNode(originNodeId);
    if (!originNode) return null;

    if (originNode.type === 'EXIT') {
      return { path: [originNodeId], edgeIds: [], totalDistanceM: 0 };
    }

    const dist = new Map<string, number>();
    const prevNode = new Map<string, string>();
    const prevEdge = new Map<string, string>();
    const visited = new Set<string>();

    const pq = new MinPriorityQueue<string>();

    dist.set(originNodeId, 0);
    pq.push(0, originNodeId, originNodeId);

    while (!pq.isEmpty) {
      const item = pq.pop()!;
      const u = item.value;

      if (visited.has(u)) continue;
      visited.add(u);

      const uNode = graph.getNode(u);
      if (uNode && uNode.type === 'EXIT') {
        // Reconstruct path
        return this.reconstructPath(originNodeId, u, prevNode, prevEdge, dist.get(u)!);
      }

      const currentDist = dist.get(u)!;
      const neighbors = graph.getOutgoingEdges(u);

      for (const neighbor of neighbors) {
        const v = neighbor.targetNodeId;
        const edge = neighbor.edge;
        const edgeWeight = edge.lengthM;

        if (edgeWeight < 0) continue; // Invalid edge weight handled by validation

        const newDist = currentDist + edgeWeight;
        const existingDist = dist.get(v);

        if (existingDist === undefined || newDist < existingDist - 1e-9) {
          dist.set(v, newDist);
          prevNode.set(v, u);
          prevEdge.set(v, edge.id);
          pq.push(newDist, v, v);
        } else if (Math.abs(newDist - (existingDist ?? 0)) <= 1e-9) {
          // Deterministic tie-breaking: prefer lexicographically smaller predecessor node ID
          const existingPrev = prevNode.get(v);
          if (existingPrev && u.localeCompare(existingPrev) < 0) {
            prevNode.set(v, u);
            prevEdge.set(v, edge.id);
          }
        }
      }
    }

    return null;
  }

  /**
   * Find shortest path traversing a specific stairwell to an exit (Zoning)
   * Uses state expansion: state is (nodeId, hasTraversedStairwell: boolean)
   */
  public static findShortestPathWithStairwell(
    graph: Graph,
    originNodeId: string,
    requiredStairwellId: string
  ): PathResult | null {
    const originNode = graph.getNode(originNodeId);
    if (!originNode) return null;

    const initialTraversed = originNode.stairwellId === requiredStairwellId;

    const stateKey = (nodeId: string, traversed: boolean) => `${nodeId}:${traversed ? '1' : '0'}`;

    const dist = new Map<string, number>();
    const prevNode = new Map<string, { nodeId: string; traversed: boolean }>();
    const prevEdge = new Map<string, string>();
    const visited = new Set<string>();

    const pq = new MinPriorityQueue<{ nodeId: string; traversed: boolean }>();

    const startKey = stateKey(originNodeId, initialTraversed);
    dist.set(startKey, 0);
    pq.push(0, startKey, { nodeId: originNodeId, traversed: initialTraversed });

    while (!pq.isEmpty) {
      const item = pq.pop()!;
      const { nodeId: u, traversed: uTraversed } = item.value;
      const uKey = stateKey(u, uTraversed);

      if (visited.has(uKey)) continue;
      visited.add(uKey);

      const uNode = graph.getNode(u);
      if (uNode && uNode.type === 'EXIT' && uTraversed) {
        // Target reached and stairwell traversed
        return this.reconstructStatePath(
          originNodeId,
          initialTraversed,
          u,
          true,
          prevNode,
          prevEdge,
          dist.get(uKey)!
        );
      }

      const currentDist = dist.get(uKey)!;
      const neighbors = graph.getOutgoingEdges(u);

      for (const neighbor of neighbors) {
        const v = neighbor.targetNodeId;
        const edge = neighbor.edge;
        const vNode = graph.getNode(v);

        // Never allow using an edge or landing of a different stairwell
        if (edge.stairwellId && edge.stairwellId !== requiredStairwellId) {
          continue;
        }
        if (vNode?.stairwellId && vNode.stairwellId !== requiredStairwellId) {
          continue;
        }

        const edgeMatchesStairwell = edge.isStair && edge.stairwellId === requiredStairwellId;
        const nodeMatchesStairwell = vNode?.stairwellId === requiredStairwellId;
        const vTraversed = uTraversed || edgeMatchesStairwell || Boolean(nodeMatchesStairwell);

        const vKey = stateKey(v, vTraversed);
        const edgeWeight = edge.lengthM;
        if (edgeWeight < 0) continue;

        const newDist = currentDist + edgeWeight;
        const existingDist = dist.get(vKey);

        if (existingDist === undefined || newDist < existingDist - 1e-9) {
          dist.set(vKey, newDist);
          prevNode.set(vKey, { nodeId: u, traversed: uTraversed });
          prevEdge.set(vKey, edge.id);
          pq.push(newDist, vKey, { nodeId: v, traversed: vTraversed });
        } else if (Math.abs(newDist - (existingDist ?? 0)) <= 1e-9) {
          const existingPrev = prevNode.get(vKey);
          if (existingPrev && u.localeCompare(existingPrev.nodeId) < 0) {
            prevNode.set(vKey, { nodeId: u, traversed: uTraversed });
            prevEdge.set(vKey, edge.id);
          }
        }
      }
    }

    return null;
  }

  private static reconstructPath(
    originId: string,
    targetId: string,
    prevNode: Map<string, string>,
    prevEdge: Map<string, string>,
    totalDistanceM: number
  ): PathResult {
    const path: string[] = [];
    const edgeIds: string[] = [];
    let curr: string | undefined = targetId;

    while (curr !== undefined) {
      path.push(curr);
      if (curr === originId) break;
      const edge = prevEdge.get(curr);
      if (edge) edgeIds.push(edge);
      curr = prevNode.get(curr);
    }

    path.reverse();
    edgeIds.reverse();

    return { path, edgeIds, totalDistanceM };
  }

  private static reconstructStatePath(
    originId: string,
    originTraversed: boolean,
    targetId: string,
    targetTraversed: boolean,
    prevNode: Map<string, { nodeId: string; traversed: boolean }>,
    prevEdge: Map<string, string>,
    totalDistanceM: number
  ): PathResult {
    const stateKey = (nodeId: string, traversed: boolean) => `${nodeId}:${traversed ? '1' : '0'}`;
    const path: string[] = [];
    const edgeIds: string[] = [];

    let currKey = stateKey(targetId, targetTraversed);
    const startKey = stateKey(originId, originTraversed);

    while (true) {
      const parts = currKey.split(':');
      const nodeId = parts[0];
      path.push(nodeId);

      if (currKey === startKey) break;

      const edge = prevEdge.get(currKey);
      if (edge) edgeIds.push(edge);

      const prev = prevNode.get(currKey);
      if (!prev) break;
      currKey = stateKey(prev.nodeId, prev.traversed);
    }

    path.reverse();
    edgeIds.reverse();

    return { path, edgeIds, totalDistanceM };
  }
}
