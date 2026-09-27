import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Flag, LoaderCircle, MessageCircle, Repeat2, Send, Trash2 } from 'lucide-react';
import { api, query } from './api';
import { attempts } from './attempts';
import { selectionHaptic, successHaptic } from './native';
import { Avatar, Button, EmptyState, ErrorState, Field, LoadingState, Modal, Notice, errorMessage } from './ui';

type MobileComment = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  name: string;
  username: string;
  avatar: string | null;
};

type CommentsResponse = {
  kind: 'comments';
  comments: MobileComment[];
  hasMore: boolean;
  viewerId: string;
};

type CommentsState =
  | { status: 'idle' | 'loading'; data: CommentsResponse | null; message: '' }
  | { status: 'ready'; data: CommentsResponse; message: '' }
  | { status: 'error'; data: CommentsResponse | null; message: string };

type ReportReason = 'spam' | 'harassment' | 'unsafe' | 'other';

export function CommentsAction({
  postId,
  author,
  count,
  online,
  onChanged,
}: {
  postId: string;
  author: string;
  count: number;
  online: boolean;
  onChanged?: () => void;
}) {
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<CommentsState>({ status: 'idle', data: null, message: '' });
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [notice, setNotice] = useState('');
  const [countState, setCountState] = useState({ source: count, value: count });
  const [reporting, setReporting] = useState<MobileComment | null>(null);
  const [deleting, setDeleting] = useState<MobileComment | null>(null);
  const sendLock = useRef(false);
  const displayCount = countState.source === count ? countState.value : count;

  useEffect(() => {
    if (!open || !online || reporting || deleting) return;
    const controller = new AbortController();
    let active = true;
    void api.request<CommentsResponse>(query('/social', { resource: 'comments', postId, offset }), {
      signal: controller.signal,
    }).then((data) => {
      if (!active) return;
      if (data.kind !== 'comments') throw new Error('Não foi possível abrir os comentários.');
      setState({ status: 'ready', data, message: '' });
    }).catch((cause) => {
      if (active && !controller.signal.aborted) {
        setState((current) => ({ status: 'error', data: current.data, message: errorMessage(cause) }));
      }
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [deleting, offset, online, open, postId, reporting, revision]);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextBody = body.trim();
    if (!online || sendLock.current || !nextBody) return;
    sendLock.current = true;
    setSending(true);
    setSendError('');
    setNotice('');
    try {
      const accountId = api.user?.id;
      if (!accountId) throw new Error('Entre novamente para comentar.');
      const attempt = await attempts.comment(accountId, postId, nextBody);
      await api.request('/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_comment', postId, body: nextBody, key: attempt.key }),
      });
      const cleared = await attempts.confirmComment(accountId, attempt.key);
      if (!cleared) throw new Error('O comentário foi confirmado, mas a tentativa local ainda precisa ser limpa. Tente enviar novamente; ele não será duplicado.');
      setBody('');
      setOffset(0);
      setCountState((current) => ({
        source: count,
        value: (current.source === count ? current.value : count) + 1,
      }));
      setNotice('Comentário enviado.');
      setState((current) => ({ status: 'loading', data: current.data, message: '' }));
      setRevision((current) => current + 1);
      await successHaptic();
      onChanged?.();
    } catch (cause) {
      setSendError(errorMessage(cause));
    } finally {
      sendLock.current = false;
      setSending(false);
    }
  }

  function close() {
    if (sending) return;
    setOpen(false);
    setReporting(null);
    setDeleting(null);
    setSendError('');
  }

  const dialog = <Modal open={open} title={reporting ? 'Denunciar comentário' : deleting ? 'Excluir comentário' : `Comentários de ${author}`} onClose={close}>
    {reporting ? <CommentReport
      comment={reporting}
      online={online}
      onCancel={() => setReporting(null)}
      onReported={() => {
        setReporting(null);
        setNotice('Denúncia registrada. Só você e a equipe podem vê-la.');
      }}
    /> : deleting ? <CommentDelete
      comment={deleting}
      online={online}
      onCancel={() => setDeleting(null)}
      onDeleted={() => {
        setDeleting(null);
        setOffset(0);
        setCountState((current) => ({ source: count, value: Math.max(0, (current.source === count ? current.value : count) - 1) }));
        setNotice('Comentário excluído.');
        setState((current) => ({ status: 'loading', data: current.data, message: '' }));
        setRevision((current) => current + 1);
        onChanged?.();
      }}
    /> : <>
      {!online && <Notice tone="warning">Sem conexão. Você pode ler o que já foi carregado, mas não pode enviar agora.</Notice>}
      {(state.status === 'idle' || state.status === 'loading') && !state.data && online && <LoadingState>Buscando comentários…</LoadingState>}
      {state.status === 'error' && <ErrorState message={state.message} onRetry={online ? () => {
        setState((current) => ({ status: 'loading', data: current.data, message: '' }));
        setRevision((current) => current + 1);
      } : undefined} />}
      {state.data && <CommentList
        data={state.data}
        onReport={setReporting}
        onDelete={setDeleting}
      />}
      {state.status === 'ready' && state.data.comments.length === 0 && <EmptyState title="Ainda não há comentários.">Puxe a primeira conversa.</EmptyState>}
      {state.data && (offset > 0 || state.data.hasMore) && <nav className="form-actions" aria-label="Páginas de comentários">
        <Button type="button" variant="quiet" disabled={sending || offset === 0} onClick={() => {
          setState((current) => ({ status: 'loading', data: current.data, message: '' }));
          setOffset((current) => Math.max(0, current - 20));
        }}>Anteriores</Button>
        <Button type="button" variant="quiet" disabled={sending || !state.data?.hasMore} onClick={() => {
          setState((current) => ({ status: 'loading', data: current.data, message: '' }));
          setOffset((current) => current + 20);
        }}>Próximos</Button>
      </nav>}
      <form className="compose-form" onSubmit={submitComment} aria-busy={sending}>
        <Field label="Escrever comentário" hint="Até 280 caracteres. O texto só é enviado ao tocar em Enviar.">
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={3} maxLength={280} placeholder="Entre na conversa." disabled={sending} />
        </Field>
        <span className="character-count">{body.length}/280</span>
        {!online && <span id={descriptionId} className="sr-only">Conecte-se para enviar um comentário.</span>}
        {sendError && <ErrorState message={sendError} />}
        {notice && <Notice tone="success">{notice}</Notice>}
        <div className="form-actions">
          <Button type="submit" disabled={!online || sending || !body.trim()} aria-describedby={!online ? descriptionId : undefined}>
            {sending ? <LoaderCircle className="spinner" size={18} aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
            {sending ? 'Enviando…' : 'Enviar'}
          </Button>
        </div>
      </form>
    </>}
  </Modal>;

  return <>
    <button
      type="button"
      aria-label={`${displayCount} ${displayCount === 1 ? 'comentário' : 'comentários'} na publicação de ${author}`}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => {
        setNotice('');
        if (!state.data && online) setState({ status: 'loading', data: null, message: '' });
        setOpen(true);
      }}
    >
      <MessageCircle size={19} aria-hidden="true" />{displayCount}
    </button>
    <Portal>{dialog}</Portal>
  </>;
}

