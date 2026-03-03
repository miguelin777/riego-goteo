/* ═══════════════════════════════════════════════════════════
   Tipos del sistema de riego por goteo por gravedad
   ═══════════════════════════════════════════════════════════ */

export interface SystemParams {
  areaLength: number;             // m
  areaWidth: number;              // m
  plantCount: number;             // 1–4
  plantPositions: number[];       // m, desde el inicio de la lateral

  tankHeight: number;             // m — altura útil (nivel agua → goteros)
  tankVolume: number;             // L

  mainPipeLength: number;         // m
  lateralPipeLength: number;      // m
  mainPipeDiameterMm: number;     // mm
  lateralPipeDiameterMm: number;  // mm

  emitterDiameterMm: number;      // mm — diámetro de orificio del gotero

  eto: number;                    // mm/día
  kc: number;                     // coeficiente de cultivo
  irrigationMinutes: number;      // min/día
  demandPerPlant: number;         // L/planta·día (modo fijo)

  useDemandETc: boolean;
  considerFriction: boolean;

  rho: number;                    // kg/m³
  g: number;                      // m/s²
  hL: number;                     // m — pérdidas menores (accesorios) manuales
  cd: number;                     // coeficiente de descarga del orificio

  showAnimation: boolean;
  showDimensions: boolean;
  showCalcSteps: boolean;
}

export interface EmitterResult {
  index: number;
  position: number;       // m
  localHead: number;      // m — cabeza disponible en el emisor
  flow: number;           // L/h
  flowMlMin: number;      // mL/min
}

export interface HydraulicResults {
  area: number;
  etc: number;
  demandLm2Day: number;
  totalDemandLDay: number;
  demandPerPlantCalc: number;

  qPlantLh: number;
  qPlantMlMin: number;
  qTotalLh: number;
  qTotalMlMin: number;

  pressurePa: number;
  pressurekPa: number;
  pressureBar: number;
  pressureMca: number;

  velocityIdeal: number;
  velocityReal: number;

  headLossMain: number;
  headLossLateral: number;
  headLossAccessories: number;
  headLossTotal: number;

  emitters: EmitterResult[];
  uniformity: number;

  warnings: ValidationWarning[];
}

export interface ValidationWarning {
  type: 'error' | 'warning' | 'info';
  message: string;
}

export interface MaterialItem {
  component: string;
  quantity: number;
  spec: string;
  usage: string;
}
