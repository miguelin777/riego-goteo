export type PipeMaterial = 'PVC' | 'PE' | 'other';

export interface PipeSpec {
  length: number;
  diameterMm: number;
  material: PipeMaterial;
  roughnessOverride?: number;
}

export interface FittingLosses {
  valveK: number;
  filterK: number;
  elbowK: number;
  elbowCount: number;
  teeK: number;
  teeCount: number;
  entryK: number;
}

export type EmitterType = 'orifice' | 'commercial';

export interface EmitterSpec {
  type: EmitterType;
  orificeDiameterMm: number;
  cd: number;
  commercialK: number;
  commercialX: number;
  obstructionPct: number;
}

export type DemandMode = 'etc' | 'fixed';
export type LossMode = 'simplified' | 'detailed';
export type TankMode = 'constant' | 'variable';

export interface SystemParams {
  areaLength: number;
  areaWidth: number;
  plantCount: number;
  plantPositions: number[];

  tankHeight: number;
  tankVolume: number;
  tankMode: TankMode;

  mainPipe: PipeSpec;
  lateralPipe: PipeSpec;

  lossMode: LossMode;
  fittings: FittingLosses;

  emitter: EmitterSpec;

  demandMode: DemandMode;
  eto: number;
  kc: number;
  demandPerPlant: number;
  irrigationMinutes: number;

  rho: number;
  g: number;
  temperature: number;
}

export interface EmitterResult {
  index: number;
  position: number;
  hLocal: number;
  pLocal: number;
  qM3s: number;
  qLh: number;
  qMlMin: number;
  volumeLDay: number;
}

export interface EngineResults {
  etc: number;
  totalDemandLDay: number;
  demandPerPlant: number;

  qReqM3s: number;
  qReqLh: number;

  P0Pa: number;
  P0kPa: number;

  viscosity: number;

  vMain: number;
  reMain: number;
  fMain: number;
  hfMain: number;

  vLateralInlet: number;
  reLateral: number;
  fLateral: number;

  hmFittings: number;
  hfLateral: number;
  hfTotal: number;

  vBernoulli: number;
  vWithLosses: number;

  emitters: EmitterResult[];

  qRealM3s: number;
  qRealLh: number;
  qRealMlMin: number;

  eu: number;
  cv: number;

  balance: 'ok' | 'over' | 'under';
  balancePct: number;
  recommendedMinutes: number;
  qTargetPerEmitterLh: number;
}

export interface MaterialItem {
  component: string;
  quantity: number;
  spec: string;
  usage: string;
}

export interface SensitivityPoint {
  x: number;
  qRealLh: number;
  eu: number;
  balancePct: number;
}

export interface MonteCarloSample {
  qRealLh: number;
  eu: number;
}

export interface MonteCarloResult {
  samples: MonteCarloSample[];
  qMean: number;
  qStd: number;
  qP5: number;
  qP95: number;
  euMean: number;
  euStd: number;
  euP5: number;
  euP95: number;
}
