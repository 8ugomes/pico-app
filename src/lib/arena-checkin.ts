export type RankingPeriod = 'week' | 'month' | 'all';
export const rankingPeriods: { id: RankingPeriod; label: string; scope: string }[] = [
  { id: 'week', label: 'Semana', scope: 'nesta semana' },
  { id: 'month', label: 'Mês', scope: 'neste mês' },
  { id: 'all', label: 'Geral', scope: 'desde o início' },
];
export const CHECKIN_WINDOW_DAYS = 7;
const weekdays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** Calendar day (YYYY-MM-DD) in the device's local zone, `back` days before `from`. */
export function dayBack(back: number, from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() - back);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function dayLabel(back: number, from = new Date()) {
  if (back === 0) return 'Hoje';
  if (back === 1) return 'Ontem';
  return weekdays[new Date(from.getFullYear(), from.getMonth(), from.getDate() - back).getDay()];
}
export function windowDays(from = new Date()) {
  return Array.from({ length: CHECKIN_WINDOW_DAYS }, (_, back) => ({ back, day: dayBack(back, from), label: dayLabel(back, from) }));
}
export function dayWord(count: number) { return count === 1 ? '1 dia' : `${count} dias`; }
