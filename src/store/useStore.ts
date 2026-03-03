import { create } from 'zustand';
import type { SystemParams } from '../types';

const STORAGE_KEY = 'riego-goteo-params-v2';

export const DEFAULT_PARAMS: SystemParams = {
  areaLength: 1.0,
  areaWidth: 0.5,
  plantCount: 4,
  plantPositions: [0.125, 0.375, 0.625, 0.875],

  tankHeight: 0.8,
  tankVolume: 10,
  tankMode: 'constant',

  mainPipe: { length: 0.6, diameterMm: 12, material: 'PVC' },
  lateralPipe: { length: 1.0, diameterMm: 8, material: 'PE' },

  lossMode: 'simplified',
  fittings: {
    valveK: 0.2,
    filterK: 1.5,
    elbowK: 0.9,
    elbowCount: 1,
    teeK: 1.3,
    teeCount: 1,
    entryK: 0.5,
  },

  emitter: {
    type: 'orifice',
    orificeDiameterMm: 2,
    cd: 0.65,
    commercialK: 1.0,
    commercialX: 0.5,
    obstructionPct: 0,
  },

  demandMode: 'fixed',
  eto: 4,
  kc: 1.15,
  demandPerPlant: 0.6,
  irrigationMinutes: 35,

  rho: 998,
  g: 9.81,
  temperature: 20,
};

function deepMerge(base: Record<string, unknown>, stored: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(base)) {
    if (!(key in stored)) continue;
    const bv = base[key];
    const sv = stored[key];
    if (bv && sv && typeof bv === 'object' && !Array.isArray(bv) && typeof sv === 'object' && !Array.isArray(sv)) {
      out[key] = { ...bv as Record<string, unknown>, ...sv as Record<string, unknown> };
    } else {
      out[key] = sv;
    }
  }
  return out;
}

function loadParams(): SystemParams {
  try {
    localStorage.removeItem('riego-goteo-params');
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const merged = deepMerge(DEFAULT_PARAMS as unknown as Record<string, unknown>, parsed) as unknown as SystemParams;
        if (!merged.mainPipe || typeof merged.mainPipe !== 'object') return { ...DEFAULT_PARAMS };
        if (!merged.emitter || typeof merged.emitter !== 'object') return { ...DEFAULT_PARAMS };
        return merged;
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return { ...DEFAULT_PARAMS };
}

function saveParams(p: SystemParams) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

interface Store {
  params: SystemParams;
  set: (partial: Partial<SystemParams>) => void;
  reset: () => void;
  autoSpace: () => void;
}

export const useStore = create<Store>((setter, getter) => ({
  params: loadParams(),

  set: (partial) => {
    const next = { ...getter().params, ...partial };
    saveParams(next);
    setter({ params: next });
  },

  reset: () => {
    const fresh = { ...DEFAULT_PARAMS };
    saveParams(fresh);
    setter({ params: fresh });
  },

  autoSpace: () => {
    const p = getter().params;
    const n = p.plantCount;
    const L = p.lateralPipe.length;
    const positions = Array.from({ length: n }, (_, i) => +((i + 0.5) / n * L).toFixed(4));
    const next = { ...p, plantPositions: positions };
    saveParams(next);
    setter({ params: next });
  },
}));
