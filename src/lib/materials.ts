import type { SystemParams, MaterialItem } from '../types';

export function generateMaterials(p: SystemParams): MaterialItem[] {
  const matLabel = (m: string) => m === 'PVC' ? 'PVC' : m === 'PE' ? 'Polietileno' : 'Otro';
  const items: MaterialItem[] = [
    {
      component: 'Tanque / Recipiente',
      quantity: 1,
      spec: `${p.tankVolume} L`,
      usage: 'Almacenamiento de agua',
    },
    {
      component: 'Soporte elevado para tanque',
      quantity: 1,
      spec: `Altura ≥ ${p.tankHeight} m`,
      usage: 'Elevar tanque para presión por gravedad',
    },
    {
      component: 'Válvula de paso',
      quantity: 1,
      spec: `Ø ${p.mainPipe.diameterMm} mm`,
      usage: 'Control de flujo',
    },
    {
      component: 'Filtro de malla',
      quantity: 1,
      spec: `Ø ${p.mainPipe.diameterMm} mm`,
      usage: 'Evitar obstrucciones en goteros',
    },
    {
      component: `Tubería principal (${matLabel(p.mainPipe.material)})`,
      quantity: 1,
      spec: `Ø ${p.mainPipe.diameterMm} mm × ${p.mainPipe.length} m`,
      usage: 'Conectar tanque con línea lateral',
    },
    {
      component: `Tubería lateral (${matLabel(p.lateralPipe.material)})`,
      quantity: 1,
      spec: `Ø ${p.lateralPipe.diameterMm} mm × ${p.lateralPipe.length} m`,
      usage: 'Distribución a goteros',
    },
    {
      component: 'Conector T',
      quantity: p.lossMode === 'detailed' ? p.fittings.teeCount : 1,
      spec: `${p.mainPipe.diameterMm}–${p.lateralPipe.diameterMm} mm`,
      usage: 'Unión principal–lateral',
    },
    {
      component: 'Codo 90°',
      quantity: p.lossMode === 'detailed' ? p.fittings.elbowCount : 1,
      spec: `Ø ${p.mainPipe.diameterMm} mm`,
      usage: 'Cambio de dirección',
    },
    {
      component: p.emitter.type === 'orifice'
        ? 'Gotero / Emisor (orificio)'
        : 'Gotero comercial',
      quantity: p.plantCount,
      spec: p.emitter.type === 'orifice'
        ? `Ø salida ${p.emitter.orificeDiameterMm} mm, Cd=${p.emitter.cd}`
        : `k=${p.emitter.commercialK}, x=${p.emitter.commercialX}`,
      usage: 'Salida de agua a cada planta',
    },
    {
      component: 'Tapón final',
      quantity: 1,
      spec: `Ø ${p.lateralPipe.diameterMm} mm`,
      usage: 'Cerrar extremo de tubería lateral',
    },
    {
      component: 'Cinta teflón / Sellador',
      quantity: 1,
      spec: 'Rollo estándar',
      usage: 'Sellado de conexiones',
    },
    {
      component: 'Abrazaderas',
      quantity: 4 + p.plantCount,
      spec: 'Ajustables',
      usage: 'Asegurar conexiones',
    },
  ];

  items.push(
    { component: 'Vaso medidor graduado', quantity: p.plantCount, spec: '250–500 mL', usage: 'Medir volumen por emisor (validación)' },
    { component: 'Cronómetro', quantity: 1, spec: 'Digital o celular', usage: 'Medir tiempo de prueba' },
    { component: 'Cinta métrica', quantity: 1, spec: '≥ 3 m', usage: 'Verificar posiciones y longitudes' },
    { component: 'Termómetro', quantity: 1, spec: 'Rango 0–50 °C', usage: 'Medir temperatura del agua' },
  );

  return items;
}
