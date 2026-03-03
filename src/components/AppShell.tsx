'use client';

import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { toPng, toSvg } from 'html-to-image';
import { saveAs } from 'file-saver';

import type { SystemParams } from '@/lib/types';
import { DEFAULT_PARAMS, loadParams, saveParams, exportParamsJSON, importParamsJSON } from '@/lib/defaults';
import { computeHydraulics } from '@/lib/hydraulics';
import { generateMaterials } from '@/lib/materials';

import ParamPanel from './ParamPanel';
import TechnicalDiagramSVG from './TechnicalDiagramSVG';
import FlowSimulationView from './FlowSimulationView';
import CalculationSteps from './CalculationSteps';
import ResultsSummary from './ResultsSummary';
import SimulationSketchSection from './SimulationSketchSection';
import MaterialsTable from './MaterialsTable';
import ExportToolbar from './ExportToolbar';
import AlertsPanel from './AlertsPanel';

type Tab = 'diagram' | 'simulation' | 'calcs' | 'results' | 'sketch' | 'materials';
const TABS: { id: Tab; label: string }[] = [
  { id: 'diagram',    label: 'Esquema' },
  { id: 'simulation', label: 'Simulación' },
  { id: 'calcs',      label: 'Cálculos' },
  { id: 'results',    label: 'Resultados' },
  { id: 'sketch',     label: 'Bosquejo' },
  { id: 'materials',  label: 'Materiales' },
];

