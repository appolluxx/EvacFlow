import { describe, it, expect } from 'vitest';
import { Statistics } from '../src/analytics/Statistics';
import { BatchRunner } from '../src/analytics/BatchRunner';
import { defaultSchoolBuilding, DEFAULT_ZONE_ASSIGNMENTS, DEFAULT_FLOOR_DELAYS } from '../src/data/defaultSchoolBuilding';

describe('Batch Analytics & Statistics', () => {
  it('calculates mean and sample standard deviation according to (n - 1) formula', () => {
    const data = [10, 20, 30, 40, 50];
    const mean = Statistics.calculateMean(data);
    expect(mean).toBe(30);

    // Sample SD of [10, 20, 30, 40, 50] with n - 1 = 4:
    // variances: 400 + 100 + 0 + 100 + 400 = 1000 / 4 = 250 -> sqrt(250) ≈ 15.8113883
    const sd = Statistics.calculateSampleSD(data);
    expect(sd).toBeCloseTo(15.811388, 4);
  });

  it('calculates reduction percentage relative to Baseline according to Section 15.5', () => {
    // 100s baseline -> 80s zoning => ((100 - 80) / 100) * 100 = 20% reduction
    const reduction = Statistics.calculateReductionPercent(100, 80);
    expect(reduction).toBe(20);

    // 100s baseline -> 120s staggered => ((100 - 120) / 100) * 100 = -20% (slower)
    const increase = Statistics.calculateReductionPercent(100, 120);
    expect(increase).toBe(-20);
  });

  it('executes a batch simulation with paired seeds and aggregates metrics', () => {
    let progressCalls = 0;
    const batchResult = BatchRunner.runBatchSimulation({
      building: defaultSchoolBuilding,
      scenario: 'BASELINE',
      iterations: 3, // 3 iterations for snappy test
      baseSeed: 1001,
      config: {
        timeStepS: 0.5,
        floorDelaysS: DEFAULT_FLOOR_DELAYS,
        zoneAssignments: DEFAULT_ZONE_ASSIGNMENTS,
      },
      onProgress: () => {
        progressCalls++;
      },
    });

    expect(progressCalls).toBe(3);
    expect(batchResult.iterations).toBe(3);
    expect(batchResult.completedRuns).toBe(3);
    expect(batchResult.runs.length).toBe(3);
    expect(batchResult.meanEvacuationTimeS).toBeGreaterThan(0);
    expect(batchResult.sdEvacuationTimeS).toBeGreaterThanOrEqual(0);
    expect(batchResult.meanPeakDensityPpm2).toBeGreaterThan(0);

    // Verify seed pairing: seeds are 1001, 1002, 1003
    expect(batchResult.runs[0].seed).toBe(1001);
    expect(batchResult.runs[1].seed).toBe(1002);
    expect(batchResult.runs[2].seed).toBe(1003);
  });
});
