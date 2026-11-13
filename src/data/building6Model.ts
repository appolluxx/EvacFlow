import { BuildingData, GraphNode, GraphEdge } from '../types/graph';

/**
 * Building 6 (อาคาร 6 ตึกเฉลิมพระเกียรติ 72 พรรษา) 2D Model
 * Accurately adapted from the Surasakmontree School evacuation drill plan.
 *
 * Architecture & 4 Evacuation Zones:
 * - ZONE_GREEN (ทางออก 2 -> ลานประดู่): ห้องสอบ 621-623, 6217, 631-633, 6318
 * - ZONE_BLUE (ทางออก 3 -> สนามฟุตบอล): ห้องสอบ 624-626, 634-636
 * - ZONE_PINK (ทางออก 1 -> ลานประดู่): ห้องสอบ 6215-6216, 6312-6317
 * - ZONE_ORANGE (ทางออก 4 -> สนามฟุตบอล): ห้องสอบ 627-629, 637-639, 6210-6214, 6310-6311
 */

export const BUILDING6_METADATA = {
  id: 'building-6-courtyard-model',
  name: 'อาคาร 6 ตึกเฉลิมพระเกียรติ 72 พรรษา (ผังจำลอง 2D)',
  version: '2.0.0',
  source: 'FIELD_SURVEY' as const,
  description:
    'แบบจำลอง 2 มิติ อาคาร 6 ตึกเฉลิมพระเกียรติ 72 พรรษา พร้อมการแบ่ง 4 โซนอพยพ สู่ลานประดู่และสนามฟุตบอล',
  floors: [1, 2, 3],
  createdAt: '2026-11-13T00:00:00.000Z',
  updatedAt: '2026-11-13T00:00:00.000Z',
};

export const BUILDING6_ZONE_ASSIGNMENTS: Record<string, string> = {
  ZONE_PINK: 'stair_sw',
  ZONE_GREEN: 'stair_nw',
  ZONE_BLUE: 'stair_ne',
  ZONE_ORANGE: 'stair_se',
};

export const BUILDING6_FLOOR_DELAYS: Record<number, number> = {
  1: 0,
  2: 20,
  3: 50,
};

