import type { SystemParams, EngineResults } from '../types';
import SimulationCanvas from './SimulationCanvas';
import ResultsDashboard from './ResultsDashboard';
import ExplainPanel from './ExplainPanel';
import ChartsGrid from './ChartsGrid';
import HistogramsPanel from './HistogramsPanel';
import AdvancedPanel from './AdvancedPanel';

interface Props { params: SystemParams; results: EngineResults }

export default function SimulationTab({ params, results }: Props) {
  return (
    <div className="space-y-6">
      {/* Simulation Canvas */}
      <section>
        <h2 className="text-base font-bold text-gray-800 mb-3">Simulación de Flujo</h2>
        <SimulationCanvas params={params} results={results} />
      </section>

      <hr className="border-gray-200" />

      {/* Results */}
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-gray-800">Resultados</h2>
        <ResultsDashboard params={params} results={results} />
        <ExplainPanel />
        <ChartsGrid params={params} results={results} />
        <HistogramsPanel results={results} />
        <AdvancedPanel params={params} results={results} />
      </section>
    </div>
  );
}
