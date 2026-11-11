import React, { useMemo } from 'react';
import { defaultSchoolBuilding, DEFAULT_ZONE_ASSIGNMENTS } from '../data/defaultSchoolBuilding';
import { GraphValidator } from '../engine/graph/GraphValidator';
import { Graph } from '../engine/graph/Graph';
import { Building2, Users, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const graph = useMemo(() => new Graph(defaultSchoolBuilding), []);
  const validation = useMemo(
    () => GraphValidator.validate(defaultSchoolBuilding, { zoneAssignments: DEFAULT_ZONE_ASSIGNMENTS }),
    []
  );

  const rooms = graph.getRooms();
  const occupiedRooms = graph.getOccupiedRooms();
  const totalOccupants = occupiedRooms.reduce((sum, r) => sum + (r.initialOccupants ?? 0), 0);
  const exits = graph.getExits();
  const stairwells = graph.getStairwells();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="max-w-6xl mx-auto mb-8 border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">EvacFlow</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Phase 1
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            2D Agent-Based Building Evacuation Simulator • Research & Decision-Support Prototype
          </p>
        </div>

        <div className="flex items-center gap-2">
          {validation.isValid ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Graph Validated
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              Validation Issues ({validation.issues.length})
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        {/* Notice Banner */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300">Synthetic Mock Building Dataset Active</p>
            <p className="text-amber-200/80 mt-0.5">
              This is a synthetic 3-story school model created for algorithm verification and testing.
              It does not represent real emergency plan data or any physical school facility.
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400 uppercase font-semibold">Total Occupants</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-white">{totalOccupants}</span>
              <span className="text-xs text-slate-400">across 3 floors</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
              <Users className="w-3.5 h-3.5" />
              <span>36 per classroom</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400 uppercase font-semibold">Classrooms</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-indigo-400">{rooms.length}</span>
              <span className="text-xs text-slate-400">7 per floor</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">21 rooms total</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400 uppercase font-semibold">Stairwells</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-teal-400">{stairwells.length}</span>
              <span className="text-xs text-slate-400">shafts</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Left (1.5m) & Right (1.5m)</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400 uppercase font-semibold">Ground Exits</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-emerald-400">{exits.length}</span>
              <span className="text-xs text-slate-400">exits</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">West (Floor 1) & East (Floor 1)</p>
          </div>
        </div>

        {/* Building Structure Breakdown */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Floor Breakdown & Routing Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((floorNum) => {
              const floorRooms = rooms.filter((r) => r.floor === floorNum);
              const floorOccupants = floorRooms.reduce((sum, r) => sum + (r.initialOccupants ?? 0), 0);

              return (
                <div key={floorNum} className="p-4 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="font-semibold text-white">Floor {floorNum}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {floorOccupants} occupants
                    </span>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-400">
                    <li>• Classrooms: {floorRooms.length} rooms</li>
                    <li>• Corridor width: 2.5 m</li>
                    <li>• Stair landings: Left & Right</li>
                    {floorNum === 1 && (
                      <li className="text-emerald-400 font-medium">• Discharge to West & East Exits</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation issues if any */}
        {validation.issues.length > 0 && (
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Validation Log
            </h2>
            <div className="space-y-2">
              {validation.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`text-xs p-3 rounded-lg border ${
                    issue.severity === 'ERROR'
                      ? 'bg-rose-950/40 border-rose-800/50 text-rose-300'
                      : 'bg-amber-950/40 border-amber-800/50 text-amber-300'
                  }`}
                >
                  <span className="font-semibold mr-2">[{issue.code}]</span>
                  {issue.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
