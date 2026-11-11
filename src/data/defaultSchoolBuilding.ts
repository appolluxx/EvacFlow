import { BuildingData, GraphNode, GraphEdge } from '../types/graph';

/**
 * Synthetic default 3-story school building dataset for EvacFlow.
 *
 * NOTE: This is a synthetic mock dataset created for testing and algorithm verification.
 * It does NOT represent any real building or school layout.
 *
 * Exact specifications:
 * - 3 floors (Floors 1, 2, 3)
 * - 7 classrooms per floor (21 rooms total)
 * - 36 occupants per classroom (756 occupants total)
 * - Main corridor width: 2.5 m
 * - Left stair width: 1.5 m
 * - Right stair width: 1.5 m
 * - 2 ground-floor exits
 */

export const DEFAULT_BUILDING_METADATA = {
  id: 'synthetic-school-3f-756',
  name: 'Synthetic 3-Story School Model',
  version: '1.0.0',
  source: 'SYNTHETIC_MOCK' as const,
  description:
    'Synthetic multi-story school building model with 21 classrooms, 756 occupants, two stairwells, and two ground exits.',
  floors: [1, 2, 3],
  createdAt: '2026-11-11T00:00:00.000Z',
  updatedAt: '2026-11-11T00:00:00.000Z',
};

export const DEFAULT_ZONE_ASSIGNMENTS: Record<string, string> = {
  ZONE_WEST: 'stair_left',
  ZONE_EAST: 'stair_right',
};

export const DEFAULT_FLOOR_DELAYS: Record<number, number> = {
  1: 0,
  2: 30,
  3: 60,
};

