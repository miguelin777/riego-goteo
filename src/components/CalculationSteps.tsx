'use client';

import type { SystemParams, HydraulicResults } from '@/lib/types';

interface Props { params: SystemParams; results: HydraulicResults; }

function F({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-blue-50/70 rounded-lg p-3.5 space-y-1.5">
      <h4 className="text-sm font-bold text-blue-800">{title}</h4>
      <div className="text-xs text-slate-700 leading-relaxed space-y-1">{children}</div>
    </div>
  );
}

function Eq({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[10px] sm:text-[11px] bg-white rounded px-2 py-1 border border-blue-200 my-1 overflow-x-auto whitespace-nowrap">{children}</p>;
}

export default function CalculationSteps({ params: p, results: r }: Props) {
  const fmt = (n: number, d = 4) => n.toFixed(d);
  const irrH = p.irrigationMinutes / 60;

  return (
    <div className="space-y-4 text-sm">
      <h2 className="text-sm sm:text-base font-bold text-slate-800">Pasos de Cálculo Hidráulico</h2>

      {/* 1. Demanda */}
      <F title="1. Demanda de agua del cultivo">
        {p.useDemandETc ? (<>
          <Eq>ETc = Kc × ETo = {p.kc} × {p.eto} = {fmt(r.etc, 2)} mm/día</Eq>
          <p>Conversión: 1 mm/día = 1 L/m²·día → ETc = {fmt(r.etc, 2)} L/m²·día</p>
          <Eq>Área = {p.areaLength} × {p.areaWidth} = {fmt(r.area, 2)} m²</Eq>
          <Eq>Demanda total = ETc × Área = {fmt(r.etc, 2)} × {fmt(r.area, 2)} = {fmt(r.totalDemandLDay, 3)} L/día</Eq>
          <Eq>Demanda/planta = {fmt(r.totalDemandLDay, 3)} / {p.plantCount} = {fmt(r.demandPerPlantCalc, 3)} L/planta·día</Eq>
        </>) : (<>
          <p><strong>Modo:</strong> Demanda fija = {p.demandPerPlant} L/planta·día</p>
          <Eq>Demanda total = {p.demandPerPlant} × {p.plantCount} = {fmt(r.totalDemandLDay, 2)} L/día</Eq>
        </>)}
      </F>

      {/* 2. Caudal */}
      <F title="2. Caudal requerido por planta">
        <Eq>t_riego = {p.irrigationMinutes} min = {fmt(irrH, 4)} h</Eq>
        <Eq>q_planta = {fmt(r.demandPerPlantCalc, 3)} L / {fmt(irrH, 4)} h = {fmt(r.qPlantLh, 4)} L/h</Eq>
        <Eq>q_planta = {fmt(r.qPlantLh, 4)} × 1000/60 = {fmt(r.qPlantMlMin, 2)} mL/min</Eq>
      </F>

      {/* 3. Caudal total */}
      <F title="3. Caudal total del sistema">
        <Eq>Q_total = q_planta × n = {fmt(r.qPlantLh, 4)} × {p.plantCount} = {fmt(r.qTotalLh, 4)} L/h = {fmt(r.qTotalMlMin, 2)} mL/min</Eq>
      </F>

      {/* 4. Presión */}
      <F title="4. Presión por gravedad">
        <Eq>P = ρ · g · h = {p.rho} × {p.g} × {p.tankHeight} = {fmt(r.pressurePa, 1)} Pa</Eq>
        <Eq>P = {fmt(r.pressurekPa, 3)} kPa = {fmt(r.pressureBar, 5)} bar = {fmt(r.pressureMca, 2)} mca</Eq>
      </F>

      {/* 5. Bernoulli */}
      <F title="5. Ecuación de Bernoulli simplificada">
        <Eq>(P₁/ρg) + (V₁²/2g) + z₁ = (P₂/ρg) + (V₂²/2g) + z₂ + h_L</Eq>
        <p><strong>Supuestos:</strong></p>
        <ul className="list-disc ml-4 space-y-0.5">
          <li>P₁ ≈ P₂ ≈ P_atm (ambos puntos abiertos a la atmósfera)</li>
          <li>V₁ ≈ 0 (superficie del tanque prácticamente estática)</li>
          <li>z₁ − z₂ = h = {p.tankHeight} m</li>
        </ul>
        <p className="mt-1"><strong>Sin pérdidas:</strong></p>
        <Eq>h = V₂²/2g → V₂ = √(2·g·h) = √(2×{p.g}×{p.tankHeight}) = {fmt(r.velocityIdeal, 4)} m/s</Eq>
        {p.considerFriction && (<>
          <p className="mt-1"><strong>Con pérdidas (Darcy-Weisbach + accesorios):</strong></p>
          <Eq>h_L = f·(L/D)·(V²/2g), con f = f(Re)</Eq>
          <p>Pérdida en tubería principal: h_L,main = {fmt(r.headLossMain, 5)} m</p>
          <p>Pérdida en tubería lateral: h_L,lat = {fmt(r.headLossLateral, 5)} m (segmento por segmento con flujo decreciente)</p>
          <p>Pérdida por accesorios: h_L,acc = {fmt(r.headLossAccessories, 4)} m</p>
          <Eq>h_L,total = {fmt(r.headLossMain, 5)} + {fmt(r.headLossLateral, 5)} + {fmt(r.headLossAccessories, 4)} = {fmt(r.headLossTotal, 5)} m</Eq>
          <Eq>h_eff = h − h_L = {p.tankHeight} − {fmt(r.headLossTotal, 5)} = {fmt(p.tankHeight - r.headLossTotal, 5)} m</Eq>
          <Eq>V₂ = √(2·g·h_eff) = {fmt(r.velocityReal, 4)} m/s</Eq>
        </>)}
      </F>

      {/* 6. Ecuación de orificio */}
      <F title="6. Ecuación de orificio (caudal real por emisor)">
        <Eq>q_emisor = Cd · A_orificio · √(2·g·h_local)</Eq>
        <p>Cd = {p.cd} (coeficiente de descarga)</p>
        <p>A_orificio = π·(d/2)² = π·({p.emitterDiameterMm/2} mm)² = {(Math.PI * Math.pow(p.emitterDiameterMm / 2000, 2) * 1e6).toFixed(4)} mm² = {(Math.PI * Math.pow(p.emitterDiameterMm / 2000, 2)).toExponential(3)} m²</p>
        <table className="w-full mt-2 text-xs border-collapse">
          <thead>
            <tr className="border-b border-blue-200">
              <th className="text-left py-1 pr-2">Emisor</th>
              <th className="text-left py-1">Posición</th>
              <th className="text-left py-1">h_local (m)</th>
              <th className="text-left py-1">q (L/h)</th>
              <th className="text-left py-1">q (mL/min)</th>
            </tr>
          </thead>
          <tbody>
            {r.emitters.map((e, i) => (
              <tr key={i} className="border-b border-blue-100">
                <td className="py-0.5 font-semibold">Gotero {i + 1}</td>
                <td className="py-0.5 font-mono">{e.position.toFixed(3)} m</td>
                <td className="py-0.5 font-mono">{e.localHead.toFixed(4)}</td>
                <td className="py-0.5 font-mono font-bold">{e.flow.toFixed(4)}</td>
                <td className="py-0.5 font-mono">{e.flowMlMin.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </F>

      {/* 7. Uniformidad */}
      <F title="7. Uniformidad de distribución">
        <Eq>EU = (q_min / q_prom) × 100</Eq>
        {r.emitters.length > 0 && (() => {
          const flows = r.emitters.map(e => e.flow);
          const qMin = Math.min(...flows);
          const qAvg = flows.reduce((a, b) => a + b, 0) / flows.length;
          return <>
            <p>q_min = {qMin.toFixed(4)} L/h, q_prom = {qAvg.toFixed(4)} L/h</p>
            <Eq>EU = ({qMin.toFixed(4)} / {qAvg.toFixed(4)}) × 100 = {fmt(r.uniformity, 1)}%</Eq>
            <p className="mt-1">
              {r.uniformity >= 90 ? 'Uniformidad excelente (≥ 90%).' :
               r.uniformity >= 80 ? 'Uniformidad buena (80–90%).' :
               'Uniformidad baja (< 80%). Considere aumentar el diámetro lateral o reducir su longitud.'}
            </p>
          </>;
        })()}
      </F>

      {/* Supuestos */}
      <div className="bg-amber-50 rounded-lg border border-amber-200 p-3.5">
        <h4 className="text-sm font-bold text-amber-800 mb-1">Supuestos del modelo</h4>
        <ul className="list-disc ml-4 text-xs text-slate-700 space-y-0.5">
          <li>Flujo estacionario (régimen permanente).</li>
          <li>Fluido incompresible (agua, ρ = {p.rho} kg/m³).</li>
          <li>Viscosidad cinemática ν ≈ 1.004×10⁻⁶ m²/s (20 °C).</li>
          <li>Factor de fricción según Reynolds: Poiseuille (laminar) / Blasius (turbulento).</li>
          <li>Coeficiente de descarga del orificio Cd = {p.cd}.</li>
          <li>Pérdidas menores en accesorios estimadas como h_L = {p.hL} m.</li>
          <li>El tanque es suficientemente grande para asumir V₁ ≈ 0.</li>
          <li>Presión atmosférica en superficie del tanque y en la salida del gotero.</li>
        </ul>
      </div>
    </div>
  );
}
