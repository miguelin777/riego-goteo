'use client';

import { useState, useMemo } from 'react';
import type { SystemParams, HydraulicResults } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';

interface Props { params: SystemParams; results: HydraulicResults; }

export default function FlowSimulationView({ params: p, results: r }: Props) {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  const W = 760, H = 340;
  const groundY = H - 50;
  const latY = groundY - 30;
  const latStartX = 200, latEndX = 680;
  const latScale = (latEndX - latStartX) / Math.max(p.lateralPipeLength, 0.01);
  const tankX = 40, tankY = 60, tankW = 55, tankH = 65;
  const tankBottomY = tankY + tankH;
  const valveX = 120, valveY = tankBottomY + 10;

  const flowDur = playing ? Math.max(0.3, 3 / speed) : 0;
  const dripDur = playing ? Math.max(0.3, 2 / speed) : 0;

  const chartData = useMemo(() =>
    r.emitters.map((e, i) => ({
      name: `P${i + 1}`,
      caudal: +e.flow.toFixed(3),
      position: e.position,
    })),
    [r.emitters],
  );
  const maxFlow = Math.max(...r.emitters.map(e => e.flow), 0.1);

  return (
    <div className="space-y-5 text-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-sm sm:text-base font-bold text-slate-800">Simulación de Flujo</h2>
        <div className="flex items-center gap-3 no-print">
          <button onClick={() => setPlaying(!playing)}
            className="rounded-md bg-blue-600 text-white px-3 py-1 text-xs font-semibold
                       hover:bg-blue-700 transition cursor-pointer">
            {playing ? 'Pausar' : 'Reproducir'}
          </button>
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="hidden xs:inline">Velocidad</span>
            <input type="range" min={0.2} max={5} step={0.1} value={speed}
              onChange={e => setSpeed(parseFloat(e.target.value))}
              className="w-16 sm:w-20" />
            <span className="font-mono text-blue-700 w-6">{speed.toFixed(1)}×</span>
          </label>
        </div>
      </div>

      {/* SVG animado */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ background: '#fafbfc' }}>
          {/* Tanque */}
          <rect x={tankX} y={tankY} width={tankW} height={tankH} fill="#dbeafe" stroke="#1e40af" strokeWidth="2" rx="3" />
          <rect x={tankX + 2} y={tankY + tankH * 0.25} width={tankW - 4} height={tankH * 0.72}
            fill="#93c5fd" opacity="0.5" rx="2" />
          <text x={tankX + tankW / 2} y={tankY - 5} textAnchor="middle" fontSize="9" fontWeight="700" fill="#1e40af">
            Tanque
          </text>

          {/* Tubería principal (tanque → T) */}
          <line x1={tankX + tankW} y1={tankBottomY} x2={valveX} y2={valveY} stroke="#3b82f6" strokeWidth="4" />
          <line x1={valveX} y1={valveY} x2={latStartX} y2={valveY} stroke="#3b82f6" strokeWidth="4" />
          <line x1={latStartX} y1={valveY} x2={latStartX} y2={latY} stroke="#3b82f6" strokeWidth="4" />

          {/* Válvula */}
          <rect x={valveX - 5} y={valveY - 6} width={16} height={12} fill="#2563eb" rx="2" />
          <text x={valveX + 3} y={valveY - 9} textAnchor="middle" fontSize="7" fill="#1e40af" fontWeight="600">V</text>

          {/* Lateral */}
          <line x1={latStartX} y1={latY} x2={latEndX} y2={latY} stroke="#3b82f6" strokeWidth="4" />

          {/* Gotas animadas en principal */}
          {playing && [0, 0.33, 0.66].map((offset, idx) => (
            <circle key={`mp-${idx}`} r="3" fill="#60a5fa" opacity="0.8">
              <animate attributeName="cx" from={tankX + tankW} to={latStartX}
                dur={`${flowDur}s`} begin={`${offset * flowDur}s`} repeatCount="indefinite" />
              <animate attributeName="cy" from={tankBottomY} to={valveY}
                dur={`${flowDur}s`} begin={`${offset * flowDur}s`} repeatCount="indefinite" />
            </circle>
          ))}

          {/* Gotas animadas en lateral */}
          {playing && [0, 0.25, 0.5, 0.75].map((offset, idx) => (
            <circle key={`lat-${idx}`} cy={latY} r="2.5" fill="#60a5fa" opacity="0.7">
              <animate attributeName="cx" from={latStartX} to={latEndX}
                dur={`${flowDur * 1.5}s`} begin={`${offset * flowDur * 1.5}s`} repeatCount="indefinite" />
            </circle>
          ))}

          {/* Goteros + plantas + goteo */}
          {Array.from({ length: p.plantCount }).map((_, i) => {
            const pos = p.plantPositions[i] ?? 0;
            const px = latStartX + pos * latScale;
            const em = r.emitters[i];
            const relFlow = em ? em.flow / maxFlow : 0.5;
            return (
              <g key={i}>
                <circle cx={px} cy={latY} r={5} fill="#f97316" stroke="#c2410c" strokeWidth="1.5" />
                {/* Gotas cayendo */}
                {playing && [0, 0.5].map((off, j) => (
                  <circle key={j} cx={px} r={2} fill="#60a5fa" opacity="0.9">
                    <animate attributeName="cy" from={latY + 6} to={latY + 30}
                      dur={`${Math.max(0.4, dripDur / relFlow)}s`} begin={`${off * dripDur}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.9" to="0"
                      dur={`${Math.max(0.4, dripDur / relFlow)}s`} begin={`${off * dripDur}s`} repeatCount="indefinite" />
                  </circle>
                ))}
                {/* Planta */}
                <circle cx={px} cy={latY + 38} r={8} fill="#22c55e" opacity="0.7" />
                <text x={px} y={latY + 55} textAnchor="middle" fontSize="8" fill="#15803d" fontWeight="600">
                  P{i + 1}
                </text>
                {/* Caudal label */}
                {em && (
                  <text x={px} y={latY - 12} textAnchor="middle" fontSize="7.5" fill="#c2410c" fontWeight="700">
                    {em.flow.toFixed(2)} L/h
                  </text>
                )}
              </g>
            );
          })}

          {/* Suelo */}
          <line x1={20} y1={groundY} x2={W - 20} y2={groundY} stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 2" />
        </svg>
      </div>

      {/* Gráfica de caudales por emisor */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Distribución de caudal por emisor</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={10} unit=" L/h" />
              <Tooltip formatter={(val) => [`${Number(val).toFixed(3)} L/h`, 'Caudal']}
                contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="caudal" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Panel what-if */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 no-print">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Panel «¿Qué pasaría si…?»</h3>
        <p className="text-xs text-slate-500 mb-3">
          Modifica los parámetros en el panel izquierdo y observa cómo cambian los caudales, la presión y la uniformidad en tiempo real.
          Prueba cambiar la altura del tanque (h) o el número de plantas para ver el efecto inmediato.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <InfoBox label="Presión" value={`${r.pressurekPa.toFixed(2)} kPa`} sub={`${r.pressureBar.toFixed(4)} bar`} />
          <InfoBox label="Velocidad ideal" value={`${r.velocityIdeal.toFixed(3)} m/s`} sub="Bernoulli sin pérdidas" />
          <InfoBox label="Velocidad real" value={`${r.velocityReal.toFixed(3)} m/s`} sub={`hL total = ${r.headLossTotal.toFixed(4)} m`} />
          <InfoBox label="Uniformidad" value={`${r.uniformity.toFixed(1)}%`}
            sub={r.uniformity >= 90 ? 'Excelente' : r.uniformity >= 80 ? 'Buena' : 'Mejorar diseño'} />
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-2.5">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className="font-bold text-slate-800 text-sm">{value}</div>
      <div className="text-[10px] text-slate-400">{sub}</div>
    </div>
  );
}
