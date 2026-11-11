import { describe, it, expect } from 'vitest';
import { defaultSchoolBuilding, DEFAULT_ZONE_ASSIGNMENTS } from '../src/data/defaultSchoolBuilding';
import { Graph } from '../src/engine/graph/Graph';
import { Dijkstra } from '../src/engine/graph/Dijkstra';
import { GraphValidator } from '../src/engine/graph/GraphValidator';

describe('Occupant Route Validation (All 756 Occupants / 21 Rooms)', () => {
  const graph = new Graph(defaultSchoolBuilding);
  const occupiedRooms = graph.getOccupiedRooms();

  it('verifies there are exactly 21 occupied rooms and 756 total occupants', () => {
    expect(occupiedRooms.length).toBe(21);
    const totalOccupants = occupiedRooms.reduce((sum, r) => sum + (r.initialOccupants ?? 0), 0);
    expect(totalOccupants).toBe(756);
  });

  it('verifies all 21 rooms have valid Baseline routes satisfying all route invariants', () => {
    for (const room of occupiedRooms) {
      const route = Dijkstra.findShortestPathToExit(graph, room.id);

      expect(route, `Room ${room.id} must have a valid Baseline route`).not.toBeNull();
      if (!route) continue;

      // Invariant 1: First node equals origin
      expect(route.path[0]).toBe(room.id);

      // Invariant 2: Final node is an EXIT
      const destNode = graph.getNode(route.path[route.path.length - 1]);
      expect(destNode?.type).toBe('EXIT');

      // Invariant 3: Connected by valid traversable edges
      const invariantIssue = GraphValidator.validateRouteInvariants(graph, route, room.id);
      expect(invariantIssue, `Route for room ${room.id} failed invariants`).toBeNull();

      // Total distance must be positive
      expect(route.totalDistanceM).toBeGreaterThan(0);
    }
  });

  it('verifies all 21 rooms have valid Zoning routes through their assigned stairwells', () => {
    for (const room of occupiedRooms) {
      expect(room.zoneId).toBeDefined();
      const assignedStairwell = DEFAULT_ZONE_ASSIGNMENTS[room.zoneId!];
      expect(assignedStairwell).toBeDefined();

      const route = Dijkstra.findShortestPathWithStairwell(graph, room.id, assignedStairwell);
      expect(
        route,
        `Room ${room.id} (${room.zoneId}) must have valid Zoning route through ${assignedStairwell}`
      ).not.toBeNull();

      if (!route) continue;

      // Invariants check
      const invariantIssue = GraphValidator.validateRouteInvariants(
        graph,
        route,
        room.id,
        assignedStairwell
      );
      expect(invariantIssue, `Zoning route for room ${room.id} failed invariants`).toBeNull();
    }
  });

  it('verifies upper floor rooms (Floor 2 and Floor 3) traverse stair edges to reach Floor 1 exits', () => {
    const upperFloorRooms = occupiedRooms.filter((r) => r.floor > 1);
    expect(upperFloorRooms.length).toBe(14); // 7 rooms on F2, 7 on F3

    for (const room of upperFloorRooms) {
      const route = Dijkstra.findShortestPathToExit(graph, room.id);
      expect(route).not.toBeNull();

      // Route must include stair edges
      const hasStairEdge = route!.edgeIds.some((edgeId) => {
        const edge = graph.getEdge(edgeId);
        return edge?.isStair === true;
      });

      expect(hasStairEdge, `Upper floor room ${room.id} route must include stair flight`).toBe(true);
    }
  });
});
