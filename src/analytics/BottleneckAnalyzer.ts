import { EdgeBottleneckMetric } from '../engine/metrics/MetricsCollector';

export interface RankedBottleneck {
  rank: number;
  edgeId: string;
  edgeLabel: string;
  isStair: boolean;
  score: number;
  peakDensityPpm2: number;
  timeAbove2Ppm2S: number;
  timeAbove3Ppm2S: number;
  maxQueueLength: number;
  primaryConstrainingFactor: string;
  promptForReview: string;
}

export class BottleneckAnalyzer {
  /**
   * Ranks building bottlenecks using composite multi-signal evidence
   * according to Section 11.6 of README.md.
   */
  public static rankBottlenecks(metrics: EdgeBottleneckMetric[]): RankedBottleneck[] {
    const scored = metrics.map((m) => {
      // Composite score weighting peak density and duration of critical congestion
      const densityScore = m.peakDensityPpm2 * 10;
      const durationScore = m.timeAbove3Ppm2S * 2 + m.timeAbove2Ppm2S * 0.5;
      const queueScore = m.maxQueueLength * 5;
      const totalScore = Math.round((densityScore + durationScore + queueScore) * 10) / 10;

      let primaryFactor = 'Moderate flow';
      let prompt = 'Observe flow rates during drills.';

      if (m.timeAbove3Ppm2S > 10) {
        primaryFactor = 'Critical prolonged density (>= 3.0 ppm²)';
        prompt = m.isStair
          ? 'Consider reviewing stairwell entrance capacity and staging upstream flow.'
          : 'Examine widening corridor transition or rebalancing zone allocations.';
      } else if (m.maxQueueLength > 5) {
        primaryFactor = 'High queue buildup';
        prompt = 'Check if downstream bottleneck or door restriction is causing queuing.';
      } else if (m.peakDensityPpm2 >= 2.0) {
        primaryFactor = 'Transient peak density (>= 2.0 ppm²)';
        prompt = 'Monitor crowd surge timing between converging room exits.';
      }

      return {
        edgeId: m.edgeId,
        edgeLabel: m.edgeLabel,
        isStair: m.isStair,
        score: totalScore,
        peakDensityPpm2: m.peakDensityPpm2,
        timeAbove2Ppm2S: m.timeAbove2Ppm2S,
        timeAbove3Ppm2S: m.timeAbove3Ppm2S,
        maxQueueLength: m.maxQueueLength,
        primaryConstrainingFactor: primaryFactor,
        promptForReview: prompt,
      };
    });

    // Sort by composite score descending
    scored.sort((a, b) => b.score - a.score);

    return scored.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }
}
