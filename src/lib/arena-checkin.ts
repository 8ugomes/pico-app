export type RankingPeriod = 'week' | 'month' | 'all';
export const rankingPeriods: { id: RankingPeriod; label: string; scope: string }[] = [
  { id: 'week', label: 'Semana', scope: 'nesta semana' },
  { id: 'month', label: 'Mês', scope: 'neste mês' },
  { id: 'all', label: 'Geral', scope: 'desde o início' },
];
export const CHECKIN_WINDOW_DAYS = 7;
const weekdays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
// The server decides check-in days in São Paulo time, so the chips use the same calendar on any device.
const saoPaulo = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });

function saoPauloDate(from: Date, back = 0) {
  const [year, month, day] = saoPaulo.format(from).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day - back));
}
/** Calendar day (YYYY-MM-DD) in São Paulo, `back` days before the instant `from`. */
export function dayBack(back: number, from = new Date()) {
  return saoPauloDate(from, back).toISOString().slice(0, 10);
}
export function dayLabel(back: number, from = new Date()) {
  if (back === 0) return 'Hoje';
  if (back === 1) return 'Ontem';
  return weekdays[saoPauloDate(from, back).getUTCDay()];
}
export function windowDays(from = new Date()) {
  return Array.from({ length: CHECKIN_WINDOW_DAYS }, (_, back) => ({ back, day: dayBack(back, from), label: dayLabel(back, from) }));
}
export function dayWord(count: number) { return count === 1 ? '1 dia' : `${count} dias`; }

export type PointKind = 'checkin' | 'post' | 'comment' | 'like_given' | 'like_received' | 'repost';
// Mirrors pico_private.arena_scored_events. The server is the source of truth; this is only the explanation shown to people.
export const pointRules: { kind: PointKind; label: string; points: string; cap: string }[] = [
  { kind: 'checkin', label: 'Check-in do dia', points: '5', cap: '1 por dia' },
  { kind: 'post', label: 'Publicação (texto 2, foto 4, vídeo 6)', points: '2 a 6', cap: '3 por dia' },
  { kind: 'comment', label: 'Comentário em post de outra pessoa', points: '1', cap: '5 por dia' },
  { kind: 'like_given', label: 'Curtida em post de outra pessoa', points: '1', cap: '5 por dia' },
  { kind: 'like_received', label: 'Curtida no seu post', points: '1', cap: '10 por dia' },
  { kind: 'repost', label: 'Republicação de outra pessoa', points: '3', cap: '2 por dia' },
];
export const pointKindLabels: Record<PointKind, string> = {
  checkin: 'Check-ins', post: 'Publicações', comment: 'Comentários', like_given: 'Curtidas dadas', like_received: 'Curtidas recebidas', repost: 'Republicações',
};
export const arenaLevels = [
  { min: 0, name: 'Pé na areia' }, { min: 25, name: 'Saque' }, { min: 100, name: 'Rally' }, { min: 250, name: 'Ace' }, { min: 600, name: 'Lenda do Pico' },
];
export function levelFor(points: number) {
  let index = 0;
  arenaLevels.forEach((level, i) => { if (points >= level.min) index = i; });
  const current = arenaLevels[index], next = arenaLevels[index + 1] ?? null;
  const progress = next ? Math.min(1, (points - current.min) / (next.min - current.min)) : 1;
  return { current, next, progress, remaining: next ? next.min - points : 0 };
}
export function pointsWord(points: number) { return points === 1 ? '1 ponto' : `${points} pontos`; }
