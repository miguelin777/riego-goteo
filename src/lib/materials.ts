import type { SystemParams, MaterialItem } from './types';

export function generateMaterials(p: SystemParams): MaterialItem[] {
  return [
    { component: 'Tanque / Recipiente', quantity: 1,
      spec: `${p.tankVolume} L`, usage: 'Almacenamiento de agua' },
    { component: 'Soporte elevado', quantity: 1,
      spec: `Altura ≥ ${p.tankHeight} m`, usage: 'Elevar tanque para presión gravitacional' },
    { component: 'Válvula de paso', quantity: 1,
      spec: `Ø ${p.mainPipeDiameterMm} mm`, usage: 'Control de flujo' },
    { component: 'Filtro de malla', quantity: 1,
      spec: `Ø ${p.mainPipeDiameterMm} mm`, usage: 'Evitar obstrucciones en goteros' },
    { component: 'Tubería principal', quantity: 1,
      spec: `Ø ${p.mainPipeDiameterMm} mm × ${p.mainPipeLength} m`, usage: 'Conducir agua del tanque a la lateral' },
    { component: 'Tubería lateral', quantity: 1,
      spec: `Ø ${p.lateralPipeDiameterMm} mm × ${p.lateralPipeLength} m`, usage: 'Distribución a goteros' },
    { component: 'Conector T', quantity: 1,
      spec: `${p.mainPipeDiameterMm}–${p.lateralPipeDiameterMm} mm`, usage: 'Unión principal → lateral' },
    { component: 'Codo 90°', quantity: 1,
      spec: `Ø ${p.mainPipeDiameterMm} mm`, usage: 'Cambio de dirección' },
    { component: 'Gotero / Emisor', quantity: p.plantCount,
      spec: `Ø salida ${p.emitterDiameterMm} mm`, usage: 'Salida regulada de agua' },
    { component: 'Tapón final', quantity: 1,
      spec: `Ø ${p.lateralPipeDiameterMm} mm`, usage: 'Cerrar extremo de lateral' },
    { component: 'Cinta teflón', quantity: 1,
      spec: 'Rollo estándar', usage: 'Sellado de roscas' },
    { component: 'Abrazaderas', quantity: 4,
      spec: 'Ajustables', usage: 'Asegurar conexiones' },
  ];
}
