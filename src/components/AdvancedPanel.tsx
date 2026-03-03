import { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ReferenceLine,
} from 'recharts';
import type { SystemParams, EngineResults, MonteCarloResult } from '../types';
import { runSensitivity, getSensitivityVars, type SensitivityVar } from '../lib/sensitivity';
import { runMonteCarlo, DEFAULT_MC } from '../lib/montecarlo';
import { buildHistBins } from '../lib/helpers';

interface Props { params: SystemParams; results: EngineResults }

export default function AdvancedPanel({ params, results: r }: Props) {
  const [open, setOpen] = useState(false);
  const sensVars = getSensitivityVars();
  const [sensVar, setSensVar] = useState<SensitivityVar>('tankHeight');
  const [mcN, setMcN] = useState(500);
  const [mcResult, setMcResult] = useState<MonteCarloResult | null>(null);
  const [mcRunning, setMcRunning] = useState(false);

  const sensData = useMemo(() => runSensitivity(params, sensVar), [params, sensVar]);

  const runMC = useCallback(() => {
    setMcRunning(true);
    setTimeout(() => {
      setMcResult(runMonteCarlo(params, { ...DEFAULT_MC }, mcN));
      setMcRunning(false);
    }, 10);
  }, [params, mcN]);

  const qHist = useMemo(() => mcResult ? buildHistBins(mcResult.samples.map(s => s.qRealLh), 18) : [], [mcResult]);
  const euHist = useMemo(() => mcResult ? buildHistBins(mcResult.samples.map(s => s.eu), 18) : [], [mcResult]);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
        <span className="text-sm font-semibold text-gray-700">🔬 Avanzado: Monte Carlo y Sensibilidad</span>
        <span className={`transition-transform text-gray-400 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="p-4 space-y-6">
          {/* Sensitivity */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h4 className="text-sm font-semibold text-gray-700">Análisis de Sensibilidad</h4>
              <select className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                value={sensVar} onChange={e => setSensVar(e.target.value as SensitivityVar)}>
                {sensVars.map(v => <option key={v.id} value={v.id}>{v.label} ({v.unit})</option>)}
              </select>
            </div>
            <p className="text-xs text-gray-500">
              Esto muestra cómo cambia el sistema al variar un parámetro. Te dice qué ajuste mejora más el resultado.
            </p>
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sensData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="x" fontSize={10} tickFormatter={v => (+v).toFixed(1)} />
                  <YAxis yAxisId="q" fontSize={10} unit=" L/h" />
                  <YAxis yAxisId="eu" orientation="right" fontSize={10} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="q" dataKey="qRealLh" stroke="#3b82f6" name="Q real (L/h)" dot={false} strokeWidth={2} />
                  <Line yAxisId="eu" dataKey="eu" stroke="#10b981" name="EU (%)" dot={false} strokeWidth={2} />
                  <ReferenceLine yAxisId="q" y={r.qReqLh} stroke="#f59e0b" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monte Carlo */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h4 className="text-sm font-semibold text-gray-700">Incertidumbre (Monte Carlo)</h4>
              <input type="number" className="rounded-lg border border-gray-300 px-2 py-1 text-xs w-20"
                value={mcN} min={50} max={5000} step={50} onChange={e => setMcN(parseInt(e.target.value) || 500)} />
              <button onClick={runMC} disabled={mcRunning}
                className="rounded-lg bg-blue-600 text-white px-4 py-1.5 text-xs font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                {mcRunning ? 'Calculando…' : 'Ejecutar'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Corremos {mcN} simulaciones variando ligeramente h, Ø emisor, Cd, longitudes y demanda para ver qué tan robusto es el diseño.
            </p>

            {mcResult && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {[
                    { label: 'Q media ± σ', value: `${mcResult.qMean.toFixed(2)} ± ${mcResult.qStd.toFixed(2)} L/h` },
                    { label: 'Q P5–P95', value: `${mcResult.qP5.toFixed(2)} – ${mcResult.qP95.toFixed(2)} L/h` },
                    { label: 'EU media ± σ', value: `${mcResult.euMean.toFixed(1)} ± ${mcResult.euStd.toFixed(1)}%` },
                    { label: 'EU P5–P95', value: `${mcResult.euP5.toFixed(1)} – ${mcResult.euP95.toFixed(1)}%` },
                  ].map((s, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-2.5">
                      <div className="text-gray-500">{s.label}</div>
                      <div className="font-mono font-bold text-gray-800">{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <h5 className="text-xs font-semibold text-gray-600 mb-1">Q_real (L/h)</h5>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={qHist}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" fontSize={8} interval="preserveStartEnd" />
                        <YAxis fontSize={9} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <h5 className="text-xs font-semibold text-gray-600 mb-1">EU (%)</h5>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={euHist}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" fontSize={8} interval="preserveStartEnd" />
                        <YAxis fontSize={9} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
