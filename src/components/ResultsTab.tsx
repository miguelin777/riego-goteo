import { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ReferenceLine,
} from 'recharts';
import type { SystemParams, EngineResults, SensitivityPoint, MonteCarloResult } from '../types';
import { runSensitivity, getSensitivityVars, type SensitivityVar } from '../lib/sensitivity';
import { runMonteCarlo, DEFAULT_MC, type MCUncertainties } from '../lib/montecarlo';

interface Props { params: SystemParams; results: EngineResults }

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  const c: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
  };
  return (
    <div className={`rounded-lg border p-3 ${c[color] ?? c.blue}`}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-sm font-bold mt-0.5">{value}</div>
      {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function ResultsTab({ params, results: r }: Props) {
  const sensVars = getSensitivityVars();
  const [sensVar, setSensVar] = useState<SensitivityVar>('tankHeight');
  const [mcN, setMcN] = useState(500);
  const [mcResult, setMcResult] = useState<MonteCarloResult | null>(null);
  const [mcRunning, setMcRunning] = useState(false);
  const [mcUnc] = useState<MCUncertainties>({ ...DEFAULT_MC });

  const barData = r.emitters.map(e => ({
    name: `G${e.index + 1}`,
    qLh: +e.qLh.toFixed(3),
    target: +(r.qTargetPerEmitterLh).toFixed(3),
  }));

  const sensData: SensitivityPoint[] = useMemo(
    () => runSensitivity(params, sensVar),
    [params, sensVar],
  );

  const runMC = useCallback(() => {
    setMcRunning(true);
    setTimeout(() => {
      const res = runMonteCarlo(params, mcUnc, mcN);
      setMcResult(res);
      setMcRunning(false);
    }, 10);
  }, [params, mcUnc, mcN]);

  const histBins = useMemo(() => {
    if (!mcResult) return [];
    const vals = mcResult.samples.map(s => s.qRealLh);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const nBins = 20;
    const bw = (max - min) / nBins || 1;
    const bins = Array.from({ length: nBins }, (_, i) => ({
      label: (min + (i + 0.5) * bw).toFixed(2),
      count: 0,
    }));
    vals.forEach(v => {
      const idx = Math.min(Math.floor((v - min) / bw), nBins - 1);
      bins[idx].count++;
    });
    return bins;
  }, [mcResult]);

  const euHistBins = useMemo(() => {
    if (!mcResult) return [];
    const vals = mcResult.samples.map(s => s.eu);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const nBins = 20;
    const bw = (max - min) / nBins || 1;
    const bins = Array.from({ length: nBins }, (_, i) => ({
      label: (min + (i + 0.5) * bw).toFixed(1),
      count: 0,
    }));
    vals.forEach(v => {
      const idx = Math.min(Math.floor((v - min) / bw), nBins - 1);
      bins[idx].count++;
    });
    return bins;
  }, [mcResult]);

  return (
    <div className="space-y-6 text-sm">
      <h2 className="text-base font-bold text-gray-800">Resultados y Gráficas</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Demanda Total" value={`${r.totalDemandLDay.toFixed(2)} L/día`} color="blue" />
        <StatCard label="Q real" value={`${r.qRealLh.toFixed(2)} L/h`} sub={`Req: ${r.qReqLh.toFixed(2)} L/h`} color="cyan" />
        <StatCard label="Presión" value={`${r.P0kPa.toFixed(2)} kPa`} color="amber" />
        <StatCard label="EU" value={`${r.eu.toFixed(1)}%`} sub={`CV = ${r.cv.toFixed(3)}`} color="green" />
        <StatCard label="Balance"
          value={r.balance === 'ok' ? 'Consistente' : r.balance === 'over' ? 'Sobreriego' : 'Subriego'}
          sub={`${r.balancePct > 0 ? '+' : ''}${r.balancePct.toFixed(1)}%`}
          color={r.balance === 'ok' ? 'green' : 'red'} />
      </div>

      {r.balance !== 'ok' && (
        <div className={`p-3 rounded-lg border text-xs ${r.balance === 'over' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          Tiempo recomendado para cumplir demanda: <b>{r.recommendedMinutes.toFixed(1)} min</b>
          {' '}(actual: {params.irrigationMinutes} min) · Q objetivo/emisor: {r.qTargetPerEmitterLh.toFixed(3)} L/h
        </div>
      )}

      {/* Emitter bar chart */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Caudal por Emisor</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis fontSize={11} unit=" L/h" />
            <Tooltip />
            <Bar dataKey="qLh" fill="#3b82f6" name="Q real (L/h)" />
            <Bar dataKey="target" fill="#f59e0b" name="Q req (L/h)" opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sensitivity */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Análisis de Sensibilidad</h3>
          <select className="rounded border border-gray-300 px-2 py-0.5 text-xs"
            value={sensVar} onChange={e => setSensVar(e.target.value as SensitivityVar)}>
            {sensVars.map(v => <option key={v.id} value={v.id}>{v.label} ({v.unit})</option>)}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={sensData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" fontSize={10} tickFormatter={v => (+v).toFixed(2)} />
            <YAxis yAxisId="q" fontSize={10} unit=" L/h" />
            <YAxis yAxisId="eu" orientation="right" fontSize={10} unit="%" />
            <Tooltip />
            <Legend />
            <Line yAxisId="q" dataKey="qRealLh" stroke="#3b82f6" name="Q_real (L/h)" dot={false} strokeWidth={2} />
            <Line yAxisId="eu" dataKey="eu" stroke="#10b981" name="EU (%)" dot={false} strokeWidth={2} />
            <ReferenceLine yAxisId="q" y={r.qReqLh} stroke="#f59e0b" strokeDasharray="4 4" label="Q_req" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monte Carlo */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Incertidumbre (Monte Carlo)</h3>
          <input type="number" className="rounded border border-gray-300 px-2 py-0.5 text-xs w-20"
            value={mcN} min={50} max={5000} step={50} onChange={e => setMcN(parseInt(e.target.value) || 500)} />
          <span className="text-xs text-gray-500">simulaciones</span>
          <button onClick={runMC} disabled={mcRunning}
            className="rounded bg-blue-600 text-white px-3 py-1 text-xs hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
            {mcRunning ? 'Calculando…' : 'Ejecutar'}
          </button>
        </div>

        {mcResult && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">Q_real media ± σ</div>
                <div className="font-mono font-semibold">{mcResult.qMean.toFixed(2)} ± {mcResult.qStd.toFixed(2)} L/h</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">Q_real P5–P95</div>
                <div className="font-mono font-semibold">{mcResult.qP5.toFixed(2)} – {mcResult.qP95.toFixed(2)} L/h</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">EU media ± σ</div>
                <div className="font-mono font-semibold">{mcResult.euMean.toFixed(1)} ± {mcResult.euStd.toFixed(1)}%</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">EU P5–P95</div>
                <div className="font-mono font-semibold">{mcResult.euP5.toFixed(1)} – {mcResult.euP95.toFixed(1)}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-600 mb-1">Histograma Q_real (L/h)</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={histBins}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={9} interval="preserveStartEnd" />
                    <YAxis fontSize={9} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-600 mb-1">Histograma EU (%)</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={euHistBins}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={9} interval="preserveStartEnd" />
                    <YAxis fontSize={9} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
