'use client';

import type { MaterialItem } from '@/lib/types';

export default function MaterialsTable({ materials }: { materials: MaterialItem[] }) {
  return (
    <div className="space-y-3 text-sm">
      <h2 className="text-base font-bold text-slate-800">Lista de Materiales</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-blue-50 text-blue-800">
              <th className="text-left py-2 px-3 rounded-tl-lg">#</th>
              <th className="text-left py-2 px-3">Componente</th>
              <th className="text-center py-2 px-3">Cantidad</th>
              <th className="text-left py-2 px-3">Especificación</th>
              <th className="text-left py-2 px-3 rounded-tr-lg">Uso</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="py-1.5 px-3 text-slate-400">{i + 1}</td>
                <td className="py-1.5 px-3 font-semibold text-slate-800">{m.component}</td>
                <td className="py-1.5 px-3 text-center font-mono">{m.quantity}</td>
                <td className="py-1.5 px-3 text-slate-600">{m.spec}</td>
                <td className="py-1.5 px-3 text-slate-500">{m.usage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-400 italic">
        * La lista se actualiza automáticamente al modificar los parámetros del sistema.
      </p>
    </div>
  );
}
