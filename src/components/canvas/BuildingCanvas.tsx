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

  // Transform state: Scale & Offset
  const [scale, setScale] = useState(1.0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const isBuilding6 = building.metadata.id === 'building-6-courtyard-model';

  // Coordinate system for Building 6 is 1000 x 680
  const autoFitView = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    if (isBuilding6) {
      // Blueprint base dimension is 1000 x 680
      const sX = rect.width / 1020;
      const sY = rect.height / 700;
      const s = Math.min(sX, sY) * 0.96;
      setScale(s);
      setOffset({
        x: (rect.width - 1000 * s) / 2,
        y: (rect.height - 680 * s) / 2,
      });
    } else {
      setScale(5.5);
      setOffset({ x: 70, y: 70 });
    }
  }, [isBuilding6]);

  useEffect(() => {
    autoFitView();
  }, [autoFitView]);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    setScale((prev) => Math.max(0.4, Math.min(6.0, prev * zoomFactor)));
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

  // Zone colors exact to the school poster
  const getZoneTheme = (zoneId?: string) => {
    switch (zoneId) {
      case 'ZONE_GREEN':
        return {
          fill: '#bbf7d0', // Pastel green
          stroke: '#16a34a',
          text: '#14532d',
          arrow: '#16a34a',
        };
      case 'ZONE_BLUE':
        return {
          fill: '#bfdbfe', // Pastel blue
          stroke: '#2563eb',
          text: '#1e3a8a',
          arrow: '#2563eb',
        };
      case 'ZONE_PINK':
        return {
          fill: '#fbcfe8', // Pastel pink
          stroke: '#db2777',
          text: '#831843',
          arrow: '#db2777',
        };
      case 'ZONE_ORANGE':
        return {
          fill: '#fed7aa', // Pastel orange/peach
          stroke: '#ea580c',
          text: '#7c2d12',
          arrow: '#ea580c',
        };
      default:
        return {
          fill: '#f1f5f9',
          stroke: '#64748b',
          text: '#1e293b',
          arrow: '#64748b',
        };
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

    // Warm cream backdrop matching the poster
    ctx.fillStyle = isBuilding6 ? '#fffbeb' : '#090d16';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    if (isBuilding6) {
      // ========================================================
      // 1. SURROUNDING ASSEMBLY AREAS (จุดรวมพล)
      // ========================================================

      // (A) Left Assembly: ลานประดู่ (ทางออก 1, 2)
      const pradooX = 25;
      const pradooY = 320;
      // Red emblem
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(pradooX + 32, pradooY - 45, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👥', pradooX + 32, pradooY - 44);

      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 19px "Sarabun", sans-serif';
      ctx.fillText('จุดรวมพล', pradooX + 32, pradooY);
      ctx.font = 'bold 15px "Sarabun", sans-serif';
      ctx.fillText('ทางออก 1,2', pradooX + 32, pradooY + 22);
      ctx.font = 'bold 21px "Sarabun", sans-serif';
      ctx.fillText('ลานประดู่', pradooX + 32, pradooY + 48);

      // (B) Right Assembly: สนามฟุตบอล (ทางออก 3, 4)
      const fieldX = 890;
      const fieldY = 240;
      const fieldW = 95;
      const fieldH = 140;
      ctx.fillStyle = '#15803d'; // Grass green
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.fillRect(fieldX, fieldY, fieldW, fieldH);
      ctx.strokeRect(fieldX, fieldY, fieldW, fieldH);

      // Field markings
      ctx.beginPath();
      ctx.moveTo(fieldX, fieldY + fieldH / 2);
      ctx.lineTo(fieldX + fieldW, fieldY + fieldH / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(fieldX + fieldW / 2, fieldY + fieldH / 2, 18, 0, Math.PI * 2);
      ctx.stroke();

      // Goal boxes
      ctx.strokeRect(fieldX + 22, fieldY, 50, 16);
      ctx.strokeRect(fieldX + 22, fieldY + fieldH - 16, 50, 16);

      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 19px "Sarabun", sans-serif';
      ctx.fillText('จุดรวมพล', fieldX + fieldW / 2, fieldY + fieldH + 24);
      ctx.font = 'bold 15px "Sarabun", sans-serif';
      ctx.fillText('ทางออก 3,4', fieldX + fieldW / 2, fieldY + fieldH + 46);
      ctx.font = 'bold 21px "Sarabun", sans-serif';
      ctx.fillText('สนามฟุตบอล', fieldX + fieldW / 2, fieldY + fieldH + 72);

      // ========================================================
      // 2. MAIN BUILDING PERIMETER WALLS & CORRIDORS
      // ========================================================
      // Building outer frame
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.0;
      ctx.strokeRect(170, 75, 700, 500);

      // Corridors fill & guide paths
      ctx.fillStyle = '#f1f5f9';
      // North Corridor
      ctx.fillRect(170, 125, 700, 30);
      // South Corridor
      ctx.fillRect(170, 485, 700, 30);
      // West Corridor
      ctx.fillRect(225, 125, 23, 390);
      // East Corridor
      ctx.fillRect(748, 125, 22, 390);

      // ========================================================
      // 3. CENTRAL AUDITORIUM & LIBRARY (ตรงกลาง)
      // ========================================================
      const hallX = 316;
      const hallY = 205;
      const hallW = 354;
      const hallH = 235;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.fillRect(hallX, hallY, hallW, hallH);
      ctx.strokeRect(hallX, hallY, hallW, hallH);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 21px "Sarabun", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ห้องประชุม (ชั้น 3)', hallX + 120, hallY + hallH / 2);

      // Library / ห้องกองกลาง on the right side of central area
      ctx.fillStyle = '#f8fafc';
      ctx.strokeRect(hallX + 285, hallY + 30, 68, hallH - 60);
      ctx.font = 'bold 12px "Sarabun", sans-serif';
      ctx.save();
      ctx.translate(hallX + 325, hallY + hallH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('ห้องกองกลาง', 0, -8);
      ctx.fillText('(ห้องสมุดอาคารโรงเรียน ชั้น 2)', 0, 8);
      ctx.restore();

      // Green Exit Door badges around the Hall
      const drawExitDoor = (x: number, y: number) => {
        ctx.fillStyle = '#15803d';
        ctx.fillRect(x - 9, y - 6, 18, 12);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('EXIT', x, y + 2.5);
      };
      drawExitDoor(hallX + 170, hallY); // Top exit
      drawExitDoor(hallX + 170, hallY + hallH); // Bottom exit
      drawExitDoor(hallX, hallY + hallH / 2); // Left exit
      drawExitDoor(hallX + 285, hallY + hallH / 2); // Library exit

      // ========================================================
      // 4. ROOMS / CLASSROOM BOXES (ARCHITECTURAL TILES)
      // ========================================================
      // Define exact dimensions for room tiles
      const drawRoomTile = (node: typeof building.nodes[0], w: number, h: number) => {
        const theme = getZoneTheme(node.zoneId);
        const matchesFloor = selectedFloor === 0 || node.floor === selectedFloor;

        ctx.fillStyle = matchesFloor ? theme.fill : '#f8fafc';
        ctx.strokeStyle = matchesFloor ? theme.stroke : '#cbd5e1';
        ctx.lineWidth = 1.4;

        ctx.fillRect(node.x - w / 2, node.y - h / 2, w, h);
        ctx.strokeRect(node.x - w / 2, node.y - h / 2, w, h);

        // Labels
        ctx.fillStyle = matchesFloor ? theme.text : '#94a3b8';
        ctx.font = 'bold 13px "Sarabun", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const parts = node.label.split(' ');
        const main = parts[0];
        const sub = parts.slice(1).join(' ');

        if (sub) {
          ctx.fillText(main, node.x, node.y - 7);
          ctx.font = '10.5px "Sarabun", sans-serif';
          ctx.fillText(sub, node.x, node.y + 7);
        } else {
          ctx.fillText(main, node.x, node.y);
        }
      };

      for (const node of building.nodes) {
        if (node.type !== 'ROOM') continue;

        // Custom widths matching the poster layout
        if (node.id.startsWith('R_631') && ['R_631', 'R_632', 'R_633', 'R_634', 'R_635', 'R_636'].includes(node.id)) {
          drawRoomTile(node, 68, 44);
        } else if (node.id.startsWith('R_621') && ['R_621', 'R_622', 'R_623', 'R_624', 'R_625', 'R_626'].includes(node.id)) {
          drawRoomTile(node, 68, 44);
        } else if (['R_6318', 'R_6317', 'R_6316'].includes(node.id)) {
          drawRoomTile(node, 54, 72);
        } else if (['R_6217', 'R_6216', 'R_6215'].includes(node.id)) {
          drawRoomTile(node, 54, 72);
        } else if (['R_627', 'R_628', 'R_629'].includes(node.id)) {
          drawRoomTile(node, 56, 72);
        } else if (['R_637', 'R_638', 'R_639'].includes(node.id)) {
          drawRoomTile(node, 56, 72);
        } else if (['R_6214', 'R_6213', 'R_6212', 'R_6211', 'R_6210'].includes(node.id)) {
          drawRoomTile(node, 78, 44);
        } else if (['R_6315', 'R_6314', 'R_6313', 'R_6312', 'R_6311', 'R_6310'].includes(node.id)) {
          drawRoomTile(node, 68, 48);
        } else {
          drawRoomTile(node, 60, 40);
        }
      }

      // Restrooms (ห้องน้ำนักเรียน)
      // Female Restrooms on NE
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.4;
      ctx.fillRect(665, 80, 115, 45);
      ctx.strokeRect(665, 80, 115, 45);
      ctx.fillRect(665, 155, 115, 45);
      ctx.strokeRect(665, 155, 115, 45);
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 11.5px "Sarabun", sans-serif';
      ctx.fillText('🚻 ห้องน้ำนักเรียนหญิง', 722, 102);
      ctx.fillText('🚻 ห้องน้ำนักเรียนหญิง', 722, 177);

      // Male Restrooms on SE
      ctx.fillRect(665, 440, 115, 45);
      ctx.strokeRect(665, 440, 115, 45);
      ctx.fillRect(665, 515, 115, 50);
      ctx.strokeRect(665, 515, 115, 50);
      ctx.fillText('🚻 ห้องน้ำนักเรียนชาย', 722, 462);
      ctx.fillText('🚻 ห้องน้ำนักเรียนชาย', 722, 540);

      // Green Exit Stairs (บันไดหนีไฟ)
      const drawStairIcon = (x: number, y: number, w: number, h: number) => {
        ctx.fillStyle = '#15803d';
        ctx.fillRect(x - w / 2, y - h / 2, w, h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.0;
        ctx.strokeRect(x - w / 2, y - h / 2, w, h);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('🪜', x, y + 1);
      };

      drawStairIcon(252, 102, 24, 44);
      drawStairIcon(252, 178, 24, 44);
      drawStairIcon(628, 102, 24, 44);
      drawStairIcon(652, 102, 24, 44);
      drawStairIcon(628, 178, 24, 44);
      drawStairIcon(652, 178, 24, 44);

      drawStairIcon(252, 540, 24, 48);
      drawStairIcon(652, 462, 24, 44);
      drawStairIcon(652, 540, 24, 48);

      // ========================================================
      // 5. THICK EVACUATION ROUTE TRACKS & BIG EXIT ARROWS
      // ========================================================
      // Helper for arrows
      const drawEvacArrow = (
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        color: string,
        label: string,
        labelAlign: CanvasTextAlign
      ) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 5.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const headLen = 14;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
          toX - headLen * Math.cos(angle - Math.PI / 6),
          toY - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          toX - headLen * Math.cos(angle + Math.PI / 6),
          toY - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // Exit Label
        ctx.font = 'bold 22px "Sarabun", sans-serif';
        ctx.textAlign = labelAlign;
        ctx.fillStyle = color;
        const textX = labelAlign === 'right' ? toX - 18 : toX + 18;
        ctx.fillText(label, textX, toY + 6);
      };

      // (1) GREEN PATH: North-West -> ทางออก 2 (Left)
      // Corridor track
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      // Dropdown branches from rooms
      [205, 300, 370].forEach((x) => {
        ctx.moveTo(x, 102);
        ctx.lineTo(x, 178);
      });
      // Main track
      ctx.moveTo(400, 140);
      ctx.lineTo(236, 140);
      ctx.lineTo(236, 180);
      ctx.lineTo(135, 180);
      ctx.stroke();
      drawEvacArrow(170, 180, 105, 180, '#15803d', 'ทางออก 2', 'right');

      // (2) BLUE PATH: North-East -> ทางออก 3 (Right)
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      [440, 510, 580].forEach((x) => {
        ctx.moveTo(x, 102);
        ctx.lineTo(x, 178);
      });
      ctx.moveTo(420, 140);
      ctx.lineTo(758, 140);
      ctx.lineTo(758, 180);
      ctx.lineTo(870, 180);
      ctx.stroke();
      drawEvacArrow(830, 180, 895, 180, '#2563eb', 'ทางออก 3', 'left');

      // (3) PINK PATH: South-West -> ทางออก 1 (Left)
      ctx.strokeStyle = '#db2777';
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      // West branch
      ctx.moveTo(236, 240);
      ctx.lineTo(236, 500);
      // South branch
      [205, 300, 370, 440].forEach((x) => {
        ctx.moveTo(x, 500);
        ctx.lineTo(x, 540);
      });
      ctx.moveTo(440, 500);
      ctx.lineTo(236, 500);
      ctx.lineTo(236, 480);
      ctx.lineTo(135, 480);
      ctx.stroke();
      drawEvacArrow(170, 480, 105, 480, '#db2777', 'ทางออก 1', 'right');

      // (4) ORANGE PATH: South-East -> ทางออก 4 (Right)
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      // East branch
      ctx.moveTo(758, 240);
      ctx.lineTo(758, 500);
      // South branch
      [220, 300, 385, 485, 580].forEach((x) => {
        ctx.moveTo(x, 462);
        ctx.lineTo(x, 500);
      });
      [520, 600].forEach((x) => {
        ctx.moveTo(x, 500);
        ctx.lineTo(x, 540);
      });
      ctx.moveTo(480, 500);
      ctx.lineTo(758, 500);
      ctx.lineTo(758, 480);
      ctx.lineTo(870, 480);
      ctx.stroke();
      drawEvacArrow(830, 480, 895, 480, '#ea580c', 'ทางออก 4', 'left');

      // ========================================================
      // 6. HEATMAP OVERLAY IF ENABLED
      // ========================================================
      if (showHeatmap && segmentManager) {
        for (const edge of building.edges) {
          if (edge.isStair) continue;
          const u = building.nodes.find((n) => n.id === edge.from);
          const v = building.nodes.find((n) => n.id === edge.to);
          if (!u || !v) continue;

          const segments = segmentManager.getSegments(edge.id);
          const dx = v.x - u.x;
          const dy = v.y - u.y;
          const len = Math.hypot(dx, dy);

          if (len > 0) {
            for (const seg of segments) {
              if (seg.densityPpm2 > 0.4) {
                const t0 = seg.startM / edge.lengthM;
                const t1 = seg.endM / edge.lengthM;

                let color = 'rgba(34, 197, 94, 0.6)';
                if (seg.densityPpm2 >= 3.0) color = 'rgba(239, 68, 68, 0.9)';
                else if (seg.densityPpm2 >= 2.0) color = 'rgba(249, 115, 22, 0.75)';
                else if (seg.densityPpm2 >= 1.0) color = 'rgba(234, 179, 8, 0.65)';

                ctx.strokeStyle = color;
                ctx.lineWidth = 14;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(u.x + t0 * dx, u.y + t0 * dy);
                ctx.lineTo(u.x + t1 * dx, u.y + t1 * dy);
                ctx.stroke();
              }
            }
          }
        }
      }
    } else {
      // Default School Building Rendering
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.0;
      for (const edge of building.edges) {
        const u = building.nodes.find((n) => n.id === edge.from);
        const v = building.nodes.find((n) => n.id === edge.to);
        if (!u || !v) continue;
        ctx.beginPath();
        ctx.moveTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
        ctx.stroke();
      }
    }

    // ========================================================
    // 7. RENDER AGENT OCCUPANTS
    // ========================================================
    for (const agent of snapshots) {
      if (agent.state === 'EVACUATED') continue;
      if (selectedFloor !== 0 && agent.floor !== selectedFloor) continue;

      ctx.beginPath();
      const radius = agent.state === 'QUEUED' ? 4.5 : 3.8;
      ctx.arc(agent.x, agent.y, radius, 0, Math.PI * 2);

      if (agent.state === 'QUEUED') {
        ctx.fillStyle = '#ef4444'; // Red for queued
        ctx.fill();
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (agent.state === 'MOVING') {
        ctx.fillStyle = '#0284c7'; // Sky blue for moving
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.0;
        ctx.stroke();
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
    <div className="relative w-full h-[660px] rounded-2xl overflow-hidden bg-amber-50/50 border border-amber-200/60 shadow-2xl select-none">
      {/* Poster Header Banner matching the school plan title */}
      {isBuilding6 && (
        <div className="absolute top-3 left-4 right-16 z-10 pointer-events-none flex flex-col items-center">
          <div className="bg-amber-100/95 border border-amber-300 text-amber-950 px-5 py-2 rounded-xl shadow-md text-center max-w-2xl">
            <h2 className="text-xs md:text-sm font-bold tracking-tight text-blue-900">
              เส้นทางการอพยพจากห้องสอบมา ณ จุดรวมพล เมื่อเกิดเหตุแผ่นดินไหว
            </h2>
            <p className="text-[11px] font-semibold text-amber-900">
              อาคารที่ใช้สอบ อาคาร 6 ตึกเฉลิมพระเกียรติ 72 พรรษา (โรงเรียนสุรศักดิ์มนตรี)
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
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-white/90 backdrop-blur border border-slate-300 shadow-md">
        <button
          onClick={() => setScale((s) => Math.min(6.0, s * 1.15))}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(0.4, s * 0.85))}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={autoFitView}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
          title="Reset to Fit Plan"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Summary Bar for Building 6 matching the exact text from the image */}
      {isBuilding6 && (
        <div className="absolute bottom-3 left-3 right-3 z-10 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-bold pointer-events-none">
          <div className="px-3 py-1.5 rounded-lg bg-pink-100/95 border border-pink-300 text-pink-900 shadow">
            ทางออก 1 ห้องสอบ 6215–6216, 6312–6317 (ลานประดู่)
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-100/95 border border-emerald-300 text-emerald-900 shadow">
            ทางออก 2 ห้องสอบ 621–623, 6217, 631–633, 6318 (ลานประดู่)
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-blue-100/95 border border-blue-300 text-blue-900 shadow">
            ทางออก 3 ห้องสอบ 624–626, 634–636 (สนามฟุตบอล)
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-orange-100/95 border border-orange-300 text-orange-900 shadow">
            ทางออก 4 ห้องสอบ 627–629, 637–639 (สนามฟุตบอล)
          </div>
        </div>
      )}
    </div>
  );
};
