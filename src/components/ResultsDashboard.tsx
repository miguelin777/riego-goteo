import type { SystemParams, EngineResults } from '../types';
import { tankEnough, diagnosisRecommendations } from '../lib/helpers';

interface Props { params: SystemParams; results: EngineResults }

function KPI({ label, value, sub, icon, status }: {
  label: string; value: string; sub?: string; icon: string;
  status?: 'good' | 'warn' | 'bad' | 'neutral';
}) {
  const border = status === 'good' ? 'border-green-200 bg-green-50'
    : status === 'bad' ? 'border-red-200 bg-red-50'
    : status === 'warn' ? 'border-amber-200 bg-amber-50'
    : 'border-gray-200 bg-gray-50';
  return (
    <div className={`rounded-xl border-2 p-3 ${border} transition-colors`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{icon}</span>
        <div className="min-w-0">
          <div className="text-[11px] text-gray-500 leading-tight">{label}</div>
          <div className="text-base font-bold text-gray-800 mt-0.5 truncate">{value}</div>
          {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

export default function ResultsDashboard({ params: p, results: r }: Props) {
  const flows = r.emitters.map(e => e.qLh);
  const pressures = r.emitters.map(e => e.pLocal / 1000);
  const qMin = flows.length > 0 ? Math.min(...flows) : 0;
  const qMax = flows.length > 0 ? Math.max(...flows) : 0;
  const pMin = pressures.length > 0 ? Math.min(...pressures) : 0;
  const tank = tankEnough(p, r);
  const recs = diagnosisRecommendations(r);
  const totalVol = r.emitters.reduce((s, e) => s + e.volumeLDay, 0);

  const diagStatus = r.balance === 'ok' ? 'good' : 'bad';
  const diagLabel = r.balance === 'ok' ? '✅ Consistente' : r.balance === 'over' ? '⚠️ Sobreriego' : '🔻 Subriego';
  const euStatus = r.eu >= 90 ? 'good' : r.eu >= 80 ? 'warn' : 'bad';

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-blue-600 rounded-full" /> Indicadores Clave
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        <KPI icon="💧" label="Caudal total real" value={`${r.qRealLh.toFixed(2)} L/h`}
          sub={`Requerido: ${r.qReqLh.toFixed(2)} L/h`} status="neutral" />
        <KPI icon="📊" label="Uniformidad (EU)" value={`${r.eu.toFixed(1)}%`}
          sub={r.eu >= 90 ? 'Excelente' : r.eu >= 80 ? 'Buena' : r.eu >= 70 ? 'Aceptable' : 'Pobre'}
          status={euStatus} />
        <KPI icon="⚡" label="Presión mínima" value={`${pMin.toFixed(2)} kPa`}
          sub={`Máx: ${(r.P0kPa).toFixed(2)} kPa`} status={pMin > 0.5 ? 'good' : 'warn'} />
        <KPI icon="🔀" label="Rango de caudal" value={`${qMin.toFixed(2)} – ${qMax.toFixed(2)}`}
          sub="L/h (mín – máx)" status="neutral" />
        <KPI icon={r.balance === 'ok' ? '✅' : '⚠️'} label="Diagnóstico"
          value={diagLabel} sub={`${r.balancePct > 0 ? '+' : ''}${r.balancePct.toFixed(1)}% vs requerido`}
          status={diagStatus} />
        <KPI icon="⏱️" label="Tiempo recomendado" value={`${r.recommendedMinutes.toFixed(0)} min`}
          sub={`Configurado: ${p.irrigationMinutes} min`}
          status={Math.abs(r.recommendedMinutes - p.irrigationMinutes) < 5 ? 'good' : 'warn'} />
        <KPI icon="🪣" label="Vol. entregado / sesión" value={`${totalVol.toFixed(2)} L`}
          sub={`Demanda: ${r.totalDemandLDay.toFixed(2)} L/día`} status="neutral" />
        <KPI icon={tank.enough ? '✅' : '❌'} label="¿Alcanza el tanque?"
          value={tank.enough ? 'Sí' : 'No'}
          sub={`Necesita ${tank.needed} L (${tank.pct}% del tanque)`}
          status={tank.enough ? 'good' : 'bad'} />
      </div>

      {/* Diagnosis */}
      {recs.length > 0 && (
        <div className={`rounded-xl p-3.5 border-2 text-xs ${r.balance === 'ok' && r.eu >= 80 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="font-bold text-gray-700 mb-1.5">💡 Recomendaciones:</div>
          <ul className="space-y-1 text-gray-600">
            {recs.map((rec, i) => <li key={i}>• {rec}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
