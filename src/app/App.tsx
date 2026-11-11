import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { defaultSchoolBuilding, DEFAULT_ZONE_ASSIGNMENTS, DEFAULT_FLOOR_DELAYS } from '../data/defaultSchoolBuilding';
import { building6Model, BUILDING6_ZONE_ASSIGNMENTS, BUILDING6_FLOOR_DELAYS } from '../data/building6Model';
import { BuildingData } from '../types/graph';
import { ScenarioType, SimulationConfig } from '../types/scenario';
import { SimulationMetrics, BatchResult } from '../types/results';
import { AgentSnapshot } from '../types/agent';
import { SimulationEngine } from '../engine/SimulationEngine';
import { GraphValidator } from '../engine/graph/GraphValidator';
import { BuildingCanvas } from '../components/canvas/BuildingCanvas';
import { SimulationControls } from '../components/controls/SimulationControls';
import { AnalyticsDashboard } from '../components/dashboard/AnalyticsDashboard';
import { BatchModal } from '../components/dashboard/BatchModal';
import { SerializationUtil } from '../utils/serialization';
import { CsvExporter } from '../utils/exportCsv';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Upload,
  Download,
} from 'lucide-react';

export const App: React.FC = () => {
  // 1. Building Dataset Selection
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('synthetic-school-3f-756');
  const [customBuilding, setCustomBuilding] = useState<BuildingData | null>(null);

  const activeBuilding: BuildingData = useMemo(() => {
    if (customBuilding && selectedBuildingId === customBuilding.metadata.id) {
      return customBuilding;
    }
    if (selectedBuildingId === 'building-6-courtyard-model') {
      return building6Model;
    }
    return defaultSchoolBuilding;
  }, [selectedBuildingId, customBuilding]);

  // Available floors from building metadata
  const availableFloors = activeBuilding.metadata.floors || [1, 2, 3];
  const [selectedFloor, setSelectedFloor] = useState<number>(availableFloors[availableFloors.length - 1]);

  // Update selected floor if active building floors change
  useEffect(() => {
    if (!availableFloors.includes(selectedFloor)) {
      setSelectedFloor(availableFloors[0]);
    }
  }, [availableFloors, selectedFloor]);

  // 2. Scenario & Simulation Configuration
  const [scenario, setScenario] = useState<ScenarioType>('BASELINE');
  const [seed, setSeed] = useState<number>(1001);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);

  // Simulation Engine Reference
  const engineRef = useRef<SimulationEngine | null>(null);

  // Live state
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    timeS: 0,
    evacuatedCount: 0,
    totalOccupants: 0,
    activeBottlenecks: 0,
    currentDensityPpm2: 0,
    peakDensityPpm2: 0,
    queuedCount: 0,
  });
  const [snapshots, setSnapshots] = useState<AgentSnapshot[]>([]);
  const [timeSeries, setTimeSeries] = useState<{ timeS: number; evacuatedCount: number }[]>([]);

  // Initialize or re-create simulation engine
  const initEngine = useCallback(() => {
    const isBuilding6 = activeBuilding.metadata.id === 'building-6-courtyard-model';
    const zoneAssignments = isBuilding6 ? BUILDING6_ZONE_ASSIGNMENTS : DEFAULT_ZONE_ASSIGNMENTS;
    const floorDelaysS = isBuilding6 ? BUILDING6_FLOOR_DELAYS : DEFAULT_FLOOR_DELAYS;

    const config: SimulationConfig = {
      scenario,
      timeStepS: 0.1,
      playbackSpeed,
      floorDelaysS,
      zoneAssignments,
      randomSeed: seed,
    };

    const engine = new SimulationEngine(activeBuilding, config);
    engineRef.current = engine;
    setMetrics(engine.getMetrics());
    setSnapshots(engine.getSnapshot());
    setTimeSeries([{ timeS: 0, evacuatedCount: 0 }]);
    setIsPlaying(false);
  }, [activeBuilding, scenario, seed, playbackSpeed]);

  useEffect(() => {
    initEngine();
  }, [initEngine]);

  // 3. Animation and Simulation Clock Loop
  const lastFrameTimeRef = useRef<number>(performance.now());
  const accumulatorRef = useRef<number>(0);

  useEffect(() => {
    let animationFrameId: number;

    const loop = (now: number) => {
      const deltaWallClockS = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;

      if (isPlaying && engineRef.current && !engineRef.current.isCompleted()) {
        const simTimeDeltaS = deltaWallClockS * playbackSpeed;
        accumulatorRef.current += simTimeDeltaS;

        const timeStepS = 0.1;
        // Step fixed increments
        let stepsExecuted = 0;
        while (accumulatorRef.current >= timeStepS && stepsExecuted < 20) {
          engineRef.current.step();
          accumulatorRef.current -= timeStepS;
          stepsExecuted++;
        }

        const currentMetrics = engineRef.current.getMetrics();
        setMetrics(currentMetrics);
        setSnapshots(engineRef.current.getSnapshot());

        setTimeSeries((prev) => {
          const t = Math.round(currentMetrics.timeS * 10) / 10;
          if (prev.length === 0 || t > prev[prev.length - 1].timeS) {
            return [...prev, { timeS: t, evacuatedCount: currentMetrics.evacuatedCount }];
          }
          return prev;
        });

        if (engineRef.current.isCompleted()) {
          setIsPlaying(false);
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    lastFrameTimeRef.current = performance.now();
    animationFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, playbackSpeed]);

  // Controls Handlers
  const handleTogglePlay = () => {
    if (engineRef.current?.isCompleted()) {
      initEngine();
    }
    setIsPlaying((prev) => !prev);
  };

  const handleStep = () => {
    if (engineRef.current && !engineRef.current.isCompleted()) {
      engineRef.current.step();
      const m = engineRef.current.getMetrics();
      setMetrics(m);
      setSnapshots(engineRef.current.getSnapshot());
      setTimeSeries((prev) => [...prev, { timeS: m.timeS, evacuatedCount: m.evacuatedCount }]);
    }
  };

  const handleReset = () => {
    initEngine();
  };

  // Building Validation status
  const validation = useMemo(() => {
    const isBuilding6 = activeBuilding.metadata.id === 'building-6-courtyard-model';
    const zoneAssignments = isBuilding6 ? BUILDING6_ZONE_ASSIGNMENTS : DEFAULT_ZONE_ASSIGNMENTS;
    return GraphValidator.validate(activeBuilding, { scenario, zoneAssignments });
  }, [activeBuilding, scenario]);

  // Import / Export JSON
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportJson = () => {
    const jsonStr = SerializationUtil.exportToJson(activeBuilding);
    SerializationUtil.downloadFile(
      jsonStr,
      `${activeBuilding.metadata.id}_config.json`,
      'application/json'
    );
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = SerializationUtil.importFromJson(content);
      if (res.success && res.data) {
        setCustomBuilding(res.data);
        setSelectedBuildingId(res.data.metadata.id);
        alert(`Successfully imported building: "${res.data.metadata.name}"!`);
      } else {
        alert(`Failed to import building: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  const handleExportRunCsv = () => {
    if (!engineRef.current) return;
    const finalRes = engineRef.current.runUntilComplete();
    const csv = CsvExporter.exportRunSummaryCsv([finalRes]);
    SerializationUtil.downloadFile(csv, `evacflow_${scenario}_run.csv`, 'text/csv');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">EvacFlow</h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Phases 1–6 Complete
                </span>
              </div>
              <p className="text-xs text-slate-400">
                2D Agent-Based Building Evacuation Simulator • Research & Decision-Support Prototype
              </p>
            </div>
          </div>

          {/* Quick Actions: Validation badge & Import/Export */}
          <div className="flex items-center gap-3">
            {validation.isValid ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Graph Validated
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                Validation Issue ({validation.issues.length})
              </div>
            )}

            <button
              onClick={handleExportJson}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Export Building Graph as JSON"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Import Building Graph from JSON"
            >
              <Upload className="w-3.5 h-3.5" /> Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJson}
            />

            <button
              onClick={handleExportRunCsv}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 transition"
            >
              <Download className="w-3.5 h-3.5" /> Run CSV
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-6 space-y-6 flex-1">
        {/* Synthetic Mock Data Notice */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-amber-300">
              {activeBuilding.metadata.name} ({activeBuilding.metadata.source})
            </p>
            <p className="text-amber-200/80">
              Simplified 2D research simulation prototype. Modeled scenarios explore crowd distribution and
              queuing under documented assumptions. Not certified safety directives.
            </p>
          </div>
        </div>

        {/* 2D Canvas Visualizer */}
        <BuildingCanvas
          building={activeBuilding}
          selectedFloor={selectedFloor}
          showHeatmap={showHeatmap}
          snapshots={snapshots}
          segmentManager={engineRef.current?.getSegmentManager()}
        />

        {/* Simulation Controls Bar */}
        <SimulationControls
          scenario={scenario}
          onScenarioChange={(sc) => {
            setScenario(sc);
            initEngine();
          }}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onStep={handleStep}
          onReset={handleReset}
          playbackSpeed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
          selectedFloor={selectedFloor}
          onFloorChange={setSelectedFloor}
          availableFloors={availableFloors}
          showHeatmap={showHeatmap}
          onToggleHeatmap={() => setShowHeatmap((prev) => !prev)}
          selectedBuildingId={selectedBuildingId}
          onBuildingChange={(id) => {
            setSelectedBuildingId(id);
            initEngine();
          }}
          onOpenBatchModal={() => setIsBatchModalOpen(true)}
          seed={seed}
          onSeedChange={(s) => {
            setSeed(s);
            initEngine();
          }}
        />

        {/* Analytics Dashboard (Live KPIs, Charts, Bottlenecks) */}
        <AnalyticsDashboard
          metrics={metrics}
          timeSeries={timeSeries}
          bottlenecks={engineRef.current?.getEdgeBottlenecks() || []}
          batchResults={batchResults}
        />
      </main>

      {/* Batch Experiments Modal */}
      <BatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        building={activeBuilding}
        onApplyResults={(results) => setBatchResults(results)}
      />

      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        EvacFlow • Client-side Agent-Based Evacuation Simulator • React + TypeScript + Vitest
      </footer>
    </div>
  );
};

export default App;
