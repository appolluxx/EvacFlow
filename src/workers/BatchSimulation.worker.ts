import { BatchRunner, BatchSimulationParams } from '../analytics/BatchRunner';

self.onmessage = (e: MessageEvent<BatchSimulationParams>) => {
  const params = e.data;

  try {
    const result = BatchRunner.runBatchSimulation({
      ...params,
      onProgress: (progress) => {
        self.postMessage({ type: 'PROGRESS', progress });
      },
    });

    self.postMessage({ type: 'COMPLETE', result });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
