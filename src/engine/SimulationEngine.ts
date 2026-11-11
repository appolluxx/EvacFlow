import { Graph } from './graph/Graph';
import { Agent, AgentSnapshot } from '../types/agent';
import { BuildingData } from '../types/graph';
import { SimulationConfig, DEFAULT_SIMULATION_CONSTANTS } from '../types/scenario';
import { SimulationMetrics, RunResult } from '../types/results';
import { AgentFactory } from './agents/AgentFactory';
import { RouteGenerator } from './scenarios/RouteGenerator';
import { SegmentManager } from './congestion/SegmentManager';
import { QueueManager } from './movement/QueueManager';
import { MovementEngine } from './movement/MovementEngine';
import { MetricsCollector, EdgeBottleneckMetric } from './metrics/MetricsCollector';

export class SimulationEngine {
  private graph: Graph;
  private config: SimulationConfig;
  private agents: Agent[] = [];
  private segmentManager: SegmentManager;
  private queueManager: QueueManager;
  private movementEngine: MovementEngine;
  private metricsCollector: MetricsCollector;

  private currentTimeS = 0;
  private currentMetrics: SimulationMetrics;
  private isFinished = false;

  constructor(data: BuildingData, config: SimulationConfig) {
    this.graph = new Graph(data);
    this.config = {
      ...config,
      timeStepS: config.timeStepS || DEFAULT_SIMULATION_CONSTANTS.DEFAULT_TIME_STEP_S,
    };

    this.segmentManager = new SegmentManager(this.graph, this.config);
    this.queueManager = new QueueManager();
    this.movementEngine = new MovementEngine(this.graph, this.segmentManager, this.queueManager);

    // 1. Create seeded agents
    this.agents = AgentFactory.createAgents(this.graph, this.config);

    // 2. Assign routes based on scenario
    const assignments = RouteGenerator.assignRoutes(this.graph, this.agents, this.config);
    for (const agent of this.agents) {
      const assignment = assignments.get(agent.id);
      if (assignment && assignment.isAssigned && assignment.route) {
        agent.path = [...assignment.route.path];
        agent.scenarioReleaseDelayS = assignment.releaseDelayS;
      } else {
        agent.state = 'UNASSIGNED';
      }
    }

    // 3. Initialize metrics collector
    this.metricsCollector = new MetricsCollector(
      this.graph,
      this.config.scenario,
      this.config.randomSeed,
      this.agents.length
    );

    this.currentMetrics = this.metricsCollector.recordStep(
      this.agents,
      this.segmentManager,
      this.queueManager,
      0,
      0
    );
  }

  public step(): SimulationMetrics {
    if (this.isFinished) return this.currentMetrics;

    const dt = this.config.timeStepS;
    this.currentTimeS += dt;

    this.movementEngine.step(this.agents, this.currentTimeS, dt);

    this.currentMetrics = this.metricsCollector.recordStep(
      this.agents,
      this.segmentManager,
      this.queueManager,
      this.currentTimeS,
      dt
    );

    // Check completion: all agents evacuated or unassigned
    const remaining = this.agents.filter(
      (a) => a.state !== 'EVACUATED' && a.state !== 'UNASSIGNED'
    ).length;

    if (remaining === 0) {
      this.isFinished = true;
    }

    return this.currentMetrics;
  }

  public runUntilComplete(maxDurationS?: number): RunResult {
    const limitS =
      maxDurationS ??
      this.config.maxSimulationDurationS ??
      DEFAULT_SIMULATION_CONSTANTS.DEFAULT_MAX_SIMULATION_DURATION_S;

    while (!this.isFinished && this.currentTimeS < limitS) {
      this.step();
    }

    const completed = this.isFinished;
    const failureReason = !completed
      ? `Simulation reached max duration limit (${limitS}s) before all occupants evacuated.`
      : undefined;

    return this.metricsCollector.getFinalResult(
      this.agents,
      this.queueManager,
      this.currentTimeS,
      completed,
      failureReason
    );
  }

  public getSnapshot(): AgentSnapshot[] {
    const snapshots: AgentSnapshot[] = [];

    for (const agent of this.agents) {
      let x = 0;
      let y = 0;
      let floor = agent.originFloor;

      if (agent.state === 'WAITING' || agent.state === 'UNASSIGNED') {
        const origin = this.graph.getNode(agent.originNodeId);
        if (origin) {
          x = origin.x;
          y = origin.y;
          floor = origin.floor;
        }
      } else if (agent.state === 'EVACUATED') {
        const exitNode = agent.currentNodeId ? this.graph.getNode(agent.currentNodeId) : null;
        if (exitNode) {
          x = exitNode.x;
          y = exitNode.y;
          floor = exitNode.floor;
        }
      } else if (agent.currentEdgeId) {
        const edge = this.graph.getEdge(agent.currentEdgeId);
        if (edge) {
          const u = this.graph.getNode(agent.path[agent.pathIndex]);
          const v = this.graph.getNode(agent.path[agent.pathIndex + 1]);

          if (u && v) {
            const frac = edge.lengthM > 0 ? Math.min(1, Math.max(0, agent.distanceOnEdgeM / edge.lengthM)) : 0;
            x = u.x + frac * (v.x - u.x);
            y = u.y + frac * (v.y - u.y);
            // If stair edge, floor transitions halfway
            floor = frac < 0.5 ? u.floor : v.floor;
          }
        }
      }

      snapshots.push({
        id: agent.id,
        floor,
        x,
        y,
        state: agent.state,
        currentSpeedMps: agent.currentSpeedMps,
      });
    }

    return snapshots;
  }

  public getMetrics(): SimulationMetrics {
    return this.currentMetrics;
  }

  public isCompleted(): boolean {
    return this.isFinished;
  }

  public getCurrentTimeS(): number {
    return this.currentTimeS;
  }

  public getAgents(): Agent[] {
    return this.agents;
  }

  public getGraph(): Graph {
    return this.graph;
  }

  public getSegmentManager(): SegmentManager {
    return this.segmentManager;
  }

  public getEdgeBottlenecks(): EdgeBottleneckMetric[] {
    return this.metricsCollector.getEdgeBottlenecks();
  }
}
