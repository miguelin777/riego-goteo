import type { SystemParams, MonteCarloResult, MonteCarloSample } from '../types';
import { computeEngine } from './engine';

function randNormal(mean: number, std: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
}

function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export interface MCUncertainties {
  hStd: number;
  dEmitterStd: number;
  cdStd: number;
  hfPct: number;
  timePct: number;
  etoStd: number;
  kcStd: number;
}

export const DEFAULT_MC: MCUncertainties = {
  hStd: 0.02,
  dEmitterStd: 0.1,
  cdStd: 0.03,
  hfPct: 10,
  timePct: 5,
  etoStd: 0.5,
  kcStd: 0.05,
};

export function runMonteCarlo(
  base: SystemParams,
  unc: MCUncertainties,
  N: number = 500,
): MonteCarloResult {
  const samples: MonteCarloSample[] = [];

  for (let i = 0; i < N; i++) {
    const p: SystemParams = structuredClone(base);

    p.tankHeight = clamp(randNormal(base.tankHeight, unc.hStd), 0.01, 10);

    const dFactor = clamp(randNormal(1, unc.dEmitterStd / base.emitter.orificeDiameterMm), 0.5, 1.5);
    p.emitter = { ...p.emitter, orificeDiameterMm: base.emitter.orificeDiameterMm * dFactor };

    p.emitter.cd = clamp(randNormal(base.emitter.cd, unc.cdStd), 0.1, 1.0);

    const lossFactor = clamp(randNormal(1, unc.hfPct / 100), 0.5, 2.0);
    p.mainPipe = { ...p.mainPipe, length: base.mainPipe.length * lossFactor };

    const tFactor = clamp(randNormal(1, unc.timePct / 100), 0.5, 2.0);
    p.irrigationMinutes = base.irrigationMinutes * tFactor;

    if (base.demandMode === 'etc') {
      p.eto = clamp(randNormal(base.eto, unc.etoStd), 0.1, 15);
      p.kc = clamp(randNormal(base.kc, unc.kcStd), 0.1, 2);
    }

    const r = computeEngine(p);
    samples.push({ qRealLh: r.qRealLh, eu: r.eu });
  }

  const qs = samples.map(s => s.qRealLh).sort((a, b) => a - b);
  const eus = samples.map(s => s.eu).sort((a, b) => a - b);
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const std = (arr: number[], m: number) =>
    Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);

  const qMean = mean(qs);
  const euMean = mean(eus);

  return {
    samples,
    qMean,
    qStd: std(qs, qMean),
    qP5: percentile(qs, 5),
    qP95: percentile(qs, 95),
    euMean,
    euStd: std(eus, euMean),
    euP5: percentile(eus, 5),
    euP95: percentile(eus, 95),
  };
}
