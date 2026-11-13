import React from 'react';
import { ScenarioType } from '../../types/scenario';
import { Play, Pause, RotateCcw, FastForward, Flame, Layers } from 'lucide-react';

interface SimulationControlsProps {
  scenario: ScenarioType;
  onScenarioChange: (s: ScenarioType) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  selectedFloor: number;
  onFloorChange: (floor: number) => void;
  availableFloors: number[];
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  selectedBuildingId: string;
  onBuildingChange: (id: string) => void;
  onOpenBatchModal: () => void;
  seed: number;
  onSeedChange: (seed: number) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  scenario,
  onScenarioChange,
  isPlaying,
  onTogglePlay,
  onStep,
  onReset,
  playbackSpeed,
  onSpeedChange,
  selectedFloor,
  onFloorChange,
  availableFloors,
  showHeatmap,
  onToggleHeatmap,
  selectedBuildingId,
  onBuildingChange,
  onOpenBatchModal,
  seed,
  onSeedChange,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        {/* Building Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            แบบจำลองอาคาร:
          </label>
          <select
            value={selectedBuildingId}
            onChange={(e) => onBuildingChange(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="building-6-courtyard-model">
              อาคาร 6 ตึกเฉลิมพระเกียรติ 72 พรรษา (ผัง 4 โซนเหมือนในรูป)
            </option>
            <option value="synthetic-school-3f-756">
              Default 3-Story School Model (แบบจำลองสังเคราะห์ 756 คน)
            </option>
          </select>
        </div>

        {/* Floor Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-400 px-2 flex items-center gap-1 font-medium">
            <Layers className="w-3.5 h-3.5" /> มุมมองชั้น:
          </span>
          <button
            onClick={() => onFloorChange(0)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              selectedFloor === 0
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            ผังรวมตึก 6 (Overview)
          </button>
          {availableFloors.map((floor) => (
            <button
              key={floor}
              onClick={() => onFloorChange(floor)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                selectedFloor === floor
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              ชั้น {floor}
            </button>
          ))}
        </div>
      </div>

      {/* Main Playback Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Scenario Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">Scenario:</span>
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['BASELINE', 'ZONING', 'STAGGERED'] as ScenarioType[]).map((sc) => (
              <button
                key={sc}
                onClick={() => onScenarioChange(sc)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  scenario === sc
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sc === 'ZONING' ? 'ZONING (ตาม 4 สีในรูป)' : sc}
              </button>
            ))}
          </div>
        </div>

        {/* Play / Step / Reset Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg shadow transition ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" /> หยุดชั่วคราว (Pause)
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> เริ่มจำลองการอพยพ
              </>
            )}
          </button>

          <button
            onClick={onStep}
            disabled={isPlaying}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition"
            title="ขยับทีละสเต็ป (0.1s)"
          >
            <FastForward className="w-3.5 h-3.5" /> สเต็ป
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="รีเซ็ตตำแหน่งคน"
          >
            <RotateCcw className="w-3.5 h-3.5" /> รีเซ็ต
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-500 px-1 font-medium">ความเร็ว:</span>
          {[1, 2, 5, 10].map((spd) => (
            <button
              key={spd}
              onClick={() => onSpeedChange(spd)}
              className={`px-2 py-0.5 text-xs font-semibold rounded ${
                playbackSpeed === spd
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Heatmap & Seed & Batch */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleHeatmap}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              showHeatmap
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Heatmap ความหนาแน่น
          </button>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg text-xs">
            <span className="text-slate-500 font-medium">Seed:</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => onSeedChange(Number(e.target.value))}
              className="w-14 bg-transparent text-slate-200 font-mono focus:outline-none"
            />
          </div>

          <button
            onClick={onOpenBatchModal}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 transition"
          >
            รันการทดลองเปรียบเทียบ (Batch 10x)
          </button>
        </div>
      </div>
    </div>
  );
};