export function createBuilding6Model(): BuildingData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // ==========================================
  // 1. CORRIDOR JUNCTION NODES & STAIR LANDINGS
  // ==========================================
  // Layout coordinates (Meters):
  // X: 26 (West corridor), 45 (Mid-West), 60 (Center), 75 (Mid-East), 94 (East corridor)
  // Y: 22 (North Corridor), 68 (South Corridor)

  const floors = [1, 2, 3];

  for (const floor of floors) {
    // 4 Corner Corridor Junctions
    nodes.push({ id: `B6_CORR_NW_${floor}`, label: `Fl.${floor} Cor NW`, floor, x: 30, y: 22, type: 'JUNCTION' });
    nodes.push({ id: `B6_CORR_NE_${floor}`, label: `Fl.${floor} Cor NE`, floor, x: 90, y: 22, type: 'JUNCTION' });
    nodes.push({ id: `B6_CORR_SW_${floor}`, label: `Fl.${floor} Cor SW`, floor, x: 30, y: 68, type: 'JUNCTION' });
    nodes.push({ id: `B6_CORR_SE_${floor}`, label: `Fl.${floor} Cor SE`, floor, x: 90, y: 68, type: 'JUNCTION' });

    // Intermediate Corridor Nodes along North (y = 22)
    const northXs = [38, 46, 54, 66, 74, 82];
    for (let i = 0; i < northXs.length; i++) {
      nodes.push({ id: `B6_CORR_N_${floor}_${i + 1}`, label: `Fl.${floor} Cor N${i + 1}`, floor, x: northXs[i], y: 22, type: 'CORRIDOR' });
    }

    // Connect North Corridor edges
    let prevN = `B6_CORR_NW_${floor}`;
    for (let i = 0; i < northXs.length; i++) {
      const curN = `B6_CORR_N_${floor}_${i + 1}`;
      edges.push({
        id: `B6_E_N_${floor}_${i}`,
        from: prevN,
        to: curN,
        lengthM: i === 0 ? northXs[0] - 30 : northXs[i] - northXs[i - 1],
        widthM: 2.5,
        direction: 'BIDIRECTIONAL',
        isStair: false,
      });
      prevN = curN;
    }
    edges.push({
      id: `B6_E_N_${floor}_END`,
      from: prevN,
      to: `B6_CORR_NE_${floor}`,
      lengthM: 90 - northXs[northXs.length - 1],
      widthM: 2.5,
      direction: 'BIDIRECTIONAL',
      isStair: false,
    });

    // Intermediate Corridor Nodes along South (y = 68)
    const southXs = [38, 46, 54, 66, 74, 82];
    for (let i = 0; i < southXs.length; i++) {
      nodes.push({ id: `B6_CORR_S_${floor}_${i + 1}`, label: `Fl.${floor} Cor S${i + 1}`, floor, x: southXs[i], y: 68, type: 'CORRIDOR' });
    }

    // Connect South Corridor edges
    let prevS = `B6_CORR_SW_${floor}`;
    for (let i = 0; i < southXs.length; i++) {
      const curS = `B6_CORR_S_${floor}_${i + 1}`;
      edges.push({
        id: `B6_E_S_${floor}_${i}`,
        from: prevS,
        to: curS,
        lengthM: i === 0 ? southXs[0] - 30 : southXs[i] - southXs[i - 1],
        widthM: 2.5,
        direction: 'BIDIRECTIONAL',
        isStair: false,
      });
      prevS = curS;
    }
    edges.push({
      id: `B6_E_S_${floor}_END`,
      from: prevS,
      to: `B6_CORR_SE_${floor}`,
      lengthM: 90 - southXs[southXs.length - 1],
      widthM: 2.5,
      direction: 'BIDIRECTIONAL',
      isStair: false,
    });

    // West Corridor Vertices & Edges (x = 30, y from 22 to 68)
    const westYs = [36, 46, 56];
    for (let i = 0; i < westYs.length; i++) {
      nodes.push({ id: `B6_CORR_W_${floor}_${i + 1}`, label: `Fl.${floor} Cor W${i + 1}`, floor, x: 30, y: westYs[i], type: 'CORRIDOR' });
    }
    let prevW = `B6_CORR_NW_${floor}`;
    for (let i = 0; i < westYs.length; i++) {
      const curW = `B6_CORR_W_${floor}_${i + 1}`;
      edges.push({
        id: `B6_E_W_${floor}_${i}`,
        from: prevW,
        to: curW,
        lengthM: i === 0 ? westYs[0] - 22 : westYs[i] - westYs[i - 1],
        widthM: 2.5,
        direction: 'BIDIRECTIONAL',
        isStair: false,
      });
      prevW = curW;
    }
    edges.push({
      id: `B6_E_W_${floor}_END`,
      from: prevW,
      to: `B6_CORR_SW_${floor}`,
      lengthM: 68 - westYs[westYs.length - 1],
      widthM: 2.5,
      direction: 'BIDIRECTIONAL',
      isStair: false,
    });

    // East Corridor Vertices & Edges (x = 90, y from 22 to 68)
    const eastYs = [36, 46, 56];
    for (let i = 0; i < eastYs.length; i++) {
      nodes.push({ id: `B6_CORR_E_${floor}_${i + 1}`, label: `Fl.${floor} Cor E${i + 1}`, floor, x: 90, y: eastYs[i], type: 'CORRIDOR' });
    }
    let prevE = `B6_CORR_NE_${floor}`;
    for (let i = 0; i < eastYs.length; i++) {
      const curE = `B6_CORR_E_${floor}_${i + 1}`;
      edges.push({
        id: `B6_E_E_${floor}_${i}`,
        from: prevE,
        to: curE,
        lengthM: i === 0 ? eastYs[0] - 22 : eastYs[i] - eastYs[i - 1],
        widthM: 2.5,
        direction: 'BIDIRECTIONAL',
        isStair: false,
      });
      prevE = curE;
    }
    edges.push({
      id: `B6_E_E_${floor}_END`,
      from: prevE,
      to: `B6_CORR_SE_${floor}`,
      lengthM: 68 - eastYs[eastYs.length - 1],
      widthM: 2.5,
      direction: 'BIDIRECTIONAL',
      isStair: false,
    });

    // 4 Stair Landing Nodes
    nodes.push({ id: `B6_STAIR_NW_${floor}`, label: `บันได NW ชั้น ${floor}`, floor, x: 24, y: 22, type: 'STAIR', stairwellId: 'stair_nw' });
    nodes.push({ id: `B6_STAIR_SW_${floor}`, label: `บันได SW ชั้น ${floor}`, floor, x: 24, y: 68, type: 'STAIR', stairwellId: 'stair_sw' });
    nodes.push({ id: `B6_STAIR_NE_${floor}`, label: `บันได NE ชั้น ${floor}`, floor, x: 96, y: 22, type: 'STAIR', stairwellId: 'stair_ne' });
    nodes.push({ id: `B6_STAIR_SE_${floor}`, label: `บันได SE ชั้น ${floor}`, floor, x: 96, y: 68, type: 'STAIR', stairwellId: 'stair_se' });

    // Edges connecting Corner JCT to Stair Landing
    edges.push({ id: `B6_CONN_NW_${floor}`, from: `B6_CORR_NW_${floor}`, to: `B6_STAIR_NW_${floor}`, lengthM: 6.0, widthM: 2.0, direction: 'BIDIRECTIONAL', isStair: false });
    edges.push({ id: `B6_CONN_SW_${floor}`, from: `B6_CORR_SW_${floor}`, to: `B6_STAIR_SW_${floor}`, lengthM: 6.0, widthM: 2.0, direction: 'BIDIRECTIONAL', isStair: false });
    edges.push({ id: `B6_CONN_NE_${floor}`, from: `B6_CORR_NE_${floor}`, to: `B6_STAIR_NE_${floor}`, lengthM: 6.0, widthM: 2.0, direction: 'BIDIRECTIONAL', isStair: false });
    edges.push({ id: `B6_CONN_SE_${floor}`, from: `B6_CORR_SE_${floor}`, to: `B6_STAIR_SE_${floor}`, lengthM: 6.0, widthM: 2.0, direction: 'BIDIRECTIONAL', isStair: false });
  }

  // ==========================================
  // 2. CONNECT STAIR FLIGHTS ACROSS FLOORS
  // ==========================================
  const stairDef = [
    { id: 'stair_nw', prefix: 'B6_STAIR_NW' },
    { id: 'stair_sw', prefix: 'B6_STAIR_SW' },
    { id: 'stair_ne', prefix: 'B6_STAIR_NE' },
    { id: 'stair_se', prefix: 'B6_STAIR_SE' },
  ];

  for (const st of stairDef) {
    edges.push({
      id: `B6_FLIGHT_${st.id}_3_2`,
      from: `${st.prefix}_3`,
      to: `${st.prefix}_2`,
      lengthM: 8.0,
      widthM: 1.8,
      direction: 'BIDIRECTIONAL',
      isStair: true,
      stairwellId: st.id,
    });
    edges.push({
      id: `B6_FLIGHT_${st.id}_2_1`,
      from: `${st.prefix}_2`,
      to: `${st.prefix}_1`,
      lengthM: 8.0,
      widthM: 1.8,
      direction: 'BIDIRECTIONAL',
      isStair: true,
      stairwellId: st.id,
    });
  }

  // ==========================================
  // 3. CLASSROOMS & ROOMS (MATCHING THE PLAN)
  // ==========================================
  // Helper to add room and doorway edge
  const addRoom = (
    id: string,
    label: string,
    floor: number,
    x: number,
    y: number,
    zoneId: string,
    connectToCorridorId: string,
    occupants = 25
  ) => {
    nodes.push({
      id,
      label,
      floor,
      x,
      y,
      type: 'ROOM',
      initialOccupants: occupants,
      zoneId,
    });
    edges.push({
      id: `E_${id}_DOOR`,
      from: id,
      to: connectToCorridorId,
      lengthM: 5.0,
      widthM: 1.8,
      direction: 'BIDIRECTIONAL',
      isStair: false,
    });
  };

  // ----- FLOOR 2 ROOMS -----
  // North Inner: 621..623 (Green), 624..626 (Blue)
  addRoom('R_621', '621 (ห้องสอบ 1)', 2, 38, 28, 'ZONE_GREEN', 'B6_CORR_N_2_1');
  addRoom('R_622', '622 (ห้องสอบ 2)', 2, 46, 28, 'ZONE_GREEN', 'B6_CORR_N_2_2');
  addRoom('R_623', '623 (ห้องสอบ 3)', 2, 54, 28, 'ZONE_GREEN', 'B6_CORR_N_2_3');
  addRoom('R_624', '624 (ห้องสอบ 4)', 2, 66, 28, 'ZONE_BLUE', 'B6_CORR_N_2_4');
  addRoom('R_625', '625 (ห้องสอบ 5)', 2, 74, 28, 'ZONE_BLUE', 'B6_CORR_N_2_5');
  addRoom('R_626', '626 (ห้องสอบ 6)', 2, 82, 28, 'ZONE_BLUE', 'B6_CORR_N_2_6');

  // West: 6217 (Green), 6216, 6215 (Pink)
  addRoom('R_6217', '6217 (ห้องสอบ 12)', 2, 24, 36, 'ZONE_GREEN', 'B6_CORR_W_2_1');
  addRoom('R_6216', '6216 (ห้องสอบ 11)', 2, 24, 46, 'ZONE_PINK', 'B6_CORR_W_2_2');
  addRoom('R_6215', '6215 (ห้องสอบ 10)', 2, 24, 56, 'ZONE_PINK', 'B6_CORR_W_2_3');

  // East: 627..629 (Orange)
  addRoom('R_627', '627 (ห้องสอบ 7)', 2, 96, 36, 'ZONE_ORANGE', 'B6_CORR_E_2_1');
  addRoom('R_628', '628 (ห้องสอบ 8)', 2, 96, 46, 'ZONE_ORANGE', 'B6_CORR_E_2_2');
  addRoom('R_629', '629 (ห้องสอบ 9)', 2, 96, 56, 'ZONE_ORANGE', 'B6_CORR_E_2_3');

  // South Inner: 6214..6210 (Orange)
  addRoom('R_6214', '6214 (วิทย์)', 2, 38, 62, 'ZONE_ORANGE', 'B6_CORR_S_2_1');
  addRoom('R_6213', '6213 (มส.)', 2, 46, 62, 'ZONE_ORANGE', 'B6_CORR_S_2_2');
  addRoom('R_6212', '6212 (ชีวะ)', 2, 54, 62, 'ZONE_ORANGE', 'B6_CORR_S_2_3');
  addRoom('R_6211', '6211 (ฟิสิกส์)', 2, 66, 62, 'ZONE_ORANGE', 'B6_CORR_S_2_4');
  addRoom('R_6210', '6210 (เคมี)', 2, 74, 62, 'ZONE_ORANGE', 'B6_CORR_S_2_5');

  // ----- FLOOR 3 ROOMS -----
  // North Outer: 631..633 (Green), 634..636 (Blue)
  addRoom('R_631', '631 (ห้องสอบ 13)', 3, 38, 14, 'ZONE_GREEN', 'B6_CORR_N_3_1');
  addRoom('R_632', '632 (ห้องสอบ 14)', 3, 46, 14, 'ZONE_GREEN', 'B6_CORR_N_3_2');
  addRoom('R_633', '633 (ห้องสอบ 15)', 3, 54, 14, 'ZONE_GREEN', 'B6_CORR_N_3_3');
  addRoom('R_634', '634 (ห้องสอบ)', 3, 66, 14, 'ZONE_BLUE', 'B6_CORR_N_3_4');
  addRoom('R_635', '635 (ห้องสอบ)', 3, 74, 14, 'ZONE_BLUE', 'B6_CORR_N_3_5');
  addRoom('R_636', '636 (ห้องสอบ)', 3, 82, 14, 'ZONE_BLUE', 'B6_CORR_N_3_6');

  // West: 6318 (Green), 6317 (ห้องรับรอง), 6316 (Pink)
  addRoom('R_6318', '6318 (ห้องสอบ)', 3, 18, 36, 'ZONE_GREEN', 'B6_CORR_W_3_1');
  addRoom('R_6317', '6317 (ห้องรับรอง)', 3, 18, 46, 'ZONE_PINK', 'B6_CORR_W_3_2');
  addRoom('R_6316', '6316 (ห้องสอบ)', 3, 18, 56, 'ZONE_PINK', 'B6_CORR_W_3_3');

  // East: 637..639 (Orange)
  addRoom('R_637', '637 (ห้องสอบ)', 3, 102, 36, 'ZONE_ORANGE', 'B6_CORR_E_3_1');
  addRoom('R_638', '638 (ห้องสอบ)', 3, 102, 46, 'ZONE_ORANGE', 'B6_CORR_E_3_2');
  addRoom('R_639', '639 (ห้องสอบ)', 3, 102, 56, 'ZONE_ORANGE', 'B6_CORR_E_3_3');

  // South Outer: 6315..6312 (Pink), 6311..6310 (Orange)
  addRoom('R_6315', '6315 (ห้องสอบ)', 3, 38, 76, 'ZONE_PINK', 'B6_CORR_S_3_1');
  addRoom('R_6314', '6314 (ห้องสอบ)', 3, 46, 76, 'ZONE_PINK', 'B6_CORR_S_3_2');
  addRoom('R_6313', '6313 (ห้องสอบ)', 3, 54, 76, 'ZONE_PINK', 'B6_CORR_S_3_3');
  addRoom('R_6312', '6312 (ห้องสอบ)', 3, 66, 76, 'ZONE_PINK', 'B6_CORR_S_3_4');
  addRoom('R_6311', '6311 (ฟิสิกส์)', 3, 74, 76, 'ZONE_ORANGE', 'B6_CORR_S_3_5');
  addRoom('R_6310', '6310 (พักครู)', 3, 82, 76, 'ZONE_ORANGE', 'B6_CORR_S_3_6');

  // Central Halls
  nodes.push({ id: 'R_HALL_F3', label: 'ห้องประชุม (ชั้น 3)', floor: 3, x: 60, y: 45, type: 'JUNCTION' });
  nodes.push({ id: 'R_LIB_F2', label: 'ห้องกองกลาง (ห้องสมุด ชั้น 2)', floor: 2, x: 74, y: 45, type: 'JUNCTION' });

  // ==========================================
  // 4. FLOOR 1 GROUND EXITS & ASSEMBLY AREAS
  // ==========================================
  // Exits directly leading to Assembly areas
  nodes.push({ id: 'EXIT_1', label: 'ทางออก 1 (ลานประดู่)', floor: 1, x: 12, y: 68, type: 'EXIT' });
  nodes.push({ id: 'EXIT_2', label: 'ทางออก 2 (ลานประดู่)', floor: 1, x: 12, y: 22, type: 'EXIT' });
  nodes.push({ id: 'EXIT_3', label: 'ทางออก 3 (สนามฟุตบอล)', floor: 1, x: 108, y: 22, type: 'EXIT' });
  nodes.push({ id: 'EXIT_4', label: 'ทางออก 4 (สนามฟุตบอล)', floor: 1, x: 108, y: 68, type: 'EXIT' });

  // Discharge routes from Stairs to Exits
  edges.push({ id: 'B6_DISCHARGE_EX1', from: 'B6_STAIR_SW_1', to: 'EXIT_1', lengthM: 12.0, widthM: 3.5, direction: 'BIDIRECTIONAL', isStair: false });
  edges.push({ id: 'B6_DISCHARGE_EX2', from: 'B6_STAIR_NW_1', to: 'EXIT_2', lengthM: 12.0, widthM: 3.5, direction: 'BIDIRECTIONAL', isStair: false });
  edges.push({ id: 'B6_DISCHARGE_EX3', from: 'B6_STAIR_NE_1', to: 'EXIT_3', lengthM: 12.0, widthM: 3.5, direction: 'BIDIRECTIONAL', isStair: false });
  edges.push({ id: 'B6_DISCHARGE_EX4', from: 'B6_STAIR_SE_1', to: 'EXIT_4', lengthM: 12.0, widthM: 3.5, direction: 'BIDIRECTIONAL', isStair: false });

  return {
    metadata: BUILDING6_METADATA,
    nodes,
    edges,
  };
}

export const building6Model: BuildingData = createBuilding6Model();
