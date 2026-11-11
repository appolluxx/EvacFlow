import { BuildingData, GraphNode, GraphEdge } from '../types/graph';

/**
 * Building 6 (ตึกเฉลิมพระเกียรติ 72 พรรษา) Inspired 2D Model
 * Adapted from the school evacuation drill and exam floor plan.
 *
 * Architecture:
 * - 3 Floors:
 *   - Floor 3: North/West/South/East exam rooms & Auditorium
 *   - Floor 2: North/West/South/East exam rooms & Library/Central office
 *   - Floor 1: Ground discharge corridors leading to 4 exits
 * - 4 Evacuation Zones:
 *   - ZONE_PINK_SW (South-West) -> stair_sw -> EXIT_1 (ลานประดู่)
 *   - ZONE_GREEN_NW (North-West) -> stair_nw -> EXIT_2 (ลานประดู่)
 *   - ZONE_BLUE_NE (North-East) -> stair_ne -> EXIT_3 (สนามฟุตบอล)
 *   - ZONE_ORANGE_SE (South-East) -> stair_se -> EXIT_4 (สนามฟุตบอล)
 * - 4 Stairwells: stair_nw, stair_sw, stair_ne, stair_se
 * - 4 Ground Exits on Floor 1: EXIT_1, EXIT_2, EXIT_3, EXIT_4
 */

export const BUILDING6_METADATA = {
  id: 'building-6-courtyard-model',
  name: 'Building 6 (เฉลิมพระเกียรติ 72 พรรษา Inspired 2D Model)',
  version: '1.0.0',
  source: 'SYNTHETIC_MOCK' as const,
  description:
    'Quadrangle courtyard layout inspired by Building 6 evacuation drill plan with 4 zones, 4 stairwells, and 4 exits.',
  floors: [1, 2, 3],
  createdAt: '2026-11-11T00:00:00.000Z',
  updatedAt: '2026-11-11T00:00:00.000Z',
};

export const BUILDING6_ZONE_ASSIGNMENTS: Record<string, string> = {
  ZONE_PINK_SW: 'stair_sw',
  ZONE_GREEN_NW: 'stair_nw',
  ZONE_BLUE_NE: 'stair_ne',
  ZONE_ORANGE_SE: 'stair_se',
};

export const BUILDING6_FLOOR_DELAYS: Record<number, number> = {
  1: 0,
  2: 20,
  3: 50,
};

