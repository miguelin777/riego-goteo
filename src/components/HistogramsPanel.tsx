import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { EngineResults } from '../types';
import { buildHistBins, stats } from '../lib/helpers';

interface Props { results: EngineResults }

function Hist({ title, values, unit, color }: { title: string; values: number[]; unit: string; color: string }) {
  const nBins = values.length < 8 ? Math.max(values.length, 2) : 8;
  const bins = buildHistBins(values, nBins);
  const s = stats(values);
  const fewEmitters = values.length < 8;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <h4 className="text-xs font-semibold text-gray-600 mb-1">{title}</h4>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={bins}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" fontSize={8} interval="preserveStartEnd" />
          <YAxis fontSize={9} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
          <Bar dataKey="count" fill={color} name="Frecuencia" radius={[3, 3, 0, 0]} />
          <ReferenceLine x={s.mean.toFixed(2)} stroke="#1e40af" strokeDasharray="4 2" />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-500 mt-1">
        <span>Media: <b>{s.mean.toFixed(2)}</b> {unit}</span>
        <span>Mín: <b>{s.min.toFixed(2)}</b></span>
        <span>Máx: <b>{s.max.toFixed(2)}</b></span>
        <span>P10–P90: <b>{s.p10.toFixed(2)}–{s.p90.toFixed(2)}</b></span>
      </div>

      {fewEmitters && (
        <div className="text-[10px] text-amber-600 mt-1">
          ⚠ Pocos emisores ({values.length}) — distribución aproximada.
          {s.max - s.min < 0.01 * s.mean ? ' Muy estrecha = buena uniformidad.' : ''}
        </div>
      )}

      <div className="text-[10px] text-gray-400 mt-0.5">
        {s.std < 0.05 * s.mean ? '→ Distribución estrecha = sistema parejo.'
          : s.std < 0.15 * s.mean ? '→ Distribución moderada, aceptable.'
          : '→ Distribución amplia: hay variabilidad alta.'}
      </div>
    </div>
  );
}

export default function HistogramsPanel({ results: r }: Props) {
  const flows = r.emitters.map(e => e.qLh);
  const pressures = r.emitters.map(e => e.pLocal / 1000);
  const volumes = r.emitters.map(e => e.volumeLDay);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-purple-500 rounded-full" /> Histogramas por Emisor
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Hist title="Caudal (q_i)" values={flows} unit="L/h" color="#3b82f6" />
        <Hist title="Presión en emisor (P_i)" values={pressures} unit="kPa" color="#10b981" />
        <Hist title="Volumen por planta (V_i)" values={volumes} unit="L/día" color="#8b5cf6" />
      </div>
    </div>
  );
}
