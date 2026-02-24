'use client';

import type { SystemParams } from '@/lib/types';

interface Props {
  params: SystemParams;
  onChange: (p: Partial<SystemParams>) => void;
  onReset: () => void;
}

/* ── Helpers de UI ────────────────────────────────────────── */
function NumInput({ label, value, unit, min, max, step, onChange }: {
  label: string; value: number; unit?: string;
  min?: number; max?: number; step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-slate-500">
        {label} {unit && <span className="text-slate-400">({unit})</span>}
      </span>
      <input type="number" className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm
        focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        value={value} min={min} max={max} step={step ?? 0.01}
        onChange={e => onChange(parseFloat(e.target.value) || 0)} />
    </label>
  );
}

function SliderInput({ label, value, unit, min, max, step, onChange }: {
  label: string; value: number; unit?: string;
  min: number; max: number; step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5 col-span-2">
      <span className="text-[11px] font-medium text-slate-500 flex justify-between">
        <span>{label} {unit && <span className="text-slate-400">({unit})</span>}</span>
        <span className="font-mono text-blue-700">{value}</span>
      </span>
      <input type="range" min={min} max={max} step={step ?? 0.01} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-bold text-blue-700 border-b border-blue-100 pb-0.5">{title}</h3>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">{children}</div>
    </div>
  );
}

export default function ParamPanel({ params: p, onChange, onReset }: Props) {
  const handlePlantPos = (idx: number, val: number) => {
    const pos = [...p.plantPositions];
    pos[idx] = val;
    onChange({ plantPositions: pos });
  };

  const handlePlantCount = (n: number) => {
    const count = Math.max(1, Math.min(4, Math.round(n)));
    const positions: number[] = [];
    for (let i = 0; i < count; i++) {
      positions.push(p.plantPositions[i] ?? +((i + 0.5) / count * p.lateralPipeLength).toFixed(3));
    }
    onChange({ plantCount: count, plantPositions: positions });
  };

  const autoSpace = () => {
    const n = p.plantCount;
    const spacing = p.lateralPipeLength / n;
    const margin = spacing / 2;
    const positions = Array.from({ length: n }, (_, i) => +(margin + i * spacing).toFixed(3));
    onChange({ plantPositions: positions });
  };

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800">Parámetros</h2>
        <button onClick={onReset}
          className="rounded bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600
                     hover:bg-slate-300 transition-colors cursor-pointer">
          Restablecer
        </button>
      </div>

      <Section title="Área de Cultivo">
        <NumInput label="Largo" value={p.areaLength} unit="m" min={0.1} max={3} onChange={v => onChange({ areaLength: v })} />
        <NumInput label="Ancho" value={p.areaWidth} unit="m" min={0.1} max={2} onChange={v => onChange({ areaWidth: v })} />
        <NumInput label="Nº plantas" value={p.plantCount} min={1} max={4} step={1} onChange={handlePlantCount} />
      </Section>

      <Section title="Posiciones de Plantas">
        {Array.from({ length: p.plantCount }).map((_, i) => (
          <NumInput key={i} label={`Planta ${i + 1}`} value={p.plantPositions[i] ?? 0}
            unit="m" min={0} max={p.lateralPipeLength} step={0.001}
            onChange={v => handlePlantPos(i, v)} />
        ))}
        <button onClick={autoSpace}
          className="col-span-2 rounded bg-blue-50 px-2 py-1 text-[11px] text-blue-700
                     font-semibold hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200">
          Auto-espaciar uniformemente
        </button>
      </Section>

      <Section title="Tanque">
        <SliderInput label="Altura útil (h)" value={p.tankHeight} unit="m" min={0.1} max={2} step={0.05}
          onChange={v => onChange({ tankHeight: v })} />
        <NumInput label="Volumen" value={p.tankVolume} unit="L" min={1} onChange={v => onChange({ tankVolume: v })} />
      </Section>

      <Section title="Tuberías">
        <NumInput label="Ø principal" value={p.mainPipeDiameterMm} unit="mm" min={1} onChange={v => onChange({ mainPipeDiameterMm: v })} />
        <NumInput label="Ø lateral" value={p.lateralPipeDiameterMm} unit="mm" min={1} onChange={v => onChange({ lateralPipeDiameterMm: v })} />
        <NumInput label="Long. principal" value={p.mainPipeLength} unit="m" min={0.1} onChange={v => onChange({ mainPipeLength: v })} />
        <NumInput label="Long. lateral" value={p.lateralPipeLength} unit="m" min={0.1} onChange={v => onChange({ lateralPipeLength: v })} />
      </Section>

      <Section title="Goteros">
        <NumInput label="Ø orificio" value={p.emitterDiameterMm} unit="mm" min={0.5} step={0.1}
          onChange={v => onChange({ emitterDiameterMm: v })} />
        <NumInput label="Cd" value={p.cd} min={0.1} max={1} step={0.01}
          onChange={v => onChange({ cd: v })} />
      </Section>

      <Section title="Demanda Hídrica">
        <NumInput label="ETo" value={p.eto} unit="mm/día" min={0} onChange={v => onChange({ eto: v })} />
        <NumInput label="Kc" value={p.kc} min={0} step={0.01} onChange={v => onChange({ kc: v })} />
        <NumInput label="Tiempo riego" value={p.irrigationMinutes} unit="min" min={1} onChange={v => onChange({ irrigationMinutes: v })} />
        <NumInput label="Demanda/planta" value={p.demandPerPlant} unit="L/día" min={0} step={0.1}
          onChange={v => onChange({ demandPerPlant: v })} />
      </Section>

      <Section title="Opciones de Cálculo">
        <label className="flex items-center gap-2 text-[11px] col-span-2 cursor-pointer">
          <input type="checkbox" checked={p.useDemandETc} className="accent-blue-600"
            onChange={e => onChange({ useDemandETc: e.target.checked })} />
          Usar ETc = Kc × ETo
        </label>
        <label className="flex items-center gap-2 text-[11px] col-span-2 cursor-pointer">
          <input type="checkbox" checked={p.considerFriction} className="accent-blue-600"
            onChange={e => onChange({ considerFriction: e.target.checked })} />
          Considerar pérdidas por fricción
        </label>
        {p.considerFriction && (
          <NumInput label="hL accesorios" value={p.hL} unit="m" min={0} step={0.01}
            onChange={v => onChange({ hL: v })} />
        )}
      </Section>

      <Section title="Visualización">
        <label className="flex items-center gap-2 text-[11px] col-span-2 cursor-pointer">
          <input type="checkbox" checked={p.showDimensions} className="accent-blue-600"
            onChange={e => onChange({ showDimensions: e.target.checked })} />
          Mostrar cotas / dimensiones
        </label>
        <label className="flex items-center gap-2 text-[11px] col-span-2 cursor-pointer">
          <input type="checkbox" checked={p.showAnimation} className="accent-blue-600"
            onChange={e => onChange({ showAnimation: e.target.checked })} />
          Mostrar animación de flujo
        </label>
      </Section>

      <Section title="Constantes Físicas">
        <NumInput label="ρ (agua)" value={p.rho} unit="kg/m³" min={900} max={1100} step={1}
          onChange={v => onChange({ rho: v })} />
        <NumInput label="g" value={p.g} unit="m/s²" min={9} max={10} step={0.01}
          onChange={v => onChange({ g: v })} />
      </Section>
    </div>
  );
}