export function createBuilding6Model(): BuildingData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Corner coordinates
  const westX = 15;
  const eastX = 75;
  const southY = 15;
  const northY = 55;

  const floors = [1, 2, 3];

  for (const floor of floors) {
    // 1. Ring Corridor Corner Junctions
    nodes.push({ id: `B6_JCT_NW_${floor}`, label: `Fl.${floor} NW Jct`, floor, x: westX, y: northY, type: 'JUNCTION' });
    nodes.push({ id: `B6_JCT_NE_${floor}`, label: `Fl.${floor} NE Jct`, floor, x: eastX, y: northY, type: 'JUNCTION' });
    nodes.push({ id: `B6_JCT_SW_${floor}`, label: `Fl.${floor} SW Jct`, floor, x: westX, y: southY, type: 'JUNCTION' });
    nodes.push({ id: `B6_JCT_SE_${floor}`, label: `Fl.${floor} SE Jct`, floor, x: eastX, y: southY, type: 'JUNCTION' });

    // 2. Stair Landing Nodes
    nodes.push({ id: `B6_STAIR_NW_${floor}`, label: `Stair NW Fl.${floor}`, floor, x: 8, y: northY, type: 'STAIR', stairwellId: 'stair_nw' });
    nodes.push({ id: `B6_STAIR_SW_${floor}`, label: `Stair SW Fl.${floor}`, floor, x: 8, y: southY, type: 'STAIR', stairwellId: 'stair_sw' });
    nodes.push({ id: `B6_STAIR_NE_${floor}`, label: `Stair NE Fl.${floor}`, floor, x: 82, y: northY, type: 'STAIR', stairwellId: 'stair_ne' });
    nodes.push({ id: `B6_STAIR_SE_${floor}`, label: `Stair SE Fl.${floor}`, floor, x: 82, y: southY, type: 'STAIR', stairwellId: 'stair_se' });

    // Connections between JCT and Stair Landing
    edges.push({ id: `B6_E_JCT_STAIR_NW_${floor}`, from: `B6_JCT_NW_${floor}`, to: `B6_STAIR_NW_${floor}`, lengthM: 7.0, widthM: 2.5, direction: 'BIDIRECTIONAL', isStair: false });
    edges.push({ id: `B6_E_JCT_STAIR_SW_${floor}`, from: `B6_JCT_SW_${floor}`, to: `B6_STAIR_SW_${floor}`, lengthM: 7.0, widthM: 2.5, direction: 'BIDIRECTIONAL', isStair: false });
    edges.push({ id: `B6_E_JCT_STAIR_NE_${floor}`, from: `B6_JCT_NE_${floor}`, to: `B6_STAIR_NE_${floor}`, lengthM: 7.0, widthM: 2.5, direction: 'BIDIRECTIONAL', isStair: false });
    edges.push({ id: `B6_E_JCT_STAIR_SE_${floor}`, from: `B6_JCT_SE_${floor}`, to: `B6_STAIR_SE_${floor}`, lengthM: 7.0, widthM: 2.5, direction: 'BIDIRECTIONAL', isStair: false });

    // 3. West & East Corridor Spines
    edges.push({ id: `B6_E_CORR_WEST_${floor}`, from: `B6_JCT_SW_${floor}`, to: `B6_JCT_NW_${floor}`, lengthM: northY - southY, widthM: 2.5, direction: 'BIDIRECTIONAL', isStair: false });
    edges.push({ id: `B6_E_CORR_EAST_${floor}`, from: `B6_JCT_SE_${floor}`, to: `B6_JCT_NE_${floor}`, lengthM: northY - southY, widthM: 2.5, direction: 'BIDIRECTIONAL', isStair: false });

    // 4. North Corridor intermediate junctions and rooms (Floors 2 & 3)
    const northJcts = [25, 35, 45, 55, 65];
    let prevNorthJct = `B6_JCT_NW_${floor}`;
    for (let i = 0; i < northJcts.length; i++) {
      const jctId = `B6_C_N_${floor}_${i + 1}`;
      const x = northJcts[i];
      nodes.push({ id: jctId, label: `Fl.${floor} North Cor ${i + 1}`, floor, x, y: northY, type: 'CORRIDOR' });
      edges.push({ id: `B6_E_N_${floor}_${i}`, from: prevNorthJct, to: jctId, lengthM: i === 0 ? x - westX : 10, widthM: 2.5, direction: 'BIDIRECTIONAL', isStair: false });
      prevNorthJct = jctId;

      if (floor >= 2) {
        // North rooms: Left side GREEN_NW, Right side BLUE_NE
        const zoneId = i < 3 ? 'ZONE_GREEN_NW' : 'ZONE_BLUE_NE';
        const roomNum = floor * 100 + (i + 1);
        const roomId = `B6_R_${roomNum}`;
        nodes.push({
          id: roomId,
          label: `Room ${roomNum}`,
          floor,
          x,
          y: northY + 7,
          type: 'ROOM',
          initialOccupants: 30,
          zoneId,
        });
        edges.push({
          id: `B6_E_R_${roomNum}`,
          from: roomId,
          to: jctId,
          lengthM: 7.0,
          widthM: 1.8,
          direction: 'BIDIRECTIONAL',
          isStair: false,
        });
      }
    }
    // Connect to NE
    edges.push({ id: `B6_E_N_${floor}_END`, from: prevNorthJct, to: `B6_JCT_NE_${floor}`, lengthM: eastX - northJcts[northJcts.length - 1], widthM: 2.5, direction: 'BIDIRECTIONAL', isStair: false });

    // 5. South Corridor intermediate junctions and rooms (Floors 2 & 3)
    const southJcts = [25, 35, 45, 55, 65];
    let prevSouthJct = `B6_JCT_SW_${floor}`;
    for (let i = 0; i < southJcts.length; i++) {
      const jctId = `B6_C_S_${floor}_${i + 1}`;
      const x = southJcts[i];
      nodes.push({ id: jctId, label: `Fl.${floor} South Cor ${i + 1}`, floor, x, y: southY, type: 'CORRIDOR' });
      edges.push({ id: `B6_E_S_${floor}_${i}`, from: prevSouthJct, to: jctId, lengthM: i === 0 ? x - westX : 10, widthM: 2.5, direction: 'BIDIRECTIONAL', isStair: false });
      prevSouthJct = jctId;

      if (floor >= 2) {
        // South rooms: Left side PINK_SW, Right side ORANGE_SE
        const zoneId = i < 3 ? 'ZONE_PINK_SW' : 'ZONE_ORANGE_SE';
        const roomNum = floor * 100 + 10 + (i + 1);
        const roomId = `B6_R_${roomNum}`;
        nodes.push({
          id: roomId,
          label: `Room ${roomNum}`,
          floor,
          x,
          y: southY - 7,
          type: 'ROOM',
          initialOccupants: 30,
          zoneId,
        });
        edges.push({
          id: `B6_E_R_${roomNum}`,
          from: roomId,
          to: jctId,
          lengthM: 7.0,
          widthM: 1.8,
          direction: 'BIDIRECTIONAL',
          isStair: false,
        });
      }
    }
    edges.push({ id: `B6_E_S_${floor}_END`, from: prevSouthJct, to: `B6_JCT_SE_${floor}`, lengthM: eastX - southJcts[southJcts.length - 1], widthM: 2.5, direction: 'BIDIRECTIONAL', isStair: false });
  }

  // 6. Connect Stair flights between floors (3->2, 2->1)
  const stairwells = [
    { id: 'stair_nw', prefix: 'B6_STAIR_NW' },
    { id: 'stair_sw', prefix: 'B6_STAIR_SW' },
    { id: 'stair_ne', prefix: 'B6_STAIR_NE' },
    { id: 'stair_se', prefix: 'B6_STAIR_SE' },
  ];

  for (const st of stairwells) {
    edges.push({
      id: `B6_E_FLIGHT_${st.id}_3_2`,
      from: `${st.prefix}_3`,
      to: `${st.prefix}_2`,
      lengthM: 9.0,
      widthM: 1.6,
      direction: 'BIDIRECTIONAL',
      isStair: true,
      stairwellId: st.id,
    });
    edges.push({
      id: `B6_E_FLIGHT_${st.id}_2_1`,
      from: `${st.prefix}_2`,
      to: `${st.prefix}_1`,
      lengthM: 9.0,
      widthM: 1.6,
      direction: 'BIDIRECTIONAL',
      isStair: true,
      stairwellId: st.id,
    });
  }

  // 7. Ground-floor exits on Floor 1
  nodes.push({ id: 'EXIT_1', label: 'Exit 1 (ลานประดู่)', floor: 1, x: 0, y: southY, type: 'EXIT' });
  nodes.push({ id: 'EXIT_2', label: 'Exit 2 (ลานประดู่)', floor: 1, x: 0, y: northY, type: 'EXIT' });
  nodes.push({ id: 'EXIT_3', label: 'Exit 3 (สนามฟุตบอล)', floor: 1, x: 90, y: northY, type: 'EXIT' });
  nodes.push({ id: 'EXIT_4', label: 'Exit 4 (สนามฟุตบอล)', floor: 1, x: 90, y: southY, type: 'EXIT' });

  // Discharge edges from Stair landing to Exits
  edges.push({ id: 'B6_E_DISCHARGE_EX1', from: 'B6_STAIR_SW_1', to: 'EXIT_1', lengthM: 8.0, widthM: 3.0, direction: 'BIDIRECTIONAL', isStair: false });
  edges.push({ id: 'B6_E_DISCHARGE_EX2', from: 'B6_STAIR_NW_1', to: 'EXIT_2', lengthM: 8.0, widthM: 3.0, direction: 'BIDIRECTIONAL', isStair: false });
  edges.push({ id: 'B6_E_DISCHARGE_EX3', from: 'B6_STAIR_NE_1', to: 'EXIT_3', lengthM: 8.0, widthM: 3.0, direction: 'BIDIRECTIONAL', isStair: false });
  edges.push({ id: 'B6_E_DISCHARGE_EX4', from: 'B6_STAIR_SE_1', to: 'EXIT_4', lengthM: 8.0, widthM: 3.0, direction: 'BIDIRECTIONAL', isStair: false });

  return {
    metadata: BUILDING6_METADATA,
    nodes,
    edges,
  };
}

export const building6Model: BuildingData = createBuilding6Model();
