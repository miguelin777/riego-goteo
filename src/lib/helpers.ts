import type { EngineResults, SystemParams } from '../types';

export function pressureColor(ratio: number): string {
  if (ratio > 0.8) return '#22c55e';
  if (ratio > 0.5) return '#eab308';
  return '#ef4444';
}

export function flowStatusColor(qi: number, qTarget: number): string {
  if (qTarget <= 0) return '#94a3b8';
  const r = qi / qTarget;
  if (r >= 0.9 && r <= 1.1) return '#22c55e';
  if (r >= 0.7 && r <= 1.3) return '#eab308';
  return '#ef4444';
}

export function flowStatusLabel(qi: number, qTarget: number): string {
  if (qTarget <= 0) return '—';
  const r = qi / qTarget;
  if (r >= 0.9 && r <= 1.1) return 'OK';
  if (r < 0.9) return 'Bajo';
  return 'Alto';
}

export function pressureGradientStops(r: EngineResults): { offset: string; color: string }[] {
  if (r.emitters.length === 0) return [{ offset: '0%', color: '#22c55e' }];
  const pMax = Math.max(...r.emitters.map(e => e.pLocal), 1);
  return r.emitters.map((e, i) => ({
    offset: `${(i / Math.max(r.emitters.length - 1, 1)) * 100}%`,
    color: pressureColor(e.pLocal / pMax),
  }));
}

export function tankEnough(p: SystemParams, r: EngineResults): { enough: boolean; needed: number; pct: number } {
  const irrigH = p.irrigationMinutes / 60;
  const needed = r.qRealLh * irrigH;
  const enough = p.tankVolume >= needed;
  const pct = needed > 0 ? (p.tankVolume / needed) * 100 : 100;
  return { enough, needed: +needed.toFixed(2), pct: +pct.toFixed(0) };
}

export function buildHistBins(values: number[], nBins = 8): { label: string; count: number; lo: number; hi: number }[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const bw = (max - min) / nBins || 1;
  const bins = Array.from({ length: nBins }, (_, i) => ({
    label: (min + (i + 0.5) * bw).toFixed(2),
    count: 0,
    lo: min + i * bw,
    hi: min + (i + 1) * bw,
  }));
  values.forEach(v => {
    const idx = Math.min(Math.floor((v - min) / bw), nBins - 1);
    bins[idx].count++;
  });
  return bins;
}

export function stats(arr: number[]) {
  if (arr.length === 0) return { mean: 0, min: 0, max: 0, std: 0, p10: 0, p90: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const std = Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length);
  const pct = (p: number) => {
    const idx = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  };
  return { mean, min: sorted[0], max: sorted[sorted.length - 1], std, p10: pct(10), p90: pct(90) };
}

export function diagnosisRecommendations(r: EngineResults): string[] {
  const recs: string[] = [];
  if (r.balance === 'over') {
    recs.push('Reduce el diámetro del emisor o baja la altura del tanque.');
    recs.push('Puedes reducir el tiempo de riego.');
  }
  if (r.balance === 'under') {
    recs.push('Aumenta la altura del tanque para más presión.');
    recs.push('Reduce pérdidas: usa tuberías más anchas o más cortas.');
    recs.push('Aumenta el tiempo de riego a ~' + r.recommendedMinutes.toFixed(0) + ' min.');
  }
  if (r.eu < 80) {
    recs.push('Uniformidad baja: aumenta Ø de lateral o reduce su longitud.');
    recs.push('Considera usar goteros autocompensantes.');
  }
  return recs;
}
