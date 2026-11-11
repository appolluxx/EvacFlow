import { QueueEntry } from '../../types/agent';
import { SegmentManager } from '../congestion/SegmentManager';

export interface QueueWaitRecord {
  agentId: string;
  targetEdgeId: string;
  targetSegmentIndex: number;
  durationS: number;
}

export class QueueManager {
  // Key: `${targetEdgeId}:${targetSegmentIndex}`
  private queues: Map<string, QueueEntry[]> = new Map();
  private agentInQueue: Map<string, { queueKey: string; entry: QueueEntry }> = new Map();
  private sequenceCounter = 0;
  private waitRecords: QueueWaitRecord[] = [];

  public static getQueueKey(edgeId: string, segmentIndex: number): string {
    return `${edgeId}:${segmentIndex}`;
  }

  public isQueued(agentId: string): boolean {
    return this.agentInQueue.has(agentId);
  }

  public enqueue(
    agentId: string,
    targetEdgeId: string,
    targetSegmentIndex: number,
    currentTimeS: number
  ): boolean {
    if (this.agentInQueue.has(agentId)) {
      return false; // Already queued
    }

    const queueKey = QueueManager.getQueueKey(targetEdgeId, targetSegmentIndex);
    const entry: QueueEntry = {
      agentId,
      targetEdgeId,
      queuedAtS: currentTimeS,
      sequenceNumber: ++this.sequenceCounter,
    };

    let q = this.queues.get(queueKey);
    if (!q) {
      q = [];
      this.queues.set(queueKey, q);
    }

    q.push(entry);
    this.agentInQueue.set(agentId, { queueKey, entry });
    return true;
  }

  /**
   * Attempts to admit queued agents into target segments if storage capacity allows.
   * Enforces strict FIFO order based on queuedAtS and sequenceNumber.
   * Returns list of admitted agent IDs.
   */
  public processQueues(
    segmentManager: SegmentManager,
    currentTimeS: number
  ): {
    admitted: Array<{ agentId: string; edgeId: string; segmentIndex: number }>;
    maxQueueLength: number;
  } {
    const admitted: Array<{ agentId: string; edgeId: string; segmentIndex: number }> = [];
    let maxQueueLength = 0;

    for (const [queueKey, queue] of this.queues.entries()) {
      if (queue.length === 0) continue;
      if (queue.length > maxQueueLength) {
        maxQueueLength = queue.length;
      }

      const [edgeId, segIdxStr] = queueKey.split(':');
      const segmentIndex = parseInt(segIdxStr, 10);

      // Try admitting from head of FIFO queue as long as capacity exists
      while (queue.length > 0) {
        const head = queue[0];
        if (segmentManager.hasCapacity(edgeId, segmentIndex)) {
          // Admit agent
          queue.shift();
          this.agentInQueue.delete(head.agentId);
          segmentManager.addOccupant(head.agentId, edgeId, segmentIndex);
          admitted.push({ agentId: head.agentId, edgeId, segmentIndex });

          const waitDurationS = Math.max(0, currentTimeS - head.queuedAtS);
          this.waitRecords.push({
            agentId: head.agentId,
            targetEdgeId: edgeId,
            targetSegmentIndex: segmentIndex,
            durationS: waitDurationS,
          });
        } else {
          // Downstream segment full; cannot admit head of FIFO queue
          break;
        }
      }
    }

    return { admitted, maxQueueLength };
  }

  public remove(agentId: string): void {
    const info = this.agentInQueue.get(agentId);
    if (!info) return;

    const queue = this.queues.get(info.queueKey);
    if (queue) {
      const idx = queue.findIndex((e) => e.agentId === agentId);
      if (idx !== -1) queue.splice(idx, 1);
    }
    this.agentInQueue.delete(agentId);
  }

  public getTotalQueuedCount(): number {
    return this.agentInQueue.size;
  }

  public getWaitRecords(): QueueWaitRecord[] {
    return this.waitRecords;
  }

  public clear(): void {
    this.queues.clear();
    this.agentInQueue.clear();
    this.sequenceCounter = 0;
    this.waitRecords = [];
  }
}
