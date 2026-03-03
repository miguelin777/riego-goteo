import type { SystemParams, EngineResults, EmitterResult, PipeSpec, PipeMaterial } from '../types';

const mmToM = (mm: number) => mm / 1000;
const circleArea = (dM: number) => Math.PI * (dM / 2) ** 2;

const ROUGHNESS: Record<PipeMaterial, number> = {
  PVC: 0.0015e-3,
  PE: 0.007e-3,
  other: 0.01e-3,
};

export function waterViscosity(tempC: number): number {
  const T = Math.max(5, Math.min(40, tempC));
  return 2.414e-5 * Math.pow(10, 247.8 / (T + 133.15));
}

function pipeRoughness(pipe: PipeSpec): number {
  if (pipe.material === 'other' && pipe.roughnessOverride !== undefined) {
    return pipe.roughnessOverride;
  }
  return ROUGHNESS[pipe.material];
}

function frictionFactor(Re: number, epsilon: number, D: number): number {
  if (Re < 1) return 0;
  if (Re < 2300) return 64 / Re;
  const eD = epsilon / D;
  const f = 0.25 / Math.log10(eD / 3.7 + 5.74 / Math.pow(Re, 0.9)) ** 2;
  return Math.max(f, 1e-6);
}

function darcyLoss(f: number, L: number, D: number, V: number, g: number): number {
  if (D <= 0 || V <= 0) return 0;
  return f * (L / D) * (V * V) / (2 * g);
}

function emitterFlow(p: SystemParams, hLocal: number): number {
  if (hLocal <= 0) return 0;
  const e = p.emitter;
  if (e.type === 'commercial') {
    const pKpa = p.rho * p.g * hLocal / 1000;
    return (e.commercialK * Math.pow(Math.max(pKpa, 0), e.commercialX)) / 3600 / 1000;
  }
  const obsFactor = 1 - e.obstructionPct / 100;
  const dEff = mmToM(e.orificeDiameterMm) * Math.sqrt(obsFactor);
  const cdEff = e.cd * obsFactor;
  const A = circleArea(dEff);
  const v = Math.sqrt(2 * p.g * hLocal);
  return cdEff * A * v;
}