function CommentList({ data, onReport, onDelete }: { data: CommentsResponse; onReport: (comment: MobileComment) => void; onDelete: (comment: MobileComment) => void }) {
  if (!data.comments.length) return null;
  return <section aria-label="Comentários">
    {data.comments.map((comment) => {
      const own = comment.authorId === data.viewerId;
      return <article className="person-row" key={comment.id}>
        <Avatar src={comment.avatar} name={comment.name} />
        <div className="row-content">
          <strong>{comment.name}{own ? ' · Você' : ''}</strong>
          <span>@{comment.username} · <time dateTime={comment.createdAt}>{commentDate(comment.createdAt)}</time></span>
          <p>{comment.body}</p>
        </div>
        <div className="row-actions">
          {own ? <Button type="button" variant="quiet" onClick={() => onDelete(comment)}><Trash2 size={17} aria-hidden="true" />Excluir</Button>
            : <Button type="button" variant="quiet" onClick={() => onReport(comment)}><Flag size={17} aria-hidden="true" />Denunciar</Button>}
        </div>
      </article>;
    })}
  </section>;
}

function CommentDelete({ comment, online, onCancel, onDeleted }: { comment: MobileComment; online: boolean; onCancel: () => void; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function remove() {
    if (!online || busy) return;
    setBusy(true);
    setError('');
    try {
      await api.request('/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_comment', id: comment.id }),
      });
      await successHaptic();
      onDeleted();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  return <section>
    <Notice tone="warning">Este comentário será removido de forma permanente.</Notice>
    <p>{comment.body}</p>
    {!online && <Notice tone="warning">Conecte-se para excluir.</Notice>}
    {error && <ErrorState message={error} />}
    <div className="form-actions"><Button type="button" variant="quiet" disabled={busy} onClick={onCancel}>Cancelar</Button><Button type="button" variant="danger" disabled={!online || busy} onClick={() => void remove()}>{busy ? 'Excluindo…' : 'Excluir comentário'}</Button></div>
  </section>;
}

