import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BuildingData } from '../../types/graph';
import { AgentSnapshot } from '../../types/agent';
import { SegmentManager } from '../../engine/congestion/SegmentManager';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface BuildingCanvasProps {
  building: BuildingData;
  selectedFloor: number;
  showHeatmap: boolean;
  snapshots: AgentSnapshot[];
  segmentManager?: SegmentManager;
}

export const BuildingCanvas: React.FC<BuildingCanvasProps> = ({
  building,
  selectedFloor,
  showHeatmap,
  snapshots,
  segmentManager,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pan and zoom transform state
  const [scale, setScale] = useState(7.0); // pixels per meter
  const [offset, setOffset] = useState({ x: 80, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset view to fit building
  const resetView = useCallback(() => {
    setScale(7.5);
    setOffset({ x: 90, y: 90 });
  }, []);

  // Handle zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setScale((prev) => Math.max(2.0, Math.min(25.0, prev * zoomFactor)));
  };

  // Handle pan drag
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI display
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#090d16'; // Deep slate dark
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    // Apply pan and zoom
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Coordinate conversion helper
    const toCanvasY = (metricY: number) => metricY * 2.2; // slight visual vertical scaling for floor plans

    // 1. Draw Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5 / scale;
    const gridStep = 5; // 5 meters
    for (let x = -10; x <= 110; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, -10);
      ctx.lineTo(x, 150);
      ctx.stroke();
    }
    for (let y = -10; y <= 150; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(-10, y);
      ctx.lineTo(110, y);
      ctx.stroke();
    }

    // Filter nodes and edges on the selected floor
    const nodeMap = new Map(building.nodes.map((n) => [n.id, n]));

    // 2. Draw Edges on this floor
    for (const edge of building.edges) {
      const u = nodeMap.get(edge.from);
      const v = nodeMap.get(edge.to);
      if (!u || !v) continue;

      // Draw edge if either node is on selected floor
      const isOnFloor = u.floor === selectedFloor && v.floor === selectedFloor;
      const isConnectingStair = edge.isStair && (u.floor === selectedFloor || v.floor === selectedFloor);

      if (!isOnFloor && !isConnectingStair) continue;

      const ux = u.x;
      const uy = toCanvasY(u.y);
      const vx = v.x;
      const vy = toCanvasY(v.y);

      // Base edge line
      ctx.beginPath();
      ctx.moveTo(ux, uy);
      ctx.lineTo(vx, vy);

      if (edge.isStair) {
        ctx.strokeStyle = '#f59e0b'; // Amber for stair flights
        ctx.lineWidth = Math.max(edge.widthM, 1.5);
        ctx.setLineDash([1.5, 1.0]);
      } else {
        ctx.strokeStyle = '#1e293b'; // Corridor path base
        ctx.lineWidth = edge.widthM;
        ctx.setLineDash([]);
      }
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Heatmap Segments if enabled
      if (showHeatmap && segmentManager && isOnFloor && !edge.isStair) {
        const segments = segmentManager.getSegments(edge.id);
        const dx = vx - ux;
        const dy = vy - uy;
        const edgeLen = Math.hypot(dx, dy);

        if (edgeLen > 0) {
          for (const seg of segments) {
            const tStart = seg.startM / edge.lengthM;
            const tEnd = seg.endM / edge.lengthM;

            const sx = ux + tStart * dx;
            const sy = uy + tStart * dy;
            const ex = ux + tEnd * dx;
            const ey = uy + tEnd * dy;

            // Determine heatmap color based on README 14
            let heatColor = 'rgba(34, 197, 94, 0.4)'; // < 1.0 green
            if (seg.densityPpm2 >= 3.0) {
              heatColor = 'rgba(239, 68, 68, 0.85)'; // >= 3.0 red
            } else if (seg.densityPpm2 >= 2.0) {
              heatColor = 'rgba(249, 115, 22, 0.7)'; // 2.0-3.0 orange
            } else if (seg.densityPpm2 >= 1.0) {
              heatColor = 'rgba(234, 179, 8, 0.55)'; // 1.0-2.0 yellow
            }

            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = heatColor;
            ctx.lineWidth = edge.widthM + 0.4;
            ctx.stroke();
          }
        }
      }
    }

    // 3. Draw Nodes on this floor
    for (const node of building.nodes) {
      if (node.floor !== selectedFloor) continue;

      const nx = node.x;
      const ny = toCanvasY(node.y);

      if (node.type === 'ROOM') {
        // Room box
        const rw = 6.5;
        const rh = 4.5;
        ctx.fillStyle = '#1e1b4b'; // Deep indigo
        ctx.strokeStyle = '#4338ca'; // Indigo border
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.roundRect(nx - rw / 2, ny - rh / 2, rw, rh, 0.8);
        ctx.fill();
        ctx.stroke();

        // Room label
        ctx.fillStyle = '#c7d2fe';
        ctx.font = 'bold 1.1px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, nx, ny - 0.7);

        // Occupant badge
        if (node.initialOccupants) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '0.9px Inter, sans-serif';
          ctx.fillText(`👤 ${node.initialOccupants}`, nx, ny + 0.9);
        }
      } else if (node.type === 'EXIT') {
        // Glowing Exit badge
        const ew = 7.0;
        const eh = 3.5;
        ctx.fillStyle = '#064e3b'; // Emerald
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.roundRect(nx - ew / 2, ny - eh / 2, ew, eh, 0.6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ecfdf5';
        ctx.font = 'bold 1.2px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚪 ' + node.label, nx, ny);
      } else if (node.type === 'STAIR') {
        // Stair Landing Node
        const sw = 4.0;
        const sh = 3.0;
        ctx.fillStyle = '#451a03'; // Amber
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.roundRect(nx - sw / 2, ny - sh / 2, sw, sh, 0.5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fef3c7';
        ctx.font = 'bold 0.9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🪜 ' + (node.stairwellId || 'Stair'), nx, ny);
      } else {
        // Corridor / Junction dot
        ctx.beginPath();
        ctx.arc(nx, ny, 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#475569';
        ctx.fill();
      }
    }

    // 4. Draw Agents on this floor
    for (const agent of snapshots) {
      if (agent.floor !== selectedFloor) continue;
      if (agent.state === 'EVACUATED') continue; // Hide evacuated on floor canvas

      const ax = agent.x;
      const ay = toCanvasY(agent.y);

      ctx.beginPath();
      const dotRadius = agent.state === 'QUEUED' ? 0.65 : 0.55;
      ctx.arc(ax, ay, dotRadius, 0, Math.PI * 2);

      if (agent.state === 'QUEUED') {
        ctx.fillStyle = '#ef4444'; // Red
        ctx.fill();
        // Red outer warning ring for queued
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 0.25;
        ctx.stroke();
      } else if (agent.state === 'MOVING') {
        ctx.fillStyle = '#38bdf8'; // Sky blue
        ctx.fill();
      } else if (agent.state === 'WAITING') {
        ctx.fillStyle = '#94a3b8'; // Slate gray
        ctx.fill();
      } else {
        ctx.fillStyle = '#d946ef'; // Fuchsia
        ctx.fill();
      }
    }

    ctx.restore();
  }, [building, selectedFloor, showHeatmap, snapshots, segmentManager, scale, offset]);

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Canvas Overlay Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-700/80 shadow">
        <button
          onClick={() => setScale((s) => Math.min(25.0, s * 1.2))}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(2.0, s * 0.8))}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Agent & Heatmap Legend */}
      <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-700/80 shadow text-xs space-y-2 pointer-events-none">
        <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
          Legend (Floor {selectedFloor})
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
            <span className="text-slate-300">Moving</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-300">Queued</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span className="text-slate-300">Waiting</span>
          </div>
        </div>

        {showHeatmap && (
          <div className="pt-2 border-t border-slate-800 flex items-center gap-3 text-[11px]">
            <span className="text-slate-400 font-medium">Density:</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded bg-emerald-500"></span> &lt;1.0
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded bg-amber-500"></span> 1.0–2.0
            </span>
            <span className="flex items-center gap-1 text-orange-400">
              <span className="w-2 h-2 rounded bg-orange-500"></span> 2.0–3.0
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded bg-rose-500"></span> &ge;3.0
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
