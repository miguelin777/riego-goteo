import type { SystemParams, EngineResults } from '../types';
import { forwardRef } from 'react';

interface Props {
  params: SystemParams;
  results: EngineResults;
}

const TechnicalDiagramSVG = forwardRef<SVGSVGElement, Props>(({ params: p, results: r }, ref) => {
  const W = 800;
  const H = 540;
  const PAD = 40;

  const tankW = 60;
  const tankH = 70;
  const tankX = PAD + 20;
  const groundY = H - 80;
  const tankBottomY = groundY - Math.min(p.tankHeight / 1.2, 1.5) * 200;
  const tankTopY = tankBottomY - tankH;
  const waterLevel = tankBottomY - tankH * 0.7;

  const supportX = tankX + tankW / 2;

  const valveY = tankBottomY + 15;
  const valveX = tankX + tankW + 5;
  const filterX = valveX + 50;

  const lateralStartX = filterX + 40;
  const lateralY = groundY - 30;
  const lateralEndX = lateralStartX + Math.min(p.lateralPipe.length / 1.2, 1.5) * 400;
  const latScale = (lateralEndX - lateralStartX) / Math.max(p.lateralPipe.length, 0.01);

  const areaX = lateralStartX - 10;
  const areaW = Math.min(p.areaLength / 1.2, 1.5) * 400 + 20;
  const areaH = Math.min(p.areaWidth / 0.7, 0.8) * 80;

  const blue = '#3b82f6';
  const darkBlue = '#1e40af';
  const green = '#22c55e';
  const gray = '#6b7280';
  const lightBlue = '#93c5fd';
  const matColor = p.mainPipe.material === 'PVC' ? '#3b82f6' : p.mainPipe.material === 'PE' ? '#10b981' : '#8b5cf6';
  const latColor = p.lateralPipe.material === 'PVC' ? '#3b82f6' : p.lateralPipe.material === 'PE' ? '#10b981' : '#8b5cf6';

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ background: '#ffffff' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowBlue" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={blue} />
        </marker>
        <pattern id="cropArea" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#f0fdf4" />
          <line x1="0" y1="10" x2="10" y2="0" stroke="#bbf7d0" strokeWidth="0.5" />
        </pattern>
      </defs>

      <text x={W / 2} y={24} textAnchor="middle" fontWeight="bold" fill={darkBlue} fontSize="13">
        Esquema Técnico — Riego por Goteo por Gravedad
      </text>

      {/* Crop area */}
      <rect x={areaX} y={lateralY + 5} width={areaW} height={areaH}
        fill="url(#cropArea)" stroke={green} strokeWidth="1" strokeDasharray="4 2" rx="4" />
      <text x={areaX + areaW / 2} y={lateralY + areaH + 22} textAnchor="middle" fontSize="9" fill={green} fontWeight="600">
        Área: {p.areaLength} × {p.areaWidth} m
      </text>

      {/* Ground */}
      <line x1={PAD} y1={groundY} x2={W - PAD} y2={groundY} stroke="#a3a3a3" strokeWidth="1.5" strokeDasharray="6 3" />
      <text x={W - PAD} y={groundY + 14} textAnchor="end" fontSize="9" fill="#a3a3a3">Nivel del suelo</text>

      {/* Support */}
      <line x1={supportX - 15} y1={tankBottomY} x2={supportX - 15} y2={groundY} stroke={gray} strokeWidth="3" />
      <line x1={supportX + 15} y1={tankBottomY} x2={supportX + 15} y2={groundY} stroke={gray} strokeWidth="3" />
      <line x1={supportX - 20} y1={groundY} x2={supportX + 20} y2={groundY} stroke={gray} strokeWidth="3" />
      <line x1={supportX - 15} y1={(tankBottomY + groundY) / 2} x2={supportX + 15} y2={(tankBottomY + groundY) / 2} stroke={gray} strokeWidth="1.5" />

      {/* Tank */}
      <rect x={tankX} y={tankTopY} width={tankW} height={tankH} fill="#dbeafe" stroke={darkBlue} strokeWidth="2" rx="3" />
      <rect x={tankX + 2} y={waterLevel} width={tankW - 4} height={tankBottomY - waterLevel} fill={lightBlue} opacity="0.6" rx="2" />
      <text x={tankX + tankW / 2} y={tankTopY - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill={darkBlue}>
        Tanque ({p.tankVolume} L)
      </text>

      {/* Height dimension */}
      <line x1={tankX - 16} y1={waterLevel} x2={tankX - 16} y2={lateralY} stroke="#ef4444" strokeWidth="1" markerEnd="url(#arrowBlue)" />
      <line x1={tankX - 20} y1={waterLevel} x2={tankX - 12} y2={waterLevel} stroke="#ef4444" strokeWidth="1" />
      <line x1={tankX - 20} y1={lateralY} x2={tankX - 12} y2={lateralY} stroke="#ef4444" strokeWidth="1" />
      <text x={tankX - 18} y={(waterLevel + lateralY) / 2 + 3} textAnchor="end" fontSize="9" fontWeight="bold" fill="#ef4444">
        h = {p.tankHeight} m
      </text>

      {/* Pipe tank→valve */}
      <line x1={tankX + tankW} y1={tankBottomY} x2={valveX} y2={valveY} stroke={matColor} strokeWidth="3" />

      {/* Valve */}
      <polygon points={`${valveX},${valveY - 7} ${valveX + 14},${valveY} ${valveX},${valveY + 7}`} fill={matColor} stroke={darkBlue} strokeWidth="1" />
      <polygon points={`${valveX + 14},${valveY - 7} ${valveX + 28},${valveY} ${valveX + 14},${valveY + 7}`} fill={matColor} stroke={darkBlue} strokeWidth="1" />
      <text x={valveX + 14} y={valveY - 12} textAnchor="middle" fontSize="9" fill={darkBlue} fontWeight="600">Válvula</text>

      {/* Pipe valve→filter */}
      <line x1={valveX + 28} y1={valveY} x2={filterX} y2={valveY} stroke={matColor} strokeWidth="3" />

      {/* Filter */}
      <rect x={filterX} y={valveY - 10} width={24} height={20} fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" rx="3" />
      {[6, 12, 18].map(dx => (
        <line key={dx} x1={filterX + dx} y1={valveY - 6} x2={filterX + dx} y2={valveY + 6} stroke="#f59e0b" strokeWidth="1" />
      ))}
      <text x={filterX + 12} y={valveY - 16} textAnchor="middle" fontSize="9" fill="#b45309" fontWeight="600">Filtro</text>

      {/* Pipe filter→T */}
      <line x1={filterX + 24} y1={valveY} x2={lateralStartX} y2={valveY} stroke={matColor} strokeWidth="3" />
      <line x1={lateralStartX} y1={valveY} x2={lateralStartX} y2={lateralY} stroke={matColor} strokeWidth="3" />

      {/* Flow arrow */}
      <line x1={filterX + 30} y1={valveY - 10} x2={filterX + 50} y2={valveY - 10} stroke={blue} strokeWidth="1.5" markerEnd="url(#arrowBlue)" />
      <text x={filterX + 40} y={valveY - 14} textAnchor="middle" fontSize="8" fill={blue}>Flujo</text>

      {/* T connector */}
      <circle cx={lateralStartX} cy={lateralY} r={5} fill={darkBlue} />
      <text x={lateralStartX} y={lateralY - 10} textAnchor="middle" fontSize="8" fill={darkBlue}>T</text>

      {/* Lateral pipe */}
      <line x1={lateralStartX} y1={lateralY} x2={lateralEndX} y2={lateralY} stroke={latColor} strokeWidth="3" />

      {/* End cap */}
      <rect x={lateralEndX - 2} y={lateralY - 6} width={8} height={12} fill={darkBlue} rx="1" />
      <text x={lateralEndX + 4} y={lateralY - 10} textAnchor="middle" fontSize="8" fill={darkBlue}>Tapón</text>

      {/* Lateral dimension */}
      <line x1={lateralStartX} y1={lateralY + 40} x2={lateralEndX} y2={lateralY + 40} stroke={gray} strokeWidth="0.8" />
      <line x1={lateralStartX} y1={lateralY + 36} x2={lateralStartX} y2={lateralY + 44} stroke={gray} strokeWidth="0.8" />
      <line x1={lateralEndX} y1={lateralY + 36} x2={lateralEndX} y2={lateralY + 44} stroke={gray} strokeWidth="0.8" />
      <text x={(lateralStartX + lateralEndX) / 2} y={lateralY + 52} textAnchor="middle" fontSize="9" fill={gray} fontWeight="600">
        Lateral: {p.lateralPipe.length} m (Ø {p.lateralPipe.diameterMm} mm, {p.lateralPipe.material})
      </text>

      {/* Main pipe dimension */}
      <text x={(tankX + tankW + lateralStartX) / 2} y={valveY + 20} textAnchor="middle" fontSize="9" fill={gray}>
        Principal: {p.mainPipe.length} m (Ø {p.mainPipe.diameterMm} mm, {p.mainPipe.material})
      </text>

      {/* Emitters and plants */}
      {r.emitters.map((em, i) => {
        const px = lateralStartX + em.position * latScale;
        const emY = lateralY;
        const plantY = emY + 22;

        return (
          <g key={i}>
            <circle cx={px} cy={emY} r={4} fill="#f97316" stroke="#c2410c" strokeWidth="1.5" />
            <line x1={px} y1={emY + 4} x2={px} y2={emY + 14} stroke={lightBlue} strokeWidth="1.5" strokeDasharray="2 2">
              <animate attributeName="strokeDashoffset" from="0" to="-8" dur={`${Math.max(0.3, 2 - em.qLh * 0.3)}s`} repeatCount="indefinite" />
            </line>
            <line x1={px} y1={plantY + 2} x2={px} y2={plantY + 14} stroke="#15803d" strokeWidth="2" />
            <circle cx={px} cy={plantY} r={7} fill={green} opacity="0.8" />
            <circle cx={px - 4} cy={plantY - 3} r={4} fill="#4ade80" opacity="0.7" />
            <circle cx={px + 4} cy={plantY - 3} r={4} fill="#4ade80" opacity="0.7" />
            <text x={px} y={plantY + 28} textAnchor="middle" fontSize="7.5" fill="#15803d" fontWeight="600">
              P{i + 1} · {em.qLh.toFixed(2)} L/h
            </text>
          </g>
        );
      })}

      {/* Lateral flow arrow */}
      <line x1={lateralStartX + 20} y1={lateralY - 12} x2={lateralStartX + 50} y2={lateralY - 12}
        stroke={blue} strokeWidth="1.5" markerEnd="url(#arrowBlue)" />
      <text x={lateralStartX + 35} y={lateralY - 16} textAnchor="middle" fontSize="8" fill={blue}>Flujo</text>

      {/* Info box */}
      <g transform={`translate(${W - 200}, ${40})`}>
        <rect x="0" y="0" width="180" height="90" fill="white" stroke="#e5e7eb" rx="4" opacity="0.95" />
        <text x="8" y="16" fontSize="9" fontWeight="bold" fill={gray}>Resumen</text>
        <text x="8" y="30" fontSize="8" fill={gray}>Q_real = {r.qRealLh.toFixed(2)} L/h</text>
        <text x="8" y="42" fontSize="8" fill={gray}>Q_req = {r.qReqLh.toFixed(2)} L/h</text>
        <text x="8" y="54" fontSize="8" fill={gray}>EU = {r.eu.toFixed(1)}% · CV = {r.cv.toFixed(3)}</text>
        <text x="8" y="66" fontSize="8" fill={gray}>hf total ≈ {r.hfTotal.toFixed(4)} m</text>
        <text x="8" y="78" fontSize="8" fill={r.balance === 'ok' ? '#16a34a' : r.balance === 'over' ? '#ea580c' : '#dc2626'} fontWeight="600">
          {r.balance === 'ok' ? '✓ Consistente' : r.balance === 'over' ? '⚠ Sobreriego' : '⚠ Subriego'} ({r.balancePct > 0 ? '+' : ''}{r.balancePct.toFixed(1)}%)
        </text>
      </g>

      {/* Legend */}
      <g transform={`translate(${W - 170}, ${H - 65})`}>
        <rect x="0" y="0" width="150" height="55" fill="white" stroke="#e5e7eb" rx="4" />
        <text x="8" y="14" fontSize="9" fontWeight="bold" fill={gray}>Leyenda:</text>
        <circle cx="16" cy="26" r="3" fill="#f97316" />
        <text x="24" y="29" fontSize="8" fill={gray}>Gotero / Emisor</text>
        <circle cx="16" cy="40" r="4" fill={green} opacity="0.8" />
        <text x="24" y="43" fontSize="8" fill={gray}>Planta de jitomate</text>
        <line x1="86" y1="24" x2="100" y2="24" stroke={blue} strokeWidth="2" />
        <text x="104" y="27" fontSize="8" fill={gray}>Tubería</text>
      </g>
    </svg>
  );
});

TechnicalDiagramSVG.displayName = 'TechnicalDiagramSVG';
export default TechnicalDiagramSVG;
