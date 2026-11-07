'use client';
import { useState } from 'react';
import Link from 'next/link';
import { pointsWord, rankingPeriods, type PointKind, type RankingPeriod } from '@/lib/arena-checkin';
import { useEntity, entityAction } from './useEntity';
import { RemoteAvatar } from './Media';
import { CheckinAction, CheckinDays, LevelCard, PeriodTabs, PointBreakdown, PointRules, RankingEmpty, RankingError, RankingList, RankingSkeleton, type RankingRowView } from '../ArenaRankingParts';

type Entry = { me: boolean; rank: number; player_id: string; username: string; name: string; avatar: string | null; points: number };
type Ranking = { period: RankingPeriod; entries: Entry[]; me: { rank: number | null; points: number; all_points: number } | null; breakdown: Partial<Record<PointKind, { points: number; count: number }>>; today_done: boolean; recent_days: string[]; total_players: number };
type Activity = { period: 'week' | 'month'; arenas: { id: string; slug: string; name: string; neighborhood: string; city: string; players: number; checkins: number }[] };

export function ArenaRanking({ arenaId, isDemo }: { arenaId: string; isDemo: boolean }) {
  const [period, setPeriod] = useState<RankingPeriod>('week');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const ranking = useEntity<Ranking>(`/api/arenas/ranking?arenaId=${arenaId}&period=${period}`);
  const data = ranking.data;
  const scope = rankingPeriods.find(p => p.id === period)!.scope;
  const rows: RankingRowView[] = (data?.entries ?? []).map(e => ({ key: e.player_id, rank: e.rank, name: e.name, points: e.points, me: e.me, href: `/perfil/${e.username}`, avatar: <RemoteAvatar src={e.avatar} name={e.name} /> }));
  async function change(day: string | undefined, record: boolean) {
    setBusy(true); setMessage('');
    try {
      await entityAction('/api/arenas/ranking', { action: record ? 'record' : 'remove', arenaId, ...(day ? { day } : {}) });
      setMessage(record ? 'Check-in registrado. Ele aparece no ranking desta arena.' : 'Check-in removido.');
      ranking.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível confirmar. Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <section className="arena-ranking" aria-labelledby="arena-ranking-title">
    <h2 id="arena-ranking-title">Ranking da arena</h2>
    <p className="form-note">Pontos por check-in, publicações, fotos, vídeos e interações nesta arena, com teto por dia. O check-in é um registro seu, feito depois do jogo, sem localização.</p>
    <PeriodTabs value={period} onChange={setPeriod} />
    {ranking.loading && <RankingSkeleton />}
    {ranking.error && <RankingError message={ranking.error} retry={ranking.reload} />}
    {data && <>
      {data.me && data.me.rank ? <p className="ranking-summary" role="status">Você está em {data.me.rank}º lugar {scope}, com {pointsWord(data.me.points)}.</p> : <p className="ranking-summary" role="status">Você ainda não pontuou {scope}.</p>}
      <LevelCard points={data.me?.all_points ?? 0} />
      <PointBreakdown breakdown={data.breakdown ?? {}} />
      {rows.length ? <RankingList rows={rows} /> : <RankingEmpty scope={scope} />}
      {isDemo ? <p className="form-note">Arena fictícia: não recebe check-ins.</p> : <CheckinAction doneToday={data.today_done} busy={busy} onToggleToday={() => change(undefined, !data.today_done)}>
        <details className="checkin-other"><summary>Registrar outro dia</summary><p className="form-note">Vale hoje e os seis dias anteriores. Toque de novo para remover.</p><CheckinDays checked={data.recent_days} busy={busy} onToggle={(day, back, done) => change(back === 0 ? undefined : day, !done)} /></details>
      </CheckinAction>}
      <PointRules />
      <p role="status" className="checkin-message">{message}</p>
    </>}
  </section>;
}

export function ArenasActivity() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const activity = useEntity<Activity>(`/api/arenas/ranking?kind=activity&period=${period}`);
  const data = activity.data;
  return <section className="arena-activity" aria-labelledby="arena-activity-title">
    <div className="arena-activity-head"><h2 id="arena-activity-title">Em movimento</h2>
      <div className="feed-tabs ranking-tabs" role="group" aria-label="Período das arenas em movimento">{(['week', 'month'] as const).map(p => <button type="button" key={p} className={period === p ? 'active-tab' : ''} aria-pressed={period === p} onClick={() => setPeriod(p)}>{p === 'week' ? 'Semana' : 'Mês'}</button>)}</div></div>
    {activity.loading && <RankingSkeleton />}
    {activity.error && <RankingError message={activity.error} retry={activity.reload} />}
    {data && (data.arenas.length ? <ol className="ranking-list arena-activity-list">{data.arenas.map((a, i) => <li key={a.id} className="ranking-row"><Link href={`/arenas/${a.slug}`}><span className="rank-place" aria-label={`${i + 1}º lugar`}>{i + 1}</span><span className="rank-name"><strong>{a.name}</strong><small>{[a.neighborhood, a.city].filter(Boolean).join(' · ')}</small></span><span className="rank-days">{a.players === 1 ? '1 pessoa' : `${a.players} pessoas`}</span></Link></li>)}</ol> : <div className="ranking-empty"><h3>Sem check-ins {period === 'week' ? 'nesta semana' : 'neste mês'}.</h3><p>Abra uma arena e registre o seu para começar.</p></div>)}
  </section>;
}
