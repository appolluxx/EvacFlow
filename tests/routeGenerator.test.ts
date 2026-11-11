import { describe, it, expect } from 'vitest';
import { defaultSchoolBuilding, DEFAULT_ZONE_ASSIGNMENTS, DEFAULT_FLOOR_DELAYS } from '../src/data/defaultSchoolBuilding';
import { Graph } from '../src/engine/graph/Graph';
import { RouteGenerator } from '../src/engine/scenarios/RouteGenerator';
import { Agent } from '../src/types/agent';
import { SimulationConfig } from '../src/types/scenario';

describe('RouteGenerator Scenario Logic', () => {
  const graph = new Graph(defaultSchoolBuilding);

  const sampleAgents: Agent[] = [
    {
      id: 'agent_f1_west',
      originNodeId: 'R_101', // Floor 1 West
      originFloor: 1,
      currentNodeId: 'R_101',
      currentEdgeId: null,
      distanceOnEdgeM: 0,
      path: [],
      pathIndex: 0,
      baseSpeedMps: 1.3,
      currentSpeedMps: 1.3,
      reactionDelayS: 1.5,
      scenarioReleaseDelayS: 0,
      state: 'WAITING',
      totalWaitTimeS: 0,
    },
    {
      id: 'agent_f3_east',
      originNodeId: 'R_307', // Floor 3 East
      originFloor: 3,
      currentNodeId: 'R_307',
      currentEdgeId: null,
      distanceOnEdgeM: 0,
      path: [],
      pathIndex: 0,
      baseSpeedMps: 1.4,
      currentSpeedMps: 1.4,
      reactionDelayS: 2.0,
      scenarioReleaseDelayS: 0,
      state: 'WAITING',
      totalWaitTimeS: 0,
    },
  ];

  it('assigns Baseline routes and sets reactionDelay as releaseDelay', () => {
    const config: SimulationConfig = {
      scenario: 'BASELINE',
      timeStepS: 0.1,
      playbackSpeed: 1,
      floorDelaysS: DEFAULT_FLOOR_DELAYS,
      zoneAssignments: DEFAULT_ZONE_ASSIGNMENTS,
      randomSeed: 1234,
    };

    const assignments = RouteGenerator.assignRoutes(graph, sampleAgents, config);
    expect(assignments.size).toBe(2);

    const a1 = assignments.get('agent_f1_west')!;
    expect(a1.isAssigned).toBe(true);
    expect(a1.releaseDelayS).toBe(1.5);
    expect(a1.route?.path[0]).toBe('R_101');

    const a2 = assignments.get('agent_f3_east')!;
    expect(a2.isAssigned).toBe(true);
    expect(a2.releaseDelayS).toBe(2.0);
    expect(a2.route?.path[0]).toBe('R_307');
  });

  it('assigns Zoning routes and verifies traversal of assigned stairwells', () => {
    const config: SimulationConfig = {
      scenario: 'ZONING',
      timeStepS: 0.1,
      playbackSpeed: 1,
      floorDelaysS: DEFAULT_FLOOR_DELAYS,
      zoneAssignments: DEFAULT_ZONE_ASSIGNMENTS,
      randomSeed: 1234,
    };

    const assignments = RouteGenerator.assignRoutes(graph, sampleAgents, config);
    const a2 = assignments.get('agent_f3_east')!;
    expect(a2.isAssigned).toBe(true);

    // R_307 is in ZONE_EAST -> stair_right
    const hasRightStair = a2.route?.path.some((nid) => graph.getNode(nid)?.stairwellId === 'stair_right');
    expect(hasRightStair).toBe(true);
  });

  it('assigns Staggered release delays based on floor delays', () => {
    const config: SimulationConfig = {
      scenario: 'STAGGERED',
      timeStepS: 0.1,
      playbackSpeed: 1,
      floorDelaysS: { 1: 0, 2: 30, 3: 60 },
      zoneAssignments: DEFAULT_ZONE_ASSIGNMENTS,
      randomSeed: 1234,
    };

    const assignments = RouteGenerator.assignRoutes(graph, sampleAgents, config);

    // Floor 1: reaction 1.5 + floor delay 0 = 1.5s
    const a1 = assignments.get('agent_f1_west')!;
    expect(a1.releaseDelayS).toBe(1.5);

    // Floor 3: reaction 2.0 + floor delay 60 = 62.0s
    const a2 = assignments.get('agent_f3_east')!;
    expect(a2.releaseDelayS).toBe(62.0);
  });
});
