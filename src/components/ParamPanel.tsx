import { useStore } from '../store/useStore';
import type { SystemParams, PipeMaterial, EmitterType, DemandMode, LossMode } from '../types';

function Num({ label, value, unit, min, max, step, onChange }: {
  label: string; value: number; unit?: string; min?: number; max?: number; step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-600">
        {label}{unit && <span className="text-gray-400"> ({unit})</span>}
      </span>
      <input type="number" className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm
        focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        value={value} min={min} max={max} step={step ?? 0.01}
        onChange={e => onChange(parseFloat(e.target.value) || 0)} />
    </label>
  );
}

function Sel<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <select className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm
        focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        value={value} onChange={e => onChange(e.target.value as T)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-blue-700 border-b border-blue-100 pb-1">{title}</h3>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

export default function ParamPanel() {
  const { params: p, set, reset, autoSpace } = useStore();

  const setPipe = (which: 'mainPipe' | 'lateralPipe', partial: Partial<SystemParams['mainPipe']>) =>
    set({ [which]: { ...p[which], ...partial } });

  const setEmitter = (partial: Partial<SystemParams['emitter']>) =>
    set({ emitter: { ...p.emitter, ...partial } });

  const setFitting = (partial: Partial<SystemParams['fittings']>) =>
    set({ fittings: { ...p.fittings, ...partial } });

  const handlePlantCount = (n: number) => {
    const count = Math.max(1, Math.min(8, Math.round(n)));
    const L = p.lateralPipe.length;
    const positions = Array.from({ length: count }, (_, i) =>
      p.plantPositions[i] ?? +((i + 0.5) / count * L).toFixed(4));
    set({ plantCount: count, plantPositions: positions });
  };

  const handlePos = (idx: number, val: number) => {
    const pos = [...p.plantPositions];
    pos[idx] = val;
    set({ plantPositions: pos });
  };

  const matOpts: { value: PipeMaterial; label: string }[] = [
    { value: 'PVC', label: 'PVC (ε=0.0015 mm)' },
    { value: 'PE', label: 'PE (ε=0.007 mm)' },
    { value: 'other', label: 'Otro (editable)' },
  ];

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-800">Parámetros</h2>
        <button onClick={reset}
          className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-300 transition-colors cursor-pointer">
          Restablecer
        </button>
      </div>

      <Section title="Área de Cultivo">
        <Num label="Largo" value={p.areaLength} unit="m" min={0.1} onChange={v => set({ areaLength: v })} />
        <Num label="Ancho" value={p.areaWidth} unit="m" min={0.1} onChange={v => set({ areaWidth: v })} />
        <Num label="Nº plantas" value={p.plantCount} min={1} max={8} step={1} onChange={handlePlantCount} />
        <button onClick={autoSpace}
          className="col-span-2 rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer">
          Auto-espaciar plantas
        </button>
      </Section>

      <Section title="Posiciones de Plantas">
        {Array.from({ length: p.plantCount }).map((_, i) => (
          <Num key={i} label={`P${i + 1}`} value={p.plantPositions[i] ?? 0} unit="m"
            min={0} max={p.lateralPipe.length} step={0.001} onChange={v => handlePos(i, v)} />
        ))}
      </Section>

      <Section title="Tanque">
        <Num label="Altura h" value={p.tankHeight} unit="m" min={0.05} onChange={v => set({ tankHeight: v })} />
        <Num label="Volumen" value={p.tankVolume} unit="L" min={1} onChange={v => set({ tankVolume: v })} />
      </Section>

      <Section title="Tubería Principal">
        <Num label="Ø int." value={p.mainPipe.diameterMm} unit="mm" min={1}
          onChange={v => setPipe('mainPipe', { diameterMm: v })} />
        <Num label="Longitud" value={p.mainPipe.length} unit="m" min={0.01}
          onChange={v => setPipe('mainPipe', { length: v })} />
        <Sel label="Material" value={p.mainPipe.material} options={matOpts}
          onChange={v => setPipe('mainPipe', { material: v })} />
        {p.mainPipe.material === 'other' && (
          <Num label="ε" value={(p.mainPipe.roughnessOverride ?? 0.01e-3) * 1000} unit="mm" min={0} step={0.001}
            onChange={v => setPipe('mainPipe', { roughnessOverride: v / 1000 })} />
        )}
      </Section>

      <Section title="Tubería Lateral">
        <Num label="Ø int." value={p.lateralPipe.diameterMm} unit="mm" min={1}
          onChange={v => setPipe('lateralPipe', { diameterMm: v })} />
        <Num label="Longitud" value={p.lateralPipe.length} unit="m" min={0.01}
          onChange={v => setPipe('lateralPipe', { length: v })} />
        <Sel label="Material" value={p.lateralPipe.material} options={matOpts}
          onChange={v => setPipe('lateralPipe', { material: v })} />
        {p.lateralPipe.material === 'other' && (
          <Num label="ε" value={(p.lateralPipe.roughnessOverride ?? 0.01e-3) * 1000} unit="mm" min={0} step={0.001}
            onChange={v => setPipe('lateralPipe', { roughnessOverride: v / 1000 })} />
        )}
      </Section>

      <Section title="Pérdidas">
        <Sel<LossMode> label="Modo" value={p.lossMode}
          options={[{ value: 'simplified', label: 'Simplificado' }, { value: 'detailed', label: 'Detallado (K)' }]}
          onChange={v => set({ lossMode: v })} />
        {p.lossMode === 'detailed' && <>
          <Num label="K válvula" value={p.fittings.valveK} min={0} step={0.1} onChange={v => setFitting({ valveK: v })} />
          <Num label="K filtro" value={p.fittings.filterK} min={0} step={0.1} onChange={v => setFitting({ filterK: v })} />
          <Num label="K codo" value={p.fittings.elbowK} min={0} step={0.1} onChange={v => setFitting({ elbowK: v })} />
          <Num label="# codos" value={p.fittings.elbowCount} min={0} step={1} onChange={v => setFitting({ elbowCount: Math.round(v) })} />
          <Num label="K tee" value={p.fittings.teeK} min={0} step={0.1} onChange={v => setFitting({ teeK: v })} />
          <Num label="# tees" value={p.fittings.teeCount} min={0} step={1} onChange={v => setFitting({ teeCount: Math.round(v) })} />
          <Num label="K entrada" value={p.fittings.entryK} min={0} step={0.1} onChange={v => setFitting({ entryK: v })} />
        </>}
      </Section>

      <Section title="Emisor">
        <Sel<EmitterType> label="Tipo" value={p.emitter.type}
          options={[{ value: 'orifice', label: 'Orificio' }, { value: 'commercial', label: 'Gotero comercial' }]}
          onChange={v => setEmitter({ type: v })} />
        {p.emitter.type === 'orifice' ? <>
          <Num label="Ø orificio" value={p.emitter.orificeDiameterMm} unit="mm" min={0.3} step={0.1}
            onChange={v => setEmitter({ orificeDiameterMm: v })} />
          <Num label="Cd" value={p.emitter.cd} min={0.1} max={1} step={0.01}
            onChange={v => setEmitter({ cd: v })} />
        </> : <>
          <Num label="k (L/h@kPa^x)" value={p.emitter.commercialK} min={0.01} step={0.1}
            onChange={v => setEmitter({ commercialK: v })} />
          <Num label="x (exponente)" value={p.emitter.commercialX} min={0} max={1} step={0.01}
            onChange={v => setEmitter({ commercialX: v })} />
        </>}
        <Num label="Obstrucción" value={p.emitter.obstructionPct} unit="%" min={0} max={90} step={1}
          onChange={v => setEmitter({ obstructionPct: v })} />
      </Section>

      <Section title="Demanda Hídrica">
        <Sel<DemandMode> label="Modo" value={p.demandMode}
          options={[{ value: 'fixed', label: 'Fija por planta' }, { value: 'etc', label: 'ETc = Kc × ETo' }]}
          onChange={v => set({ demandMode: v })} />
        {p.demandMode === 'etc' ? <>
          <Num label="ETo" value={p.eto} unit="mm/día" min={0} onChange={v => set({ eto: v })} />
          <Num label="Kc" value={p.kc} min={0} step={0.01} onChange={v => set({ kc: v })} />
        </> : (
          <Num label="Demanda/planta" value={p.demandPerPlant} unit="L/día" min={0} step={0.1}
            onChange={v => set({ demandPerPlant: v })} />
        )}
        <Num label="Tiempo riego" value={p.irrigationMinutes} unit="min" min={1} step={1}
          onChange={v => set({ irrigationMinutes: v })} />
      </Section>

      <Section title="Constantes Físicas">
        <Num label="ρ (agua)" value={p.rho} unit="kg/m³" min={900} max={1100} step={1}
          onChange={v => set({ rho: v })} />
        <Num label="g" value={p.g} unit="m/s²" min={9} max={10} step={0.01}
          onChange={v => set({ g: v })} />
        <Num label="Temperatura" value={p.temperature} unit="°C" min={5} max={40} step={1}
          onChange={v => set({ temperature: v })} />
      </Section>
    </div>
  );
}
