import { Agent } from '../../types/agent';
import { SimulationMetrics, RunResult } from '../../types/results';
import { ScenarioType } from '../../types/scenario';
import { SegmentManager } from '../congestion/SegmentManager';
import { QueueManager } from '../movement/QueueManager';
import { Graph } from '../graph/Graph';

export interface EdgeBottleneckMetric {
  edgeId: string;
  edgeLabel: string;
  isStair: boolean;
  peakDensityPpm2: number;
  timeAbove2Ppm2S: number;
  timeAbove3Ppm2S: number;
  maxQueueLength: number;
  totalWaitTimeS: number;
}

export class MetricsCollector {
  private scenario: ScenarioType;
  private seed: number;
  private totalOccupants: number;
  private peakDensitySoFar = 0;
  private timeSeries: { timeS: number; evacuatedCount: number }[] = [];
  private lastTimeSeriesRecordedS = -1;

  private edgeMetrics: Map<string, EdgeBottleneckMetric> = new Map();

  constructor(graph: Graph, scenario: ScenarioType, seed: number, totalOccupants: number) {
    this.scenario = scenario;
    this.seed = seed;
    this.totalOccupants = totalOccupants;

    for (const edge of graph.getAllEdges()) {
      this.edgeMetrics.set(edge.id, {
        edgeId: edge.id,
        edgeLabel: `${edge.from} -> ${edge.to}`,
        isStair: edge.isStair,
        peakDensityPpm2: 0,
        timeAbove2Ppm2S: 0,
        timeAbove3Ppm2S: 0,
        maxQueueLength: 0,
        totalWaitTimeS: 0,
      });
    }
  }

  public recordStep(
    agents: Agent[],
    segmentManager: SegmentManager,
    _queueManager: QueueManager,
    currentTimeS: number,
    dt: number
  ): SimulationMetrics {
    let evacuatedCount = 0;
    let queuedCount = 0;
    let currentStepPeakDensity = 0;

    for (const agent of agents) {
      if (agent.state === 'EVACUATED') evacuatedCount++;
      else if (agent.state === 'QUEUED') queuedCount++;
    }

    // Sample edge densities and bottleneck durations
    let activeBottlenecks = 0;

    for (const [edgeId, metric] of this.edgeMetrics.entries()) {
      const segments = segmentManager.getSegments(edgeId);
      let edgeMaxDensity = 0;

      for (const seg of segments) {
        if (seg.densityPpm2 > edgeMaxDensity) {
          edgeMaxDensity = seg.densityPpm2;
        }
      }

      if (edgeMaxDensity > metric.peakDensityPpm2) {
        metric.peakDensityPpm2 = edgeMaxDensity;
      }
      if (edgeMaxDensity > currentStepPeakDensity) {
        currentStepPeakDensity = edgeMaxDensity;
      }

      if (edgeMaxDensity >= 2.0) {
        metric.timeAbove2Ppm2S += dt;
        activeBottlenecks++;
      }
      if (edgeMaxDensity >= 3.0) {
        metric.timeAbove3Ppm2S += dt;
      }
    }

    if (currentStepPeakDensity > this.peakDensitySoFar) {
      this.peakDensitySoFar = currentStepPeakDensity;
    }

    // Record time series point every 1.0s or at start/end
    if (currentTimeS - this.lastTimeSeriesRecordedS >= 1.0 || evacuatedCount === this.totalOccupants) {
      this.timeSeries.push({
        timeS: Math.round(currentTimeS * 10) / 10,
        evacuatedCount,
      });
      this.lastTimeSeriesRecordedS = currentTimeS;
    }

    return {
      timeS: currentTimeS,
      evacuatedCount,
      totalOccupants: this.totalOccupants,
      activeBottlenecks,
      currentDensityPpm2: Math.round(currentStepPeakDensity * 100) / 100,
      peakDensityPpm2: Math.round(this.peakDensitySoFar * 100) / 100,
      queuedCount,
    };
  }

  public getFinalResult(
    agents: Agent[],
    queueManager: QueueManager,
    currentTimeS: number,
    completed: boolean,
    failureReason?: string
  ): RunResult {
    let maxWaitS = 0;
    let evacuatedCount = 0;
    let lastEvacTimeS: number | null = null;

    for (const agent of agents) {
      if (agent.totalWaitTimeS > maxWaitS) {
        maxWaitS = agent.totalWaitTimeS;
      }
      if (agent.state === 'EVACUATED' && agent.evacuatedAtS !== undefined) {
        evacuatedCount++;
        if (lastEvacTimeS === null || agent.evacuatedAtS > lastEvacTimeS) {
          lastEvacTimeS = agent.evacuatedAtS;
        }
      }
    }

    const waitRecords = queueManager.getWaitRecords();
    const meanQueueWaitS =
      waitRecords.length > 0
        ? waitRecords.reduce((sum, r) => sum + r.durationS, 0) / waitRecords.length
        : 0;

    return {
      runId: `run_${this.scenario}_${this.seed}_${Date.now()}`,
      scenario: this.scenario,
      seed: this.seed,
      completed,
      totalEvacuationTimeS: completed ? (lastEvacTimeS !== null ? Math.round(lastEvacTimeS * 10) / 10 : currentTimeS) : null,
      peakDensityPpm2: Math.round(this.peakDensitySoFar * 100) / 100,
      maxIndividualWaitS: Math.round(maxWaitS * 10) / 10,
      meanQueueWaitS: Math.round(meanQueueWaitS * 10) / 10,
      evacuatedCount,
      totalOccupants: this.totalOccupants,
      timeSeries: this.timeSeries,
      failureReason,
    };
  }

  public getEdgeBottlenecks(): EdgeBottleneckMetric[] {
    return Array.from(this.edgeMetrics.values()).sort(
      (a, b) => b.peakDensityPpm2 - a.peakDensityPpm2
    );
  }
}
