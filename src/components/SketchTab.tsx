import type { SystemParams, EngineResults } from '../types';

interface Props { params: SystemParams; results: EngineResults }

export default function SketchTab({ params: p, results: r }: Props) {
  return (
    <div className="space-y-4 text-sm">
      <h2 className="text-base font-bold text-gray-800">Bosquejo de Diseño del Simulador</h2>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-amber-800">1. Variables de Entrada</h3>
        <ul className="list-disc ml-5 text-xs text-gray-700 space-y-0.5">
          <li>Altura del tanque (h): {p.tankHeight} m · Volumen: {p.tankVolume} L</li>
          <li>Tub. principal: Ø {p.mainPipe.diameterMm} mm × {p.mainPipe.length} m ({p.mainPipe.material})</li>
          <li>Tub. lateral: Ø {p.lateralPipe.diameterMm} mm × {p.lateralPipe.length} m ({p.lateralPipe.material})</li>
          <li>Nº plantas: {p.plantCount} · Posiciones: [{p.plantPositions.slice(0, p.plantCount).map(v => v.toFixed(3)).join(', ')}] m</li>
          <li>Emisor: {p.emitter.type === 'orifice' ? `orificio Ø ${p.emitter.orificeDiameterMm} mm, Cd=${p.emitter.cd}` : `comercial k=${p.emitter.commercialK}, x=${p.emitter.commercialX}`} · Obstrucción: {p.emitter.obstructionPct}%</li>
          <li>Demanda: {p.demandMode === 'etc' ? `ETc = ${p.kc} × ${p.eto} = ${r.etc.toFixed(2)} mm/día` : `${p.demandPerPlant} L/planta·día`} · Tiempo riego: {p.irrigationMinutes} min</li>
          <li>ρ = {p.rho} kg/m³ · g = {p.g} m/s² · T = {p.temperature} °C · μ = {(r.viscosity * 1000).toFixed(4)} × 10⁻³ Pa·s</li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-blue-800">2. Variables de Salida (Calculadas)</h3>
        <ul className="list-disc ml-5 text-xs text-gray-700 space-y-0.5">
          <li>Demanda total: {r.totalDemandLDay.toFixed(2)} L/día</li>
          <li>Q requerido: {r.qReqLh.toFixed(3)} L/h</li>
          <li>Q real (sum. emisores): {r.qRealLh.toFixed(3)} L/h ({r.qRealMlMin.toFixed(2)} mL/min)</li>
          <li>Presión: {r.P0kPa.toFixed(3)} kPa ({r.P0Pa.toFixed(1)} Pa)</li>
          <li>Velocidad Bernoulli: {r.vBernoulli.toFixed(3)} m/s (con pérdidas: {r.vWithLosses.toFixed(3)} m/s)</li>
          <li>hf total: {r.hfTotal.toFixed(4)} m (principal: {r.hfMain.toFixed(4)} m + accesorios: {r.hmFittings.toFixed(4)} m)</li>
          <li>EU = {r.eu.toFixed(1)}% · CV = {r.cv.toFixed(4)}</li>
          <li>Balance: {r.balance === 'ok' ? 'Consistente' : r.balance === 'over' ? 'Sobreriego' : 'Subriego'} ({r.balancePct > 0 ? '+' : ''}{r.balancePct.toFixed(1)}%)</li>
        </ul>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-green-800">3. Variables a Medir Experimentalmente</h3>
        <ul className="list-disc ml-5 text-xs text-gray-700 space-y-0.5">
          <li><b>Volumen recolectado por emisor</b> (mL) — recipientes graduados</li>
          <li><b>Tiempo de recolección</b> (s o min) — cronómetro</li>
          <li><b>Caudal real por emisor</b> (mL/min) = Volumen / Tiempo</li>
          <li><b>Uniformidad real</b> (%) = (Q_min / Q_promedio) × 100</li>
          <li><b>Presión</b> — columna de agua medida</li>
          <li><b>Temperatura del agua</b> (°C) — termómetro</li>
        </ul>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-purple-800">4. Procedimiento de Prueba</h3>
        <ol className="list-decimal ml-5 text-xs text-gray-700 space-y-1">
          <li>Armar el sistema según el esquema técnico.</li>
          <li>Llenar el tanque con agua limpia ({p.tankVolume} L).</li>
          <li>Colocar recipientes graduados debajo de cada gotero.</li>
          <li>Abrir la válvula y esperar estabilización (~1 min).</li>
          <li>Cronometrar un período de 5 minutos.</li>
          <li>Medir el volumen recolectado en cada recipiente.</li>
          <li>Calcular caudal real = volumen / tiempo para cada emisor.</li>
          <li>Repetir 3 veces y calcular promedio.</li>
          <li>Comparar con valores teóricos del simulador.</li>
          <li>Calcular la uniformidad real y compararla con EU = {r.eu.toFixed(1)}%.</li>
        </ol>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-gray-800">5. Supuestos del Modelo</h3>
        <ul className="list-disc ml-5 text-xs text-gray-700 space-y-0.5">
          <li>Flujo estacionario (nivel constante si tankMode = constant).</li>
          <li>Tuberías lisas; rugosidad ε según material (PVC ≈ 0.0015 mm, PE ≈ 0.007 mm).</li>
          <li>Factor de fricción: Darcy-Weisbach con Swamee-Jain (turbulento) o 64/Re (laminar).</li>
          <li>Pérdidas menores: {p.lossMode === 'simplified' ? '15% de hf_main (simplificado)' : 'coeficientes K individuales'}.</li>
          <li>Modelo emisor: {p.emitter.type === 'orifice' ? 'q = Cd·A·√(2gh), con A y Cd reducidos por obstrucción' : 'q = k·P^x (gotero comercial)'}.</li>
          <li>Iteración 4 pasadas para convergencia de Q (lateral segmentada).</li>
        </ul>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h3 className="font-semibold text-indigo-800 mb-2">6. Diagrama de Flujo del Simulador</h3>
        <div className="flex flex-col items-center gap-1 text-xs text-gray-700">
          {['Ingreso de parámetros', 'Cálculo de demanda (ETc o fija)', 'Presión P₀ = ρgh',
            'Continuidad Q = A·V', 'Bernoulli + pérdidas (Darcy-Weisbach)', 'Iteración lateral segmentada',
            'q_i por emisor → Q_real', 'EU, CV, balance Q_real vs Q_req',
            'Visualización + gráficas + Monte Carlo',
          ].map((step, i, arr) => (
            <div key={i} className="flex flex-col items-center">
              <div className="bg-white border border-indigo-300 rounded px-3 py-1 font-semibold text-center">{step}</div>
              {i < arr.length - 1 && <span className="text-indigo-400">↓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