function createDefaultBuilding(): BuildingData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const floors = [1, 2, 3];
  const roomXCoordinates = [15, 25, 35, 45, 55, 65, 75]; // 7 rooms along corridor
  const leftLandingX = 10;
  const rightLandingX = 80;
  const corridorY = 5;
  const roomY = 12; // 7m from corridor

  // 1. Create nodes for each floor
  for (const floor of floors) {
    // Corridor junction nodes
    nodes.push({
      id: `C_${floor}_L`,
      label: `Fl.${floor} West Landing Jct`,
      floor,
      x: leftLandingX,
      y: corridorY,
      type: 'JUNCTION',
    });

    for (let i = 0; i < roomXCoordinates.length; i++) {
      const roomNum = floor * 100 + (i + 1);
      const x = roomXCoordinates[i];
      const zoneId = i < 4 ? 'ZONE_WEST' : 'ZONE_EAST'; // Rooms 1-4 West, 5-7 East

      // Corridor junction opposite classroom door
      nodes.push({
        id: `C_${floor}_${i + 1}`,
        label: `Fl.${floor} Cor.${i + 1}`,
        floor,
        x,
        y: corridorY,
        type: 'CORRIDOR',
      });

      // Classroom Room node
      nodes.push({
        id: `R_${roomNum}`,
        label: `Room ${roomNum}`,
        floor,
        x,
        y: roomY,
        type: 'ROOM',
        initialOccupants: 36,
        zoneId,
      });

      // Edge from Room to Corridor Junction
      edges.push({
        id: `E_R_${roomNum}_C`,
        from: `R_${roomNum}`,
        to: `C_${floor}_${i + 1}`,
        lengthM: 7.0, // 7m doorway / access corridor
        widthM: 2.0,
        direction: 'BIDIRECTIONAL',
        isStair: false,
      });
    }

    nodes.push({
      id: `C_${floor}_R`,
      label: `Fl.${floor} East Landing Jct`,
      floor,
      x: rightLandingX,
      y: corridorY,
      type: 'JUNCTION',
    });

    // Corridor spine edges (2.5m wide main corridor)
    // Left landing to first room junction
    edges.push({
      id: `E_C_${floor}_L_1`,
      from: `C_${floor}_L`,
      to: `C_${floor}_1`,
      lengthM: roomXCoordinates[0] - leftLandingX, // 5m
      widthM: 2.5,
      direction: 'BIDIRECTIONAL',
      isStair: false,
    });

    // Between room junctions
    for (let i = 0; i < roomXCoordinates.length - 1; i++) {
      edges.push({
        id: `E_C_${floor}_${i + 1}_${i + 2}`,
        from: `C_${floor}_${i + 1}`,
        to: `C_${floor}_${i + 2}`,
        lengthM: roomXCoordinates[i + 1] - roomXCoordinates[i], // 10m
        widthM: 2.5,
        direction: 'BIDIRECTIONAL',
        isStair: false,
      });
    }

    // Last room junction to right landing
    edges.push({
      id: `E_C_${floor}_7_R`,
      from: `C_${floor}_7`,
      to: `C_${floor}_R`,
      lengthM: rightLandingX - roomXCoordinates[6], // 5m
      widthM: 2.5,
      direction: 'BIDIRECTIONAL',
      isStair: false,
    });

    // Stair landing nodes on each floor
    nodes.push({
      id: `STAIR_L_${floor}`,
      label: `Stair Left Landing Fl.${floor}`,
      floor,
      x: 5,
      y: corridorY,
      type: 'STAIR',
      stairwellId: 'stair_left',
    });

    nodes.push({
      id: `STAIR_R_${floor}`,
      label: `Stair Right Landing Fl.${floor}`,
      floor,
      x: 85,
      y: corridorY,
      type: 'STAIR',
      stairwellId: 'stair_right',
    });

    // Edges connecting corridor landing junction to stair landing node
    edges.push({
      id: `E_CONN_L_${floor}`,
      from: `C_${floor}_L`,
      to: `STAIR_L_${floor}`,
      lengthM: 5.0,
      widthM: 2.5,
      direction: 'BIDIRECTIONAL',
      isStair: false,
    });

    edges.push({
      id: `E_CONN_R_${floor}`,
      from: `C_${floor}_R`,
      to: `STAIR_R_${floor}`,
      lengthM: 5.0,
      widthM: 2.5,
      direction: 'BIDIRECTIONAL',
      isStair: false,
    });
  }

  // 2. Stair flights connecting floors
  // Left stairwell (1.5m width, 8m slant travel length)
  // Floor 3 -> Floor 2
  edges.push({
    id: 'E_STAIR_L_3_2',
    from: 'STAIR_L_3',
    to: 'STAIR_L_2',
    lengthM: 8.0,
    widthM: 1.5,
    direction: 'BIDIRECTIONAL',
    isStair: true,
    stairwellId: 'stair_left',
  });

  // Floor 2 -> Floor 1
  edges.push({
    id: 'E_STAIR_L_2_1',
    from: 'STAIR_L_2',
    to: 'STAIR_L_1',
    lengthM: 8.0,
    widthM: 1.5,
    direction: 'BIDIRECTIONAL',
    isStair: true,
    stairwellId: 'stair_left',
  });

  // Right stairwell (1.5m width, 8m slant travel length)
  // Floor 3 -> Floor 2
  edges.push({
    id: 'E_STAIR_R_3_2',
    from: 'STAIR_R_3',
    to: 'STAIR_R_2',
    lengthM: 8.0,
    widthM: 1.5,
    direction: 'BIDIRECTIONAL',
    isStair: true,
    stairwellId: 'stair_right',
  });

  // Floor 2 -> Floor 1
  edges.push({
    id: 'E_STAIR_R_2_1',
    from: 'STAIR_R_2',
    to: 'STAIR_R_1',
    lengthM: 8.0,
    widthM: 1.5,
    direction: 'BIDIRECTIONAL',
    isStair: true,
    stairwellId: 'stair_right',
  });

  // 3. Ground-Floor Exits (Floor 1 only)
  // 2 ground-floor exits
  nodes.push({
    id: 'EXIT_WEST',
    label: 'West Ground Exit',
    floor: 1,
    x: 0,
    y: corridorY,
    type: 'EXIT',
  });

  nodes.push({
    id: 'EXIT_EAST',
    label: 'East Ground Exit',
    floor: 1,
    x: 90,
    y: corridorY,
    type: 'EXIT',
  });

  // Exit discharge corridors (2.5m width)
  edges.push({
    id: 'E_EXIT_DISCHARGE_WEST',
    from: 'STAIR_L_1',
    to: 'EXIT_WEST',
    lengthM: 5.0,
    widthM: 2.5,
    direction: 'BIDIRECTIONAL',
    isStair: false,
  });

  edges.push({
    id: 'E_EXIT_DISCHARGE_EAST',
    from: 'STAIR_R_1',
    to: 'EXIT_EAST',
    lengthM: 5.0,
    widthM: 2.5,
    direction: 'BIDIRECTIONAL',
    isStair: false,
  });

  return {
    metadata: DEFAULT_BUILDING_METADATA,
    nodes,
    edges,
  };
}

export const defaultSchoolBuilding: BuildingData = createDefaultBuilding();
