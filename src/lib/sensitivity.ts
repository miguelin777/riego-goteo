import type { SystemParams, SensitivityPoint } from '../types';
import { computeEngine } from './engine';

export type SensitivityVar =
  | 'tankHeight'
  | 'emitterDiameter'
  | 'obstruction'
  | 'lateralDiameter'
  | 'mainPipeLength'
  | 'temperature';

interface VarConfig {
  label: string;
  unit: string;
  range: (base: SystemParams) => [number, number];
  apply: (p: SystemParams, v: number) => SystemParams;
}

const VARS: Record<SensitivityVar, VarConfig> = {
  tankHeight: {
    label: 'Altura del tanque',
    unit: 'm',
    range: () => [0.2, 3.0],
    apply: (p, v) => ({ ...p, tankHeight: v }),
  },
  emitterDiameter: {
    label: 'Ø emisor',
    unit: 'mm',
    range: () => [0.5, 5],
    apply: (p, v) => ({ ...p, emitter: { ...p.emitter, orificeDiameterMm: v } }),
  },
  obstruction: {
    label: 'Obstrucción',
    unit: '%',
    range: () => [0, 80],
    apply: (p, v) => ({ ...p, emitter: { ...p.emitter, obstructionPct: v } }),
  },
  lateralDiameter: {
    label: 'Ø lateral',
    unit: 'mm',
    range: () => [4, 20],
    apply: (p, v) => ({ ...p, lateralPipe: { ...p.lateralPipe, diameterMm: v } }),
  },
  mainPipeLength: {
    label: 'Long. principal',
    unit: 'm',
    range: () => [0.1, 3],
    apply: (p, v) => ({ ...p, mainPipe: { ...p.mainPipe, length: v } }),
  },
  temperature: {
    label: 'Temperatura',
    unit: '°C',
    range: () => [5, 40],
    apply: (p, v) => ({ ...p, temperature: v }),
  },
};

export function getSensitivityVars() {
  return Object.entries(VARS).map(([id, c]) => ({ id: id as SensitivityVar, label: c.label, unit: c.unit }));
}

export function runSensitivity(
  base: SystemParams,
  variable: SensitivityVar,
  steps: number = 30,
): SensitivityPoint[] {
  const cfg = VARS[variable];
  const [lo, hi] = cfg.range(base);
  const points: SensitivityPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = lo + (hi - lo) * (i / steps);
    const p = cfg.apply(structuredClone(base), x);
    const r = computeEngine(p);
    points.push({ x, qRealLh: r.qRealLh, eu: r.eu, balancePct: r.balancePct });
  }
  return points;
}
