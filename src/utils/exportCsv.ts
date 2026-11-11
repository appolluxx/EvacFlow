import { RunResult, BatchResult } from '../types/results';
import { EdgeBottleneckMetric } from '../engine/metrics/MetricsCollector';

export class CsvExporter {
  public static exportRunSummaryCsv(runs: RunResult[]): string {
    const headers = [
      'Run ID',
      'Scenario',
      'Seed',
      'Completed',
      'Total Evacuation Time (s)',
      'Peak Density (ppm2)',
      'Max Individual Wait (s)',
      'Mean Queue Wait (s)',
      'Evacuated Occupants',
      'Total Occupants',
    ];

    const rows = runs.map((r) => [
      r.runId,
      r.scenario,
      r.seed,
      r.completed ? 'YES' : 'NO',
      r.totalEvacuationTimeS ?? 'INCOMPLETE',
      r.peakDensityPpm2,
      r.maxIndividualWaitS,
      r.meanQueueWaitS,
      r.evacuatedCount,
      r.totalOccupants,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  public static exportTimeSeriesCsv(timeSeries: { timeS: number; evacuatedCount: number }[]): string {
    const headers = ['Time (s)', 'Cumulative Evacuated Occupants'];
    const rows = timeSeries.map((pt) => [pt.timeS, pt.evacuatedCount]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public static exportBottlenecksCsv(bottlenecks: EdgeBottleneckMetric[]): string {
    const headers = [
      'Edge ID',
      'Edge Description',
      'Is Stair',
      'Peak Density (ppm2)',
      'Time Above 2.0 ppm2 (s)',
      'Time Above 3.0 ppm2 (s)',
      'Max Queue Length',
    ];

    const rows = bottlenecks.map((b) => [
      b.edgeId,
      `"${b.edgeLabel}"`,
      b.isStair ? 'YES' : 'NO',
      b.peakDensityPpm2,
      b.timeAbove2Ppm2S,
      b.timeAbove3Ppm2S,
      b.maxQueueLength,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public static exportBatchSummaryCsv(batchResults: BatchResult[]): string {
    const headers = [
      'Scenario',
      'Iterations',
      'Completed Runs',
      'Mean Evacuation Time (s)',
      'Sample SD Time (s)',
      'Mean Peak Density (ppm2)',
      'Sample SD Density (ppm2)',
      'Mean Max Wait (s)',
    ];

    const rows = batchResults.map((b) => [
      b.scenario,
      b.iterations,
      b.completedRuns,
      b.meanEvacuationTimeS ?? 'N/A',
      b.sdEvacuationTimeS ?? 'N/A',
      b.meanPeakDensityPpm2,
      b.sdPeakDensityPpm2,
      b.meanMaxWaitS,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
