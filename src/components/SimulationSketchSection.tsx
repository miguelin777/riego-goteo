'use client';

import type { SystemParams } from '@/lib/types';

export default function SimulationSketchSection({ params: p }: { params: SystemParams }) {
  return (
    <div className="space-y-4 text-sm">
      <h2 className="text-sm sm:text-base font-bold text-slate-800">Bosquejo de Diseño del Simulador</h2>

      <Block color="amber" title="1. Variables de entrada">
        <ul className="list-disc ml-5 text-xs text-slate-700 space-y-0.5">
          <li>Altura útil del tanque (h): {p.tankHeight} m</li>
          <li>Volumen del tanque: {p.tankVolume} L</li>
          <li>Diámetro tubería principal: {p.mainPipeDiameterMm} mm</li>
          <li>Diámetro tubería lateral: {p.lateralPipeDiameterMm} mm</li>
          <li>Longitud principal: {p.mainPipeLength} m · lateral: {p.lateralPipeLength} m</li>
          <li>Número de plantas: {p.plantCount}</li>
          <li>Diámetro orificio del gotero: {p.emitterDiameterMm} mm</li>
          <li>Cd: {p.cd}</li>
          <li>ETo: {p.eto} mm/día · Kc: {p.kc}</li>
          <li>Tiempo de riego: {p.irrigationMinutes} min/día</li>
          <li>ρ = {p.rho} kg/m³ · g = {p.g} m/s²</li>
          <li>hL accesorios: {p.hL} m</li>
        </ul>
      </Block>

      <Block color="blue" title="2. Variables de salida (calculadas)">
        <ul className="list-disc ml-5 text-xs text-slate-700 space-y-0.5">
          <li>Demanda total de agua (L/día)</li>
          <li>Caudal requerido por planta (L/h y mL/min)</li>
          <li>Caudal total del sistema (L/h)</li>
          <li>Presión por gravedad (Pa, kPa, bar)</li>
          <li>Velocidad en la salida (m/s) — Bernoulli</li>
          <li>Pérdida de carga (m) — Darcy-Weisbach</li>
          <li>Caudal real por emisor (L/h) — ecuación de orificio</li>
          <li>Uniformidad de distribución (%)</li>
        </ul>
      </Block>

      <Block color="green" title="3. Variables a medir experimentalmente">
        <ul className="list-disc ml-5 text-xs text-slate-700 space-y-0.5">
          <li><strong>Volumen recolectado por emisor</strong> (mL) — recipientes graduados</li>
          <li><strong>Tiempo de recolección</strong> (s o min) — cronómetro</li>
          <li><strong>Caudal real</strong> = Volumen / Tiempo (mL/min)</li>
          <li><strong>Uniformidad real</strong> = (Q_min / Q_promedio) × 100</li>
          <li><strong>Presión</strong> — verificar por columna de agua</li>
        </ul>
      </Block>

      <Block color="purple" title="4. Procedimiento sugerido de prueba">
        <ol className="list-decimal ml-5 text-xs text-slate-700 space-y-0.5">
          <li>Armar el sistema según el esquema técnico.</li>
          <li>Llenar el tanque a la marca indicada ({p.tankVolume} L).</li>
          <li>Colocar recipientes graduados debajo de cada gotero.</li>
          <li>Abrir válvula y esperar 1 min de estabilización.</li>
          <li>Cronometrar 5 minutos de recolección.</li>
          <li>Medir volumen en cada recipiente (mL).</li>
          <li>Calcular caudal = volumen / tiempo.</li>
          <li>Repetir 3 veces y promediar.</li>
          <li>Comparar resultados experimentales con valores teóricos.</li>
          <li>Calcular uniformidad real y comparar con la estimada.</li>
        </ol>
      </Block>

      <Block color="gray" title="5. Software y herramientas">
        <table className="w-full text-xs mt-1">
          <thead><tr className="border-b border-slate-300">
            <th className="text-left py-1">Herramienta</th>
            <th className="text-left py-1">Uso</th>
          </tr></thead>
          <tbody>
            {[
              ['Next.js + TypeScript', 'Aplicación web interactiva'],
              ['Tailwind CSS', 'Estilización de la interfaz'],
              ['SVG inline', 'Esquema técnico escalable'],
              ['Recharts', 'Gráficas de distribución de caudal'],
              ['Navegador web', 'Ejecución del simulador'],
              ['localStorage', 'Persistencia de parámetros'],
              ['Excel (opcional)', 'Validación cruzada de cálculos'],
            ].map(([tool, use], i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-1 font-semibold">{tool}</td>
                <td className="py-1">{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Block>

      <Block color="indigo" title="6. Supuestos del modelo">
        <ul className="list-disc ml-5 text-xs text-slate-700 space-y-0.5">
          <li>Flujo estacionario.</li>
          <li>Fluido incompresible (agua, ρ = {p.rho} kg/m³).</li>
          <li>Viscosidad cinemática ν ≈ 1.004×10⁻⁶ m²/s (20 °C).</li>
          <li>Factor de fricción: Poiseuille (laminar, Re &lt; 2000) / Blasius (turbulento, Re &gt; 4000).</li>
          <li>Emisor modelado como orificio: q = Cd·A·√(2g·h).</li>
          <li>P₁ ≈ P₂ ≈ P_atm, V₁ ≈ 0.</li>
          <li>Pérdidas menores agrupadas en h_L = {p.hL} m.</li>
        </ul>
      </Block>

      <Block color="indigo" title="7. Diagrama de flujo del simulador">
        <div className="flex flex-col items-center gap-1 text-xs text-slate-700 py-2">
          {['Ingreso de parámetros', 'Cálculo de demanda (ETc o fija)',
            'Presión por gravedad (P = ρgh)', 'Bernoulli → velocidad teórica',
            'Pérdidas (Darcy-Weisbach)', 'Caudal por emisor (orificio)',
            'Uniformidad de distribución', 'Visualización + simulación'].map((step, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className={`bg-white border border-indigo-300 rounded px-3 py-1 text-center
                ${i === 0 || i === 7 ? 'font-semibold' : ''}`}>{step}</div>
              {i < 7 && <span className="text-indigo-400">↓</span>}
            </div>
          ))}
        </div>
      </Block>
    </div>
  );
}

function Block({ color, title, children }: { color: string; title: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    amber:  'bg-amber-50 border-amber-200',
    blue:   'bg-blue-50 border-blue-200',
    green:  'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    gray:   'bg-slate-50 border-slate-200',
    indigo: 'bg-indigo-50 border-indigo-200',
  };
  const textMap: Record<string, string> = {
    amber: 'text-amber-800', blue: 'text-blue-800', green: 'text-green-800',
    purple: 'text-purple-800', gray: 'text-slate-800', indigo: 'text-indigo-800',
  };
  return (
    <div className={`rounded-lg border p-3.5 space-y-2 ${map[color] ?? map.gray}`}>
      <h3 className={`font-semibold text-sm ${textMap[color] ?? textMap.gray}`}>{title}</h3>
      {children}
    </div>
  );
}
