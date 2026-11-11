import { describe, it, expect } from 'vitest';
import {
  building6Model,
  BUILDING6_ZONE_ASSIGNMENTS,
} from '../src/data/building6Model';
import { GraphValidator } from '../src/engine/graph/GraphValidator';
import { Graph } from '../src/engine/graph/Graph';
import { Dijkstra } from '../src/engine/graph/Dijkstra';

describe('Building 6 (เฉลิมพระเกียรติ 72 พรรษา Inspired 2D Model)', () => {
  it('passes all 11 GraphValidator checks under Baseline and Zoning', () => {
    const baselineResult = GraphValidator.validate(building6Model, {
      scenario: 'BASELINE',
    });
    expect(baselineResult.isValid).toBe(true);
    expect(baselineResult.issues.filter((i) => i.severity === 'ERROR')).toHaveLength(0);

    const zoningResult = GraphValidator.validate(building6Model, {
      scenario: 'ZONING',
      zoneAssignments: BUILDING6_ZONE_ASSIGNMENTS,
    });
    expect(zoningResult.isValid).toBe(true);
    expect(zoningResult.issues.filter((i) => i.severity === 'ERROR')).toHaveLength(0);
  });

  it('contains 4 stairwells and 4 ground exits', () => {
    const graph = new Graph(building6Model);
    const stairwells = graph.getStairwells();
    const exits = graph.getExits();

    expect(stairwells).toHaveLength(4);
    expect(stairwells).toEqual(['stair_ne', 'stair_nw', 'stair_se', 'stair_sw']);

    expect(exits).toHaveLength(4);
    expect(exits.map((e) => e.id)).toEqual(['EXIT_1', 'EXIT_2', 'EXIT_3', 'EXIT_4']);
  });

  it('verifies all rooms have valid Baseline and Zoning routes', () => {
    const graph = new Graph(building6Model);
    const rooms = graph.getOccupiedRooms();
    expect(rooms.length).toBeGreaterThan(0);

    for (const room of rooms) {
      // Baseline
      const baseRoute = Dijkstra.findShortestPathToExit(graph, room.id);
      expect(baseRoute).not.toBeNull();

      // Zoning
      const assignedStair = room.zoneId ? BUILDING6_ZONE_ASSIGNMENTS[room.zoneId] : undefined;
      expect(assignedStair).toBeDefined();

      const zoneRoute = Dijkstra.findShortestPathWithStairwell(graph, room.id, assignedStair!);
      expect(zoneRoute).not.toBeNull();
    }
  });
});
