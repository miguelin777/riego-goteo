/* ═══════════════════════════════════════════════════════════
   Cálculos hidráulicos — FÓRMULAS CORREGIDAS
   ═══════════════════════════════════════════════════════════
   Correcciones respecto al código anterior:
   1. Ecuación de orificio: q = Cd·A·√(2g·h) — se agrega Cd
   2. Factor de fricción: f calculado con Reynolds (Poiseuille /
      Blasius) en vez de f=0.03 fijo
   3. Pérdidas en lateral: segmento por segmento con flujo
      decreciente, en vez de interpolación lineal arbitraria
   4. Velocidad de pérdidas: calculada desde Q/A real del tubo,
      no estimada como 0.8·v_bernoulli
   5. Se agregan pérdidas menores (accesorios) como parámetro hL
   6. Presión en bar y mca (metros columna de agua)
   7. Validaciones integradas
   ═══════════════════════════════════════════════════════════ */

import type {
  SystemParams,
  HydraulicResults,
  EmitterResult,
  ValidationWarning,
} from './types';

// ─── Constantes ─────────────────────────────────────────────
const NU = 1.004e-6; // viscosidad cinemática agua ~20 °C (m²/s)

// ─── Conversiones ───────────────────────────────────────────
const mmToM  = (mm: number) => mm / 1000;
const lhToM3s = (lh: number) => lh / 3_600_000;
const m3sToLh = (m3s: number) => m3s * 3_600_000;

/** Área de sección circular (m²), diámetro en mm */
function pipeArea(dMm: number): number {
  const r = mmToM(dMm) / 2;
  return Math.PI * r * r;
}

// ─── Fricción (Darcy-Weisbach) ──────────────────────────────

function reynolds(v: number, dMm: number): number {
  const d = mmToM(dMm);
  if (d <= 0 || v <= 0) return 0;
  return (v * d) / NU;
}

/**
 * Factor de fricción de Darcy según régimen:
 * - Laminar  (Re < 2000): f = 64 / Re
 * - Transición (2000–4000): interpolación lineal
 * - Turbulento (Re > 4000): Blasius f = 0.316 / Re^0.25
 */
function frictionFactor(re: number): number {
  if (re <= 0) return 0;
  if (re < 2000) return 64 / re;
  if (re > 4000) return 0.316 / Math.pow(re, 0.25);
  // transición: interpolar entre laminar y turbulento
  const fLam = 64 / 2000;
  const fTurb = 0.316 / Math.pow(4000, 0.25);
  const t = (re - 2000) / 2000;
  return fLam + t * (fTurb - fLam);
}

/** Pérdida de carga Darcy-Weisbach (m) */
function darcyLoss(v: number, length: number, dMm: number, g: number): number {
  if (length <= 0 || v <= 0) return 0;
  const d = mmToM(dMm);
  if (d <= 0) return 0;
  const re = reynolds(v, dMm);
  const f = frictionFactor(re);
  return f * (length / d) * (v * v) / (2 * g);
}

// ─── Cálculo principal ──────────────────────────────────────

