import { Graph } from '../graph/Graph';
import { GraphEdge } from '../../types/graph';
import { SimulationConfig, DEFAULT_SIMULATION_CONSTANTS } from '../../types/scenario';

export interface EdgeSegment {
  edgeId: string;
  segmentIndex: number;
  startM: number;
  endM: number;
  lengthM: number;
  widthM: number;
  areaM2: number;
  storageCapacity: number;
  occupantCount: number;
  densityPpm2: number;
}

export class SegmentManager {
  private segmentsByEdge: Map<string, EdgeSegment[]> = new Map();
  private agentToSegment: Map<string, { edgeId: string; segmentIndex: number }> = new Map();

  private freeFlowDensity: number;
  private jamDensity: number;
  private minSpeedFactor: number;
  private stairSpeedFactor: number;

  constructor(graph: Graph, config?: Partial<SimulationConfig>) {
    const targetSegLen = config?.segmentLengthM ?? DEFAULT_SIMULATION_CONSTANTS.DEFAULT_SEGMENT_LENGTH_M;
    this.freeFlowDensity = config?.freeFlowDensityPpm2 ?? DEFAULT_SIMULATION_CONSTANTS.DEFAULT_FREE_FLOW_DENSITY_PPM2;
    this.jamDensity = config?.jamDensityPpm2 ?? DEFAULT_SIMULATION_CONSTANTS.DEFAULT_JAM_DENSITY_PPM2;
    this.minSpeedFactor = config?.minSpeedFactor ?? DEFAULT_SIMULATION_CONSTANTS.DEFAULT_MIN_SPEED_FACTOR;
    this.stairSpeedFactor = config?.stairSpeedFactor ?? DEFAULT_SIMULATION_CONSTANTS.DEFAULT_STAIR_SPEED_FACTOR;

    for (const edge of graph.getAllEdges()) {
      this.initEdgeSegments(edge, targetSegLen);
    }
  }

  private initEdgeSegments(edge: GraphEdge, targetLengthM: number): void {
    const numSegments = Math.max(1, Math.round(edge.lengthM / targetLengthM));
    const segmentLengthM = edge.lengthM / numSegments;
    const areaM2 = segmentLengthM * edge.widthM;
    const storageCapacity = Math.max(1, Math.floor(areaM2 * this.jamDensity));

    const segments: EdgeSegment[] = [];
    for (let i = 0; i < numSegments; i++) {
      const startM = i * segmentLengthM;
      const endM = (i + 1) * segmentLengthM;
      segments.push({
        edgeId: edge.id,
        segmentIndex: i,
        startM,
        endM,
        lengthM: segmentLengthM,
        widthM: edge.widthM,
        areaM2,
        storageCapacity,
        occupantCount: 0,
        densityPpm2: 0,
      });
    }

    this.segmentsByEdge.set(edge.id, segments);
  }

  public getSegments(edgeId: string): EdgeSegment[] {
    return this.segmentsByEdge.get(edgeId) || [];
  }

  public getSegmentIndex(edgeId: string, distanceM: number): number {
    const segments = this.segmentsByEdge.get(edgeId);
    if (!segments || segments.length === 0) return 0;
    const lastIdx = segments.length - 1;
    if (distanceM <= 0) return 0;
    if (distanceM >= segments[lastIdx].endM) return lastIdx;

    for (let i = 0; i < segments.length; i++) {
      if (distanceM >= segments[i].startM && distanceM < segments[i].endM) {
        return i;
      }
    }
    return lastIdx;
  }

  public getSegment(edgeId: string, segmentIndex: number): EdgeSegment | undefined {
    const segments = this.segmentsByEdge.get(edgeId);
    return segments ? segments[segmentIndex] : undefined;
  }

  public hasCapacity(edgeId: string, segmentIndex: number): boolean {
    const seg = this.getSegment(edgeId, segmentIndex);
    if (!seg) return false;
    return seg.occupantCount < seg.storageCapacity;
  }

  public addOccupant(agentId: string, edgeId: string, segmentIndex: number): boolean {
    const seg = this.getSegment(edgeId, segmentIndex);
    if (!seg) return false;

    // Check if agent is already registered somewhere
    const existing = this.agentToSegment.get(agentId);
    if (existing) {
      if (existing.edgeId === edgeId && existing.segmentIndex === segmentIndex) {
        return true; // Already registered here
      }
      this.removeOccupant(agentId);
    }

    seg.occupantCount++;
    seg.densityPpm2 = seg.occupantCount / seg.areaM2;
    this.agentToSegment.set(agentId, { edgeId, segmentIndex });
    return true;
  }

  public removeOccupant(agentId: string): void {
    const existing = this.agentToSegment.get(agentId);
    if (!existing) return;

    const seg = this.getSegment(existing.edgeId, existing.segmentIndex);
    if (seg && seg.occupantCount > 0) {
      seg.occupantCount--;
      seg.densityPpm2 = seg.occupantCount / seg.areaM2;
    }
    this.agentToSegment.delete(agentId);
  }

  public getAgentLocation(agentId: string): { edgeId: string; segmentIndex: number } | undefined {
    return this.agentToSegment.get(agentId);
  }

  /**
   * Calculates local movement speed based on Section 11.2 formula
   */
  public calculateSpeed(baseSpeedMps: number, isStair: boolean, densityPpm2: number): number {
    const vFree = isStair ? baseSpeedMps * this.stairSpeedFactor : baseSpeedMps;

    if (densityPpm2 <= this.freeFlowDensity) {
      return vFree;
    }

    const congestionFactor = 1 - (densityPpm2 - this.freeFlowDensity) / (this.jamDensity - this.freeFlowDensity);
    return vFree * Math.max(this.minSpeedFactor, congestionFactor);
  }

  public clearAll(): void {
    for (const segments of this.segmentsByEdge.values()) {
      for (const seg of segments) {
        seg.occupantCount = 0;
        seg.densityPpm2 = 0;
      }
    }
    this.agentToSegment.clear();
  }

  public getPeakDensity(): number {
    let peak = 0;
    for (const segments of this.segmentsByEdge.values()) {
      for (const seg of segments) {
        if (seg.densityPpm2 > peak) {
          peak = seg.densityPpm2;
        }
      }
    }
    return peak;
  }
}
