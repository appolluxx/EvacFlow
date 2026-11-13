import { BuildingData, GraphNode, GraphEdge } from '../types/graph';

/**
 * Building 6 (อาคาร 6 ตึกเฉลิมพระเกียรติ 72 พรรษา) 2D Model
 * Exact Architectural Grid Model matching the Surasakmontree School evacuation drill plan.
 *
 * Coordinates are mapped to a 0-1000 x 0-700 architectural blueprint coordinate system:
 * - North Corridor: y = 140 (between Row 631-636 at y=102 and Row 621-626 at y=178)
 * - South Corridor: y = 500 (between Row 6214-6210 at y=462 and Row 6315-6310 at y=540)
 * - West Corridor: x = 170 (connecting North and South corridors on the left)
 * - East Corridor: x = 780 (connecting North and South corridors on the right)
 *
 * 4 Evacuation Zones matching the poster colors:
 * - ZONE_GREEN (ทางออก 2 -> ลานประดู่): ห้องสอบ 621-623, 6217, 631-633, 6318
 * - ZONE_BLUE (ทางออก 3 -> สนามฟุตบอล): ห้องสอบ 624-626, 634-636
 * - ZONE_PINK (ทางออก 1 -> ลานประดู่): ห้องสอบ 6215-6216, 6312-6317
 * - ZONE_ORANGE (ทางออก 4 -> สนามฟุตบอล): ห้องสอบ 627-629, 637-639, 6210-6214, 6310-6311
 */

