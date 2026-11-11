/**
 * Graph domain types for EvacFlow
 * All spatial coordinates and lengths use SI units (meters).
 */

export type NodeType =
  | 'ROOM'
  | 'CORRIDOR'
  | 'JUNCTION'
  | 'STAIR'
  | 'EXIT';

export interface GraphNode {
  id: string;
  label: string;
  floor: number;
  x: number; // Building-plan coordinate in meters, not canvas pixels
  y: number; // Building-plan coordinate in meters, not canvas pixels
  type: NodeType;
  initialOccupants?: number; // Only meaningful for ROOM nodes
  zoneId?: string;
  stairwellId?: string; // Shared identifier for the same stairwell across floors
}

export type EdgeDirection = 'BIDIRECTIONAL' | 'A_TO_B' | 'B_TO_A';

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  lengthM: number;
  widthM: number;
  direction: EdgeDirection;
  isStair: boolean;
  stairwellId?: string;
  maxFlowRatePps?: number; // Optional calibrated entry/flow limit (persons/second)
}

export type BuildingSource = 'SYNTHETIC_MOCK' | 'FIELD_SURVEY';

export interface BuildingMetadata {
  id: string;
  name: string;
  version: string;
  source: BuildingSource;
  description?: string;
  floors: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BuildingData {
  metadata: BuildingMetadata;
  nodes: GraphNode[];
  edges: GraphEdge[];
}
