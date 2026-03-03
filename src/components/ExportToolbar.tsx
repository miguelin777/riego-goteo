'use client';

interface Props {
  onPNG: () => void;
  onSVG: () => void;
  onPrint: () => void;
  onExportJSON: () => void;
  onImportJSON: () => void;
}

function Btn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-medium
                 hover:bg-white/25 transition-colors cursor-pointer whitespace-nowrap">
      {children}
    </button>
  );
}

export default function ExportToolbar({ onPNG, onSVG, onPrint, onExportJSON, onImportJSON }: Props) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      <Btn onClick={onPNG}>PNG</Btn>
      <Btn onClick={onSVG}>SVG</Btn>
      <Btn onClick={onPrint}>Imprimir</Btn>
      <Btn onClick={onExportJSON}>Exportar JSON</Btn>
      <Btn onClick={onImportJSON}>Importar JSON</Btn>
    </div>
  );
}
