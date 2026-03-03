import { useState } from 'react';

const ITEMS = [
  { term: 'Caudal (L/h)', explain: 'Cuánta agua sale por hora. Un grifo abierto suave ≈ 200 L/h; un gotero ≈ 1–4 L/h.' },
  { term: 'Presión (kPa)', explain: 'Qué tan fuerte empuja el agua. Más alto = más fuerza. La gravedad da presión al elevar el tanque.' },
  { term: 'EU – Uniformidad (%)', explain: 'Qué tan parejo riega el sistema. EU 95% = excelente (todas las plantas reciben casi lo mismo). Menos de 80% = algunas plantas reciben mucha menos agua.' },
  { term: 'Pérdidas (hf)', explain: 'Energía que se "pierde" por fricción en las tuberías. Tuberías más largas o más angostas = más pérdidas = menos presión en los goteros.' },
  { term: 'Q_req vs Q_real', explain: 'Q requerido es lo que necesitan las plantas. Q real es lo que entrega el sistema. Si Q_real < Q_req hay subriego.' },
  { term: 'Sobreriego / Subriego', explain: 'Sobreriego: entra más agua de la necesaria (desperdicio). Subriego: no llega suficiente agua (plantas con sed).' },
  { term: '¿Alcanza el tanque?', explain: 'Compara el volumen del tanque con lo que necesita una sesión de riego. Si no alcanza, necesitas rellenar.' },
];

export default function ExplainPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-100/50 transition-colors cursor-pointer">
        <span>❓ ¿Qué significan estos números?</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-2">
          {ITEMS.map((item, i) => (
            <div key={i} className="text-xs">
              <span className="font-bold text-blue-700">{item.term}: </span>
              <span className="text-gray-600">{item.explain}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
