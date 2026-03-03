'use client';

import type { ValidationWarning } from '@/lib/types';

const ICONS: Record<string, string> = {
  error:   '⛔',
  warning: '⚠️',
  info:    'ℹ️',
};
const COLORS: Record<string, string> = {
  error:   'bg-red-50 border-red-300 text-red-800',
  warning: 'bg-amber-50 border-amber-300 text-amber-800',
  info:    'bg-blue-50 border-blue-300 text-blue-800',
};

export default function AlertsPanel({ warnings }: { warnings: ValidationWarning[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {warnings.map((w, i) => (
        <div key={i} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${COLORS[w.type]}`}>
          <span className="mt-0.5 shrink-0">{ICONS[w.type]}</span>
          <span>{w.message}</span>
        </div>
      ))}
    </div>
  );
}
