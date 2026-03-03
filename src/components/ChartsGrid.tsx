import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Cell,
} from 'recharts';
import type { SystemParams, EngineResults } from '../types';

interface Props { params: SystemParams; results: EngineResults }

export default function ChartsGrid({ params: p, results: r }: Props) {
  const irrigH = p.irrigationMinutes / 60;

  const pressureData = r.emitters.map(e => ({
    name: `G${e.index + 1}`,
    pos: +e.position.toFixed(3),
    kPa: +(e.pLocal / 1000).toFixed(2),
  }));

  const flowData = r.emitters.map(e => ({
    name: `G${e.index + 1}`,
    qLh: +e.qLh.toFixed(3),
    target: +r.qTargetPerEmitterLh.toFixed(3),
  }));

  const lossData = [
    { name: 'Principal', value: +r.hfMain.toFixed(4), fill: '#3b82f6' },
    { name: 'Lateral', value: +r.hfLateral.toFixed(4), fill: '#10b981' },
    { name: 'Accesorios', value: +r.hmFittings.toFixed(4), fill: '#f59e0b' },
  ];

  const volData = r.emitters.map(e => ({
    name: `P${e.index + 1}`,
    volL: +(e.qLh * irrigH).toFixed(3),
    demand: +(r.demandPerPlant).toFixed(3),
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-indigo-500 rounded-full" /> Gráficas
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1: Pressure vs Distance */}
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Presión a lo largo de la lateral</h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={pressureData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="pos" fontSize={10} label={{ value: 'm', position: 'insideBottomRight', offset: -4, fontSize: 9 }} />
              <YAxis fontSize={10} unit=" kPa" />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Line dataKey="kPa" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} name="P (kPa)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 2: Flow per emitter */}
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Caudal por emisor</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={flowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} unit=" L/h" />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Bar dataKey="qLh" name="Q real" radius={[4, 4, 0, 0]}>
                {flowData.map((d, i) => {
                  const ratio = d.target > 0 ? d.qLh / d.target : 1;
                  const fill = ratio >= 0.9 && ratio <= 1.1 ? '#22c55e' : ratio >= 0.7 ? '#eab308' : '#ef4444';
                  return <Cell key={i} fill={fill} />;
                })}
              </Bar>
              <Bar dataKey="target" fill="#94a3b8" name="Q objetivo" opacity={0.3} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3: Loss breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Desglose de pérdidas (m)</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={lossData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" fontSize={10} unit=" m" />
              <YAxis dataKey="name" type="category" fontSize={10} width={70} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Bar dataKey="value" name="hf (m)" radius={[0, 4, 4, 0]}>
                {lossData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="text-[10px] text-gray-400 text-center mt-1">
            Total: {r.hfTotal.toFixed(4)} m ({(r.hfTotal / Math.max(p.tankHeight, 0.01) * 100).toFixed(1)}% de h)
          </div>
        </div>

        {/* 4: Volume per plant */}
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Volumen por planta (sesión de riego)</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={volData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} unit=" L" />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Bar dataKey="volL" fill="#8b5cf6" name="Entregado (L)" radius={[4, 4, 0, 0]} />
              <ReferenceLine y={r.demandPerPlant} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Demanda', fontSize: 9, fill: '#ef4444' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