export default function AppShell() {
  const [params, setParamsRaw] = useState<SystemParams>(DEFAULT_PARAMS);
  const [activeTab, setActiveTab] = useState<Tab>('diagram');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setParamsRaw(loadParams());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveParams(params);
  }, [params, hydrated]);

  const setParams = useCallback((partial: Partial<SystemParams>) => {
    setParamsRaw(prev => ({ ...prev, ...partial }));
  }, []);
  const resetParams = useCallback(() => setParamsRaw({ ...DEFAULT_PARAMS }), []);

  const results   = useMemo(() => computeHydraulics(params),   [params]);
  const materials = useMemo(() => generateMaterials(params), [params]);

  const handleExportPNG = useCallback(async () => {
    if (!svgRef.current) return;
    try {
      const url = await toPng(svgRef.current as unknown as HTMLElement, { backgroundColor: '#fff', pixelRatio: 3 });
      saveAs(url, 'esquema-riego-goteo.png');
    } catch (e) { console.error(e); }
  }, []);

  const handleExportSVG = useCallback(async () => {
    if (!svgRef.current) return;
    try {
      const url = await toSvg(svgRef.current as unknown as HTMLElement, { backgroundColor: '#fff' });
      saveAs(url, 'esquema-riego-goteo.svg');
    } catch (e) { console.error(e); }
  }, []);

  const handleExportJSON = useCallback(() => {
    const blob = new Blob([exportParamsJSON(params)], { type: 'application/json' });
    saveAs(blob, 'parametros-riego.json');
  }, [params]);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      const imported = importParamsJSON(text);
      if (imported) setParamsRaw(imported);
    };
    input.click();
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white shadow-lg no-print">
        <div className="max-w-[1520px] mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg md:text-xl font-bold tracking-tight truncate">
                Riego por Goteo por Gravedad
              </h1>
              <p className="text-blue-200 text-[10px] sm:text-xs mt-0.5 hidden sm:block">
                Proyecto Académico — Física / Estadística · Querétaro, México
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Botón móvil para sidebar */}
              <button onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden rounded-md bg-white/15 p-1.5 hover:bg-white/25 transition-colors cursor-pointer"
                aria-label="Parámetros">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>
              <div className="hidden sm:block">
                <ExportToolbar
                  onPNG={handleExportPNG}
                  onSVG={handleExportSVG}
                  onPrint={() => window.print()}
                  onExportJSON={handleExportJSON}
                  onImportJSON={handleImportJSON}
                />
              </div>
            </div>
          </div>
          {/* Export en móvil: fila debajo */}
          <div className="sm:hidden mt-2">
            <ExportToolbar
              onPNG={handleExportPNG}
              onSVG={handleExportSVG}
              onPrint={() => window.print()}
              onExportJSON={handleExportJSON}
              onImportJSON={handleImportJSON}
            />
          </div>
        </div>
      </header>

      {/* ── Alertas ──────────────────────────────────────────── */}
      {results.warnings.length > 0 && (
        <div className="max-w-[1520px] mx-auto px-3 sm:px-4 mt-3 no-print">
          <AlertsPanel warnings={results.warnings} />
        </div>
      )}

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="max-w-[1520px] mx-auto px-3 sm:px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 items-start">

          {/* Overlay oscuro en móvil cuando sidebar está abierta */}
          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/40 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)} />
          )}

          {/* Columna izquierda: parámetros */}
          <aside className={`
            fixed top-0 left-0 z-40 h-full w-[300px] bg-white shadow-xl
            transform transition-transform duration-300 ease-in-out overflow-y-auto
            lg:relative lg:z-auto lg:h-auto lg:w-[310px] lg:shrink-0
            lg:transform-none lg:shadow-sm lg:rounded-xl lg:border lg:border-slate-200
            lg:sticky lg:top-3 lg:max-h-[calc(100vh-5rem)]
            no-print
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="p-4">
              {/* Botón cerrar en móvil */}
              <div className="flex items-center justify-between mb-3 lg:hidden">
                <span className="text-sm font-bold text-slate-800">Parámetros</span>
                <button onClick={() => setSidebarOpen(false)}
                  className="rounded-md bg-slate-100 p-1 hover:bg-slate-200 transition cursor-pointer"
                  aria-label="Cerrar">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ParamPanel params={params} onChange={setParams} onReset={resetParams} />
            </div>
          </aside>

          {/* Columna derecha: contenido */}
          <section className="flex-1 min-w-0 w-full space-y-4">
            {/* Tabs — scroll horizontal en móvil */}
            <nav className="flex gap-1 overflow-x-auto pb-1 no-print -mx-1 px-1 scrollbar-none">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0
                    ${activeTab === t.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
                  {t.label}
                </button>
              ))}
            </nav>

            {/* Contenido de tab */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-5">
              {activeTab === 'diagram' && (
                <div className="space-y-4">
                  <h2 className="text-sm sm:text-base font-bold text-slate-800">Esquema Técnico del Sistema</h2>
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white -mx-1 sm:mx-0">
                    <TechnicalDiagramSVG ref={svgRef} params={params} results={results} />
                  </div>
                  <QuickStats results={results} />
                </div>
              )}
              {activeTab === 'simulation' && (
                <FlowSimulationView params={params} results={results} />
              )}
              {activeTab === 'calcs' && (
                <CalculationSteps params={params} results={results} />
              )}
              {activeTab === 'results' && (
                <ResultsSummary params={params} results={results} />
              )}
              {activeTab === 'sketch' && (
                <SimulationSketchSection params={params} />
              )}
              {activeTab === 'materials' && (
                <MaterialsTable materials={materials} />
              )}
            </div>

            {/* Print: mostrar todo */}
            <div className="hidden print:block space-y-6">
              <div className="bg-white p-4 border rounded-lg">
                <TechnicalDiagramSVG params={params} results={results} />
              </div>
              <div className="bg-white p-4 border rounded-lg print-break">
                <CalculationSteps params={params} results={results} />
              </div>
              <div className="bg-white p-4 border rounded-lg print-break">
                <ResultsSummary params={params} results={results} />
              </div>
              <div className="bg-white p-4 border rounded-lg print-break">
                <SimulationSketchSection params={params} />
              </div>
              <div className="bg-white p-4 border rounded-lg print-break">
                <MaterialsTable materials={materials} />
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="text-center text-[10px] sm:text-xs text-slate-400 py-4 no-print">
        Sistema de Riego por Goteo por Gravedad — Proyecto Académico · Querétaro, México
      </footer>
    </div>
  );
}

function QuickStats({ results: r }: { results: ReturnType<typeof computeHydraulics> }) {
  const cards = [
    { label: 'Demanda Total',  value: `${r.totalDemandLDay.toFixed(2)} L/día`,  bg: 'bg-blue-50 border-blue-200 text-blue-800' },
    { label: 'Caudal Total',   value: `${r.qTotalLh.toFixed(2)} L/h`,           bg: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
    { label: 'Presión (h)',    value: `${r.pressurekPa.toFixed(2)} kPa`,         bg: 'bg-amber-50 border-amber-200 text-amber-800' },
    { label: 'Uniformidad',    value: `${r.uniformity.toFixed(1)}%`,             bg: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
      {cards.map(c => (
        <div key={c.label} className={`rounded-lg border p-2 sm:p-3 ${c.bg}`}>
          <div className="text-[10px] sm:text-[11px] opacity-70">{c.label}</div>
          <div className="text-xs sm:text-sm font-bold mt-0.5">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
