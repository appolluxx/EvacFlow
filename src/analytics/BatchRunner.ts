import { BuildingData } from '../types/graph';
import { ScenarioType, SimulationConfig } from '../types/scenario';
import { BatchResult, RunResult } from '../types/results';
import { SimulationEngine } from '../engine/SimulationEngine';
import { Statistics } from './Statistics';

export interface BatchSimulationParams {
  building: BuildingData;
  scenario: ScenarioType;
  iterations?: number;
  baseSeed?: number;
  config: Partial<SimulationConfig>;
  onProgress?: (progress: { completed: number; total: number; currentIteration: number }) => void;
}

export class BatchRunner {
  /**
   * Executes headless batch experiments with reproducible paired seeds.
   */
  public static runBatchSimulation(params: BatchSimulationParams): BatchResult {
    const iterations = params.iterations ?? 10;
    const baseSeed = params.baseSeed ?? 1001;
    const runs: RunResult[] = [];

    for (let i = 0; i < iterations; i++) {
      const seed = baseSeed + i;
      const fullConfig: SimulationConfig = {
        scenario: params.scenario,
        timeStepS: params.config.timeStepS ?? 0.2,
        playbackSpeed: 1,
        floorDelaysS: params.config.floorDelaysS ?? {},
        zoneAssignments: params.config.zoneAssignments ?? {},
        randomSeed: seed,
        walkingSpeedMinMps: params.config.walkingSpeedMinMps,
        walkingSpeedMaxMps: params.config.walkingSpeedMaxMps,
        stairSpeedFactor: params.config.stairSpeedFactor,
        freeFlowDensityPpm2: params.config.freeFlowDensityPpm2,
        jamDensityPpm2: params.config.jamDensityPpm2,
        minSpeedFactor: params.config.minSpeedFactor,
        segmentLengthM: params.config.segmentLengthM,
        maxSimulationDurationS: params.config.maxSimulationDurationS,
      };

      const engine = new SimulationEngine(params.building, fullConfig);
      const runResult = engine.runUntilComplete();
      runs.push(runResult);

      if (params.onProgress) {
        params.onProgress({
          completed: i + 1,
          total: iterations,
          currentIteration: i + 1,
        });
      }
    }

    const completedRuns = runs.filter((r) => r.completed);
    const evacTimes = completedRuns
      .map((r) => r.totalEvacuationTimeS)
      .filter((t): t is number => t !== null);

    const peakDensities = runs.map((r) => r.peakDensityPpm2);
    const maxWaits = runs.map((r) => r.maxIndividualWaitS);

    const meanEvacTime = evacTimes.length > 0 ? Statistics.calculateMean(evacTimes) : null;
    const sdEvacTime = evacTimes.length > 1 ? Statistics.calculateSampleSD(evacTimes) : null;

    const meanPeakDensity = Statistics.calculateMean(peakDensities);
    const sdPeakDensity = Statistics.calculateSampleSD(peakDensities);
    const meanMaxWait = Statistics.calculateMean(maxWaits);

    return {
      scenario: params.scenario,
      iterations,
      completedRuns: completedRuns.length,
      meanEvacuationTimeS: meanEvacTime !== null ? Math.round(meanEvacTime * 10) / 10 : null,
      sdEvacuationTimeS: sdEvacTime !== null ? Math.round(sdEvacTime * 10) / 10 : null,
      meanPeakDensityPpm2: Math.round(meanPeakDensity * 100) / 100,
      sdPeakDensityPpm2: Math.round(sdPeakDensity * 100) / 100,
      meanMaxWaitS: Math.round(meanMaxWait * 10) / 10,
      runs,
    };
  }
}
