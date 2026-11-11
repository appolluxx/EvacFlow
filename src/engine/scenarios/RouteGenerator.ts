import { Graph } from '../graph/Graph';
import { Dijkstra, PathResult } from '../graph/Dijkstra';
import { SimulationConfig } from '../../types/scenario';
import { Agent } from '../../types/agent';

export interface RouteAssignment {
  agentId: string;
  route: PathResult | null;
  releaseDelayS: number;
  isAssigned: boolean;
  unassignedReason?: string;
}

export class RouteGenerator {
  /**
   * Generates route assignments and release delays for a collection of agents
   * according to the specified scenario rules in Sections 9 & 12.
   */
  public static assignRoutes(
    graph: Graph,
    agents: Agent[],
    config: SimulationConfig
  ): Map<string, RouteAssignment> {
    const assignments = new Map<string, RouteAssignment>();

    // Cache computed paths for origin nodes under Baseline / Staggered / Zoning
    const baselineCache = new Map<string, PathResult | null>();
    const zoningCache = new Map<string, PathResult | null>();

    for (const agent of agents) {
      const originNode = graph.getNode(agent.originNodeId);
      if (!originNode) {
        assignments.set(agent.id, {
          agentId: agent.id,
          route: null,
          releaseDelayS: agent.reactionDelayS,
          isAssigned: false,
          unassignedReason: `Origin node "${agent.originNodeId}" not found in building graph.`,
        });
        continue;
      }

      if (config.scenario === 'BASELINE') {
        let route = baselineCache.get(agent.originNodeId);
        if (route === undefined) {
          route = Dijkstra.findShortestPathToExit(graph, agent.originNodeId);
          baselineCache.set(agent.originNodeId, route);
        }

        assignments.set(agent.id, {
          agentId: agent.id,
          route,
          releaseDelayS: agent.reactionDelayS,
          isAssigned: route !== null,
          unassignedReason: route ? undefined : 'No valid path to an exit found.',
        });
      } else if (config.scenario === 'ZONING') {
        const zoneId = originNode.zoneId;
        const assignedStairwell = zoneId ? config.zoneAssignments[zoneId] : undefined;

        if (!assignedStairwell) {
          assignments.set(agent.id, {
            agentId: agent.id,
            route: null,
            releaseDelayS: agent.reactionDelayS,
            isAssigned: false,
            unassignedReason: `Zone "${zoneId || 'unspecified'}" has no assigned stairwell in configuration.`,
          });
          continue;
        }

        const cacheKey = `${agent.originNodeId}:${assignedStairwell}`;
        let route = zoningCache.get(cacheKey);
        if (route === undefined) {
          route = Dijkstra.findShortestPathWithStairwell(graph, agent.originNodeId, assignedStairwell);
          zoningCache.set(cacheKey, route);
        }

        assignments.set(agent.id, {
          agentId: agent.id,
          route,
          releaseDelayS: agent.reactionDelayS,
          isAssigned: route !== null,
          unassignedReason: route ? undefined : `No route through assigned stairwell "${assignedStairwell}" to exit.`,
        });
      } else if (config.scenario === 'STAGGERED') {
        let route = baselineCache.get(agent.originNodeId);
        if (route === undefined) {
          route = Dijkstra.findShortestPathToExit(graph, agent.originNodeId);
          baselineCache.set(agent.originNodeId, route);
        }

        const floorDelay = config.floorDelaysS[agent.originFloor] ?? 0;
        const totalDelay = Math.max(0, agent.reactionDelayS + floorDelay);

        assignments.set(agent.id, {
          agentId: agent.id,
          route,
          releaseDelayS: totalDelay,
          isAssigned: route !== null,
          unassignedReason: route ? undefined : 'No valid path to an exit found.',
        });
      }
    }

    return assignments;
  }
}
