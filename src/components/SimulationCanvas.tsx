import { useRef, useState, useEffect, useCallback } from 'react';
import type { SystemParams, EngineResults } from '../types';
import { pressureColor, flowStatusColor, flowStatusLabel } from '../lib/helpers';

interface Props { params: SystemParams; results: EngineResults }
interface Drop { id: number; emIdx: number; y: number; opacity: number }

export default function SimulationCanvas({ params: p, results: r }: Props) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [colorMode, setColorMode] = useState<'pressure' | 'flow'>('pressure');
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const nextIdRef = useRef(0);
  const accumRef = useRef<number[]>([]);

  const W = 780, H = 380;
  const tankX = 35, tankW = 52, tankH = 55;
  const groundY = H - 40;
  const tankBottomY = groundY - 130;
  const tankTopY = tankBottomY - tankH;
  const waterH = tankH * Math.min(1, p.tankVolume / Math.max(p.tankVolume, 1));
  const waterTopY = tankBottomY - waterH;
  const lateralY = groundY - 28;
  const lateralStartX = 185;
  const lateralEndX = W - 40;
  const latLen = p.lateralPipe.length || 1;

  const pMax = Math.max(...r.emitters.map(e => e.pLocal), 1);
  const qTarget = r.qTargetPerEmitterLh;

  const emitterX = (pos: number) => lateralStartX + (pos / latLen) * (lateralEndX - lateralStartX);

  const getEmitterColor = (em: (typeof r.emitters)[0]) =>
    colorMode === 'pressure' ? pressureColor(em.pLocal / pMax) : flowStatusColor(em.qLh, qTarget);

  const reset = useCallback(() => {
    setDrops([]); setElapsed(0);
    lastTimeRef.current = 0;
    accumRef.current = r.emitters.map(() => 0);
    nextIdRef.current = 0;
  }, [r.emitters]);

  useEffect(() => { reset(); }, [reset]);

  useEffect(() => {
    if (!playing) { cancelAnimationFrame(frameRef.current); return; }
    if (accumRef.current.length !== r.emitters.length)
      accumRef.current = r.emitters.map(() => 0);

    const tick = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const dtMs = Math.min(time - lastTimeRef.current, 100) * speed;
      lastTimeRef.current = time;
      setElapsed(prev => prev + dtMs / 1000);

      setDrops(prev => {
        let next = prev
          .map(d => ({ ...d, y: d.y + dtMs * 0.15, opacity: d.opacity - dtMs * 0.0005 }))
          .filter(d => d.opacity > 0 && d.y < 160);

        r.emitters.forEach((em, i) => {
          const interval = em.qLh > 0.01 ? Math.max(120, 1600 / em.qLh) : 99999;
          accumRef.current[i] = (accumRef.current[i] || 0) + dtMs;
          if (accumRef.current[i] >= interval) {
            accumRef.current[i] = 0;
            next = [...next, { id: nextIdRef.current++, emIdx: i, y: 0, opacity: 1 }];
          }
        });
        return next;
      });
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [playing, speed, r.emitters]);

  const hovEm = hovered !== null ? r.emitters[hovered] : null;

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <button onClick={() => { if (!playing) lastTimeRef.current = 0; setPlaying(!playing); }}
          className={`rounded-lg px-4 py-2 font-semibold cursor-pointer transition-colors ${playing ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
          {playing ? '⏸ Pausa' : '▶ Iniciar'}
        </button>
        <button onClick={() => { setPlaying(false); reset(); }}
          className="rounded-lg bg-gray-200 text-gray-700 px-3 py-2 hover:bg-gray-300 cursor-pointer">↺ Reset</button>

        <div className="flex items-center gap-1.5 ml-2 bg-gray-100 rounded-lg px-3 py-1.5">
          <span className="text-gray-500">Velocidad:</span>
          <input type="range" min={0.5} max={10} step={0.5} value={speed}
            onChange={e => setSpeed(+e.target.value)}
            className="w-20 accent-blue-600" />
          <span className="font-mono font-bold text-gray-700 w-8">{speed}×</span>
        </div>

        <div className="flex gap-1 ml-2">
          {(['pressure', 'flow'] as const).map(m => (
            <button key={m} onClick={() => setColorMode(m)}
              className={`rounded-md px-3 py-1.5 cursor-pointer transition-colors ${colorMode === m ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {m === 'pressure' ? '🔵 Presión' : '💧 Caudal'}
            </button>
          ))}
        </div>

        <span className="text-gray-400 ml-auto">{elapsed.toFixed(1)}s simulados</span>
      </div>

      {/* Canvas */}
      <div className="relative border border-gray-200 rounded-xl overflow-hidden bg-gradient-to-b from-sky-50 to-blue-50 shadow-inner">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <defs>
            <linearGradient id="latGrad" x1="0" y1="0" x2="1" y2="0">
              {r.emitters.map((em, i) => (
                <stop key={i}
                  offset={`${(emitterX(em.position) - lateralStartX) / (lateralEndX - lateralStartX) * 100}%`}
                  stopColor={pressureColor(em.pLocal / pMax)} />
              ))}
            </linearGradient>
            <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <filter id="dropShadow"><feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.1" /></filter>
          </defs>

          {/* Ground */}
          <rect x="0" y={groundY} width={W} height={H - groundY} fill="#e8dcc8" rx="0" />
          <line x1="0" y1={groundY} x2={W} y2={groundY} stroke="#c4b5a0" strokeWidth="1.5" />

          {/* Tank support */}
          <rect x={tankX + 8} y={tankBottomY} width={10} height={groundY - tankBottomY} fill="#9ca3af" rx="2" />
          <rect x={tankX + tankW - 18} y={tankBottomY} width={10} height={groundY - tankBottomY} fill="#9ca3af" rx="2" />
          <rect x={tankX + 4} y={(tankBottomY + groundY) / 2 - 2} width={tankW - 8} height={4} fill="#9ca3af" rx="1" />

          {/* Tank */}
          <rect x={tankX} y={tankTopY} width={tankW} height={tankH} fill="#dbeafe" stroke="#1e40af" strokeWidth="2" rx="4" />
          <rect x={tankX + 3} y={waterTopY} width={tankW - 6} height={tankBottomY - waterTopY - 1} fill="url(#waterGrad)" opacity="0.7" rx="2" />
          <text x={tankX + tankW / 2} y={tankTopY - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill="#1e40af">
            {p.tankVolume}L · h={p.tankHeight}m
          </text>

          {/* Height annotation */}
          <line x1={tankX - 10} y1={waterTopY} x2={tankX - 10} y2={lateralY} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 2" />
          <line x1={tankX - 14} y1={waterTopY} x2={tankX - 6} y2={waterTopY} stroke="#ef4444" strokeWidth="1" />
          <line x1={tankX - 14} y1={lateralY} x2={tankX - 6} y2={lateralY} stroke="#ef4444" strokeWidth="1" />
          <text x={tankX - 13} y={(waterTopY + lateralY) / 2 + 3} textAnchor="end" fontSize="8" fontWeight="bold" fill="#ef4444" transform={`rotate(-90,${tankX - 13},${(waterTopY + lateralY) / 2 + 3})`}>
            h={p.tankHeight}m
          </text>

          {/* === PIPE ROUTING: tank → valve → filter → down → lateral === */}
          {(() => {
            const pipeY = tankBottomY;
            const outX = tankX + tankW;
            const valveCX = outX + 25;
            const filterCX = outX + 65;
            const cornerX = lateralStartX;
            return (<>
              {/* Segment: tank outlet → valve */}
              <line x1={outX} y1={pipeY} x2={valveCX - 10} y2={pipeY}
                stroke="#3b82f6" strokeWidth="5" strokeLinecap="round" />

              {/* Valve */}
              <g>
                <polygon points={`${valveCX - 8},${pipeY - 7} ${valveCX},${pipeY} ${valveCX - 8},${pipeY + 7}`}
                  fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
                <polygon points={`${valveCX},${pipeY - 7} ${valveCX + 8},${pipeY} ${valveCX},${pipeY + 7}`}
                  fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
                <text x={valveCX} y={pipeY - 11} textAnchor="middle" fontSize="8" fontWeight="700" fill="#b45309">Válvula</text>
              </g>

              {/* Segment: valve → filter */}
              <line x1={valveCX + 10} y1={pipeY} x2={filterCX - 12} y2={pipeY}
                stroke="#3b82f6" strokeWidth="5" strokeLinecap="round" />

              {/* Filter */}
              <g>
                <rect x={filterCX - 12} y={pipeY - 8} width="24" height="16"
                  fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" rx="3" />
                {[filterCX - 6, filterCX, filterCX + 6].map(lx => (
                  <line key={lx} x1={lx} y1={pipeY - 5} x2={lx} y2={pipeY + 5}
                    stroke="#f59e0b" strokeWidth="0.8" />
                ))}
                <text x={filterCX} y={pipeY - 12} textAnchor="middle" fontSize="8" fontWeight="700" fill="#92400e">Filtro</text>
              </g>

              {/* Segment: filter → corner */}
              <line x1={filterCX + 12} y1={pipeY} x2={cornerX} y2={pipeY}
                stroke="#3b82f6" strokeWidth="5" strokeLinecap="round" />

              {/* Flow arrow */}
              <polygon points={`${filterCX + 22},${pipeY - 4} ${filterCX + 30},${pipeY} ${filterCX + 22},${pipeY + 4}`}
                fill="#2563eb" />

              {/* Vertical drop: corner → lateral junction */}
              <line x1={cornerX} y1={pipeY} x2={cornerX} y2={lateralY}
                stroke="#3b82f6" strokeWidth="5" strokeLinecap="round" />

              {/* Pipe labels */}
              <text x={(outX + cornerX) / 2} y={pipeY + 16} textAnchor="middle" fontSize="7" fill="#64748b">
                Principal: {p.mainPipe.length}m (Ø{p.mainPipe.diameterMm}mm {p.mainPipe.material})
              </text>
            </>);
          })()}

          {/* Lateral pipe with gradient */}
          <line x1={lateralStartX} y1={lateralY} x2={lateralEndX} y2={lateralY}
            stroke="url(#latGrad)" strokeWidth="5" strokeLinecap="round" />

          {/* Junction */}
          <circle cx={lateralStartX} cy={lateralY} r={6} fill="#1e40af" />

          {/* End cap */}
          <rect x={lateralEndX - 2} y={lateralY - 5} width={7} height={10} fill="#1e40af" rx="2" />

          {/* Emitters */}
          {r.emitters.map((em, i) => {
            const cx = emitterX(em.position);
            const ey = lateralY;
            const color = getEmitterColor(em);
            const isHov = hovered === i;
            return (
              <g key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setHovered(hovered === i ? null : i)}
                className="cursor-pointer">
                {/* Emitter */}
                <circle cx={cx} cy={ey} r={isHov ? 8 : 6} fill={color} stroke="white" strokeWidth="2"
                  filter="url(#dropShadow)" className="transition-all duration-150" />

                {/* Drops */}
                {drops.filter(d => d.emIdx === i).map(d => (
                  <ellipse key={d.id} cx={cx + (Math.sin(d.id * 7) * 2)} cy={ey + 10 + d.y} rx={1.8} ry={2.8}
                    fill="#3b82f6" opacity={d.opacity * 0.75} />
                ))}

                {/* Plant */}
                <line x1={cx} y1={groundY} x2={cx} y2={groundY - 14} stroke="#15803d" strokeWidth="2.5" />
                <circle cx={cx} cy={groundY - 18} r={7} fill="#22c55e" opacity="0.9" />
                <circle cx={cx - 4} cy={groundY - 22} r={4.5} fill="#4ade80" opacity="0.7" />
                <circle cx={cx + 4} cy={groundY - 22} r={4.5} fill="#4ade80" opacity="0.7" />

                {/* Label */}
                <text x={cx} y={ey - 14} textAnchor="middle" fontSize="8" fontWeight="700"
                  fill={color}>
                  G{i + 1}: {em.qLh.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Summary text */}
          <text x={W - 8} y={16} textAnchor="end" fontSize="9" fill="#64748b">
            Q = {r.qRealLh.toFixed(1)} L/h · EU = {r.eu.toFixed(0)}%
          </text>

          {/* Legend */}
          <g transform={`translate(${W - 160},${H - 36})`}>
            <rect x="0" y="0" width="152" height="30" fill="white" stroke="#e5e7eb" rx="4" opacity="0.92" />
            <text x="6" y="12" fontSize="7" fontWeight="600" fill="#64748b">
              {colorMode === 'pressure' ? 'Presión:' : 'Caudal vs objetivo:'}
            </text>
            <circle cx="12" cy="22" r="4" fill="#22c55e" /><text x="20" y="25" fontSize="7" fill="#6b7280">{colorMode === 'pressure' ? 'Alta' : 'OK'}</text>
            <circle cx="52" cy="22" r="4" fill="#eab308" /><text x="60" y="25" fontSize="7" fill="#6b7280">{colorMode === 'pressure' ? 'Media' : '±30%'}</text>
            <circle cx="100" cy="22" r="4" fill="#ef4444" /><text x="108" y="25" fontSize="7" fill="#6b7280">{colorMode === 'pressure' ? 'Baja' : 'Fuera'}</text>
          </g>
        </svg>

        {/* Tooltip card */}
        {hovEm && (
          <div className="absolute bg-white rounded-xl shadow-lg border border-gray-200 p-3 text-xs pointer-events-none z-10 w-52"
            style={{
              left: `${((emitterX(hovEm.position)) / W) * 100}%`,
              top: '12px',
              transform: 'translateX(-50%)',
            }}>
            <div className="font-bold text-gray-800 text-sm mb-1.5">Gotero {hovEm.index + 1}</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <span className="text-gray-500">Caudal:</span>
              <span className="font-semibold">{hovEm.qLh.toFixed(3)} L/h</span>
              <span className="text-gray-500">Presión:</span>
              <span className="font-semibold">{(hovEm.pLocal / 1000).toFixed(2)} kPa</span>
              <span className="text-gray-500">h local:</span>
              <span className="font-semibold">{hovEm.hLocal.toFixed(3)} m</span>
              <span className="text-gray-500">Vol/día:</span>
              <span className="font-semibold">{hovEm.volumeLDay.toFixed(3)} L</span>
              <span className="text-gray-500">Estado:</span>
              <span className={`font-bold ${flowStatusLabel(hovEm.qLh, qTarget) === 'OK' ? 'text-green-600' : flowStatusLabel(hovEm.qLh, qTarget) === 'Bajo' ? 'text-red-600' : 'text-amber-600'}`}>
                {flowStatusLabel(hovEm.qLh, qTarget)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
