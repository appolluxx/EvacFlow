import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { SimulationMetrics, BatchResult } from '../../types/results';
import { EdgeBottleneckMetric } from '../../engine/metrics/MetricsCollector';
import { BottleneckAnalyzer } from '../../analytics/BottleneckAnalyzer';
import { CsvExporter } from '../../utils/exportCsv';
import { SerializationUtil } from '../../utils/serialization';
import { Download, AlertTriangle, Activity, Users, Clock, Flame } from 'lucide-react';

interface AnalyticsDashboardProps {
  metrics: SimulationMetrics;
  timeSeries: { timeS: number; evacuatedCount: number }[];
  bottlenecks: EdgeBottleneckMetric[];
  batchResults?: BatchResult[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  metrics,
  timeSeries,
  bottlenecks,
  batchResults,
}) => {
  const rankedBottlenecks = BottleneckAnalyzer.rankBottlenecks(bottlenecks).slice(0, 6);

  const handleExportCsv = () => {
    const csvContent = CsvExporter.exportBottlenecksCsv(bottlenecks);
    SerializationUtil.downloadFile(csvContent, 'evacflow_bottlenecks.csv', 'text/csv');
  };

  const handleExportTimeSeriesCsv = () => {
    const csvContent = CsvExporter.exportTimeSeriesCsv(timeSeries);
    SerializationUtil.downloadFile(csvContent, 'evacflow_evacuation_curve.csv', 'text/csv');
  };

  return (
    <div className="space-y-6">
      {/* 1. Real-time KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Elapsed Time</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1 font-mono">
            {metrics.timeS.toFixed(1)} <span className="text-xs text-slate-400 font-sans">s</span>
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Evacuated</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            {metrics.evacuatedCount}{' '}
            <span className="text-xs text-slate-400 font-sans">/ {metrics.totalOccupants}</span>
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{
                width: `${metrics.totalOccupants > 0 ? (metrics.evacuatedCount / metrics.totalOccupants) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Queued Agents</span>
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-1 font-mono">
            {metrics.queuedCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">FIFO storage wait</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Peak Density</span>
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-1 font-mono">
            {metrics.peakDensityPpm2.toFixed(2)}{' '}
            <span className="text-xs text-slate-400 font-sans">ppm²</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Current: {metrics.currentDensityPpm2.toFixed(2)}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase">
            <Activity className="w-3.5 h-3.5 text-orange-400" />
            <span>Active Bottlenecks</span>
          </div>
          <p className="text-2xl font-bold text-orange-400 mt-1 font-mono">
            {metrics.activeBottlenecks}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">&ge; 2.0 persons/m²</p>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cumulative Evacuation Curve */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Cumulative Evacuation Curve
              </h3>
              <p className="text-[11px] text-slate-500">Evacuated occupants over simulation time</p>
            </div>
            <button
              onClick={handleExportTimeSeriesCsv}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <Download className="w-3 h-3" /> Export CSV
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries.length > 0 ? timeSeries : [{ timeS: 0, evacuatedCount: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timeS" stroke="#64748b" fontSize={11} unit="s" />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, metrics.totalOccupants || 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Line
                  type="monotone"
                  dataKey="evacuatedCount"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Batch Scenario Comparison Chart if available */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Scenario Evacuation Time Comparison
              </h3>
              <p className="text-[11px] text-slate-500">Mean evacuation completion time (seconds)</p>
            </div>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {batchResults && batchResults.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={batchResults}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="scenario" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} unit="s" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  />
                  <Bar dataKey="meanEvacuationTimeS" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 text-xs py-8">
                Run batch experiments to view multi-scenario comparative bar charts.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottleneck Ranking Table */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Bottleneck Ranking (Multi-Signal Analysis)
            </h3>
            <p className="text-[11px] text-slate-500">
              Ranked by peak density, queue buildup, and duration above critical threshold
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <Download className="w-3 h-3" /> Export Bottlenecks CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2 px-3">Rank</th>
                <th className="py-2 px-3">Location</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Peak Density</th>
                <th className="py-2 px-3">Time &ge; 2.0 ppm²</th>
                <th className="py-2 px-3">Max Queue</th>
                <th className="py-2 px-3">Analysis Prompt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rankedBottlenecks.map((b) => (
                <tr key={b.edgeId} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-300">#{b.rank}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-200">{b.edgeLabel}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        b.isStair
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {b.isStair ? 'Stairwell' : 'Corridor'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span
                      className={
                        b.peakDensityPpm2 >= 3.0
                          ? 'text-rose-400 font-bold'
                          : b.peakDensityPpm2 >= 2.0
                            ? 'text-amber-400 font-semibold'
                            : 'text-slate-300'
                      }
                    >
                      {b.peakDensityPpm2.toFixed(2)} ppm²
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">{b.timeAbove2Ppm2S.toFixed(1)}s</td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">{b.maxQueueLength}</td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">{b.promptForReview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
