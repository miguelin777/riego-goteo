'use client';

import { forwardRef } from 'react';
import type { SystemParams, HydraulicResults } from '@/lib/types';

interface Props { params: SystemParams; results: HydraulicResults; }

const TechnicalDiagramSVG = forwardRef<SVGSVGElement, Props>(({ params: p, results: r }, ref) => {
  const W = 860, H = 540, PAD = 45;

  const blue = '#3b82f6';
  const dkBlue = '#1e40af';
  const green = '#22c55e';
  const gray = '#6b7280';
  const ltBlue = '#93c5fd';

  // ── Coordenadas clave ──────────────────────────────────────
  const groundY = H - 85;
  const scale = Math.min(200 / 1.2, 200); // px per m (approx)
  const tankW = 60, tankH = 72;
  const tankX = PAD + 25;
  const tankBottomY = groundY - Math.max(p.tankHeight, 0.1) * scale;
  const tankTopY = tankBottomY - tankH;
  const waterY = tankBottomY - tankH * 0.72;
  const supportX = tankX + tankW / 2;

  const valveX = tankX + tankW + 8;
  const valveY = tankBottomY + 14;
  const filterX = valveX + 50;

  const latStartX = filterX + 55;
  const latY = groundY - 32;
  const latEndX = Math.min(latStartX + p.lateralPipeLength * 380, W - PAD - 30);
  const latScale = (latEndX - latStartX) / Math.max(p.lateralPipeLength, 0.01);

  const areaX = latStartX - 12;
  const areaW = (latEndX - latStartX) + 24;
  const areaY = latY + 8;
  const areaH = Math.min(p.areaWidth * 160, 90);

  const show = p.showDimensions;

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" xmlns="http://www.w3.org/2000/svg"
      style={{ background: '#ffffff' }}>
      <defs>
        <marker id="arrB" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
          <polygon points="0 0,7 2.5,0 5" fill={blue} />
        </marker>
        <marker id="arrR" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
          <polygon points="0 0,7 2.5,0 5" fill="#ef4444" />
        </marker>
        <pattern id="crop" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#f0fdf4" />
          <line x1="0" y1="10" x2="10" y2="0" stroke="#bbf7d0" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Título */}
      <text x={W / 2} y={22} textAnchor="middle" fontSize="13" fontWeight="bold" fill={dkBlue}>
        Esquema Técnico — Riego por Goteo por Gravedad
      </text>

      {/* Área de cultivo */}
      <rect x={areaX} y={areaY} width={areaW} height={areaH}
        fill="url(#crop)" stroke={green} strokeWidth="1" strokeDasharray="4 2" rx="4" />
      {show && <text x={areaX + areaW / 2} y={areaY + areaH + 15} textAnchor="middle"
        fontSize="9" fill={green} fontWeight="600">
        Área de cultivo: {p.areaLength} m × {p.areaWidth} m
      </text>}

      {/* Suelo */}
      <line x1={PAD} y1={groundY} x2={W - PAD} y2={groundY} stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="6 3" />
      <text x={W - PAD} y={groundY + 13} textAnchor="end" fontSize="8" fill="#a3a3a3">Nivel del suelo</text>

      {/* Soporte tanque */}
      <line x1={supportX - 16} y1={tankBottomY} x2={supportX - 16} y2={groundY} stroke={gray} strokeWidth="3" />
      <line x1={supportX + 16} y1={tankBottomY} x2={supportX + 16} y2={groundY} stroke={gray} strokeWidth="3" />
      <line x1={supportX - 22} y1={groundY} x2={supportX + 22} y2={groundY} stroke={gray} strokeWidth="3" />
      <line x1={supportX - 16} y1={(tankBottomY + groundY) / 2} x2={supportX + 16} y2={(tankBottomY + groundY) / 2} stroke={gray} strokeWidth="1.5" />
      <text x={supportX} y={groundY + 13} textAnchor="middle" fontSize="8" fill={gray}>Soporte</text>

      {/* Tanque */}
      <rect x={tankX} y={tankTopY} width={tankW} height={tankH}
        fill="#dbeafe" stroke={dkBlue} strokeWidth="2" rx="3" />
      <rect x={tankX + 2} y={waterY} width={tankW - 4} height={tankBottomY - waterY}
        fill={ltBlue} opacity="0.55" rx="2" />
      <text x={tankX + tankW / 2} y={tankTopY - 5} textAnchor="middle"
        fontSize="10" fontWeight="700" fill={dkBlue}>Tanque ({p.tankVolume} L)</text>

      {/* Cota de altura (h) */}
      {show && <>
        <line x1={tankX - 18} y1={waterY} x2={tankX - 18} y2={latY} stroke="#ef4444" strokeWidth="1" markerEnd="url(#arrR)" />
        <line x1={tankX - 22} y1={waterY} x2={tankX - 14} y2={waterY} stroke="#ef4444" strokeWidth="1" />
        <line x1={tankX - 22} y1={latY} x2={tankX - 14} y2={latY} stroke="#ef4444" strokeWidth="1" />
        <text x={tankX - 20} y={(waterY + latY) / 2 + 3} textAnchor="end"
          fontSize="9" fontWeight="bold" fill="#ef4444">h = {p.tankHeight} m</text>
      </>}

      {/* Salida tanque → válvula */}
      <line x1={tankX + tankW} y1={tankBottomY} x2={valveX} y2={valveY} stroke={blue} strokeWidth="3" />

      {/* Válvula */}
      <polygon points={`${valveX},${valveY - 7} ${valveX + 14},${valveY} ${valveX},${valveY + 7}`}
        fill={blue} stroke={dkBlue} strokeWidth="1" />
      <polygon points={`${valveX + 14},${valveY - 7} ${valveX + 28},${valveY} ${valveX + 14},${valveY + 7}`}
        fill={blue} stroke={dkBlue} strokeWidth="1" />
      <text x={valveX + 14} y={valveY - 12} textAnchor="middle" fontSize="8" fill={dkBlue} fontWeight="600">Válvula</text>

      {/* Tubería principal → filtro */}
      <line x1={valveX + 28} y1={valveY} x2={filterX} y2={valveY} stroke={blue} strokeWidth="3" />

      {/* Filtro */}
      <rect x={filterX} y={valveY - 10} width={24} height={20} fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" rx="3" />
      {[6, 12, 18].map(dx => (
        <line key={dx} x1={filterX + dx} y1={valveY - 6} x2={filterX + dx} y2={valveY + 6} stroke="#f59e0b" strokeWidth="1" />
      ))}
      <text x={filterX + 12} y={valveY - 16} textAnchor="middle" fontSize="8" fill="#b45309" fontWeight="600">Filtro</text>

      {/* Flecha flujo principal */}
      <line x1={filterX + 30} y1={valveY - 10} x2={filterX + 48} y2={valveY - 10}
        stroke={blue} strokeWidth="1.2" markerEnd="url(#arrB)" />
      <text x={filterX + 39} y={valveY - 14} textAnchor="middle" fontSize="7" fill={blue}>Flujo</text>

      {/* Principal → lateral */}
      <line x1={filterX + 24} y1={valveY} x2={latStartX} y2={valveY} stroke={blue} strokeWidth="3" />
      <line x1={latStartX} y1={valveY} x2={latStartX} y2={latY} stroke={blue} strokeWidth="3" />

      {/* Conector T */}
      <circle cx={latStartX} cy={latY} r={5} fill={dkBlue} />
      <text x={latStartX} y={latY - 9} textAnchor="middle" fontSize="7" fill={dkBlue}>T</text>

      {/* Cota principal */}
      {show && <text x={(tankX + tankW + latStartX) / 2} y={valveY + 18} textAnchor="middle" fontSize="8" fill={gray}>
        Principal: {p.mainPipeLength} m (Ø{p.mainPipeDiameterMm} mm)
      </text>}

      {/* Línea lateral */}
      <line x1={latStartX} y1={latY} x2={latEndX} y2={latY} stroke={blue} strokeWidth="3" />

      {/* Tapón */}
      <rect x={latEndX - 2} y={latY - 6} width={8} height={12} fill={dkBlue} rx="1" />
      <text x={latEndX + 4} y={latY - 9} textAnchor="middle" fontSize="7" fill={dkBlue}>Tapón</text>

      {/* Flecha lateral */}
      <line x1={latStartX + 18} y1={latY - 11} x2={latStartX + 44} y2={latY - 11}
        stroke={blue} strokeWidth="1.2" markerEnd="url(#arrB)" />
      <text x={latStartX + 31} y={latY - 15} textAnchor="middle" fontSize="7" fill={blue}>Flujo</text>

      {/* Cota lateral */}
      {show && <>
        <line x1={latStartX} y1={latY + 38} x2={latEndX} y2={latY + 38} stroke={gray} strokeWidth="0.7" />
        <line x1={latStartX} y1={latY + 34} x2={latStartX} y2={latY + 42} stroke={gray} strokeWidth="0.7" />
        <line x1={latEndX} y1={latY + 34} x2={latEndX} y2={latY + 42} stroke={gray} strokeWidth="0.7" />
        <text x={(latStartX + latEndX) / 2} y={latY + 50} textAnchor="middle" fontSize="8" fill={gray} fontWeight="600">
          Lateral: {p.lateralPipeLength} m (Ø{p.lateralPipeDiameterMm} mm)
        </text>
      </>}

      {/* Goteros y plantas */}
      {Array.from({ length: p.plantCount }).map((_, i) => {
        const pos = p.plantPositions[i] ?? 0;
        const px = latStartX + pos * latScale;
        const eY = latY;
        const pY = eY + 22;
        const outOfBounds = pos < 0 || pos > p.lateralPipeLength;
        const emRes = r.emitters[i];
        return (
          <g key={i}>
            {/* Gotero */}
            <circle cx={px} cy={eY} r={4.5} fill={outOfBounds ? '#ef4444' : '#f97316'}
              stroke={outOfBounds ? '#991b1b' : '#c2410c'} strokeWidth="1.5" />
            {/* Goteo */}
            <line x1={px} y1={eY + 5} x2={px} y2={eY + 14} stroke={ltBlue} strokeWidth="1.5" strokeDasharray="2 2" />
            {/* Planta */}
            <line x1={px} y1={pY + 2} x2={px} y2={pY + 13} stroke="#15803d" strokeWidth="2" />
            <circle cx={px} cy={pY} r={7} fill={green} opacity="0.8" />
            <circle cx={px - 4} cy={pY - 3} r={4} fill="#4ade80" opacity="0.7" />
            <circle cx={px + 4} cy={pY - 3} r={4} fill="#4ade80" opacity="0.7" />
            {/* Etiqueta */}
            <text x={px} y={pY + 26} textAnchor="middle" fontSize="7.5" fill="#15803d" fontWeight="600">
              P{i + 1} ({pos.toFixed(3)} m)
            </text>
            {/* Caudal */}
            {emRes && show && (
              <text x={px} y={eY - 10} textAnchor="middle" fontSize="6.5" fill="#c2410c" fontWeight="600">
                {emRes.flow.toFixed(2)} L/h
              </text>
            )}
          </g>
        );
      })}

      {/* Leyenda */}
      <g transform={`translate(${W - 175},${H - 70})`}>
        <rect x="0" y="0" width="155" height="58" fill="white" stroke="#e5e7eb" rx="4" />
        <text x="8" y="13" fontSize="8" fontWeight="bold" fill={gray}>Leyenda:</text>
        <circle cx="14" cy="24" r="3" fill="#f97316" />
        <text x="22" y="27" fontSize="7.5" fill={gray}>Gotero / Emisor</text>
        <circle cx="14" cy="36" r="4" fill={green} opacity="0.8" />
        <text x="22" y="39" fontSize="7.5" fill={gray}>Planta de jitomate</text>
        <line x1="88" y1="23" x2="102" y2="23" stroke={blue} strokeWidth="2" />
        <text x="106" y="26" fontSize="7.5" fill={gray}>Tubería</text>
        <line x1="88" y1="35" x2="102" y2="35" stroke="#ef4444" strokeWidth="1" />
        <text x="106" y="38" fontSize="7.5" fill={gray}>Cota h</text>
      </g>
    </svg>
  );
});

TechnicalDiagramSVG.displayName = 'TechnicalDiagramSVG';
export default TechnicalDiagramSVG;
