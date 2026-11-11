/**
 * Agent domain types for EvacFlow
 * All speeds use meters per second (mps), time uses seconds (s).
 */

export type AgentState = 'WAITING' | 'MOVING' | 'QUEUED' | 'EVACUATED' | 'UNASSIGNED';

export interface Agent {
  id: string;
  originNodeId: string;
  originFloor: number;
  currentNodeId: string | null;
  currentEdgeId: string | null;
  distanceOnEdgeM: number;
  path: string[];
  pathIndex: number;
  baseSpeedMps: number;
  currentSpeedMps: number;
  reactionDelayS: number;
  scenarioReleaseDelayS: number;
  state: AgentState;
  evacuatedAtS?: number;
  totalWaitTimeS: number;
}

export interface QueueEntry {
  agentId: string;
  targetEdgeId: string;
  queuedAtS: number;
  sequenceNumber: number;
}

export interface AgentSnapshot {
  id: string;
  floor: number;
  x: number;
  y: number;
  state: AgentState;
  currentSpeedMps: number;
}
