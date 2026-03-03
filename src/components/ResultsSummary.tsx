'use client';

import type { SystemParams, HydraulicResults } from '@/lib/types';

interface Props { params: SystemParams; results: HydraulicResults; }

function Row({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="py-1.5 pr-3 text-slate-600 text-xs">{label}</td>
      <td className="py-1.5 font-mono font-semibold text-slate-900 text-sm">{value}</td>
      <td className="py-1.5 pl-1.5 text-slate-400 text-[11px]">{unit}</td>
    </tr>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <tr><td colSpan={3} className="pt-3 pb-1">
      <span className="text-xs font-bold text-blue-700">{children}</span>
    </td></tr>
  );
}

export default function ResultsSummary({ params: p, results: r }: Props) {
  const fmt = (n: number, d = 4) => n.toFixed(d);

  // Observación técnica automática
  let obs = '';
  if (r.pressurekPa < 5) obs = 'Presión muy baja (<5 kPa). Se recomienda elevar el tanque o usar goteros de baja presión.';
  else if (r.pressurekPa < 10) obs = 'Presión baja. Verificar que los goteros funcionen a esta presión.';
  else obs = 'Presión adecuada para goteros de baja presión.';

  return (
    <div className="space-y-4 text-sm">
      <h2 className="text-sm sm:text-base font-bold text-slate-800">Resumen de Resultados</h2>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[400px]">
          <tbody>
            <SectionTitle>Demanda hídrica</SectionTitle>
            <Row label="Área de cultivo" value={fmt(r.area, 2)} unit="m²" />
            {p.useDemandETc && <Row label="ETc (Kc × ETo)" value={fmt(r.etc, 2)} unit="mm/día = L/m²·día" />}
            <Row label="Demanda total diaria" value={fmt(r.totalDemandLDay, 2)} unit="L/día" />
            <Row label="Demanda por planta" value={fmt(r.demandPerPlantCalc, 3)} unit="L/planta·día" />

            <SectionTitle>Caudales</SectionTitle>
            <Row label="Caudal por planta" value={`${fmt(r.qPlantLh, 3)} L/h = ${fmt(r.qPlantMlMin, 1)} mL/min`} />
            <Row label="Caudal total" value={`${fmt(r.qTotalLh, 3)} L/h = ${fmt(r.qTotalMlMin, 1)} mL/min`} />

            <SectionTitle>Presión por gravedad</SectionTitle>
            <Row label="Presión" value={fmt(r.pressurePa, 1)} unit="Pa" />
            <Row label="" value={fmt(r.pressurekPa, 3)} unit="kPa" />
            <Row label="" value={fmt(r.pressureBar, 5)} unit="bar" />
            <Row label="" value={fmt(r.pressureMca, 2)} unit="mca" />

            <SectionTitle>Bernoulli</SectionTitle>
            <Row label="Velocidad ideal (sin pérdidas)" value={fmt(r.velocityIdeal, 4)} unit="m/s" />
            {p.considerFriction && <>
              <Row label="Pérdida — principal" value={fmt(r.headLossMain, 5)} unit="m" />
              <Row label="Pérdida — lateral" value={fmt(r.headLossLateral, 5)} unit="m" />
              <Row label="Pérdida — accesorios" value={fmt(r.headLossAccessories, 4)} unit="m" />
              <Row label="Pérdida total h_L" value={fmt(r.headLossTotal, 5)} unit="m" />
              <Row label="Velocidad real (con pérdidas)" value={fmt(r.velocityReal, 4)} unit="m/s" />
            </>}

            <SectionTitle>Uniformidad</SectionTitle>
            <Row label="EU (q_min/q_prom)" value={fmt(r.uniformity, 1)} unit="%" />

            <SectionTitle>Caudal por emisor</SectionTitle>
            {r.emitters.map((e, i) => (
              <Row key={i} label={`Gotero ${i + 1} (x=${e.position.toFixed(3)} m)`}
                value={`${e.flow.toFixed(3)} L/h = ${e.flowMlMin.toFixed(1)} mL/min`}
                unit={`h_local=${e.localHead.toFixed(4)} m`} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Observación técnica */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
        <h4 className="text-xs font-bold text-indigo-800 mb-1">Observación técnica</h4>
        <p className="text-xs text-indigo-700">{obs}</p>
      </div>
    </div>
  );
}
