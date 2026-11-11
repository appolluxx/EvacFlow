/**
 * Statistical formulas and aggregations according to Section 15 of README.md
 */

export class Statistics {
  /**
   * Calculates arithmetic mean of a dataset
   */
  public static calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  /**
   * Calculates sample standard deviation using (n - 1) denominator
   * according to Section 15.4
   */
  public static calculateSampleSD(values: number[]): number {
    if (values.length <= 1) return 0;
    const mean = this.calculateMean(values);
    const sumSquares = values.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0);
    return Math.sqrt(sumSquares / (values.length - 1));
  }

  /**
   * Calculates reduction percentage relative to Baseline according to Section 15.5:
   * reductionPercent = ((baselineMean - scenarioMean) / baselineMean) * 100
   * Positive value: lower metric than Baseline (e.g. less time or less density)
   * Negative value: higher metric than Baseline
   */
  public static calculateReductionPercent(baselineMean: number, scenarioMean: number): number {
    if (baselineMean === 0) return 0;
    return ((baselineMean - scenarioMean) / baselineMean) * 100;
  }

  /**
   * Aggregates multiple run time-series curves into a single mean curve
   * at consistent time points according to Section 15.6
   */
  public static aggregateTimeCurves(
    curves: { timeS: number; evacuatedCount: number }[][]
  ): { timeS: number; meanEvacuatedCount: number }[] {
    if (curves.length === 0) return [];

    // Collect all unique time points
    const timePointsSet = new Set<number>();
    for (const curve of curves) {
      for (const pt of curve) {
        timePointsSet.add(pt.timeS);
      }
    }
    const timePoints = Array.from(timePointsSet).sort((a, b) => a - b);

    const aggregated: { timeS: number; meanEvacuatedCount: number }[] = [];

    for (const t of timePoints) {
      let sumEvac = 0;

      for (const curve of curves) {
        if (curve.length === 0) continue;

        // Find value at or immediately before time t, or last known value
        let val = 0;
        if (t <= curve[0].timeS) {
          val = curve[0].evacuatedCount;
        } else if (t >= curve[curve.length - 1].timeS) {
          val = curve[curve.length - 1].evacuatedCount;
        } else {
          // Find closest preceding point
          for (let i = 0; i < curve.length; i++) {
            if (curve[i].timeS <= t) {
              val = curve[i].evacuatedCount;
            } else {
              break;
            }
          }
        }
        sumEvac += val;
      }

      aggregated.push({
        timeS: t,
        meanEvacuatedCount: Math.round((sumEvac / curves.length) * 10) / 10,
      });
    }

    return aggregated;
  }
}
