import { useRef, useMemo, useCallback, useState } from 'react';
import { toPng, toSvg } from 'html-to-image';
import { saveAs } from 'file-saver';

import { useStore } from './store/useStore';
import { computeEngine } from './lib/engine';
import { generateMaterials } from './lib/materials';

import ParamPanel from './components/ParamPanel';
import MobileDrawer from './components/MobileDrawer';
import TechnicalDiagramSVG from './components/TechnicalDiagramSVG';
import CalcsTab from './components/CalcsTab';
import ResultsTab from './components/ResultsTab';
import SimulationTab from './components/SimulationTab';
import SketchTab from './components/SketchTab';
import MaterialsTab from './components/MaterialsTab';

type Tab = 'diagram' | 'simulation' | 'calcs' | 'results' | 'sketch' | 'materials';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'diagram', label: 'Esquema', icon: '📐' },
  { id: 'simulation', label: 'Simulación', icon: '🎬' },
  { id: 'calcs', label: 'Cálculos', icon: '🧮' },
  { id: 'results', label: 'Resultados', icon: '📊' },
  { id: 'sketch', label: 'Bosquejo', icon: '📋' },
  { id: 'materials', label: 'Materiales', icon: '🛠️' },
];

export default function App() {
  const params = useStore(s => s.params);
  const [activeTab, setActiveTab] = useState<Tab>('simulation');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const results = useMemo(() => {
    try { return computeEngine(params); } catch (e) {
      console.error('Engine error, resetting params:', e);
      useStore.getState().reset();
      return computeEngine(useStore.getState().params);
    }
  }, [params]);
  const materials = useMemo(() => generateMaterials(params), [params]);

  const exportPNG = useCallback(async () => {
    if (!svgRef.current) return;
    try {
      const dataUrl = await toPng(svgRef.current as unknown as HTMLElement, { backgroundColor: '#ffffff', pixelRatio: 3 });
      saveAs(dataUrl, 'esquema-riego-goteo.png');
    } catch (e) { console.error('Error PNG:', e); }
  }, []);

  const exportSVG = useCallback(async () => {
    if (!svgRef.current) return;
    try {
      const dataUrl = await toSvg(svgRef.current as unknown as HTMLElement, { backgroundColor: '#ffffff' });
      saveAs(dataUrl, 'esquema-riego-goteo.svg');
    } catch (e) { console.error('Error SVG:', e); }
  }, []);

  const balanceColor = results.balance === 'ok' ? 'bg-green-500' : results.balance === 'over' ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <ParamPanel />
      </MobileDrawer>

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg no-print">
        <div className="max-w-[1520px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold tracking-tight truncate">
                Riego por Goteo por Gravedad
              </h1>
              <p className="text-blue-200 text-xs mt-0.5 hidden sm:block">
                Proyecto Académico — Física / Estadística · Querétaro, México
              </p>
            </div>

            {/* Status pill */}
            <div className="flex items-center gap-2 shrink-0">
              <div className={`hidden sm:flex items-center gap-1.5 rounded-full ${balanceColor} px-3 py-1 text-xs font-semibold`}>
                <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                {results.balance === 'ok' ? 'Sistema OK' : results.balance === 'over' ? 'Sobreriego' : 'Subriego'}
              </div>

              <div className="hidden md:flex gap-1.5">
                <button onClick={exportPNG}
                  className="rounded-md bg-white/15 px-2.5 py-1.5 text-xs hover:bg-white/25 transition-colors cursor-pointer">PNG</button>
                <button onClick={exportSVG}
                  className="rounded-md bg-white/15 px-2.5 py-1.5 text-xs hover:bg-white/25 transition-colors cursor-pointer">SVG</button>
                <button onClick={() => window.print()}
                  className="rounded-md bg-white/15 px-2.5 py-1.5 text-xs hover:bg-white/25 transition-colors cursor-pointer">PDF</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1520px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex gap-5">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-80 shrink-0 no-print">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4
                            sticky top-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
              <ParamPanel />
            </div>
          </aside>

          {/* Content */}
          <section className="flex-1 min-w-0">
            {/* Mobile param button + Tabs */}
            <div className="flex items-center gap-2 mb-4 no-print">
              <button onClick={() => setDrawerOpen(true)}
                className="lg:hidden rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors cursor-pointer shrink-0">
                ⚙ Parámetros
              </button>

              <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}>
                    <span className="hidden sm:inline">{tab.icon} </span>{tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab content */}
            <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${activeTab === 'simulation' ? 'p-4 sm:p-5' : 'p-4 sm:p-6'}`}>
              {activeTab === 'diagram' && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-gray-800">Esquema Técnico del Sistema</h2>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <TechnicalDiagramSVG ref={svgRef} params={params} results={results} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-4">
                    <SC label="Demanda" value={`${results.totalDemandLDay.toFixed(2)} L/día`} color="blue" />
                    <SC label="Q real" value={`${results.qRealLh.toFixed(2)} L/h`} color="cyan" />
                    <SC label="Presión" value={`${results.P0kPa.toFixed(2)} kPa`} color="amber" />
                    <SC label="EU" value={`${results.eu.toFixed(1)}%`} color="green" />
                  </div>
                </div>
              )}

              {activeTab === 'simulation' && <SimulationTab params={params} results={results} />}
              {activeTab === 'calcs' && <CalcsTab params={params} results={results} />}
              {activeTab === 'results' && <ResultsTab params={params} results={results} />}
              {activeTab === 'sketch' && <SketchTab params={params} results={results} />}
              {activeTab === 'materials' && <MaterialsTab materials={materials} />}
            </div>

            {/* Print-only */}
            <div className="hidden print:block space-y-8 mt-4">
              <div className="bg-white p-4 border rounded-lg">
                <TechnicalDiagramSVG params={params} results={results} />
              </div>
              <div className="bg-white p-4 border rounded-lg">
                <CalcsTab params={params} results={results} />
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-4 no-print">
        Riego por Goteo por Gravedad — Proyecto Académico · Querétaro
      </footer>
    </div>
  );
}

function SC({ label, value, color }: { label: string; value: string; color: string }) {
  const m: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    green: 'bg-green-50 border-green-200 text-green-800',
  };
  return (
    <div className={`rounded-xl border p-3 ${m[color] ?? m.blue}`}>
      <div className="text-[11px] opacity-70">{label}</div>
      <div className="text-sm font-bold mt-0.5">{value}</div>
    </div>
  );
}
