import React, { useState } from 'react';
import { BuildingData } from '../../types/graph';
import { BatchResult } from '../../types/results';
import { BatchRunner } from '../../analytics/BatchRunner';
import { Statistics } from '../../analytics/Statistics';
import { CsvExporter } from '../../utils/exportCsv';
import { SerializationUtil } from '../../utils/serialization';
import { DEFAULT_ZONE_ASSIGNMENTS, DEFAULT_FLOOR_DELAYS } from '../../data/defaultSchoolBuilding';
import { X, Play, Download, CheckCircle, Loader2 } from 'lucide-react';

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: BuildingData;
  onApplyResults: (results: BatchResult[]) => void;
}

export const BatchModal: React.FC<BatchModalProps> = ({
  isOpen,
  onClose,
  building,
  onApplyResults,
}) => {
  const [iterations, setIterations] = useState(10);
  const [baseSeed, setBaseSeed] = useState(1001);
  const [isRunning, setIsRunning] = useState(false);
  const [currentProgress, setCurrentProgress] = useState({ completed: 0, total: 30, text: '' });
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);

  if (!isOpen) return null;

  const handleStartBatch = async () => {
    setIsRunning(true);
    setBatchResults([]);

    const scenarios = ['BASELINE', 'ZONING', 'STAGGERED'] as const;
    const totalRuns = scenarios.length * iterations;
    let overallCompleted = 0;
    const results: BatchResult[] = [];

    // Run sequentially with setTimeout to allow UI update
    for (const sc of scenarios) {
      setCurrentProgress({
        completed: overallCompleted,
        total: totalRuns,
        text: `Running ${sc} (${iterations} iterations)...`,
      });

      // Small async tick
      await new Promise((r) => setTimeout(r, 50));

      const res = BatchRunner.runBatchSimulation({
        building,
        scenario: sc,
        iterations,
        baseSeed,
        config: {
          timeStepS: 0.2,
          floorDelaysS: DEFAULT_FLOOR_DELAYS,
          zoneAssignments: DEFAULT_ZONE_ASSIGNMENTS,
        },
        onProgress: () => {
          overallCompleted++;
          setCurrentProgress({
            completed: overallCompleted,
            total: totalRuns,
            text: `Running ${sc} (iteration ${overallCompleted % iterations || iterations}/${iterations})...`,
          });
        },
      });

      results.push(res);
    }

    setBatchResults(results);
    onApplyResults(results);
    setIsRunning(false);
  };

  const baseline = batchResults.find((r) => r.scenario === 'BASELINE');

  const handleExportCsv = () => {
    if (batchResults.length === 0) return;
    const csv = CsvExporter.exportBatchSummaryCsv(batchResults);
    SerializationUtil.downloadFile(csv, 'evacflow_batch_comparison.csv', 'text/csv');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Batch Experiment Runner (Paired Seeds)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Runs Baseline, Zoning, and Staggered under identical paired random seeds
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <label className="text-xs text-slate-400 font-semibold block mb-1">
              Iterations per scenario:
            </label>
            <input
              type="number"
              min={3}
              max={30}
              value={iterations}
              disabled={isRunning}
              onChange={(e) => setIterations(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-sm font-mono text-white focus:outline-none"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">Default: 10 runs</span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <label className="text-xs text-slate-400 font-semibold block mb-1">
              Starting Random Seed:
            </label>
            <input
              type="number"
              value={baseSeed}
              disabled={isRunning}
              onChange={(e) => setBaseSeed(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-sm font-mono text-white focus:outline-none"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">Paired: seed + 0..{iterations - 1}</span>
          </div>
        </div>

        {/* Progress bar if running */}
        {isRunning && (
          <div className="space-y-2 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-indigo-300 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" /> {currentProgress.text}
              </span>
              <span className="font-mono text-slate-400">
                {currentProgress.completed} / {currentProgress.total} runs
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full transition-all duration-200"
                style={{
                  width: `${(currentProgress.completed / currentProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Batch Results Table */}
        {batchResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Comparative Results (n = {iterations})
              </h3>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                <Download className="w-3.5 h-3.5" /> Export Batch CSV
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="py-2 px-3">Scenario</th>
                    <th className="py-2 px-3">Mean Evac Time ± SD</th>
                    <th className="py-2 px-3">Reduction vs Baseline</th>
                    <th className="py-2 px-3">Mean Peak Density</th>
                    <th className="py-2 px-3">Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {batchResults.map((r) => {
                    const reduction =
                      baseline?.meanEvacuationTimeS && r.meanEvacuationTimeS
                        ? Statistics.calculateReductionPercent(
                            baseline.meanEvacuationTimeS,
                            r.meanEvacuationTimeS
                          )
                        : null;

                    return (
                      <tr key={r.scenario} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-semibold text-white">{r.scenario}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-200">
                          {r.meanEvacuationTimeS}s ± {r.sdEvacuationTimeS ?? 0}s
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium">
                          {r.scenario === 'BASELINE' ? (
                            <span className="text-slate-500">Reference (0%)</span>
                          ) : reduction !== null ? (
                            <span
                              className={
                                reduction > 0
                                  ? 'text-emerald-400'
                                  : reduction < 0
                                    ? 'text-rose-400'
                                    : 'text-slate-400'
                              }
                            >
                              {reduction > 0 ? `+${reduction.toFixed(1)}%` : `${reduction.toFixed(1)}%`}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-amber-300">
                          {r.meanPeakDensityPpm2} ppm²
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5" /> {r.completedRuns}/{r.iterations}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={isRunning}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Close
          </button>
          <button
            onClick={handleStartBatch}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg transition"
          >
            <Play className="w-4 h-4" /> Start All Scenarios
          </button>
        </div>
      </div>
    </div>
  );
};