function CommentReport({
  comment,
  online,
  onCancel,
  onReported,
}: {
  comment: MobileComment;
  online: boolean;
  onCancel: () => void;
  onReported: () => void;
}) {
  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!online || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await api.request('/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'report', target: 'comment', id: comment.id, reason, details }),
      });
      await successHaptic();
      onReported();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return <form className="compose-form" onSubmit={submit} aria-busy={busy}>
    <p className="privacy-note">A equipe recebe a denúncia. O comentário não é removido automaticamente.</p>
    <Field label="Motivo">
      <select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)} disabled={busy}>
        <option value="spam">Spam</option>
        <option value="harassment">Assédio</option>
        <option value="unsafe">Risco ou conteúdo inseguro</option>
        <option value="other">Outro</option>
      </select>
    </Field>
    <Field label="Detalhes (opcional)">
      <textarea rows={3} maxLength={500} value={details} onChange={(event) => setDetails(event.target.value)} disabled={busy} />
    </Field>
    {!online && <Notice tone="warning">Conecte-se para enviar a denúncia.</Notice>}
    {error && <ErrorState message={error} />}
    <div className="form-actions">
      <Button type="button" variant="quiet" onClick={onCancel} disabled={busy}>Voltar aos comentários</Button>
      <Button type="submit" disabled={!online || busy}>{busy ? 'Enviando…' : 'Enviar denúncia'}</Button>
    </div>
  </form>;
}

export function RepostAction({
  postId,
  author,
  audience,
  canRepost,
  reposted,
  online,
  onChanged,
}: {
  postId: string;
  author: string;
  audience: 'beta' | 'private';
  canRepost: boolean;
  reposted: boolean;
  online: boolean;
  onChanged?: (reposted: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [repostState, setRepostState] = useState({ postId, source: reposted, value: reposted });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const lock = useRef(false);
  const current = repostState.postId === postId && repostState.source === reposted ? repostState.value : reposted;

  if (!canRepost && !current) return null;

  async function confirm() {
    if (!online || lock.current) return;
    lock.current = true;
    const previous = current;
    const next = !previous;
    setRepostState({ postId, source: reposted, value: next });
    setBusy(true);
    setError('');
    setAnnouncement('');
    try {
      await api.request('/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'repost', id: postId, reposted: next }),
      });
      const message = next ? 'Publicação republicada.' : 'Republicação desfeita.';
      setAnnouncement(message);
      setOpen(false);
      await selectionHaptic();
      onChanged?.(next);
    } catch (cause) {
      setRepostState({ postId, source: reposted, value: previous });
      setError(`${errorMessage(cause)} A publicação voltou ao estado anterior nesta tela.`);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  const dialog = <Modal open={open} title={current ? 'Desfazer republicação?' : 'Republicar?'} onClose={() => { if (!busy) setOpen(false); }}>
    <p>{current
      ? 'Ela sai das suas republicações. A publicação original mantém as curtidas e os comentários.'
      : `A publicação de ${author} aparece no seu perfil e no Início de quem acompanha você.`}</p>
    {!current && <p className="privacy-note">{audience === 'private'
      ? 'Só participantes do grupo privado que já têm acesso poderão vê-la.'
      : 'A audiência original é mantida para pessoas com acesso ao Pico.'}</p>}
    {!online && <Notice tone="warning">Conecte-se para confirmar.</Notice>}
    {error && <ErrorState message={error} />}
    <div className="form-actions">
      <Button type="button" variant="quiet" disabled={busy} onClick={() => setOpen(false)}>Cancelar</Button>
      <Button type="button" disabled={!online || busy} onClick={() => void confirm()}>
        {busy ? <LoaderCircle className="spinner" size={18} aria-hidden="true" /> : <Repeat2 size={18} aria-hidden="true" />}
        {busy ? 'Confirmando…' : current ? 'Desfazer republicação' : 'Republicar'}
      </Button>
    </div>
  </Modal>;

  return <>
    <button
      type="button"
      aria-pressed={current}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={`${current ? 'Desfazer republicação' : 'Republicar'} de ${author}`}
      onClick={() => {
        setError('');
        setOpen(true);
      }}
    >
      <Repeat2 size={19} aria-hidden="true" />{current ? 'Republicado' : 'Republicar'}
    </button>
    <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    <Portal>{dialog}</Portal>
  </>;
}

function Portal({ children }: { children: ReactNode }) {
  return typeof document === 'undefined' ? null : createPortal(children, document.body);
}

function commentDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
