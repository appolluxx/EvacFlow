/**
 * Result and validation types for EvacFlow
 */

import { ScenarioType } from './scenario';

export type ValidationSeverity = 'ERROR' | 'WARNING';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
  zoneId?: string;
  stairwellId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

export interface SimulationMetrics {
  timeS: number;
  evacuatedCount: number;
  totalOccupants: number;
  activeBottlenecks: number;
  currentDensityPpm2: number;
  peakDensityPpm2: number;
  queuedCount: number;
}

export interface RunResult {
  runId: string;
  scenario: ScenarioType;
  seed: number;
  completed: boolean;
  totalEvacuationTimeS: number | null;
  peakDensityPpm2: number;
  maxIndividualWaitS: number;
  meanQueueWaitS: number;
  evacuatedCount: number;
  totalOccupants: number;
  timeSeries: { timeS: number; evacuatedCount: number }[];
  failureReason?: string;
}

export interface BatchResult {
  scenario: ScenarioType;
  iterations: number;
  completedRuns: number;
  meanEvacuationTimeS: number | null;
  sdEvacuationTimeS: number | null;
  meanPeakDensityPpm2: number;
  sdPeakDensityPpm2: number;
  meanMaxWaitS: number;
  runs: RunResult[];
}
