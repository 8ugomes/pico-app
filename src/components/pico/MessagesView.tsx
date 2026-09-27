'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowUpRight, Check, CheckCheck, ChevronLeft, ChevronRight, MessageCircle, RefreshCw, Send } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/Button';
import type { DirectMessage, MessagePage } from '@/types/messages';
import { RemoteAvatar } from './connected/Media';
import { SafetyActions } from './connected/SafetyActions';
import { messagesCanRefresh, useMessages } from './MessagesProvider';

function formatDate(value: string, compact = false) {
  return new Date(value).toLocaleString('pt-BR', compact
    ? { day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function MessagesUnavailable() {
  const { demo } = useMessages();
  return <section className="messages-page" aria-labelledby="messages-title">
    <div className="page-heading"><h1 id="messages-title">Mensagens</h1></div>
    <div className="messages-empty"><MessageCircle size={30} aria-hidden="true" />
      <h2>{demo ? 'Conversas da sua conta ficam aqui.' : 'Mensagens ainda não estão disponíveis.'}</h2>
      <p>{demo ? 'A demonstração não envia mensagens para outras pessoas.' : 'Você pode continuar encontrando pessoas e participando das comunidades do Pico.'}</p>
      <Link href="/descobrir" className={buttonVariants({ variant: 'secondary' })}>Encontrar pessoas <ArrowUpRight size={18} aria-hidden="true" /></Link>
    </div>
  </section>;
}

export function MessagesView() {
  const { enabled, demo } = useMessages();
  return enabled && !demo ? <Inbox /> : <MessagesUnavailable />;
}

function Inbox() {
  const { data, error, loading, refreshing, online, cursor, setCursor, refresh } = useMessages();
  const [previous, setPrevious] = useState<(string | null)[]>([]);
  const hasPrevious = cursor !== null && previous.length > 0;
  useEffect(() => () => setCursor(null), [setCursor]);
  return <section className="messages-page" aria-labelledby="messages-title">
    <div className="page-heading"><h1 id="messages-title">Mensagens</h1><Button variant="quiet" size="small" disabled={!online || refreshing} onClick={refresh} aria-label="Atualizar conversas"><RefreshCw size={19} aria-hidden="true" /></Button></div>
    <p className="messages-intro">Continue a conversa depois do jogo.</p>
    <div className="messages-inbox-toolbar"><span>{data?.unreadCount ? `${data.unreadCount} ${data.unreadCount === 1 ? 'mensagem não lida' : 'mensagens não lidas'}` : 'Suas conversas'}</span><Link href="/descobrir">Encontrar pessoas <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
    {!online && <p className="messages-connection" role="status">Você está sem conexão. As conversas atualizam quando a rede voltar.</p>}
    {loading && online && <p className="read-source" role="status">Carregando conversas…</p>}
    {error && <div className="read-message" role="alert"><h2>Não deu para carregar.</h2><p>{error}</p><Button disabled={!online || refreshing} onClick={refresh}>Tentar novamente</Button></div>}
    {data && !data.items.length && <div className="messages-empty"><MessageCircle size={30} aria-hidden="true" /><h2>{cursor ? 'Você chegou ao fim das conversas.' : 'Sua primeira conversa começa com alguém.'}</h2><p>Abra o perfil de uma pessoa e toque em Mensagem. Vocês precisam se acompanhar para trocar mensagens.</p><Link href="/descobrir" className={buttonVariants()}>Encontrar pessoas <ArrowUpRight size={18} aria-hidden="true" /></Link></div>}
    {data && data.items.length > 0 && <ul className="messages-inbox" aria-label="Suas conversas">{data.items.map(item => <li key={item.id}>
      <Link className={`messages-conversation ${item.unreadCount ? 'messages-conversation-unread' : ''}`} href={'/mensagens/' + item.id}>
        <RemoteAvatar src={item.peer.avatar} name={item.peer.name} />
        <div className="messages-conversation-copy"><div className="messages-conversation-heading"><strong>{item.peer.name}</strong>{item.lastMessage && <time dateTime={item.lastMessage.createdAt}>{formatDate(item.lastMessage.createdAt, true)}</time>}</div><span className="messages-username">@{item.peer.username}</span><p>{item.lastMessage ? <>{item.lastMessage.senderId !== item.peer.id && <span>Você: </span>}{item.lastMessage.body}</> : 'Conversa iniciada. Envie a primeira mensagem.'}</p></div>
        {item.unreadCount > 0 && <span className="messages-unread-badge" aria-label={`${item.unreadCount} ${item.unreadCount === 1 ? 'mensagem não lida' : 'mensagens não lidas'}`}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</span>}
      </Link>
    </li>)}</ul>}
    {(hasPrevious || data?.nextCursor) && <nav className="messages-pagination" aria-label="Páginas de conversas">
      {hasPrevious && <Button variant="quiet" disabled={!online || refreshing} onClick={() => { setCursor(previous.at(-1) ?? null); setPrevious(values => values.slice(0, -1)); }}><ChevronLeft size={18} aria-hidden="true" />Mais recentes</Button>}
      {data?.nextCursor && <Button variant="quiet" disabled={!online || refreshing} onClick={() => { setPrevious(values => [...(cursor ? values : []), cursor]); setCursor(data.nextCursor); }}>Mais antigas<ChevronRight size={18} aria-hidden="true" /></Button>}
    </nav>}
  </section>;
}

function mergeMessages(previous: DirectMessage[], incoming: DirectMessage[]) {
  const byId = new Map(previous.map(item => [item.id, item]));
  for (const item of incoming) byId.set(item.id, item);
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}

export function MessageThreadView({ conversationId }: { conversationId: string }) {
  const { enabled, demo, identityVersion } = useMessages();
  return enabled && !demo ? <MessageThread key={`${identityVersion}:${conversationId}`} conversationId={conversationId} /> : <MessagesUnavailable />;
}

function MessageThread({ conversationId }: { conversationId: string }) {
  const { online, refresh: refreshInbox } = useMessages();
  const [data, setData] = useState<MessagePage | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [reading, setReading] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const [attempt, setAttempt] = useState<{ key: string; body: string } | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const scrollBeforeOlder = useRef<{ height: number; top: number } | null>(null);
  const writeRequest = useRef<AbortController | null>(null);
  const readRequest = useRef<AbortController | null>(null);
  const olderRequest = useRef<AbortController | null>(null);
  const latestRequest = useRef<AbortController | null>(null);
  const accessGeneration = useRef(0);
  const historyGeneration = useRef(0);
  const fetchedIds = useRef(new Set<string>());
  const draftField = useRef<HTMLTextAreaElement>(null);
  const formId = useId();
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  const latestId = data?.items[0]?.id ?? null;
  const latestIncoming = data?.items.find(item => item.senderId === data.conversation.peer.id)?.id ?? null;

  useEffect(() => {
    if (!online || !messagesCanRefresh()) return;
    const controller = new AbortController();
    const generation = accessGeneration.current;
    latestRequest.current = controller;
    async function load() {
      setFetching(true);
      try {
        const response = await fetch('/api/messages?conversation=' + encodeURIComponent(conversationId), {
          cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        });
        const payload = await response.json();
        if (!response.ok || payload.data?.conversation?.id !== conversationId || !Array.isArray(payload.data?.items)) throw Error(payload.message || 'Não foi possível carregar esta conversa.');
        if (!controller.signal.aborted && generation === accessGeneration.current) {
          const page: MessagePage = payload.data;
          const intersectsHistory = page.items.some(item => fetchedIds.current.has(item.id));
          // After a long absence, the newest page can be separated from the old
          // window by unseen messages. Replace that window and its cursor, so
          // the complete intervening history remains reachable through paging.
          if (!intersectsHistory) { historyGeneration.current += 1; fetchedIds.current.clear(); }
          for (const item of page.items) fetchedIds.current.add(item.id);
          setData(current => current && intersectsHistory ? { conversation: page.conversation, items: mergeMessages(current.items, page.items), nextCursor: current.nextCursor } : page);
          setError('');
        }
      } catch (failure) {
        if (!controller.signal.aborted && generation === accessGeneration.current) {
          // An inaccessible conversation must not retain a readable snapshot.
          accessGeneration.current += 1;
          fetchedIds.current.clear();
          setData(null);
          setError(failure instanceof Error && failure.name === 'Error' ? failure.message : 'Confira sua conexão e tente novamente.');
        }
      } finally {
        if (latestRequest.current === controller) latestRequest.current = null;
        if (!controller.signal.aborted) setFetching(false);
      }
    }
    void load();
    return () => { controller.abort(); if (latestRequest.current === controller) latestRequest.current = null; };
  }, [conversationId, online, revision]);

  useEffect(() => {
    // A slow request gets its full timeout; polling must not restart it every 8s.
    const foreground = () => { if (messagesCanRefresh() && !latestRequest.current) refresh(); };
    const timer = window.setInterval(foreground, 8000);
    window.addEventListener('focus', foreground);
    document.addEventListener('visibilitychange', foreground);
    return () => { clearInterval(timer); window.removeEventListener('focus', foreground); document.removeEventListener('visibilitychange', foreground); };
  }, [refresh]);

  useEffect(() => () => { writeRequest.current?.abort(); readRequest.current?.abort(); olderRequest.current?.abort(); }, []);

  useLayoutEffect(() => {
    const element = list.current;
    if (!element) return;
    const before = scrollBeforeOlder.current;
    if (before) { element.scrollTop = before.top + element.scrollHeight - before.height; scrollBeforeOlder.current = null; }
    else if (nearBottom.current) element.scrollTop = element.scrollHeight;
  }, [latestId, data?.items.length]);

  async function loadOlder() {
    if (!data?.nextCursor || olderRequest.current || !navigator.onLine) return;
    const controller = new AbortController();
    const generation = accessGeneration.current;
    const history = historyGeneration.current;
    olderRequest.current = controller; setLoadingOlder(true); setNotice(null);
    try {
      const params = new URLSearchParams({ conversation: conversationId, before: data.nextCursor });
      const response = await fetch('/api/messages?' + params, { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
      const payload = await response.json();
      if (!response.ok || payload.data?.conversation?.id !== conversationId || !Array.isArray(payload.data?.items)) {
        if ([401, 403, 404].includes(response.status) && !controller.signal.aborted && generation === accessGeneration.current) {
          accessGeneration.current += 1; fetchedIds.current.clear(); setData(null); setError(payload.message || 'Esta conversa não está disponível.');
        }
        throw Error(payload.message || 'Não foi possível carregar as mensagens anteriores.');
      }
      if (!controller.signal.aborted && generation === accessGeneration.current && history === historyGeneration.current) {
        if (list.current) scrollBeforeOlder.current = { height: list.current.scrollHeight, top: list.current.scrollTop };
        const page: MessagePage = payload.data;
        for (const item of page.items) fetchedIds.current.add(item.id);
        setData(current => current ? { conversation: page.conversation, items: mergeMessages(current.items, page.items), nextCursor: page.nextCursor } : null);
      }
    } catch (failure) {
      if (!controller.signal.aborted && generation === accessGeneration.current) setNotice({ error: true, text: failure instanceof Error && failure.name === 'Error' ? failure.message : 'Não foi possível carregar as mensagens anteriores. Tente novamente.' });
    } finally { if (!controller.signal.aborted) { olderRequest.current = null; setLoadingOlder(false); } }
  }

  async function markRead() {
    if (!latestId || !latestIncoming || readRequest.current || !navigator.onLine) return;
    const controller = new AbortController();
    const generation = accessGeneration.current;
    readRequest.current = controller; setReading(true); setNotice(null);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST', cache: 'no-store', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read', conversationId, throughId: latestId }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
      });
      const payload = await response.json();
      if (!response.ok || payload.data?.saved !== true) {
        if ([401, 403, 404].includes(response.status) && !controller.signal.aborted && generation === accessGeneration.current) {
          accessGeneration.current += 1; fetchedIds.current.clear(); setData(null); setError(payload.message || 'Esta conversa não está disponível.');
        }
        throw Error(payload.message || 'Não foi possível confirmar a leitura.');
      }
      if (!controller.signal.aborted && generation === accessGeneration.current) {
        setData(current => current ? { ...current, conversation: { ...current.conversation, unreadCount: 0 } } : null);
        setNotice({ error: false, text: 'Conversa marcada como lida.' }); refreshInbox();
      }
    } catch (failure) {
      if (!controller.signal.aborted && generation === accessGeneration.current) setNotice({ error: true, text: failure instanceof Error && failure.name === 'Error' ? failure.message : 'Não foi possível confirmar a leitura. Tente novamente.' });
    } finally { if (!controller.signal.aborted) { readRequest.current = null; setReading(false); } }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (writeRequest.current || !navigator.onLine || !data?.conversation.canSend) return;
    const body = attempt?.body ?? draft.trim();
    if (!body || body.length > 2000) return;
    const pending = attempt ?? { key: crypto.randomUUID(), body };
    const controller = new AbortController();
    const generation = accessGeneration.current;
    writeRequest.current = controller; setAttempt(pending); setSending(true); setNotice(null);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST', cache: 'no-store', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', conversationId, key: pending.key, body: pending.body }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
      });
      const payload = await response.json();
      if (!response.ok || payload.data?.conversationId !== conversationId || typeof payload.data?.id !== 'string') {
        // A rejected request is editable. An uncertain response retains the exact
        // key and body, so retry confirms the original write without duplicating it.
        // A later rejection cannot disprove an earlier uncertain commit.
        if (!attempt && [400, 401, 403, 404, 413, 422, 429].includes(response.status) && !controller.signal.aborted && generation === accessGeneration.current) setAttempt(null);
        if ([401, 403, 404].includes(response.status) && !controller.signal.aborted) refresh();
        throw Error(payload.message || 'Não foi possível confirmar o envio. Tente novamente.');
      }
      if (!controller.signal.aborted && generation === accessGeneration.current) {
        nearBottom.current = true;
        setData(current => current ? { ...current, items: mergeMessages(current.items, [payload.data]) } : null);
        setAttempt(null); setDraft(''); setNotice({ error: false, text: 'Mensagem enviada.' });
        refreshInbox(); requestAnimationFrame(() => draftField.current?.focus({ preventScroll: true }));
      }
    } catch (failure) {
      if (!controller.signal.aborted && generation === accessGeneration.current) setNotice({ error: true, text: failure instanceof Error && failure.name === 'Error' ? failure.message : 'Não foi possível confirmar o envio. Tente novamente para conferir esta mensagem.' });
    } finally { if (!controller.signal.aborted) { writeRequest.current = null; setSending(false); } }
  }

  return <section className="messages-page messages-thread" aria-labelledby="conversation-title">
    <Link href="/mensagens" className="messages-back"><ArrowLeft size={18} aria-hidden="true" />Mensagens</Link>
    {!data && !error && <h1 id="conversation-title" className="sr-only">Conversa</h1>}
    {!online && <p className="messages-connection" role="status">Você está sem conexão. Seu texto continua nesta tela; o envio precisa de internet.</p>}
    {!data && !error && online && <p className="read-source" role="status">Carregando conversa…</p>}
    {error && <div className="read-message" role="alert"><h1 id="conversation-title">Conversa indisponível.</h1><p>{error}</p><Button disabled={!online || fetching} onClick={refresh}>Tentar novamente</Button></div>}
    {data && <>
      <header className="messages-thread-heading"><Link href={'/perfil/' + encodeURIComponent(data.conversation.peer.username)} className="messages-peer"><RemoteAvatar src={data.conversation.peer.avatar} name={data.conversation.peer.name} /><div><h1 id="conversation-title">{data.conversation.peer.name}</h1><span>@{data.conversation.peer.username}</span></div></Link><SafetyActions target="player" id={data.conversation.peer.id} playerId={data.conversation.peer.id} name={data.conversation.peer.name} onChange={() => { accessGeneration.current += 1; fetchedIds.current.clear(); setData(null); refresh(); refreshInbox(); }} /></header>
      <p className="messages-thread-context">Conversa entre vocês. Mensagens não aparecem no feed.</p>
      <div className="messages-thread-tools">
        <Button variant="quiet" size="small" disabled={!online || fetching} onClick={refresh} aria-label="Atualizar conversa"><RefreshCw size={17} aria-hidden="true" />Atualizar</Button>
        {latestIncoming && data.conversation.unreadCount > 0 && <Button variant="quiet" size="small" disabled={!online || reading} onClick={() => void markRead()}><CheckCheck size={17} aria-hidden="true" />{reading ? 'Salvando leitura…' : 'Marcar como lida'}</Button>}
      </div>
      {data.nextCursor && <Button className="messages-older" variant="quiet" size="small" disabled={!online || loadingOlder} onClick={() => void loadOlder()}>{loadingOlder ? 'Carregando…' : 'Carregar mensagens anteriores'}</Button>}
      <div ref={list} className="messages-history" tabIndex={0} role="log" aria-live="polite" aria-relevant="additions text" aria-label="Histórico da conversa" onScroll={() => { const element = list.current; if (element) nearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 100; }}>
        {!data.items.length ? <div className="messages-thread-empty"><MessageCircle size={26} aria-hidden="true" /><h2>A conversa começa aqui.</h2><p>Que tal combinar o próximo jogo?</p></div> : <ol className="messages-log" aria-label="Mensagens da conversa">{[...data.items].reverse().map(item => {
          const own = item.senderId !== data.conversation.peer.id;
          return <li key={item.id} className={`messages-bubble ${own ? 'messages-bubble-own' : ''}`}><div className="messages-message-heading"><span className="messages-author">{own ? 'Você' : data.conversation.peer.name}</span>{!own && <SafetyActions target="message" id={item.id} playerId={data.conversation.peer.id} name={data.conversation.peer.name} onChange={() => { accessGeneration.current += 1; fetchedIds.current.clear(); setData(null); refresh(); refreshInbox(); }} />}</div><p>{item.body}</p><div className="messages-message-meta"><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>{own && <span><Check size={13} aria-hidden="true" />Enviada</span>}</div></li>;
        })}</ol>}
      </div>
      {data.items.length > 0 && <Button className="messages-to-recent" variant="quiet" size="small" onClick={() => { if (list.current) { nearBottom.current = true; list.current.scrollTop = list.current.scrollHeight; list.current.focus({ preventScroll: true }); } }}><ArrowDown size={16} aria-hidden="true" />Últimas mensagens</Button>}
      {!data.conversation.canSend && <p className="messages-connection" role="status">Vocês precisam se acompanhar para trocar mensagens. O histórico continua disponível.</p>}
      <form className="messages-composer" onSubmit={event => void send(event)}>
        <label htmlFor={formId}>Mensagem</label>
        <textarea ref={draftField} id={formId} className="input" rows={3} maxLength={2000} value={draft} readOnly={Boolean(attempt)} disabled={sending || !data.conversation.canSend} placeholder="Escreva sua mensagem…" aria-describedby={`${formId}-help${notice?.error ? ` ${formId}-notice` : ''}`} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
        <div className="messages-composer-footer"><span id={`${formId}-help`}>{attempt && !sending ? 'Tente novamente para confirmar este envio.' : 'Até 2.000 caracteres.'}<span className="messages-character-count">{draft.length}/2000</span></span><Button type="submit" disabled={!online || sending || !data.conversation.canSend || !(attempt?.body ?? draft.trim())}><Send size={17} aria-hidden="true" />{sending ? 'Enviando…' : attempt ? 'Tentar novamente' : 'Enviar'}</Button></div>
      </form>
    </>}
    {notice && <p id={`${formId}-notice`} className={`auth-notice ${notice.error ? 'notice-error' : 'notice-success'}`} role={notice.error ? 'alert' : 'status'}>{notice.text}</p>}
  </section>;
}
