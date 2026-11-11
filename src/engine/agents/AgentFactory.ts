import { Graph } from '../graph/Graph';
import { Agent } from '../../types/agent';
import { SimulationConfig, DEFAULT_SIMULATION_CONSTANTS } from '../../types/scenario';
import { SeededRandom } from '../../utils/random';

export class AgentFactory {
  /**
   * Generates a deterministic list of agents for the given graph and random seed.
   * Ensures identical agent characteristics across paired scenarios.
   */
  public static createAgents(graph: Graph, config: SimulationConfig): Agent[] {
    const rng = new SeededRandom(config.randomSeed);
    const agents: Agent[] = [];

    const minSpeed = config.walkingSpeedMinMps ?? DEFAULT_SIMULATION_CONSTANTS.DEFAULT_WALKING_SPEED_MIN_MPS;
    const maxSpeed = config.walkingSpeedMaxMps ?? DEFAULT_SIMULATION_CONSTANTS.DEFAULT_WALKING_SPEED_MAX_MPS;

    // Sort rooms deterministically by room ID
    const occupiedRooms = graph
      .getOccupiedRooms()
      .sort((a, b) => a.id.localeCompare(b.id));

    for (const room of occupiedRooms) {
      const count = room.initialOccupants ?? 0;
      for (let i = 0; i < count; i++) {
        const agentId = `agent_${room.id}_${i + 1}`;
        const baseSpeedMps = rng.range(minSpeed, maxSpeed);
        // Reaction delay sampled between 0.5s and 3.5s (average 2.0s ± 1.5s), clamped >= 0
        const reactionDelayS = Math.max(0, rng.range(0.5, 3.5));

        agents.push({
          id: agentId,
          originNodeId: room.id,
          originFloor: room.floor,
          currentNodeId: room.id,
          currentEdgeId: null,
          distanceOnEdgeM: 0,
          path: [],
          pathIndex: 0,
          baseSpeedMps,
          currentSpeedMps: baseSpeedMps,
          reactionDelayS,
          scenarioReleaseDelayS: 0,
          state: 'WAITING',
          totalWaitTimeS: 0,
        });
      }
    }

    return agents;
  }
}
