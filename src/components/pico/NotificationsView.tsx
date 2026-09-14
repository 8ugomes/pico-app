'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, ChevronLeft, ChevronRight, RefreshCw, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNotifications } from './NotificationsProvider';
import { MutationNotice } from './connected/useMutation';

export function NotificationsView() {
  const { data, error, loading, refreshing, busy, demo, notice, refresh, markRead, cursor, setCursor } = useNotifications();
  const [previous, setPrevious] = useState<(string | null)[]>([]);
  useEffect(() => () => setCursor(null), [setCursor]);
  const unread = data?.unreadCount ?? 0;
  return <section className="notifications-page" aria-labelledby="notifications-title">
    <div className="page-heading"><h1 id="notifications-title">Notificações</h1><Button variant="quiet" size="small" onClick={refresh} disabled={refreshing || demo} aria-label="Atualizar notificações"><RefreshCw size={18} aria-hidden="true" /></Button></div>
    <p className="notifications-intro">Quem chegou às suas comunidades.</p>
    {unread > 0 && <div className="notifications-toolbar"><span>{unread} não {unread === 1 ? 'lida' : 'lidas'}</span><Button variant="quiet" size="small" disabled={busy || refreshing} onClick={() => void markRead()}><CheckCheck size={18} aria-hidden="true" />Marcar todas como lidas</Button></div>}
    <MutationNotice message={notice} />
    {loading && <p className="read-source" role="status">Carregando notificações…</p>}
    {error && <div className="read-message" role="alert"><h2>Não deu para carregar.</h2><p>{error}</p><Button onClick={refresh}>Tentar novamente</Button></div>}
    {data && data.items.length === 0 && <div className="social-empty"><Bell size={28} aria-hidden="true" /><h2>{cursor ? 'Fim das notificações.' : 'Nenhuma notificação por enquanto.'}</h2><p>{demo ? 'Na demonstração, ninguém entra de verdade. Suas notificações aparecem quando você usa sua conta.' : 'Quando alguém entrar em uma comunidade da qual você participa, o aviso aparece aqui.'}</p></div>}
    {data && data.items.length > 0 && <ul className="notifications-list" aria-label="Atividade nas suas comunidades">
      {data.items.map(item => <li key={item.id} className={`notification-row ${item.read_at ? '' : 'notification-unread'}`}>
        <span className="notification-person" aria-hidden="true"><UsersRound size={22} /></span>
        <div className="notification-content"><p><strong>{item.actor_name}</strong> entrou na comunidade <Link href={'/comunidades/' + item.community_slug}>{item.community_name}</Link>.</p>
          <div className="notification-meta"><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time><span>{item.read_at ? 'Lida' : 'Não lida'}</span></div>
          {!item.read_at && <Button variant="quiet" size="small" disabled={busy || refreshing} onClick={() => void markRead([item.id])} aria-label={`Marcar como lida: ${item.actor_name} em ${item.community_name}`}><Check size={16} aria-hidden="true" />Marcar como lida</Button>}
        </div>
      </li>)}
    </ul>}
    {(previous.length > 0 || data?.nextCursor) && <nav className="notifications-pagination" aria-label="Páginas de notificações">
      {previous.length > 0 && <Button variant="quiet" disabled={refreshing} onClick={() => { setCursor(previous.at(-1) ?? null); setPrevious(values => values.slice(0, -1)); }}><ChevronLeft size={18} aria-hidden="true" />Mais recentes</Button>}
      {data?.nextCursor && <Button variant="quiet" disabled={refreshing} onClick={() => { setPrevious(values => [...values, cursor]); setCursor(data.nextCursor); }} >Mais antigas<ChevronRight size={18} aria-hidden="true" /></Button>}
    </nav>}
  </section>;
}
