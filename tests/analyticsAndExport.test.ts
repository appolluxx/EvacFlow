import { describe, it, expect } from 'vitest';
import { defaultSchoolBuilding } from '../src/data/defaultSchoolBuilding';
import { SerializationUtil } from '../src/utils/serialization';
import { CsvExporter } from '../src/utils/exportCsv';
import { BottleneckAnalyzer } from '../src/analytics/BottleneckAnalyzer';
import { RunResult, BatchResult } from '../src/types/results';
import { EdgeBottleneckMetric } from '../src/engine/metrics/MetricsCollector';

describe('Serialization and Export (Phase 6)', () => {
  it('exports and re-imports valid building JSON without loss of data', () => {
    const jsonStr = SerializationUtil.exportToJson(defaultSchoolBuilding);
    expect(jsonStr).toBeDefined();

    const outcome = SerializationUtil.importFromJson(jsonStr);
    expect(outcome.success).toBe(true);
    expect(outcome.data).toBeDefined();
    expect(outcome.data?.nodes.length).toBe(defaultSchoolBuilding.nodes.length);
    expect(outcome.data?.edges.length).toBe(defaultSchoolBuilding.edges.length);
  });

  it('rejects invalid JSON structure with descriptive error', () => {
    const invalidJson = JSON.stringify({ broken: true });
    const outcome = SerializationUtil.importFromJson(invalidJson);
    expect(outcome.success).toBe(false);
    expect(outcome.error).toBeDefined();
  });

  it('exports valid run summary CSV with units and headers', () => {
    const sampleRun: RunResult = {
      runId: 'test_run_1',
      scenario: 'BASELINE',
      seed: 1001,
      completed: true,
      totalEvacuationTimeS: 320.5,
      peakDensityPpm2: 2.8,
      maxIndividualWaitS: 45.2,
      meanQueueWaitS: 12.4,
      evacuatedCount: 756,
      totalOccupants: 756,
      timeSeries: [{ timeS: 0, evacuatedCount: 0 }],
    };

    const csv = CsvExporter.exportRunSummaryCsv([sampleRun]);
    expect(csv).toContain('Run ID,Scenario,Seed,Completed');
    expect(csv).toContain('test_run_1,BASELINE,1001,YES,320.5,2.8,45.2,12.4,756,756');
  });

  it('exports batch summary CSV with statistical metrics', () => {
    const batchRes: BatchResult = {
      scenario: 'BASELINE',
      iterations: 10,
      completedRuns: 10,
      meanEvacuationTimeS: 310.2,
      sdEvacuationTimeS: 12.8,
      meanPeakDensityPpm2: 2.75,
      sdPeakDensityPpm2: 0.15,
      meanMaxWaitS: 42.1,
      runs: [],
    };

    const csv = CsvExporter.exportBatchSummaryCsv([batchRes]);
    expect(csv).toContain('Scenario,Iterations,Completed Runs,Mean Evacuation Time (s)');
    expect(csv).toContain('BASELINE,10,10,310.2,12.8,2.75,0.15,42.1');
  });

  it('ranks bottlenecks and generates actionable analysis prompts', () => {
    const sampleMetrics: EdgeBottleneckMetric[] = [
      {
        edgeId: 'e_corridor',
        edgeLabel: 'Main Corridor',
        isStair: false,
        peakDensityPpm2: 1.5,
        timeAbove2Ppm2S: 0,
        timeAbove3Ppm2S: 0,
        maxQueueLength: 0,
        totalWaitTimeS: 0,
      },
      {
        edgeId: 'e_stair_bottleneck',
        edgeLabel: 'Stair Flight 2->1',
        isStair: true,
        peakDensityPpm2: 3.5,
        timeAbove2Ppm2S: 45,
        timeAbove3Ppm2S: 25,
        maxQueueLength: 12,
        totalWaitTimeS: 120,
      },
    ];

    const ranked = BottleneckAnalyzer.rankBottlenecks(sampleMetrics);
    expect(ranked.length).toBe(2);
    expect(ranked[0].edgeId).toBe('e_stair_bottleneck');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].isStair).toBe(true);
    expect(ranked[0].promptForReview).toContain('stairwell entrance');
  });
});