export const BUILDING6_METADATA = {
  id: 'building-6-courtyard-model',
  name: 'อาคาร 6 ตึกเฉลิมพระเกียรติ 72 พรรษา',
  version: '3.0.0',
  source: 'FIELD_SURVEY' as const,
  description:
    'แบบจำลองอาคาร 6 ตึกเฉลิมพระเกียรติ 72 พรรษา ตรงตามผังการซ้อมอพยพแผ่นดินไหว 4 โซนสี สู่ลานประดู่และสนามฟุตบอล',
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

  const floors = [1, 2, 3];

  // ========================================================
  // 1. CORRIDOR SPINE & JUNCTION NODES
  // ========================================================
  for (const floor of floors) {
    // 4 Corner Junctions of the main building
    nodes.push({ id: `B6_C_NW_${floor}`, label: `Cor NW F${floor}`, floor, x: 170, y: 140, type: 'JUNCTION' });
    nodes.push({ id: `B6_C_NE_${floor}`, label: `Cor NE F${floor}`, floor, x: 780, y: 140, type: 'JUNCTION' });
    nodes.push({ id: `B6_C_SW_${floor}`, label: `Cor SW F${floor}`, floor, x: 170, y: 500, type: 'JUNCTION' });
    nodes.push({ id: `B6_C_SE_${floor}`, label: `Cor SE F${floor}`, floor, x: 780, y: 500, type: 'JUNCTION' });

    // North Corridor nodes (y = 140)
    const northXs = [205, 300, 370, 440, 510, 580];
    for (let i = 0; i < northXs.length; i++) {
      nodes.push({ id: `B6_CN_${floor}_${i + 1}`, label: `Cor N${i + 1} F${floor}`, floor, x: northXs[i], y: 140, type: 'CORRIDOR' });
    }

    // Connect North Corridor from NW (170) to NE (780)
    let prevN = `B6_C_NW_${floor}`;
    for (let i = 0; i < northXs.length; i++) {
      const curN = `B6_CN_${floor}_${i + 1}`;
      edges.push({
        id: `B6_EN_${floor}_${i}`,
        from: prevN,
        to: curN,
        lengthM: (northXs[i] - (i === 0 ? 170 : northXs[i - 1])) / 10,
        widthM: 2.5,
        direction: 'BIDIRECTIONAL',
        isStair: false,
      });
      prevN = curN;
    }
    edges.push({
      id: `B6_EN_${floor}_END`,
      from: prevN,
      to: `B6_C_NE_${floor}`,
      lengthM: (780 - northXs[northXs.length - 1]) / 10,
      widthM: 2.5,
      direction: 'BIDIRECTIONAL',
      isStair: false,
    });

    // South Corridor nodes (y = 500)
    const southXs = [205, 300, 370, 440, 510, 580];
    for (let i = 0; i < southXs.length; i++) {
      nodes.push({ id: `B6_CS_${floor}_${i + 1}`, label: `Cor S${i + 1} F${floor}`, floor, x: southXs[i], y: 500, type: 'CORRIDOR' });
    }

    // Connect South Corridor from SW (170) to SE (780)
    let prevS = `B6_C_SW_${floor}`;
    for (let i = 0; i < southXs.length; i++) {
      const curS = `B6_CS_${floor}_${i + 1}`;
      edges.push({
        id: `B6_ES_${floor}_${i}`,
        from: prevS,
        to: curS,
        lengthM: (southXs[i] - (i === 0 ? 170 : southXs[i - 1])) / 10,
        widthM: 2.5,
        direction: 'BIDIRECTIONAL',
        isStair: false,
      });
      prevS = curS;
    }
    edges.push({
      id: `B6_ES_${floor}_END`,
      from: prevS,
      to: `B6_C_SE_${floor}`,
      lengthM: (780 - southXs[southXs.length - 1]) / 10,
      widthM: 2.5,
      direction: 'BIDIRECTIONAL',
      isStair: false,
    });

    // West Corridor nodes (x = 170)
    const westYs = [240, 315, 395];
    for (let i = 0; i < westYs.length; i++) {
      nodes.push({ id: `B6_CW_${floor}_${i + 1}`, label: `Cor W${i + 1} F${floor}`, floor, x: 170, y: westYs[i], type: 'CORRIDOR' });
    }
    let prevW = `B6_C_NW_${floor}`;
    for (let i = 0; i < westYs.length; i++) {
      const curW = `B6_CW_${floor}_${i + 1}`;
      edges.push({
        id: `B6_EW_${floor}_${i}`,
        from: prevW,
        to: curW,
        lengthM: (westYs[i] - (i === 0 ? 140 : westYs[i - 1])) / 10,
        widthM: 2.5,
        direction: 'BIDIRECTIONAL',
        isStair: false,
      });
      prevW = curW;
    }
    edges.push({
      id: `B6_EW_${floor}_END`,
      from: prevW,
      to: `B6_C_SW_${floor}`,
      lengthM: (500 - westYs[westYs.length - 1]) / 10,
      widthM: 2.5,
      direction: 'BIDIRECTIONAL',
      isStair: false,
    });

    // East Corridor nodes (x = 780)
    const eastYs = [240, 315, 395];
    for (let i = 0; i < eastYs.length; i++) {
      nodes.push({ id: `B6_CE_${floor}_${i + 1}`, label: `Cor E${i + 1} F${floor}`, floor, x: 780, y: eastYs[i], type: 'CORRIDOR' });
    }
    let prevE = `B6_C_NE_${floor}`;
    for (let i = 0; i < eastYs.length; i++) {
      const curE = `B6_CE_${floor}_${i + 1}`;
      edges.push({
        id: `B6_EE_${floor}_${i}`,
        from: prevE,
        to: curE,
        lengthM: (eastYs[i] - (i === 0 ? 140 : eastYs[i - 1])) / 10,
        widthM: 2.5,
        direction: 'BIDIRECTIONAL',
        isStair: false,
      });
      prevE = curE;
    }
    edges.push({
      id: `B6_EE_${floor}_END`,
      from: prevE,
      to: `B6_C_SE_${floor}`,
      lengthM: (500 - eastYs[eastYs.length - 1]) / 10,
      widthM: 2.5,
      direction: 'BIDIRECTIONAL',
      isStair: false,
    });

    // 4 Stair Landing Nodes
    nodes.push({ id: `STAIR_NW_${floor}`, label: `บันได NW ชั้น ${floor}`, floor, x: 252, y: 140, type: 'STAIR', stairwellId: 'stair_nw' });
    nodes.push({ id: `STAIR_NE_${floor}`, label: `บันได NE ชั้น ${floor}`, floor, x: 628, y: 140, type: 'STAIR', stairwellId: 'stair_ne' });
    nodes.push({ id: `STAIR_SW_${floor}`, label: `บันได SW ชั้น ${floor}`, floor, x: 252, y: 500, type: 'STAIR', stairwellId: 'stair_sw' });
    nodes.push({ id: `STAIR_SE_${floor}`, label: `บันได SE ชั้น ${floor}`, floor, x: 628, y: 500, type: 'STAIR', stairwellId: 'stair_se' });

    edges.push({ id: `B6_E_STAIR_NW_${floor}`, from: `B6_CN_${floor}_2`, to: `STAIR_NW_${floor}`, lengthM: 4.8, widthM: 2.0, direction: 'BIDIRECTIONAL', isStair: false });
    edges.push({ id: `B6_E_STAIR_NE_${floor}`, from: `B6_CN_${floor}_6`, to: `STAIR_NE_${floor}`, lengthM: 4.8, widthM: 2.0, direction: 'BIDIRECTIONAL', isStair: false });
    edges.push({ id: `B6_E_STAIR_SW_${floor}`, from: `B6_CS_${floor}_2`, to: `STAIR_SW_${floor}`, lengthM: 4.8, widthM: 2.0, direction: 'BIDIRECTIONAL', isStair: false });
    edges.push({ id: `B6_E_STAIR_SE_${floor}`, from: `B6_CS_${floor}_6`, to: `STAIR_SE_${floor}`, lengthM: 4.8, widthM: 2.0, direction: 'BIDIRECTIONAL', isStair: false });
  }

  // ========================================================
  // 2. CONNECT STAIR FLIGHTS (3 -> 2 -> 1)
  // ========================================================
  const stairwells = ['stair_nw', 'stair_ne', 'stair_sw', 'stair_se'] as const;
  for (const st of stairwells) {
    const code = st.replace('stair_', '').toUpperCase();
    edges.push({
      id: `B6_FLIGHT_${st}_3_2`,
      from: `STAIR_${code}_3`,
      to: `STAIR_${code}_2`,
      lengthM: 8.0,
      widthM: 1.8,
      direction: 'BIDIRECTIONAL',
      isStair: true,
      stairwellId: st,
    });
    edges.push({
      id: `B6_FLIGHT_${st}_2_1`,
      from: `STAIR_${code}_2`,
      to: `STAIR_${code}_1`,
      lengthM: 8.0,
      widthM: 1.8,
      direction: 'BIDIRECTIONAL',
      isStair: true,
      stairwellId: st,
    });
  }

  // ========================================================
  // 3. CLASSROOM NODES & DOOR CONNECTIONS
  // ========================================================
  const addClassroom = (
    id: string,
    label: string,
    floor: number,
    x: number,
    y: number,
    zoneId: string,
    corridorNodeId: string,
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
      id: `EDOOR_${id}`,
      from: id,
      to: corridorNodeId,
      lengthM: 4.0,
      widthM: 1.8,
      direction: 'BIDIRECTIONAL',
      isStair: false,
    });
  };

  // ----- NORTH WING -----
  // Outer Row (Floor 3): 631..633 (Green), 634..636 (Blue)
  addClassroom('R_631', '631 (ห้องสอบ 13)', 3, 205, 102, 'ZONE_GREEN', 'B6_CN_3_1');
  addClassroom('R_632', '632 (ห้องสอบ 14)', 3, 300, 102, 'ZONE_GREEN', 'B6_CN_3_2');
  addClassroom('R_633', '633 (ห้องสอบ 15)', 3, 370, 102, 'ZONE_GREEN', 'B6_CN_3_3');
  addClassroom('R_634', '634 (ห้องสอบ 4)', 3, 440, 102, 'ZONE_BLUE', 'B6_CN_3_4');
  addClassroom('R_635', '635 (ห้องสอบ 5)', 3, 510, 102, 'ZONE_BLUE', 'B6_CN_3_5');
  addClassroom('R_636', '636 (ห้องสอบ 6)', 3, 580, 102, 'ZONE_BLUE', 'B6_CN_3_6');

  // Inner Row (Floor 2): 621..623 (Green), 624..626 (Blue)
  addClassroom('R_621', '621 (ห้องสอบ 1)', 2, 205, 178, 'ZONE_GREEN', 'B6_CN_2_1');
  addClassroom('R_622', '622 (ห้องสอบ 2)', 2, 300, 178, 'ZONE_GREEN', 'B6_CN_2_2');
  addClassroom('R_623', '623 (ห้องสอบ 3)', 2, 370, 178, 'ZONE_GREEN', 'B6_CN_2_3');
  addClassroom('R_624', '624 (ห้องสอบ 4)', 2, 440, 178, 'ZONE_BLUE', 'B6_CN_2_4');
  addClassroom('R_625', '625 (ห้องสอบ 5)', 2, 510, 178, 'ZONE_BLUE', 'B6_CN_2_5');
  addClassroom('R_626', '626 (ห้องสอบ 6)', 2, 580, 178, 'ZONE_BLUE', 'B6_CN_2_6');

  // ----- WEST WING -----
  // Outer Column (Floor 3): 6318 (Green), 6317, 6316 (Pink)
  addClassroom('R_6318', '6318', 3, 198, 240, 'ZONE_GREEN', 'B6_CW_3_1');
  addClassroom('R_6317', 'ห้องรับรอง 6317', 3, 198, 315, 'ZONE_PINK', 'B6_CW_3_2');
  addClassroom('R_6316', '6316', 3, 198, 395, 'ZONE_PINK', 'B6_CW_3_3');

  // Inner Column (Floor 2): 6217 (Green), 6216, 6215 (Pink)
  addClassroom('R_6217', '6217 (ห้องสอบ 12)', 2, 276, 240, 'ZONE_GREEN', 'B6_CW_2_1');
  addClassroom('R_6216', '6216 (ห้องสอบ 11)', 2, 276, 315, 'ZONE_PINK', 'B6_CW_2_2');
  addClassroom('R_6215', '6215 (ห้องสอบ 10)', 2, 276, 395, 'ZONE_PINK', 'B6_CW_2_3');

  // ----- EAST WING -----
  // Inner Column (Floor 2): 627..629 (Orange)
  addClassroom('R_627', '627 (ห้องสอบ 7)', 2, 718, 240, 'ZONE_ORANGE', 'B6_CE_2_1');
  addClassroom('R_628', '628 (ห้องสอบ 8)', 2, 718, 315, 'ZONE_ORANGE', 'B6_CE_2_2');
  addClassroom('R_629', '629 (ห้องสอบ 9)', 2, 718, 395, 'ZONE_ORANGE', 'B6_CE_2_3');

  // Outer Column (Floor 3): 637..639 (Orange)
  addClassroom('R_637', '637', 3, 798, 240, 'ZONE_ORANGE', 'B6_CE_3_1');
  addClassroom('R_638', '638', 3, 798, 315, 'ZONE_ORANGE', 'B6_CE_3_2');
  addClassroom('R_639', '639', 3, 798, 395, 'ZONE_ORANGE', 'B6_CE_3_3');

  // ----- SOUTH WING -----
  // Inner Row (Floor 2): 6214..6210 (Orange)
  addClassroom('R_6214', '6214 (วิทย์)', 2, 220, 462, 'ZONE_ORANGE', 'B6_CS_2_1');
  addClassroom('R_6213', '6213 (มส.)', 2, 300, 462, 'ZONE_ORANGE', 'B6_CS_2_2');
  addClassroom('R_6212', '6212 (ชีวะ)', 2, 385, 462, 'ZONE_ORANGE', 'B6_CS_2_3');
  addClassroom('R_6211', '6211 (ฟิสิกส์)', 2, 485, 462, 'ZONE_ORANGE', 'B6_CS_2_4');
  addClassroom('R_6210', '6210 (เคมี)', 2, 580, 462, 'ZONE_ORANGE', 'B6_CS_2_5');

  // Outer Row (Floor 3): 6315..6312 (Pink), 6311..6310 (Orange)
  addClassroom('R_6315', '6315', 3, 205, 540, 'ZONE_PINK', 'B6_CS_3_1');
  addClassroom('R_6314', '6314', 3, 300, 540, 'ZONE_PINK', 'B6_CS_3_2');
  addClassroom('R_6313', '6313', 3, 370, 540, 'ZONE_PINK', 'B6_CS_3_3');
  addClassroom('R_6312', '6312', 3, 440, 540, 'ZONE_PINK', 'B6_CS_3_4');
  addClassroom('R_6311', '6311 (ฟิสิกส์)', 3, 520, 540, 'ZONE_ORANGE', 'B6_CS_3_5');
  addClassroom('R_6310', '6310 (พักครู)', 3, 600, 540, 'ZONE_ORANGE', 'B6_CS_3_6');

  // ========================================================
  // 4. FLOOR 1 DISCHARGE EXITS (DIRECTLY TO ASSEMBLY POINTS)
  // ========================================================
  // Exits in exact order: 1, 2, 3, 4
  nodes.push({ id: 'EXIT_1', label: 'ทางออก 1 (ลานประดู่)', floor: 1, x: 105, y: 500, type: 'EXIT' });
  nodes.push({ id: 'EXIT_2', label: 'ทางออก 2 (ลานประดู่)', floor: 1, x: 105, y: 140, type: 'EXIT' });
  nodes.push({ id: 'EXIT_3', label: 'ทางออก 3 (สนามฟุตบอล)', floor: 1, x: 880, y: 140, type: 'EXIT' });
  nodes.push({ id: 'EXIT_4', label: 'ทางออก 4 (สนามฟุตบอล)', floor: 1, x: 880, y: 500, type: 'EXIT' });

  // Discharge routes from stair landing on Floor 1
  edges.push({ id: 'B6_DISCHARGE_EX1', from: 'STAIR_SW_1', to: 'EXIT_1', lengthM: 14.7, widthM: 3.5, direction: 'BIDIRECTIONAL', isStair: false });
  edges.push({ id: 'B6_DISCHARGE_EX2', from: 'STAIR_NW_1', to: 'EXIT_2', lengthM: 14.7, widthM: 3.5, direction: 'BIDIRECTIONAL', isStair: false });
  edges.push({ id: 'B6_DISCHARGE_EX3', from: 'STAIR_NE_1', to: 'EXIT_3', lengthM: 14.7, widthM: 3.5, direction: 'BIDIRECTIONAL', isStair: false });
  edges.push({ id: 'B6_DISCHARGE_EX4', from: 'STAIR_SE_1', to: 'EXIT_4', lengthM: 14.7, widthM: 3.5, direction: 'BIDIRECTIONAL', isStair: false });

  return {
    metadata: BUILDING6_METADATA,
    nodes,
    edges,
  };
}

export const building6Model: BuildingData = createBuilding6Model();
