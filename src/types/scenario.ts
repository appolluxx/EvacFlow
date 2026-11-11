/**
 * Scenario and simulation configuration types for EvacFlow
 */

export type ScenarioType = 'BASELINE' | 'ZONING' | 'STAGGERED';

export interface SimulationConfig {
  scenario: ScenarioType;
  timeStepS: number;
  playbackSpeed: number;
  floorDelaysS: Record<number, number>;
  zoneAssignments: Record<string, string>; // zoneId -> stairwellId
  randomSeed: number;

  // Physical & modeling parameters with defaults
  walkingSpeedMinMps?: number;
  walkingSpeedMaxMps?: number;
  stairSpeedFactor?: number;
  freeFlowDensityPpm2?: number;
  jamDensityPpm2?: number;
  minSpeedFactor?: number;
  segmentLengthM?: number;
  maxSimulationDurationS?: number;
}

export const DEFAULT_SIMULATION_CONSTANTS = {
  DEFAULT_TIME_STEP_S: 0.1,
  DEFAULT_WALKING_SPEED_MIN_MPS: 1.2,
  DEFAULT_WALKING_SPEED_MAX_MPS: 1.5,
  DEFAULT_STAIR_SPEED_FACTOR: 0.6,
  DEFAULT_FREE_FLOW_DENSITY_PPM2: 0.5,
  DEFAULT_JAM_DENSITY_PPM2: 4.0,
  DEFAULT_MIN_SPEED_FACTOR: 0.15,
  DEFAULT_SEGMENT_LENGTH_M: 1.5,
  DEFAULT_MAX_SIMULATION_DURATION_S: 1800, // 30 minutes max
} as const;
