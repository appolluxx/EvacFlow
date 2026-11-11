import { Graph } from '../graph/Graph';
import { Agent } from '../../types/agent';
import { SegmentManager } from '../congestion/SegmentManager';
import { QueueManager } from './QueueManager';

export class MovementEngine {
  private graph: Graph;
  private segmentManager: SegmentManager;
  private queueManager: QueueManager;

  constructor(graph: Graph, segmentManager: SegmentManager, queueManager: QueueManager) {
    this.graph = graph;
    this.segmentManager = segmentManager;
    this.queueManager = queueManager;
  }

  public step(agents: Agent[], currentTimeS: number, dt: number): void {
    // 1. Release WAITING agents whose release time has arrived
    for (const agent of agents) {
      if (agent.state === 'WAITING' && currentTimeS >= agent.scenarioReleaseDelayS) {
        if (!agent.path || agent.path.length < 2) {
          agent.state = 'UNASSIGNED';
          continue;
        }

        const fromNode = agent.path[0];
        const toNode = agent.path[1];
        const firstEdge = this.graph.getEdgeBetween(fromNode, toNode);

        if (!firstEdge) {
          agent.state = 'UNASSIGNED';
          continue;
        }

        // Try entering first segment (index 0) of the first edge
        if (this.segmentManager.hasCapacity(firstEdge.id, 0)) {
          this.segmentManager.addOccupant(agent.id, firstEdge.id, 0);
          agent.state = 'MOVING';
          agent.currentEdgeId = firstEdge.id;
          agent.currentNodeId = null;
          agent.pathIndex = 0;
          agent.distanceOnEdgeM = 0;
        } else {
          // Segment 0 full -> enqueue
          this.queueManager.enqueue(agent.id, firstEdge.id, 0, currentTimeS);
          agent.state = 'QUEUED';
        }
      }
    }

    // 2. Process FIFO Queues
    const { admitted } = this.queueManager.processQueues(this.segmentManager, currentTimeS);
    for (const item of admitted) {
      const agent = agents.find((a) => a.id === item.agentId);
      if (!agent) continue;

      agent.state = 'MOVING';
      const targetSeg = this.segmentManager.getSegment(item.edgeId, item.segmentIndex);
      const startDist = targetSeg ? targetSeg.startM : 0;

      if (agent.currentEdgeId !== item.edgeId) {
        agent.currentEdgeId = item.edgeId;
        agent.pathIndex++;
        agent.distanceOnEdgeM = 0;
      } else {
        agent.distanceOnEdgeM = startDist;
      }
    }

    // 3. Accumulate wait time for agents currently in QUEUED state
    for (const agent of agents) {
      if (agent.state === 'QUEUED') {
        agent.totalWaitTimeS += dt;
        agent.currentSpeedMps = 0;
      }
    }

    // 4. Advance MOVING agents
    for (const agent of agents) {
      if (agent.state !== 'MOVING' || !agent.currentEdgeId) continue;

      const edge = this.graph.getEdge(agent.currentEdgeId);
      if (!edge) {
        agent.state = 'UNASSIGNED';
        continue;
      }

      const curSegIdx = this.segmentManager.getSegmentIndex(edge.id, agent.distanceOnEdgeM);
      const curSeg = this.segmentManager.getSegment(edge.id, curSegIdx);
      const density = curSeg ? curSeg.densityPpm2 : 0;

      const speed = this.segmentManager.calculateSpeed(agent.baseSpeedMps, edge.isStair, density);
      agent.currentSpeedMps = speed;

      const advanceM = speed * dt;
      const proposedDist = agent.distanceOnEdgeM + advanceM;

      // Case A: Still on current edge
      if (proposedDist < edge.lengthM) {
        const nextSegIdx = this.segmentManager.getSegmentIndex(edge.id, proposedDist);

        if (nextSegIdx === curSegIdx) {
          // Within same segment
          agent.distanceOnEdgeM = proposedDist;
        } else {
          // Attempting to cross into next segment on the same edge
          if (this.segmentManager.hasCapacity(edge.id, nextSegIdx)) {
            this.segmentManager.addOccupant(agent.id, edge.id, nextSegIdx);
            agent.distanceOnEdgeM = proposedDist;
          } else {
            // Next segment full -> stop at boundary and queue
            agent.distanceOnEdgeM = curSeg ? curSeg.endM - 0.01 : proposedDist;
            this.queueManager.enqueue(agent.id, edge.id, nextSegIdx, currentTimeS);
            agent.state = 'QUEUED';
          }
        }
      } else {
        // Case B: Reached or exceeded end of current edge
        const nextNodeIndex = agent.pathIndex + 1;
        const reachedNodeId = agent.path[nextNodeIndex];
        const reachedNode = this.graph.getNode(reachedNodeId);

        if (reachedNode && reachedNode.type === 'EXIT') {
          // Target is EXIT! Agent evacuated!
          this.segmentManager.removeOccupant(agent.id);
          agent.state = 'EVACUATED';
          agent.evacuatedAtS = currentTimeS;
          agent.currentEdgeId = null;
          agent.currentNodeId = reachedNodeId;
          agent.currentSpeedMps = 0;
        } else {
          // Transition to next edge on path
          const nextTargetNodeId = agent.path[agent.pathIndex + 2];
          if (!nextTargetNodeId) {
            // No further path; mark evacuated if at exit or unassigned
            this.segmentManager.removeOccupant(agent.id);
            agent.state = 'UNASSIGNED';
            continue;
          }

          const nextEdge = this.graph.getEdgeBetween(reachedNodeId, nextTargetNodeId);
          if (!nextEdge) {
            this.segmentManager.removeOccupant(agent.id);
            agent.state = 'UNASSIGNED';
            continue;
          }

          // Check if first segment of next edge has capacity
          if (this.segmentManager.hasCapacity(nextEdge.id, 0)) {
            this.segmentManager.removeOccupant(agent.id);
            this.segmentManager.addOccupant(agent.id, nextEdge.id, 0);
            agent.currentEdgeId = nextEdge.id;
            agent.pathIndex++;
            agent.distanceOnEdgeM = Math.min(proposedDist - edge.lengthM, 0.05);
          } else {
            // Next edge segment full -> wait at end of current edge and queue
            agent.distanceOnEdgeM = edge.lengthM;
            this.queueManager.enqueue(agent.id, nextEdge.id, 0, currentTimeS);
            agent.state = 'QUEUED';
          }
        }
      }
    }
  }
}