export function computeHydraulics(p: SystemParams): HydraulicResults {
  const warnings: ValidationWarning[] = [];
  const area = p.areaLength * p.areaWidth;

  // ── Validaciones previas ──────────────────────────────────
  if (p.areaLength > 1.0 || p.areaWidth > 0.5)
    warnings.push({ type: 'warning', message: `Área (${p.areaLength}×${p.areaWidth} m) excede el máximo del proyecto (1.0×0.5 m).` });
  if (p.plantCount > 4)
    warnings.push({ type: 'warning', message: 'Número de plantas mayor a 4.' });
  if (p.tankHeight <= 0)
    warnings.push({ type: 'error', message: 'La altura del tanque debe ser > 0.' });
  if (p.irrigationMinutes <= 0)
    warnings.push({ type: 'error', message: 'El tiempo de riego debe ser > 0.' });
  if (p.mainPipeDiameterMm <= 0 || p.lateralPipeDiameterMm <= 0)
    warnings.push({ type: 'error', message: 'Los diámetros de tubería deben ser > 0.' });
  if (p.emitterDiameterMm <= 0)
    warnings.push({ type: 'error', message: 'El diámetro del emisor debe ser > 0.' });

  const sortedPositions = [...p.plantPositions].slice(0, p.plantCount).sort((a, b) => a - b);
  sortedPositions.forEach((pos, i) => {
    if (pos < 0 || pos > p.lateralPipeLength)
      warnings.push({ type: 'error', message: `Planta ${i + 1} (x=${pos} m) fuera de la tubería lateral [0, ${p.lateralPipeLength}].` });
  });

  // ── 1. Demanda de agua ────────────────────────────────────
  const etc = p.kc * p.eto;               // mm/día
  const demandLm2Day = etc;                // 1 mm/día ≡ 1 L/m²·día
  const totalDemandETc = demandLm2Day * area;
  const demandPerPlantETc = p.plantCount > 0 ? totalDemandETc / p.plantCount : 0;

  const demandPerPlantCalc = p.useDemandETc ? demandPerPlantETc : p.demandPerPlant;
  const totalDemandLDay = demandPerPlantCalc * p.plantCount;

  // ── 2. Caudal requerido ───────────────────────────────────
  const irrigationHours = Math.max(p.irrigationMinutes, 0.001) / 60;
  const qPlantLh   = demandPerPlantCalc / irrigationHours;
  const qPlantMlMin = qPlantLh * 1000 / 60;
  const qTotalLh    = qPlantLh * p.plantCount;
  const qTotalMlMin = qPlantMlMin * p.plantCount;

  // ── 3. Presión por gravedad ───────────────────────────────
  const pressurePa  = p.rho * p.g * Math.max(p.tankHeight, 0);
  const pressurekPa = pressurePa / 1000;
  const pressureBar = pressurePa / 100_000;
  const pressureMca = Math.max(p.tankHeight, 0); // 1 mca ≡ 1 m de columna de agua

  // ── 4. Bernoulli simplificado (ideal, sin pérdidas) ───────
  const velocityIdeal = p.tankHeight > 0
    ? Math.sqrt(2 * p.g * p.tankHeight)
    : 0;

  // ── 5. Pérdidas en la tubería principal ───────────────────
  // Flujo total pasa por la principal.
  const qTotal_m3s = lhToM3s(qTotalLh);
  const aMain = pipeArea(p.mainPipeDiameterMm);
  const vMain = aMain > 0 ? qTotal_m3s / aMain : 0;
  const headLossMain = p.considerFriction
    ? darcyLoss(vMain, p.mainPipeLength, p.mainPipeDiameterMm, p.g)
    : 0;

  // ── 6. Pérdidas en la lateral (segmento por segmento) ────
  //    El flujo disminuye en cada segmento porque cada emisor
  //    extrae agua. Usamos una primera pasada con flujos iguales.
  const aLat = pipeArea(p.lateralPipeDiameterMm);
  const aEmitter = pipeArea(p.emitterDiameterMm);
  const n = p.plantCount;

  let headLossLateral = 0;
  const segmentLosses: number[] = [];

  if (p.considerFriction && n > 0) {
    let prevPos = 0;
    for (let i = 0; i < n; i++) {
      const pos = sortedPositions[i] ?? 0;
      const segLen = Math.max(pos - prevPos, 0);
      // Flujo en este segmento: suma de emisores restantes (i..n-1)
      const emittersRemaining = n - i;
      const qSeg_m3s = lhToM3s(qPlantLh * emittersRemaining);
      const vSeg = aLat > 0 ? qSeg_m3s / aLat : 0;
      const loss = darcyLoss(vSeg, segLen, p.lateralPipeDiameterMm, p.g);
      segmentLosses.push(loss);
      headLossLateral += loss;
      prevPos = pos;
    }
  }

  // Pérdidas por accesorios (manuales)
  const headLossAccessories = p.considerFriction ? p.hL : 0;
  const headLossTotal = headLossMain + headLossLateral + headLossAccessories;

  // Validar energía suficiente
  if (headLossTotal >= p.tankHeight && p.considerFriction)
    warnings.push({ type: 'error', message: `Pérdida de carga total (${headLossTotal.toFixed(3)} m) ≥ altura del tanque (${p.tankHeight} m). Sin energía suficiente.` });

  // ── 7. Velocidad real (Bernoulli con pérdidas) ────────────
  const hEff = Math.max(p.tankHeight - headLossTotal, 0);
  const velocityReal = Math.sqrt(2 * p.g * hEff);

  // ── 8. Caudal real por cada emisor (ecuación de orificio) ─
  //    q = Cd · A_orificio · √(2·g·h_local)
  const emitters: EmitterResult[] = [];
  let cumLoss = headLossMain + headLossAccessories;

  for (let i = 0; i < n; i++) {
    cumLoss += (segmentLosses[i] ?? 0);
    const localHead = Math.max(p.tankHeight - cumLoss, 0);
    const vEmitter = Math.sqrt(2 * p.g * localHead);
    const q_m3s = p.cd * aEmitter * vEmitter;
    const qLh = m3sToLh(q_m3s);
    emitters.push({
      index: i,
      position: sortedPositions[i] ?? 0,
      localHead,
      flow: qLh,
      flowMlMin: qLh * 1000 / 60,
    });
  }

  // ── 9. Uniformidad ────────────────────────────────────────
  let uniformity = 100;
  if (emitters.length > 0) {
    const flows = emitters.map(e => e.flow);
    const qMin = Math.min(...flows);
    const qAvg = flows.reduce((a, b) => a + b, 0) / flows.length;
    uniformity = qAvg > 0 ? Math.min((qMin / qAvg) * 100, 100) : 100;
  }

  // Observaciones automáticas
  if (pressurekPa < 5)
    warnings.push({ type: 'info', message: 'Presión muy baja (<5 kPa). Se recomiendan goteros de baja presión o aumentar la altura del tanque.' });
  if (uniformity < 80)
    warnings.push({ type: 'warning', message: `Uniformidad baja (${uniformity.toFixed(1)}%). Considere reducir la longitud lateral o aumentar su diámetro.` });
  if (totalDemandLDay > p.tankVolume)
    warnings.push({ type: 'info', message: `La demanda diaria (${totalDemandLDay.toFixed(1)} L) excede el volumen del tanque (${p.tankVolume} L). Será necesario rellenar.` });

  return {
    area,
    etc,
    demandLm2Day,
    totalDemandLDay,
    demandPerPlantCalc,
    qPlantLh,
    qPlantMlMin,
    qTotalLh,
    qTotalMlMin,
    pressurePa,
    pressurekPa,
    pressureBar,
    pressureMca,
    velocityIdeal,
    velocityReal,
    headLossMain,
    headLossLateral,
    headLossAccessories,
    headLossTotal,
    emitters,
    uniformity,
    warnings,
  };
}
