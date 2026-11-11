import { describe, it, expect } from 'vitest';
import { GraphValidator } from '../src/engine/graph/GraphValidator';
import { defaultSchoolBuilding, DEFAULT_ZONE_ASSIGNMENTS } from '../src/data/defaultSchoolBuilding';
import { BuildingData } from '../src/types/graph';

describe('GraphValidator', () => {
  it('validates defaultSchoolBuilding as valid with no errors', () => {
    const result = GraphValidator.validate(defaultSchoolBuilding, {
      scenario: 'BASELINE',
      zoneAssignments: DEFAULT_ZONE_ASSIGNMENTS,
    });

    expect(result.isValid).toBe(true);
    const errors = result.issues.filter((i) => i.severity === 'ERROR');
    expect(errors).toHaveLength(0);
  });

  it('validates defaultSchoolBuilding under ZONING scenario successfully', () => {
    const result = GraphValidator.validate(defaultSchoolBuilding, {
      scenario: 'ZONING',
      zoneAssignments: DEFAULT_ZONE_ASSIGNMENTS,
    });

    expect(result.isValid).toBe(true);
    const errors = result.issues.filter((i) => i.severity === 'ERROR');
    expect(errors).toHaveLength(0);
  });

  it('Check 1: detects duplicate node IDs', () => {
    const data: BuildingData = JSON.parse(JSON.stringify(defaultSchoolBuilding));
    // Duplicate first node id
    data.nodes[1].id = data.nodes[0].id;

    const result = GraphValidator.validate(data);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'DUPLICATE_NODE_ID')).toBe(true);
  });

  it('Check 2: detects duplicate edge IDs', () => {
    const data: BuildingData = JSON.parse(JSON.stringify(defaultSchoolBuilding));
    data.edges[1].id = data.edges[0].id;

    const result = GraphValidator.validate(data);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'DUPLICATE_EDGE_ID')).toBe(true);
  });

  it('Check 3: detects edge referencing non-existent nodes', () => {
    const data: BuildingData = JSON.parse(JSON.stringify(defaultSchoolBuilding));
    data.edges.push({
      id: 'e_invalid_from',
      from: 'NON_EXISTENT_NODE',
      to: data.nodes[0].id,
      lengthM: 5,
      widthM: 2,
      direction: 'BIDIRECTIONAL',
      isStair: false,
    });

    const result = GraphValidator.validate(data);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'EDGE_MISSING_NODE')).toBe(true);
  });

  it('Check 4: detects non-positive or non-finite edge length and width', () => {
    const data: BuildingData = JSON.parse(JSON.stringify(defaultSchoolBuilding));
    data.edges[0].lengthM = -5;
    data.edges[1].widthM = 0;

    const result = GraphValidator.validate(data);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'INVALID_EDGE_LENGTH')).toBe(true);
    expect(result.issues.some((i) => i.code === 'INVALID_EDGE_WIDTH')).toBe(true);
  });

  it('Check 5: detects invalid initialOccupants (negative or non-integer)', () => {
    const data: BuildingData = JSON.parse(JSON.stringify(defaultSchoolBuilding));
    const roomNode = data.nodes.find((n) => n.type === 'ROOM')!;
    roomNode.initialOccupants = -10;

    const result = GraphValidator.validate(data);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'INVALID_OCCUPANT_COUNT')).toBe(true);

    roomNode.initialOccupants = 12.5;
    const result2 = GraphValidator.validate(data);
    expect(result2.isValid).toBe(false);
    expect(result2.issues.some((i) => i.code === 'INVALID_OCCUPANT_COUNT')).toBe(true);
  });

  it('Check 6: detects occupied room without any route to an exit', () => {
    const data: BuildingData = JSON.parse(JSON.stringify(defaultSchoolBuilding));
    // Disconnect room R_101 by removing its edge
    data.edges = data.edges.filter((e) => e.from !== 'R_101' && e.to !== 'R_101');

    const result = GraphValidator.validate(data);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'ROOM_NO_EXIT_ROUTE' && i.nodeId === 'R_101')).toBe(true);
  });

  it('Check 7: detects stair edge missing stairwellId or mismatching landing stairwellId', () => {
    const data: BuildingData = JSON.parse(JSON.stringify(defaultSchoolBuilding));
    const stairEdge = data.edges.find((e) => e.isStair)!;
    stairEdge.stairwellId = undefined;

    const result = GraphValidator.validate(data);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'STAIR_MISSING_STAIRWELL_ID')).toBe(true);

    // Mismatched landing stairwellId
    stairEdge.stairwellId = 'wrong_stairwell';
    const result2 = GraphValidator.validate(data);
    expect(result2.isValid).toBe(false);
    expect(result2.issues.some((i) => i.code === 'STAIRWELL_ID_MISMATCH')).toBe(true);
  });

  it('Check 9: detects invalid zone assignments (unknown zone or unknown stairwell)', () => {
    const result = GraphValidator.validate(defaultSchoolBuilding, {
      scenario: 'ZONING',
      zoneAssignments: {
        UNKNOWN_ZONE: 'stair_left',
        ZONE_WEST: 'unknown_stair',
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'INVALID_ZONE_ID')).toBe(true);
    expect(result.issues.some((i) => i.code === 'INVALID_STAIRWELL_ID')).toBe(true);
  });

  it('Check 10: detects when an occupied room cannot reach exit through assigned stairwell', () => {
    const data: BuildingData = JSON.parse(JSON.stringify(defaultSchoolBuilding));
    // Remove the left stair flight between floor 2 and 1
    data.edges = data.edges.filter((e) => e.id !== 'E_STAIR_L_2_1');

    const result = GraphValidator.validate(data, {
      scenario: 'ZONING',
      zoneAssignments: DEFAULT_ZONE_ASSIGNMENTS,
    });

    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'ZONING_ROUTE_UNAVAILABLE')).toBe(true);
  });

  it('Check 11: detects zero-length edge and self-loop edge', () => {
    const data: BuildingData = JSON.parse(JSON.stringify(defaultSchoolBuilding));
    data.edges[0].lengthM = 0; // zero-length
    data.edges.push({
      id: 'e_self_loop',
      from: 'R_101',
      to: 'R_101',
      lengthM: 5,
      widthM: 2,
      direction: 'BIDIRECTIONAL',
      isStair: false,
    });

    const result = GraphValidator.validate(data);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'INVALID_EDGE_LENGTH')).toBe(true);
    expect(result.issues.some((i) => i.code === 'EDGE_SELF_LOOP')).toBe(true);
  });

  it('warns when non-room node has initialOccupants', () => {
    const data: BuildingData = JSON.parse(JSON.stringify(defaultSchoolBuilding));
    const corridorNode = data.nodes.find((n) => n.type === 'CORRIDOR')!;
    corridorNode.initialOccupants = 5;

    const result = GraphValidator.validate(data);
    expect(result.issues.some((i) => i.code === 'NON_ROOM_OCCUPANTS')).toBe(true);
  });

  it('detects missing zone assignment when validating Zoning scenario', () => {
    const result = GraphValidator.validate(defaultSchoolBuilding, {
      scenario: 'ZONING',
      zoneAssignments: {
        // Only assigning ZONE_WEST, leaving ZONE_EAST unassigned
        ZONE_WEST: 'stair_left',
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'MISSING_ZONE_ASSIGNMENT')).toBe(true);
  });

  it('detects graph with no EXIT nodes', () => {
    const data: BuildingData = JSON.parse(JSON.stringify(defaultSchoolBuilding));
    data.nodes = data.nodes.filter((n) => n.type !== 'EXIT');

    const result = GraphValidator.validate(data);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'NO_EXITS_DEFINED')).toBe(true);
  });
});
