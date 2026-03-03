/* ═══════════════════════════════════════════════════════════
   Valores por defecto y persistencia (localStorage)
   Modifica aquí las constantes iniciales del proyecto.
   ═══════════════════════════════════════════════════════════ */

import type { SystemParams } from './types';

export const DEFAULT_PARAMS: SystemParams = {
  areaLength: 1.0,
  areaWidth: 0.5,
  plantCount: 4,
  plantPositions: [0.125, 0.375, 0.625, 0.875],

  tankHeight: 0.8,
  tankVolume: 10,

  mainPipeLength: 0.6,
  lateralPipeLength: 1.0,
  mainPipeDiameterMm: 12,
  lateralPipeDiameterMm: 8,

  emitterDiameterMm: 2,

  eto: 4,
  kc: 1.15,
  irrigationMinutes: 35,
  demandPerPlant: 0.6,

  useDemandETc: false,
  considerFriction: true,

  rho: 1000,
  g: 9.81,
  hL: 0.05,
  cd: 0.62,

  showAnimation: true,
  showDimensions: true,
  showCalcSteps: true,
};

const STORAGE_KEY = 'riego-goteo-params-v2';

export function loadParams(): SystemParams {
  if (typeof window === 'undefined') return { ...DEFAULT_PARAMS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PARAMS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_PARAMS };
}

export function saveParams(p: SystemParams): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

export function exportParamsJSON(p: SystemParams): string {
  return JSON.stringify(p, null, 2);
}

export function importParamsJSON(json: string): SystemParams | null {
  try {
    const obj = JSON.parse(json);
    return { ...DEFAULT_PARAMS, ...obj };
  } catch { return null; }
}
