import { describe, it, expect } from 'vitest';
import { Graph } from '../src/engine/graph/Graph';
import { Dijkstra } from '../src/engine/graph/Dijkstra';
import { BuildingData } from '../src/types/graph';

describe('Dijkstra Pathfinding', () => {
  it('finds shortest path on a simple linear graph', () => {
    const data: BuildingData = {
      metadata: {
        id: 'test-linear',
        name: 'Test Linear',
        version: '1.0.0',
        source: 'SYNTHETIC_MOCK',
        floors: [1],
      },
      nodes: [
        { id: 'R1', label: 'Room 1', floor: 1, x: 0, y: 0, type: 'ROOM', initialOccupants: 10 },
        { id: 'C1', label: 'Corridor 1', floor: 1, x: 5, y: 0, type: 'CORRIDOR' },
        { id: 'EX1', label: 'Exit 1', floor: 1, x: 15, y: 0, type: 'EXIT' },
      ],
      edges: [
        { id: 'e1', from: 'R1', to: 'C1', lengthM: 5, widthM: 2, direction: 'BIDIRECTIONAL', isStair: false },
        { id: 'e2', from: 'C1', to: 'EX1', lengthM: 10, widthM: 2, direction: 'BIDIRECTIONAL', isStair: false },
      ],
    };

    const graph = new Graph(data);
    const result = Dijkstra.findShortestPathToExit(graph, 'R1');

    expect(result).not.toBeNull();
    expect(result?.path).toEqual(['R1', 'C1', 'EX1']);
    expect(result?.edgeIds).toEqual(['e1', 'e2']);
    expect(result?.totalDistanceM).toBe(15);
  });

  it('selects the shortest path between multiple routes', () => {
    const data: BuildingData = {
      metadata: {
        id: 'test-branching',
        name: 'Test Branching',
        version: '1.0.0',
        source: 'SYNTHETIC_MOCK',
        floors: [1],
      },
      nodes: [
        { id: 'R1', label: 'Room 1', floor: 1, x: 0, y: 0, type: 'ROOM', initialOccupants: 10 },
        { id: 'C_SHORT', label: 'Corridor Short', floor: 1, x: 5, y: 0, type: 'CORRIDOR' },
        { id: 'C_LONG', label: 'Corridor Long', floor: 1, x: 5, y: 10, type: 'CORRIDOR' },
        { id: 'EX1', label: 'Exit 1', floor: 1, x: 15, y: 0, type: 'EXIT' },
      ],
      edges: [
        { id: 'e_s1', from: 'R1', to: 'C_SHORT', lengthM: 5, widthM: 2, direction: 'BIDIRECTIONAL', isStair: false },
        { id: 'e_s2', from: 'C_SHORT', to: 'EX1', lengthM: 5, widthM: 2, direction: 'BIDIRECTIONAL', isStair: false },
        { id: 'e_l1', from: 'R1', to: 'C_LONG', lengthM: 20, widthM: 2, direction: 'BIDIRECTIONAL', isStair: false },
        { id: 'e_l2', from: 'C_LONG', to: 'EX1', lengthM: 20, widthM: 2, direction: 'BIDIRECTIONAL', isStair: false },
      ],
    };

    const graph = new Graph(data);
    const result = Dijkstra.findShortestPathToExit(graph, 'R1');

    expect(result?.path).toEqual(['R1', 'C_SHORT', 'EX1']);
    expect(result?.totalDistanceM).toBe(10);
  });

  it('respects one-way edge directions', () => {
    const data: BuildingData = {
      metadata: {
        id: 'test-directed',
        name: 'Test Directed',
        version: '1.0.0',
        source: 'SYNTHETIC_MOCK',
        floors: [1],
      },
      nodes: [
        { id: 'R1', label: 'Room 1', floor: 1, x: 0, y: 0, type: 'ROOM', initialOccupants: 10 },
        { id: 'C1', label: 'Corridor 1', floor: 1, x: 5, y: 0, type: 'CORRIDOR' },
        { id: 'EX1', label: 'Exit 1', floor: 1, x: 15, y: 0, type: 'EXIT' },
      ],
      edges: [
        // R1 -> C1 is valid
        { id: 'e1', from: 'R1', to: 'C1', lengthM: 5, widthM: 2, direction: 'A_TO_B', isStair: false },
        // EX1 -> C1 is one-way backward (B_TO_A means from C1 to EX1 is NOT allowed)
        { id: 'e2', from: 'EX1', to: 'C1', lengthM: 5, widthM: 2, direction: 'A_TO_B', isStair: false },
      ],
    };

    const graph = new Graph(data);
    const result = Dijkstra.findShortestPathToExit(graph, 'R1');

    // Cannot reach exit because e2 only allows EX1 -> C1, not C1 -> EX1
    expect(result).toBeNull();
  });

  it('finds path traversing required stairwell for Zoning', () => {
    const data: BuildingData = {
      metadata: {
        id: 'test-zoning-path',
        name: 'Test Zoning Path',
        version: '1.0.0',
        source: 'SYNTHETIC_MOCK',
        floors: [1, 2],
      },
      nodes: [
        { id: 'R2', label: 'Room 2', floor: 2, x: 10, y: 0, type: 'ROOM', initialOccupants: 10, zoneId: 'Z_EAST' },
        { id: 'STAIR_W2', label: 'Stair West F2', floor: 2, x: 0, y: 0, type: 'STAIR', stairwellId: 'stair_west' },
        { id: 'STAIR_E2', label: 'Stair East F2', floor: 2, x: 20, y: 0, type: 'STAIR', stairwellId: 'stair_east' },
        { id: 'STAIR_W1', label: 'Stair West F1', floor: 1, x: 0, y: 0, type: 'STAIR', stairwellId: 'stair_west' },
        { id: 'STAIR_E1', label: 'Stair East F1', floor: 1, x: 20, y: 0, type: 'STAIR', stairwellId: 'stair_east' },
        { id: 'EX1', label: 'Exit 1', floor: 1, x: 10, y: 0, type: 'EXIT' },
      ],
      edges: [
        // R2 to West Stair is shorter (10m)
        { id: 'e_rw', from: 'R2', to: 'STAIR_W2', lengthM: 10, widthM: 2, direction: 'BIDIRECTIONAL', isStair: false },
        // R2 to East Stair is longer (15m)
        { id: 'e_re', from: 'R2', to: 'STAIR_E2', lengthM: 15, widthM: 2, direction: 'BIDIRECTIONAL', isStair: false },
        // Stairs
        { id: 'e_stair_w', from: 'STAIR_W2', to: 'STAIR_W1', lengthM: 5, widthM: 1.5, direction: 'BIDIRECTIONAL', isStair: true, stairwellId: 'stair_west' },
        { id: 'e_stair_e', from: 'STAIR_E2', to: 'STAIR_E1', lengthM: 5, widthM: 1.5, direction: 'BIDIRECTIONAL', isStair: true, stairwellId: 'stair_east' },
        // From Stairs to Exit
        { id: 'e_w_ex', from: 'STAIR_W1', to: 'EX1', lengthM: 10, widthM: 2, direction: 'BIDIRECTIONAL', isStair: false },
        { id: 'e_e_ex', from: 'STAIR_E1', to: 'EX1', lengthM: 10, widthM: 2, direction: 'BIDIRECTIONAL', isStair: false },
      ],
    };

    const graph = new Graph(data);

    // Baseline picks the shortest path (West: 10 + 5 + 10 = 25m)
    const baseline = Dijkstra.findShortestPathToExit(graph, 'R2');
    expect(baseline?.path).toEqual(['R2', 'STAIR_W2', 'STAIR_W1', 'EX1']);
    expect(baseline?.totalDistanceM).toBe(25);

    // Zoning requiring East stairwell must take East even though longer (15 + 5 + 10 = 30m)
    const zoningEast = Dijkstra.findShortestPathWithStairwell(graph, 'R2', 'stair_east');
    expect(zoningEast).not.toBeNull();
    expect(zoningEast?.path).toEqual(['R2', 'STAIR_E2', 'STAIR_E1', 'EX1']);
    expect(zoningEast?.totalDistanceM).toBe(30);
  });
});
