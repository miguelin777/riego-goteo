import type { SystemParams, EngineResults } from '../types';

interface Props { params: SystemParams; results: EngineResults }

function FB({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 rounded-lg p-3 space-y-1">
      <h4 className="text-sm font-semibold text-blue-800">{title}</h4>
      <div className="text-xs text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}

function Row({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  const d = typeof value === 'number' ? value.toFixed(4) : value;
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-1.5 pr-3 text-gray-600">{label}</td>
      <td className="py-1.5 font-mono font-semibold text-gray-900">{d}</td>
      <td className="py-1.5 pl-1 text-gray-400 text-xs">{unit}</td>
    </tr>
  );
}

const f = (n: number, d = 4) => n.toFixed(d);

export default function CalcsTab({ params: p, results: r }: Props) {
  const irrigH = p.irrigationMinutes / 60;
  const area = p.areaLength * p.areaWidth;

  return (
    <div className="space-y-4 text-sm">
      <h2 className="text-base font-bold text-gray-800">Cálculos Hidráulicos (paso a paso)</h2>

      {/* 1 Demand */}
      <FB title="1. Demanda de Agua del Cultivo">
        {p.demandMode === 'etc' ? <>
          <p><b>ETc</b> = Kc × ETo = {p.kc} × {p.eto} = <b>{f(r.etc, 2)} mm/día</b></p>
          <p>Área = {p.areaLength} × {p.areaWidth} = {f(area, 2)} m²</p>
          <p>Demanda total = {f(r.etc, 2)} × {f(area, 2)} = <b>{f(r.totalDemandLDay, 2)} L/día</b></p>
          <p>Demanda/planta = {f(r.totalDemandLDay, 2)} / {p.plantCount} = <b>{f(r.demandPerPlant, 3)} L/planta·día</b></p>
        </> : <>
          <p>Modo: demanda fija = {p.demandPerPlant} L/planta·día</p>
          <p>Total = {p.demandPerPlant} × {p.plantCount} = <b>{f(r.totalDemandLDay, 2)} L/día</b></p>
        </>}
      </FB>

      {/* 2 Q_req */}
      <FB title="2. Caudal Requerido (Q_req)">
        <p>Tiempo de riego = {p.irrigationMinutes} min = {f(irrigH, 3)} h</p>
        <p>Q_req = {f(r.totalDemandLDay, 2)} L/día ÷ {f(irrigH, 3)} h = <b>{f(r.qReqLh, 3)} L/h</b></p>
        <p>Q_req por emisor = {f(r.qTargetPerEmitterLh, 3)} L/h</p>
      </FB>

      {/* 3 Pressure */}
      <FB title="3. Presión por Gravedad">
        <p>P₀ = ρ · g · h = {p.rho} × {p.g} × {p.tankHeight}</p>
        <p>P₀ = <b>{f(r.P0Pa, 1)} Pa</b> = <b>{f(r.P0kPa, 3)} kPa</b></p>
        <p className="text-gray-500">Viscosidad μ({p.temperature} °C) = {(r.viscosity * 1000).toFixed(4)} × 10⁻³ Pa·s</p>
      </FB>

      {/* 4 Continuity */}
      <FB title="4. Continuidad Q = A · V">
        <p><b>Tub. principal</b> (Ø {p.mainPipe.diameterMm} mm, {p.mainPipe.material}):</p>
        <p>A = π(D/2)² = {f(Math.PI * (p.mainPipe.diameterMm / 2000) ** 2, 6)} m²</p>
        <p>V_main = Q_real / A = <b>{f(r.vMain, 4)} m/s</b></p>
        <p className="mt-1"><b>Tub. lateral</b> (Ø {p.lateralPipe.diameterMm} mm, {p.lateralPipe.material}):</p>
        <p>V_lateral (entrada) = <b>{f(r.vLateralInlet, 4)} m/s</b></p>
      </FB>

      {/* 5 Bernoulli */}
      <FB title="5. Ecuación de Bernoulli Simplificada">
        <p className="font-mono text-xs bg-white rounded p-2 my-1 border border-blue-200">
          P₁/ρg + V₁²/2g + z₁ = P₂/ρg + V₂²/2g + z₂ + h_L
        </p>
        <p><b>Sin pérdidas:</b> V = √(2·g·h) = √(2 × {p.g} × {p.tankHeight}) = <b>{f(r.vBernoulli, 3)} m/s</b></p>
        <p><b>Con pérdidas:</b> V_eff = √(2·g·(h − hf)) = <b>{f(r.vWithLosses, 3)} m/s</b></p>
      </FB>

      {/* 6 Losses */}
      <FB title="6. Pérdidas de Carga (Darcy-Weisbach + accesorios)">
        <p>Re_main = ρ·V·D/μ = <b>{f(r.reMain, 0)}</b>
          {r.reMain < 2300 ? ' (laminar)' : ' (turbulento)'}
        </p>
        <p>f_main = <b>{f(r.fMain, 5)}</b> → hf_main = f·(L/D)·V²/(2g) = <b>{f(r.hfMain, 4)} m</b></p>
        <p>Re_lateral = <b>{f(r.reLateral, 0)}</b> · f_lateral = <b>{f(r.fLateral, 5)}</b></p>
        <p>Pérdidas accesorios (hm) = <b>{f(r.hmFittings, 4)} m</b>
          {p.lossMode === 'simplified' && ' (est. 15% de hf_main)'}
        </p>
        <p>hf total ≈ <b>{f(r.hfTotal, 4)} m</b></p>
      </FB>

      {/* 7 Emitter table */}
      <FB title="7. Tabla por Emisor">
        <table className="w-full mt-1 text-xs">
          <thead>
            <tr className="border-b border-blue-200">
              <th className="text-left py-1">Emisor</th>
              <th className="text-left py-1">Pos (m)</th>
              <th className="text-left py-1">h_local (m)</th>
              <th className="text-left py-1">P_local (kPa)</th>
              <th className="text-left py-1">q (L/h)</th>
              <th className="text-left py-1">Vol (L/día)</th>
            </tr>
          </thead>
          <tbody>
            {r.emitters.map((e, i) => (
              <tr key={i} className="border-b border-blue-100">
                <td className="py-0.5">G{i + 1}</td>
                <td className="py-0.5 font-mono">{f(e.position, 3)}</td>
                <td className="py-0.5 font-mono">{f(e.hLocal, 4)}</td>
                <td className="py-0.5 font-mono">{f(e.pLocal / 1000, 3)}</td>
                <td className="py-0.5 font-mono font-semibold">{f(e.qLh, 3)}</td>
                <td className="py-0.5 font-mono">{f(e.volumeLDay, 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </FB>

      {/* 8 Uniformity */}
      <FB title="8. Uniformidad y CV">
        <p>EU = q_min / q_prom × 100 = <b>{f(r.eu, 1)}%</b></p>
        <p>CV = σ / q̄ = <b>{f(r.cv, 4)}</b></p>
        <p className="text-gray-500">
          {r.eu >= 90 ? 'Excelente (≥90%)' : r.eu >= 80 ? 'Buena (80–90%)' : r.eu >= 70 ? 'Aceptable (70–80%)' : 'Pobre (<70%)'}
        </p>
      </FB>

      {/* 9 Balance */}
      <FB title="9. Balance Hídrico">
        <p>Q_req = <b>{f(r.qReqLh, 3)} L/h</b></p>
        <p>Q_real = <b>{f(r.qRealLh, 3)} L/h</b></p>
        <p>Vol. entregado/día = {f(r.emitters.reduce((s, e) => s + e.volumeLDay, 0), 2)} L</p>
        <p>Vol. requerido/día = {f(r.totalDemandLDay, 2)} L</p>
        <p className={`font-semibold ${r.balance === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
          Diagnóstico: {r.balance === 'ok' ? 'Consistente' : r.balance === 'over' ? 'Sobreriego' : 'Subriego'}
          {' '}({r.balancePct > 0 ? '+' : ''}{f(r.balancePct, 1)}%)
        </p>
        {r.balance !== 'ok' && (
          <p>Tiempo recomendado para cumplir demanda: <b>{f(r.recommendedMinutes, 1)} min</b></p>
        )}
      </FB>

      {/* Summary table */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Resumen de Resultados</h4>
        <table className="w-full text-xs">
          <tbody>
            <Row label="Demanda total" value={f(r.totalDemandLDay, 2)} unit="L/día" />
            <Row label="Q requerido" value={f(r.qReqLh, 3)} unit="L/h" />
            <Row label="Q real" value={f(r.qRealLh, 3)} unit="L/h" />
            <Row label="Presión tanque" value={f(r.P0kPa, 3)} unit="kPa" />
            <Row label="V Bernoulli ideal" value={f(r.vBernoulli, 3)} unit="m/s" />
            <Row label="V con pérdidas" value={f(r.vWithLosses, 3)} unit="m/s" />
            <Row label="hf total" value={f(r.hfTotal, 4)} unit="m" />
            <Row label="EU" value={f(r.eu, 1)} unit="%" />
            <Row label="CV" value={f(r.cv, 4)} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
