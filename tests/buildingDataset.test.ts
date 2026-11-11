import { describe, it, expect } from 'vitest';
import {
  defaultSchoolBuilding,
  DEFAULT_BUILDING_METADATA,
  DEFAULT_ZONE_ASSIGNMENTS,
} from '../src/data/defaultSchoolBuilding';
import { Graph } from '../src/engine/graph/Graph';

describe('Synthetic Default School Building Dataset', () => {
  it('loads successfully and contains valid metadata labeled as SYNTHETIC_MOCK', () => {
    expect(defaultSchoolBuilding).toBeDefined();
    expect(defaultSchoolBuilding.metadata.source).toBe('SYNTHETIC_MOCK');
    expect(defaultSchoolBuilding.metadata.floors).toEqual([1, 2, 3]);
    expect(DEFAULT_BUILDING_METADATA.source).toBe('SYNTHETIC_MOCK');
  });

  it('contains exactly 3 floors, 21 classrooms, 36 occupants per room, and 756 occupants total', () => {
    const graph = new Graph(defaultSchoolBuilding);
    const rooms = graph.getRooms();

    expect(rooms.length).toBe(21);

    // 7 classrooms per floor
    for (const floor of [1, 2, 3]) {
      const floorRooms = rooms.filter((r) => r.floor === floor);
      expect(floorRooms.length).toBe(7);
    }

    // Each classroom has exactly 36 occupants
    let totalOccupants = 0;
    for (const room of rooms) {
      expect(room.initialOccupants).toBe(36);
      totalOccupants += room.initialOccupants ?? 0;
    }

    // Total occupants must be exactly 756
    expect(totalOccupants).toBe(756);
  });

  it('contains exactly two stairwells (left and right) with 1.5m width', () => {
    const graph = new Graph(defaultSchoolBuilding);
    const stairwells = graph.getStairwells();

    expect(stairwells).toEqual(['stair_left', 'stair_right']);

    // Check all stair flight edges have width 1.5m and isStair: true
    const stairFlightEdges = defaultSchoolBuilding.edges.filter((e) => e.isStair);
    expect(stairFlightEdges.length).toBe(4); // 2 flights per stairwell (3->2, 2->1)

    for (const edge of stairFlightEdges) {
      expect(edge.widthM).toBe(1.5);
      expect(edge.isStair).toBe(true);
      expect(['stair_left', 'stair_right']).toContain(edge.stairwellId);
    }
  });

  it('contains main corridor edges with width 2.5m', () => {
    // Check main corridor edges between junctions
    const corridorSpineEdges = defaultSchoolBuilding.edges.filter((e) =>
      e.id.startsWith('E_C_')
    );
    expect(corridorSpineEdges.length).toBeGreaterThan(0);
    for (const edge of corridorSpineEdges) {
      expect(edge.widthM).toBe(2.5);
    }
  });

  it('contains exactly two ground-floor exit nodes on Floor 1', () => {
    const graph = new Graph(defaultSchoolBuilding);
    const exits = graph.getExits();

    expect(exits.length).toBe(2);
    for (const exit of exits) {
      expect(exit.floor).toBe(1);
      expect(exit.type).toBe('EXIT');
    }
  });

  it('provides valid default zone assignments for all zones in the building', () => {
    const graph = new Graph(defaultSchoolBuilding);
    const zones = graph.getZones();

    expect(zones.length).toBeGreaterThan(0);
    for (const zone of zones) {
      expect(DEFAULT_ZONE_ASSIGNMENTS[zone]).toBeDefined();
      expect(graph.getStairwells()).toContain(DEFAULT_ZONE_ASSIGNMENTS[zone]);
    }
  });
});
