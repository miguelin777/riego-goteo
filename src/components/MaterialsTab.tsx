import type { MaterialItem } from '../types';

interface Props { materials: MaterialItem[] }

export default function MaterialsTab({ materials }: Props) {
  return (
    <div className="space-y-3 text-sm">
      <h2 className="text-base font-bold text-gray-800">Lista de Materiales</h2>
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
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-1.5 px-3 text-gray-400">{i + 1}</td>
                <td className="py-1.5 px-3 font-semibold text-gray-800">{m.component}</td>
                <td className="py-1.5 px-3 text-center font-mono">{m.quantity}</td>
                <td className="py-1.5 px-3 text-gray-600">{m.spec}</td>
                <td className="py-1.5 px-3 text-gray-500">{m.usage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 italic">
        * La lista se actualiza automáticamente al modificar parámetros (longitudes, diámetros, material, emisores).
      </p>
    </div>
  );
}