export function computeEngine(p: SystemParams): EngineResults {
  const mu = waterViscosity(p.temperature);
  const area = p.areaLength * p.areaWidth;

  // 1 — Demand
  const etc = p.kc * p.eto;
  const demandPerPlant = p.demandMode === 'etc'
    ? (etc * area) / Math.max(p.plantCount, 1)
    : p.demandPerPlant;
  const totalDemandLDay = demandPerPlant * p.plantCount;
  const irrigH = p.irrigationMinutes / 60;
  const qReqLh = irrigH > 0 ? totalDemandLDay / irrigH : 0;
  const qReqM3s = qReqLh / 3600 / 1000;

  // 2 — Pressure
  const P0Pa = p.rho * p.g * p.tankHeight;
  const P0kPa = P0Pa / 1000;

  // 3 — Bernoulli ideal
  const vBernoulli = Math.sqrt(2 * p.g * Math.max(p.tankHeight, 0));

  // 4 — Pipe geometry
  const dMain = mmToM(p.mainPipe.diameterMm);
  const dLat = mmToM(p.lateralPipe.diameterMm);
  const aMain = circleArea(dMain);
  const aLat = circleArea(dLat);
  const epsMain = pipeRoughness(p.mainPipe);
  const epsLat = pipeRoughness(p.lateralPipe);

  // 5 — Sort positions
  const positions = p.plantPositions.slice(0, p.plantCount).sort((a, b) => a - b);

  // Iterative solve (3 passes)
  let emitters: EmitterResult[] = [];
  let qTotal = qReqM3s;
  let hfMainVal = 0;
  let hmFit = 0;
  let fMainVal = 0;
  let reMainVal = 0;
  let vMainVal = 0;
  let reLateralVal = 0;
  let fLateralVal = 0;
  let vLatInlet = 0;

  for (let iter = 0; iter < 4; iter++) {
    // Main pipe
    vMainVal = aMain > 0 ? qTotal / aMain : 0;
    reMainVal = dMain > 0 && mu > 0 ? (p.rho * vMainVal * dMain) / mu : 0;
    fMainVal = frictionFactor(reMainVal, epsMain, dMain);
    hfMainVal = darcyLoss(fMainVal, p.mainPipe.length, dMain, vMainVal, p.g);

    // Minor losses
    if (p.lossMode === 'detailed') {
      const vRef = vMainVal;
      const vHead = vRef * vRef / (2 * p.g);
      const f = p.fittings;
      hmFit = (f.valveK + f.filterK + f.elbowK * f.elbowCount + f.teeK * f.teeCount + f.entryK) * vHead;
    } else {
      hmFit = 0.15 * hfMainVal;
    }

    // Lateral segments
    const segLengths: number[] = [];
    for (let i = 0; i < positions.length; i++) {
      segLengths.push(i === 0 ? positions[0] : positions[i] - positions[i - 1]);
    }

    let hfAccum = 0;
    let qUpstream = qTotal;
    const newEmitters: EmitterResult[] = [];

    for (let i = 0; i < positions.length; i++) {
      const segL = segLengths[i];
      const vSeg = aLat > 0 ? qUpstream / aLat : 0;
      const reSeg = dLat > 0 && mu > 0 ? (p.rho * vSeg * dLat) / mu : 0;
      const fSeg = frictionFactor(reSeg, epsLat, dLat);
      const hfSeg = darcyLoss(fSeg, segL, dLat, vSeg, p.g);
      hfAccum += hfSeg;

      if (i === 0) {
        vLatInlet = vSeg;
        reLateralVal = reSeg;
        fLateralVal = fSeg;
      }

      const hLocal = Math.max(p.tankHeight - hfMainVal - hmFit - hfAccum, 0);
      const pLocal = p.rho * p.g * hLocal;
      const qi = emitterFlow(p, hLocal);

      newEmitters.push({
        index: i,
        position: positions[i],
        hLocal,
        pLocal,
        qM3s: qi,
        qLh: qi * 3600 * 1000,
        qMlMin: qi * 60 * 1e6,
        volumeLDay: qi * 3600 * 1000 * irrigH,
      });

      qUpstream = Math.max(qUpstream - qi, 0);
    }

    emitters = newEmitters;
    qTotal = emitters.reduce((s, e) => s + e.qM3s, 0);
    if (qTotal <= 0) break;
  }

  const hfLateral = emitters.length > 0
    ? Math.max(p.tankHeight - hfMainVal - hmFit - emitters[emitters.length - 1].hLocal, 0)
    : 0;
  const hfTotal = hfMainVal + hmFit + hfLateral;

  const vWithLosses = Math.sqrt(2 * p.g * Math.max(p.tankHeight - hfMainVal - hmFit, 0));

  // Real flow
  const qRealM3s = emitters.reduce((s, e) => s + e.qM3s, 0);
  const qRealLh = qRealM3s * 3600 * 1000;
  const qRealMlMin = qRealM3s * 60 * 1e6;

  // Uniformity
  const flows = emitters.map(e => e.qLh);
  const qAvg = flows.length > 0 ? flows.reduce((a, b) => a + b, 0) / flows.length : 0;
  const qMin = flows.length > 0 ? Math.min(...flows) : 0;
  const qStd = flows.length > 1
    ? Math.sqrt(flows.reduce((s, q) => s + (q - qAvg) ** 2, 0) / flows.length)
    : 0;
  const cv = qAvg > 0 ? qStd / qAvg : 0;
  const eu = qAvg > 0 ? Math.min((qMin / qAvg) * 100, 100) : 100;

  // Balance
  const balancePct = qReqLh > 0 ? ((qRealLh - qReqLh) / qReqLh) * 100 : 0;
  const balance: EngineResults['balance'] =
    Math.abs(balancePct) <= 10 ? 'ok' : balancePct > 10 ? 'over' : 'under';
  const totalRealLDay = emitters.reduce((s, e) => s + e.volumeLDay, 0);
  const recommendedMinutes = totalRealLDay > 0
    ? (totalDemandLDay / totalRealLDay) * p.irrigationMinutes
    : p.irrigationMinutes;
  const qTargetPerEmitterLh = p.plantCount > 0 ? qReqLh / p.plantCount : 0;

  return {
    etc,
    totalDemandLDay,
    demandPerPlant,
    qReqM3s,
    qReqLh,
    P0Pa,
    P0kPa,
    viscosity: mu,
    vMain: vMainVal,
    reMain: reMainVal,
    fMain: fMainVal,
    hfMain: hfMainVal,
    vLateralInlet: vLatInlet,
    reLateral: reLateralVal,
    fLateral: fLateralVal,
    hmFittings: hmFit,
    hfLateral,
    hfTotal,
    vBernoulli,
    vWithLosses,
    emitters,
    qRealM3s,
    qRealLh,
    qRealMlMin,
    eu,
    cv,
    balance,
    balancePct,
    recommendedMinutes,
    qTargetPerEmitterLh,
  };
}
