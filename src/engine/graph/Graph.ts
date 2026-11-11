import { GraphNode, GraphEdge, BuildingData } from '../../types/graph';

export interface DirectedNeighbor {
  targetNodeId: string;
  edge: GraphEdge;
}

export class Graph {
  private nodesMap: Map<string, GraphNode> = new Map();
  private edgesMap: Map<string, GraphEdge> = new Map();
  private adjacencyMap: Map<string, DirectedNeighbor[]> = new Map();

  constructor(data?: BuildingData) {
    if (data) {
      this.load(data);
    }
  }

  public load(data: BuildingData): void {
    this.nodesMap.clear();
    this.edgesMap.clear();
    this.adjacencyMap.clear();

    for (const node of data.nodes) {
      this.nodesMap.set(node.id, { ...node });
      this.adjacencyMap.set(node.id, []);
    }

    for (const edge of data.edges) {
      this.edgesMap.set(edge.id, { ...edge });

      // Build directed adjacency list based on direction
      if (edge.direction === 'BIDIRECTIONAL' || edge.direction === 'A_TO_B') {
        const fromAdj = this.adjacencyMap.get(edge.from);
        if (fromAdj) {
          fromAdj.push({ targetNodeId: edge.to, edge });
        }
      }

      if (edge.direction === 'BIDIRECTIONAL' || edge.direction === 'B_TO_A') {
        const toAdj = this.adjacencyMap.get(edge.to);
        if (toAdj) {
          toAdj.push({ targetNodeId: edge.from, edge });
        }
      }
    }
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodesMap.get(id);
  }

  public getEdge(id: string): GraphEdge | undefined {
    return this.edgesMap.get(id);
  }

  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodesMap.values());
  }

  public getAllEdges(): GraphEdge[] {
    return Array.from(this.edgesMap.values());
  }

  public getOutgoingEdges(nodeId: string): DirectedNeighbor[] {
    return this.adjacencyMap.get(nodeId) || [];
  }

  public getEdgeBetween(fromId: string, toId: string): GraphEdge | undefined {
    const neighbors = this.getOutgoingEdges(fromId);
    const match = neighbors.find((n) => n.targetNodeId === toId);
    return match ? match.edge : undefined;
  }

  public getRooms(): GraphNode[] {
    return this.getAllNodes().filter((n) => n.type === 'ROOM');
  }

  public getOccupiedRooms(): GraphNode[] {
    return this.getAllNodes().filter((n) => n.type === 'ROOM' && (n.initialOccupants ?? 0) > 0);
  }

  public getExits(): GraphNode[] {
    return this.getAllNodes().filter((n) => n.type === 'EXIT');
  }

  public getStairwells(): string[] {
    const stairwells = new Set<string>();
    for (const node of this.getAllNodes()) {
      if (node.stairwellId) stairwells.add(node.stairwellId);
    }
    for (const edge of this.getAllEdges()) {
      if (edge.stairwellId) stairwells.add(edge.stairwellId);
    }
    return Array.from(stairwells).sort();
  }

  public getZones(): string[] {
    const zones = new Set<string>();
    for (const node of this.getAllNodes()) {
      if (node.zoneId) zones.add(node.zoneId);
    }
    return Array.from(zones).sort();
  }
}
