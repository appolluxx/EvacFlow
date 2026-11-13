import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BuildingData } from '../../types/graph';
import { AgentSnapshot } from '../../types/agent';
import { SegmentManager } from '../../engine/congestion/SegmentManager';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface BuildingCanvasProps {
  building: BuildingData;
  selectedFloor: number; // 0 = Overview (all floors), 1, 2, 3
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
  const [scale, setScale] = useState(5.8); // pixels per meter
  const [offset, setOffset] = useState({ x: 40, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const isBuilding6 = building.metadata.id === 'building-6-courtyard-model';

  // Reset view to fit building plan
  const resetView = useCallback(() => {
    setScale(isBuilding6 ? 5.8 : 7.5);
    setOffset(isBuilding6 ? { x: 50, y: 30 } : { x: 90, y: 90 });
  }, [isBuilding6]);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setScale((prev) => Math.max(2.0, Math.min(25.0, prev * zoomFactor)));
  };

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

  // Helper for zone colors matching the school diagram
  const getZoneStyle = (zoneId?: string) => {
    switch (zoneId) {
      case 'ZONE_GREEN':
        return { fill: '#bbf7d0', stroke: '#15803d', text: '#14532d', glow: '#4ade80' };
      case 'ZONE_BLUE':
        return { fill: '#bfdbfe', stroke: '#1d4ed8', text: '#1e3a8a', glow: '#60a5fa' };
      case 'ZONE_PINK':
        return { fill: '#fbcfe8', stroke: '#be185d', text: '#831843', glow: '#f472b6' };
      case 'ZONE_ORANGE':
        return { fill: '#fed7aa', stroke: '#c2410c', text: '#7c2d12', glow: '#fb923c' };
      default:
        return { fill: '#e2e8f0', stroke: '#64748b', text: '#1e293b', glow: '#94a3b8' };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Warm architectural backdrop matching the school poster theme
    ctx.fillStyle = isBuilding6 ? '#fefce8' : '#090d16'; // Soft cream yellow or dark
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    const toCanvasY = (metricY: number) => metricY * 1.5;

    // ====================================================
    // DRAW BUILDING 6 HIGH-FIDELITY ARCHITECTURAL PLAN
    // ====================================================
    if (isBuilding6) {
      // 1. Surrounding Assembly Areas (จุดรวมพล)
      // Left: ลานประดู่
      const pradooX = 2;
      const pradooY = toCanvasY(45);
      ctx.fillStyle = '#dc2626'; // Red circular icon
      ctx.beginPath();
      ctx.arc(pradooX + 7, pradooY - 14, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 3.2px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👥', pradooX + 7, pradooY - 13);

      ctx.fillStyle = '#991b1b';
      ctx.font = 'bold 2.8px "Sarabun", Inter, sans-serif';
      ctx.fillText('จุดรวมพล', pradooX + 7, pradooY - 5);
      ctx.font = 'bold 2.4px "Sarabun", Inter, sans-serif';
      ctx.fillText('ทางออก 1,2', pradooX + 7, pradooY - 1);
      ctx.font = 'bold 3.4px "Sarabun", Inter, sans-serif';
      ctx.fillText('ลานประดู่', pradooX + 7, pradooY + 4);

      // Right: สนามฟุตบอล (Soccer Field Graphic)
      const fieldX = 104;
      const fieldY = toCanvasY(26);
      const fieldW = 20;
      const fieldH = 26;
      ctx.fillStyle = '#16a34a'; // Grass green
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      ctx.fillRect(fieldX, fieldY, fieldW, fieldH);
      ctx.strokeRect(fieldX, fieldY, fieldW, fieldH);

      // Field lines
      ctx.beginPath();
      // Center line
      ctx.moveTo(fieldX + fieldW / 2, fieldY);
      ctx.lineTo(fieldX + fieldW / 2, fieldY + fieldH);
      // Center circle
      ctx.arc(fieldX + fieldW / 2, fieldY + fieldH / 2, 3.5, 0, Math.PI * 2);
      ctx.stroke();

      // Goal boxes
      ctx.strokeRect(fieldX, fieldY + 7, 3, 12);
      ctx.strokeRect(fieldX + fieldW - 3, fieldY + 7, 3, 12);

      // Football field text
      ctx.fillStyle = '#14532d';
      ctx.font = 'bold 2.8px "Sarabun", Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('จุดรวมพล', fieldX + fieldW / 2, fieldY + fieldH + 4);
      ctx.fillText('ทางออก 3,4', fieldX + fieldW / 2, fieldY + fieldH + 7.5);
      ctx.font = 'bold 3.2px "Sarabun", Inter, sans-serif';
      ctx.fillText('สนามฟุตบอล', fieldX + fieldW / 2, fieldY + fieldH + 11.5);

      // 2. Building Outer Frame / Perimeter Walls
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 0.9;
      ctx.strokeRect(16, toCanvasY(11), 88, toCanvasY(73));

      // 3. Central Halls (ห้องประชุม ชั้น 3 & ห้องสมุด ชั้น 2)
      const hallX = 35;
      const hallY = toCanvasY(28);
      const hallW = 48;
      const hallH = toCanvasY(34);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 0.8;
      ctx.fillRect(hallX, hallY, hallW, hallH);
      ctx.strokeRect(hallX, hallY, hallW, hallH);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 3.2px "Sarabun", Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ห้องประชุม (ชั้น 3)', hallX + 20, hallY + hallH / 2);

      // Library / ห้องกองกลาง box on right side of courtyard
      ctx.strokeRect(hallX + 34, hallY + 5, 12, hallH - 10);
      ctx.font = '2.0px "Sarabun", Inter, sans-serif';
      ctx.save();
      ctx.translate(hallX + 40, hallY + hallH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('ห้องกองกลาง (ห้องสมุด ชั้น 2)', 0, 0);
      ctx.restore();

      // 4. Draw Corridors
      for (const edge of building.edges) {
        const u = building.nodes.find((n) => n.id === edge.from);
        const v = building.nodes.find((n) => n.id === edge.to);
        if (!u || !v || edge.isStair) continue;

        // Skip non-active floor if specific floor selected
        if (selectedFloor !== 0 && (u.floor !== selectedFloor || v.floor !== selectedFloor)) continue;

        const ux = u.x;
        const uy = toCanvasY(u.y);
        const vx = v.x;
        const vy = toCanvasY(v.y);

        ctx.beginPath();
        ctx.moveTo(ux, uy);
        ctx.lineTo(vx, vy);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = edge.widthM * 0.9;
        ctx.stroke();

        // Heatmap rendering
        if (showHeatmap && segmentManager && (selectedFloor === 0 || u.floor === selectedFloor)) {
          const segments = segmentManager.getSegments(edge.id);
          const dx = vx - ux;
          const dy = vy - uy;
          const edgeLen = Math.hypot(dx, dy);

          if (edgeLen > 0) {
            for (const seg of segments) {
              if (seg.densityPpm2 > 0.3) {
                const tStart = seg.startM / edge.lengthM;
                const tEnd = seg.endM / edge.lengthM;
                const sx = ux + tStart * dx;
                const sy = uy + tStart * dy;
                const ex = ux + tEnd * dx;
                const ey = uy + tEnd * dy;

                let heatColor = 'rgba(34, 197, 94, 0.5)';
                if (seg.densityPpm2 >= 3.0) heatColor = 'rgba(239, 68, 68, 0.85)';
                else if (seg.densityPpm2 >= 2.0) heatColor = 'rgba(249, 115, 22, 0.7)';
                else if (seg.densityPpm2 >= 1.0) heatColor = 'rgba(234, 179, 8, 0.6)';

                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(ex, ey);
                ctx.strokeStyle = heatColor;
                ctx.lineWidth = edge.widthM + 0.6;
                ctx.stroke();
              }
            }
          }
        }
      }

      // 5. Draw Exit Directional Arrows & Lines (Green, Blue, Pink, Orange)
      // Green Route (Top Left -> ทางออก 2)
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(60, toCanvasY(18));
      ctx.lineTo(30, toCanvasY(18));
      ctx.lineTo(30, toCanvasY(22));
      ctx.lineTo(13, toCanvasY(22));
      ctx.stroke();

      // Green Exit Arrowhead
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(13, toCanvasY(22));
      ctx.lineTo(17, toCanvasY(22) - 1.8);
      ctx.lineTo(17, toCanvasY(22) + 1.8);
      ctx.closePath();
      ctx.fill();

      // Arrow label
      ctx.font = 'bold 3.2px "Sarabun", Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('ทางออก 2', 11, toCanvasY(22) + 1.1);

      // Blue Route (Top Right -> ทางออก 3)
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(62, toCanvasY(18));
      ctx.lineTo(90, toCanvasY(18));
      ctx.lineTo(90, toCanvasY(22));
      ctx.lineTo(107, toCanvasY(22));
      ctx.stroke();

      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.moveTo(107, toCanvasY(22));
      ctx.lineTo(103, toCanvasY(22) - 1.8);
      ctx.lineTo(103, toCanvasY(22) + 1.8);
      ctx.closePath();
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.fillText('ทางออก 3', 109, toCanvasY(22) + 1.1);

      // Pink Route (Bottom Left -> ทางออก 1)
      ctx.strokeStyle = '#be185d';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(56, toCanvasY(72));
      ctx.lineTo(30, toCanvasY(72));
      ctx.lineTo(30, toCanvasY(68));
      ctx.lineTo(13, toCanvasY(68));
      ctx.stroke();

      ctx.fillStyle = '#be185d';
      ctx.beginPath();
      ctx.moveTo(13, toCanvasY(68));
      ctx.lineTo(17, toCanvasY(68) - 1.8);
      ctx.lineTo(17, toCanvasY(68) + 1.8);
      ctx.closePath();
      ctx.fill();

      ctx.textAlign = 'right';
      ctx.fillText('ทางออก 1', 11, toCanvasY(68) + 1.1);

      // Orange Route (Bottom Right -> ทางออก 4)
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(58, toCanvasY(72));
      ctx.lineTo(90, toCanvasY(72));
      ctx.lineTo(90, toCanvasY(68));
      ctx.lineTo(107, toCanvasY(68));
      ctx.stroke();

      ctx.fillStyle = '#c2410c';
      ctx.beginPath();
      ctx.moveTo(107, toCanvasY(68));
      ctx.lineTo(103, toCanvasY(68) - 1.8);
      ctx.lineTo(103, toCanvasY(68) + 1.8);
      ctx.closePath();
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.fillText('ทางออก 4', 109, toCanvasY(68) + 1.1);

      // 6. Draw Classrooms / Rooms as solid architectural rectangles
      for (const node of building.nodes) {
        if (node.type !== 'ROOM') continue;

        // If specific floor selected, dim or skip others
        const matchesFloor = selectedFloor === 0 || node.floor === selectedFloor;
        const style = getZoneStyle(node.zoneId);

        const nx = node.x;
        const ny = toCanvasY(node.y);
        const rw = 7.4;
        const rh = 6.4;

        ctx.fillStyle = matchesFloor ? style.fill : '#f1f5f9';
        ctx.strokeStyle = matchesFloor ? style.stroke : '#cbd5e1';
        ctx.lineWidth = 0.5;
        ctx.fillRect(nx - rw / 2, ny - rh / 2, rw, rh);
        ctx.strokeRect(nx - rw / 2, ny - rh / 2, rw, rh);

        // Room number in bold
        ctx.fillStyle = matchesFloor ? style.text : '#94a3b8';
        ctx.font = 'bold 1.7px "Sarabun", Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Extract clean short number (e.g. 631)
        const parts = node.label.split(' ');
        const mainLabel = parts[0];
        const subLabel = parts.slice(1).join(' ');

        ctx.fillText(mainLabel, nx, ny - 1.2);
        if (subLabel) {
          ctx.font = '1.3px "Sarabun", Inter, sans-serif';
          ctx.fillText(subLabel, nx, ny + 1.2);
        }
      }

      // 7. Draw Toilets & Stairs
      // Female Restrooms on NE
      ctx.fillStyle = '#f8fafc';
      ctx.strokeRect(93, toCanvasY(11), 11, toCanvasY(9));
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 1.6px "Sarabun", Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚻 ห้องน้ำหญิง', 98.5, toCanvasY(15.5));

      // Male Restrooms on SE
      ctx.fillStyle = '#f8fafc';
      ctx.strokeRect(93, toCanvasY(75), 11, toCanvasY(9));
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 1.6px "Sarabun", Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚻 ห้องน้ำชาย', 98.5, toCanvasY(79.5));

      // Green Exit / Stair Symbols
      for (const node of building.nodes) {
        if (node.type === 'STAIR' && (selectedFloor === 0 || node.floor === selectedFloor)) {
          const sx = node.x;
          const sy = toCanvasY(node.y);
          ctx.fillStyle = '#15803d'; // Green emergency sign
          ctx.fillRect(sx - 2.5, sy - 2.5, 5, 5);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 2.4px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🪜', sx, sy);
        }
      }
    } else {
      // Generic CAD Grid for default school building
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5 / scale;
      for (let x = -10; x <= 110; x += 5) {
        ctx.beginPath();
        ctx.moveTo(x, -10);
        ctx.lineTo(x, 150);
        ctx.stroke();
      }
      for (let y = -10; y <= 150; y += 5) {
        ctx.beginPath();
        ctx.moveTo(-10, y);
        ctx.lineTo(110, y);
        ctx.stroke();
      }

      // Default Edges & Nodes rendering
      for (const edge of building.edges) {
        const u = building.nodes.find((n) => n.id === edge.from);
        const v = building.nodes.find((n) => n.id === edge.to);
        if (!u || !v) continue;
        if (selectedFloor !== 0 && u.floor !== selectedFloor && v.floor !== selectedFloor) continue;

        ctx.beginPath();
        ctx.moveTo(u.x, toCanvasY(u.y));
        ctx.lineTo(v.x, toCanvasY(v.y));
        ctx.strokeStyle = edge.isStair ? '#f59e0b' : '#334155';
        ctx.lineWidth = edge.widthM;
        ctx.stroke();
      }

      for (const node of building.nodes) {
        if (selectedFloor !== 0 && node.floor !== selectedFloor) continue;
        const nx = node.x;
        const ny = toCanvasY(node.y);
        ctx.fillStyle = node.type === 'ROOM' ? '#312e81' : node.type === 'EXIT' ? '#065f46' : '#64748b';
        ctx.beginPath();
        ctx.arc(nx, ny, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ====================================================
    // 8. RENDER AGENTS
    // ====================================================
    for (const agent of snapshots) {
      if (agent.state === 'EVACUATED') continue;
      // If a specific floor is selected (and not 0), only draw agents on that floor
      if (selectedFloor !== 0 && agent.floor !== selectedFloor) continue;

      const ax = agent.x;
      const ay = toCanvasY(agent.y);

      ctx.beginPath();
      const dotRadius = agent.state === 'QUEUED' ? 0.75 : 0.65;
      ctx.arc(ax, ay, dotRadius, 0, Math.PI * 2);

      if (agent.state === 'QUEUED') {
        ctx.fillStyle = '#ef4444'; // Red for queued
        ctx.fill();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 0.3;
        ctx.stroke();
      } else if (agent.state === 'MOVING') {
        ctx.fillStyle = '#0284c7'; // Sky blue for moving
        ctx.fill();
      } else if (agent.state === 'WAITING') {
        ctx.fillStyle = '#64748b'; // Slate gray
        ctx.fill();
      } else {
        ctx.fillStyle = '#d946ef';
        ctx.fill();
      }
    }

    ctx.restore();
  }, [building, selectedFloor, showHeatmap, snapshots, segmentManager, scale, offset, isBuilding6]);

  return (
    <div className="relative w-full h-[580px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl select-none">
      {/* Top Banner on Building 6 matching the school plan title */}
      {isBuilding6 && (
        <div className="absolute top-3 left-4 right-16 z-10 pointer-events-none flex flex-col items-center">
          <div className="bg-amber-100/95 border border-amber-300 text-amber-950 px-4 py-1.5 rounded-xl shadow-md text-center max-w-xl">
            <h2 className="text-xs md:text-sm font-bold tracking-tight">
              เส้นทางการอพยพจากห้องสอบมา ณ จุดรวมพล เมื่อเกิดเหตุแผ่นดินไหว
            </h2>
            <p className="text-[11px] font-semibold text-amber-900">
              อาคารที่ใช้สอบ อาคาร 6 ตึกเฉลิมพระเกียรติ 72 พรรษา (จำลอง 2 มิติ)
            </p>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Canvas Viewport Zoom/Pan Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 backdrop-blur border border-slate-700/80 shadow-lg">
        <button
          onClick={() => setScale((s) => Math.min(25.0, s * 1.2))}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(2.0, s * 0.8))}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Summary Bar for Building 6 matching the exact text from the image */}
      {isBuilding6 && (
        <div className="absolute bottom-3 left-3 right-3 z-10 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-semibold pointer-events-none">
          <div className="px-3 py-1.5 rounded-lg bg-pink-100/90 border border-pink-300 text-pink-900 shadow">
            ทางออก 1: ห้อง 6215–6216, 6312–6317 (ลานประดู่)
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-100/90 border border-emerald-300 text-emerald-900 shadow">
            ทางออก 2: ห้อง 621–623, 6217, 631–633, 6318 (ลานประดู่)
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-blue-100/90 border border-blue-300 text-blue-900 shadow">
            ทางออก 3: ห้อง 624–626, 634–636 (สนามฟุตบอล)
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-orange-100/90 border border-orange-300 text-orange-900 shadow">
            ทางออก 4: ห้อง 627–629, 637–639, 6210–6214 (สนามฟุตบอล)
          </div>
        </div>
      )}
    </div>
  );
};
