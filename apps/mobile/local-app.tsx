import { useCallback, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  CalendarDays,
  Download,
  Home,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
} from 'lucide-react';
import { PicoMark } from './auth';
import { createId } from './id';
import {
  LOCAL_SPORTS,
  createLocalArena,
  createLocalGame,
  deleteLocalArena,
  deleteLocalGame,
  setupLocalProfile,
  updateLocalArena,
  updateLocalGame,
  type LocalArena,
  type LocalGame,
  type LocalProfileInput,
  type LocalSport,
  type LocalWorkspace,
} from './local-model.ts';
import { localRepository } from './local-store.ts';
import { selectionHaptic, shareExport, successHaptic } from './native';
import { Button, EmptyState, ErrorState, Field, Modal, Notice, dateLabel, initials } from './ui';

type LocalTab = 'home' | 'games' | 'arenas' | 'profile';
type WorkspaceMutation = (workspace: LocalWorkspace) => LocalWorkspace;
type PersistWorkspace = (mutation: WorkspaceMutation) => Promise<boolean>;

type LocalModeAppProps = {
  initialWorkspace: LocalWorkspace;
  onLeave: () => void | Promise<void>;
};

export function LocalModeApp({ initialWorkspace, onLeave }: LocalModeAppProps) {
  const workspaceRef = useRef(initialWorkspace);
  const operationRef = useRef(false);
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const runExclusive = useCallback(async (operation: () => Promise<void>) => {
    if (operationRef.current) return false;
    operationRef.current = true;
    setBusy(true);
    setError('');
    try {
      await operation();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir agora. Tente novamente.');
      return false;
    } finally {
      operationRef.current = false;
      setBusy(false);
    }
  }, []);

  const persist = useCallback<PersistWorkspace>(async (mutation) => runExclusive(async () => {
    const next = mutation(workspaceRef.current);
    const saved = await localRepository.save(next, localDateValue());
    workspaceRef.current = saved;
    setWorkspace(saved);
  }), [runExclusive]);

  const leave = useCallback(async () => runExclusive(async () => {
    await localRepository.leave();
    await onLeave();
  }), [onLeave, runExclusive]);

  const erase = useCallback(async () => runExclusive(async () => {
    await localRepository.erase();
    await successHaptic();
    await onLeave();
  }), [onLeave, runExclusive]);

  const exportData = useCallback(async () => runExclusive(async () => {
    await shareExport(workspaceRef.current);
  }), [runExclusive]);

  if (!workspace.profile) {
    return <LocalSetup
      workspace={workspace}
      busy={busy}
      error={error}
      onClearError={() => setError('')}
      onSave={persist}
      onLeave={leave}
    />;
  }

  const configuredWorkspace: LocalWorkspace & { profile: LocalProfileInput } = {
    ...workspace,
    profile: workspace.profile,
  };

  return <LocalShell
    workspace={configuredWorkspace}
    busy={busy}
    error={error}
    onClearError={() => setError('')}
    onPersist={persist}
    onExport={exportData}
    onLeave={leave}
    onErase={erase}
  />;
}

function LocalSetup({ workspace, busy, error, onClearError, onSave, onLeave }: {
  workspace: LocalWorkspace;
  busy: boolean;
  error: string;
  onClearError: () => void;
  onSave: PersistWorkspace;
  onLeave: () => Promise<boolean>;
}) {
  const [sport, setSport] = useState<LocalSport>('Futevôlei');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const profile: LocalProfileInput = {
      name: String(values.get('name') || ''),
      sport,
      city: String(values.get('city') || ''),
    };
    const saved = await onSave((current) => setupLocalProfile(current, profile));
    if (saved) await successHaptic();
  }

  return <main className="setup-screen local-setup" id="main-content">
    <PicoMark />
    <header className="editorial-heading local-setup-heading">
      <span>SÓ NESTE IPHONE</span>
      <h1>Seu Pico começa por você.</h1>
      <p>Monte um espaço privado para guardar suas arenas e seus jogos, mesmo sem conta ou internet.</p>
    </header>
    <Notice><Smartphone size={18} aria-hidden="true" /> Nada é enviado automaticamente. Os dados ficam neste aparelho.</Notice>
    <form className="setup-form local-form" onSubmit={submit} onChange={onClearError} aria-busy={busy}>
      <fieldset disabled={busy}>
        <Field label="Seu nome"><input name="name" required minLength={2} maxLength={60} autoComplete="name" autoFocus /></Field>
        <Field label="Modalidade principal"><select name="sport" required value={sport} onChange={(event) => setSport(event.target.value as LocalSport)}>{LOCAL_SPORTS.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Cidade" hint="Opcional"><input name="city" maxLength={80} autoComplete="address-level2" /></Field>
        {error && <ErrorState message={error} />}
        <Button type="submit" className="full-width" disabled={busy}>{busy ? 'Guardando…' : 'Criar meu espaço local'}</Button>
        <Button type="button" variant="quiet" className="full-width" disabled={busy} onClick={() => void onLeave()}>Voltar</Button>
      </fieldset>
    </form>
    <span className="sr-only">Espaço local versão {workspace.version}</span>
  </main>;
}

function LocalShell({ workspace, busy, error, onClearError, onPersist, onExport, onLeave, onErase }: {
  workspace: LocalWorkspace & { profile: LocalProfileInput };
  busy: boolean;
  error: string;
  onClearError: () => void;
  onPersist: PersistWorkspace;
  onExport: () => Promise<boolean>;
  onLeave: () => Promise<boolean>;
  onErase: () => Promise<boolean>;
}) {
  const [tab, setTab] = useState<LocalTab>('home');
  const mainContent = useRef<HTMLElement>(null);
  const previousTab = useRef<LocalTab | null>(null);

  useLayoutEffect(() => {
    if (previousTab.current === tab) return;
    previousTab.current = tab;
    mainContent.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }, [tab]);

  function navigate(next: LocalTab) {
    onClearError();
    setTab(next);
    void selectionHaptic();
  }

  const screen = tab === 'home'
    ? <LocalHome workspace={workspace} onNavigate={navigate} />
    : tab === 'games'
      ? <LocalGames workspace={workspace} busy={busy} error={error} onClearError={onClearError} onPersist={onPersist} onOpenArenas={() => navigate('arenas')} />
      : tab === 'arenas'
        ? <LocalArenas workspace={workspace} busy={busy} error={error} onClearError={onClearError} onPersist={onPersist} />
        : <LocalProfile workspace={workspace} busy={busy} error={error} onClearError={onClearError} onPersist={onPersist} onExport={onExport} onLeave={onLeave} onErase={onErase} />;

  return <div className="app-shell local-shell">
    <a className="skip-link" href="#main-content">Ir para o conteúdo</a>
    <header className="app-header local-header">
      <PicoMark />
      <span className="local-mode-badge"><Smartphone size={15} aria-hidden="true" />Só neste iPhone</span>
    </header>
    <main ref={mainContent} id="main-content" tabIndex={-1}>{screen}</main>
    <nav className="tab-bar local-tab-bar" aria-label="Navegação local">
      <LocalTabButton active={tab === 'home'} label="Início" icon={<Home />} onClick={() => navigate('home')} />
      <LocalTabButton active={tab === 'games'} label="Jogos" icon={<CalendarDays />} onClick={() => navigate('games')} />
      <LocalTabButton active={tab === 'arenas'} label="Arenas" icon={<MapPin />} onClick={() => navigate('arenas')} />
      <LocalTabButton active={tab === 'profile'} label="Perfil" icon={<UserRound />} onClick={() => navigate('profile')} />
    </nav>
  </div>;
}

function LocalTabButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: ReactNode; onClick: () => void }) {
  return <button type="button" aria-current={active ? 'page' : undefined} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function LocalHome({ workspace, onNavigate }: { workspace: LocalWorkspace & { profile: LocalProfileInput }; onNavigate: (tab: LocalTab) => void }) {
  const recentGames = sortedGames(workspace.games).slice(0, 3);
  const nextAction = workspace.arenas.length === 0 ? 'arenas' : 'games';

  return <section className="screen local-screen local-home" aria-labelledby="local-home-title">
    <header className="local-welcome">
      <span className="local-avatar" aria-hidden="true">{initials(workspace.profile.name)}</span>
      <div><span className="eyebrow">SEU ESPAÇO PRIVADO</span><h1 id="local-home-title" tabIndex={-1}>Oi, {firstName(workspace.profile.name)}.</h1><p>{workspace.profile.sport}{workspace.profile.city ? ` · ${workspace.profile.city}` : ''}</p></div>
    </header>
    <Notice><ShieldCheck size={18} aria-hidden="true" /> Só você vê. Registrar um jogo aqui não publica no feed.</Notice>
    <div className="local-summary" aria-label="Resumo local">
      <button type="button" onClick={() => onNavigate('games')}><strong>{workspace.games.length}</strong><span>{workspace.games.length === 1 ? 'jogo guardado' : 'jogos guardados'}</span></button>
      <button type="button" onClick={() => onNavigate('arenas')}><strong>{workspace.arenas.length}</strong><span>{workspace.arenas.length === 1 ? 'arena salva' : 'arenas salvas'}</span></button>
    </div>
    <section className="local-next-action" aria-labelledby="local-next-title">
      <div><span className="eyebrow">PRÓXIMO PASSO</span><h2 id="local-next-title">{nextAction === 'arenas' ? 'Guarde seu primeiro lugar.' : 'Registre o jogo depois da partida.'}</h2><p>{nextAction === 'arenas' ? 'Cadastre uma arena para poder associá-la aos seus jogos.' : 'O registro fica privado e continua disponível sem conexão.'}</p></div>
      <Button onClick={() => onNavigate(nextAction)}><Plus size={18} aria-hidden="true" />{nextAction === 'arenas' ? 'Adicionar arena' : 'Registrar jogo'}</Button>
    </section>
    <section className="local-recent" aria-labelledby="local-recent-title">
      <div className="local-section-heading"><h2 id="local-recent-title">Jogos recentes</h2>{workspace.games.length > 3 && <Button variant="quiet" onClick={() => onNavigate('games')}>Ver todos</Button>}</div>
      {recentGames.length === 0
        ? <EmptyState title="Seu primeiro jogo fica aqui.">Depois de jogar, guarde um registro só seu.</EmptyState>
        : <div className="game-list local-game-list">{recentGames.map((game) => <LocalGameSummary key={game.id} game={game} />)}</div>}
    </section>
  </section>;
}

function LocalGames({ workspace, busy, error, onClearError, onPersist, onOpenArenas }: {
  workspace: LocalWorkspace & { profile: LocalProfileInput };
  busy: boolean;
  error: string;
  onClearError: () => void;
  onPersist: PersistWorkspace;
  onOpenArenas: () => void;
}) {
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const games = sortedGames(workspace.games);
  const editingGame = editingId && editingId !== 'new' ? workspace.games.find((game) => game.id === editingId) : undefined;
  const deletingGame = workspace.games.find((game) => game.id === deletingId);

  function closeEditor() {
    if (busy) return;
    setEditingId(null);
    onClearError();
  }

  async function remove() {
    if (!deletingGame) return;
    const removed = await onPersist((current) => deleteLocalGame(current, deletingGame.id));
    if (removed) {
      setDeletingId(null);
      await successHaptic();
    }
  }

  return <section className="screen local-screen" aria-labelledby="local-games-title">
    <header className="screen-heading local-screen-heading"><div><span>REGISTRO PRIVADO</span><h1 id="local-games-title" tabIndex={-1}>Jogos</h1></div><Button disabled={busy || workspace.arenas.length === 0} onClick={() => { onClearError(); setEditingId('new'); }}><Plus size={18} aria-hidden="true" />Registrar</Button></header>
    <Notice>Os jogos ficam apenas neste iPhone. Nada é publicado ou compartilhado automaticamente.</Notice>
    {workspace.arenas.length === 0 && <div className="local-empty-action"><EmptyState title={games.length === 0 ? 'Primeiro, guarde uma arena.' : 'Adicione uma arena para registrar outro jogo.'}>{games.length === 0 ? 'Todo jogo precisa de um lugar. Você pode cadastrar o seu agora.' : 'Seu histórico continua disponível abaixo, inclusive para editar ou excluir.'}</EmptyState><Button onClick={onOpenArenas}><MapPin size={18} aria-hidden="true" />Adicionar arena</Button></div>}
    {games.length === 0
      ? workspace.arenas.length > 0 && <EmptyState title="Nenhum jogo guardado.">Depois da partida, registre arena, modalidade, data e, se quiser, uma nota.</EmptyState>
      : <div className="game-list local-game-list">{games.map((game) => <article className="game-row local-game-row" key={game.id}><LocalGameSummary game={game} /><div className="local-row-actions"><Button type="button" variant="quiet" aria-label={`Editar jogo de ${dateLabel(game.playedOn)} em ${game.arenaSnapshot}`} disabled={busy} onClick={() => { onClearError(); setEditingId(game.id); }}><Pencil size={17} aria-hidden="true" />Editar</Button><Button type="button" variant="quiet" aria-label={`Excluir jogo de ${dateLabel(game.playedOn)} em ${game.arenaSnapshot}`} disabled={busy} onClick={() => { onClearError(); setDeletingId(game.id); }}><Trash2 size={17} aria-hidden="true" />Excluir</Button></div></article>)}</div>}
    <Modal open={editingId !== null} title={editingGame ? 'Editar jogo' : 'Registrar jogo'} onClose={closeEditor}>
      {editingId && <GameEditor key={editingId} game={editingGame} arenas={workspace.arenas} defaultSport={workspace.profile.sport} busy={busy} error={error} onClearError={onClearError} onPersist={onPersist} onDone={() => setEditingId(null)} />}
    </Modal>
    <Modal open={Boolean(deletingGame)} title="Excluir jogo" onClose={() => { if (!busy) { setDeletingId(null); onClearError(); } }}>
      {deletingGame && <div className="local-confirm"><p>Excluir o jogo em <strong>{deletingGame.arenaSnapshot}</strong>? Este registro não poderá ser recuperado.</p>{error && <ErrorState message={error} />}<div className="form-actions"><Button type="button" variant="quiet" disabled={busy} onClick={() => setDeletingId(null)}>Cancelar</Button><Button type="button" variant="danger" disabled={busy} onClick={() => void remove()}>{busy ? 'Excluindo…' : 'Excluir jogo'}</Button></div></div>}
    </Modal>
  </section>;
}

function GameEditor({ game, arenas, defaultSport, busy, error, onClearError, onPersist, onDone }: {
  game?: LocalGame;
  arenas: LocalArena[];
  defaultSport: LocalSport;
  busy: boolean;
  error: string;
  onClearError: () => void;
  onPersist: PersistWorkspace;
  onDone: () => void;
}) {
  const [arenaId, setArenaId] = useState(game?.arenaId || '');
  const [sport, setSport] = useState<LocalSport>(game?.sport || defaultSport);
  const [playedOn, setPlayedOn] = useState(game?.playedOn || localDateValue());
  const [notes, setNotes] = useState(game?.notes || '');
  const today = localDateValue();
  const maximumPlayedOn = game?.playedOn && game.playedOn > today ? game.playedOn : today;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await onPersist((current) => game
      ? updateLocalGame(current, game.id, { ...(arenaId ? { arenaId } : {}), sport, playedOn, notes }, { today: localDateValue() })
      : createLocalGame(current, { id: createId(), arenaId, sport, playedOn, notes }, { today: localDateValue() }));
    if (saved) {
      await successHaptic();
      onDone();
    }
  }

  return <form className="local-form" onSubmit={submit} onChange={onClearError} aria-busy={busy}>
    <fieldset disabled={busy}>
      <Notice>Só você vê este registro.</Notice>
      {game?.arenaId === null && <Notice tone="warning">A arena original foi apagada. Você pode editar este registro agora e associar outro lugar quando quiser.</Notice>}
      <Field label="Arena"><select required={!game} value={arenaId} onChange={(event) => setArenaId(event.target.value)}><option value="" disabled={!game}>{game?.arenaId === null ? `Arena removida: ${game.arenaSnapshot}` : 'Escolha'}</option>{arenas.map((arena) => <option key={arena.id} value={arena.id}>{arena.name}</option>)}</select></Field>
      <Field label="Modalidade"><select required value={sport} onChange={(event) => setSport(event.target.value as LocalSport)}>{LOCAL_SPORTS.map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field label="Data do jogo"><input type="date" required max={maximumPlayedOn} value={playedOn} onChange={(event) => setPlayedOn(event.target.value)} /></Field>
      <Field label="Nota" hint="Opcional. Até 500 caracteres e somente neste aparelho."><textarea maxLength={500} rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Como foi o jogo?" /></Field>
      {error && <ErrorState message={error} />}
      <div className="form-actions"><Button type="submit" disabled={busy || (!game && !arenaId) || !playedOn}>{busy ? 'Guardando…' : game ? 'Salvar jogo' : 'Guardar jogo'}</Button></div>
    </fieldset>
  </form>;
}

function LocalGameSummary({ game }: { game: LocalGame }) {
  return <div className="local-game-summary"><span className="game-date"><strong>{new Date(`${game.playedOn}T12:00:00`).getDate()}</strong><small>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${game.playedOn}T12:00:00`))}</small></span><div><h3>{game.arenaSnapshot}</h3><p>{game.sport} · {dateLabel(game.playedOn)}</p>{game.notes && <span>{game.notes}</span>}{game.arenaId === null && <small>Arena removida do cadastro</small>}</div></div>;
}

function LocalArenas({ workspace, busy, error, onClearError, onPersist }: {
  workspace: LocalWorkspace & { profile: LocalProfileInput };
  busy: boolean;
  error: string;
  onClearError: () => void;
  onPersist: PersistWorkspace;
}) {
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const editingArena = editingId && editingId !== 'new' ? workspace.arenas.find((arena) => arena.id === editingId) : undefined;
  const deletingArena = workspace.arenas.find((arena) => arena.id === deletingId);
  const linkedGames = deletingArena ? workspace.games.filter((game) => game.arenaId === deletingArena.id).length : 0;

  function closeEditor() {
    if (busy) return;
    setEditingId(null);
    onClearError();
  }

  async function remove() {
    if (!deletingArena) return;
    const removed = await onPersist((current) => deleteLocalArena(current, deletingArena.id));
    if (removed) {
      setDeletingId(null);
      await successHaptic();
    }
  }

  return <section className="screen local-screen" aria-labelledby="local-arenas-title">
    <header className="screen-heading local-screen-heading"><div><span>SEUS LUGARES</span><h1 id="local-arenas-title" tabIndex={-1}>Arenas</h1></div><Button disabled={busy} onClick={() => { onClearError(); setEditingId('new'); }}><Plus size={18} aria-hidden="true" />Adicionar</Button></header>
    {workspace.arenas.length === 0
      ? <EmptyState title="Nenhuma arena salva.">Adicione os lugares onde você joga. Eles ficam apenas neste iPhone.</EmptyState>
      : <div className="arena-list local-arena-list">{workspace.arenas.map((arena) => <article className="arena-row local-arena-row" key={arena.id}><span className="arena-placeholder"><MapPin size={21} aria-hidden="true" /></span><div><h2>{arena.name}</h2><p>{[arena.neighborhood, arena.city].filter(Boolean).join(', ') || 'Localização não informada'}</p></div><div className="local-row-actions"><Button type="button" variant="quiet" aria-label={`Editar arena ${arena.name}`} disabled={busy} onClick={() => { onClearError(); setEditingId(arena.id); }}><Pencil size={17} aria-hidden="true" />Editar</Button><Button type="button" variant="quiet" aria-label={`Excluir arena ${arena.name}`} disabled={busy} onClick={() => { onClearError(); setDeletingId(arena.id); }}><Trash2 size={17} aria-hidden="true" />Excluir</Button></div></article>)}</div>}
    <Modal open={editingId !== null} title={editingArena ? 'Editar arena' : 'Adicionar arena'} onClose={closeEditor}>
      {editingId && <ArenaEditor key={editingId} arena={editingArena} defaultCity={workspace.profile.city} busy={busy} error={error} onClearError={onClearError} onPersist={onPersist} onDone={() => setEditingId(null)} />}
    </Modal>
    <Modal open={Boolean(deletingArena)} title="Excluir arena" onClose={() => { if (!busy) { setDeletingId(null); onClearError(); } }}>
      {deletingArena && <div className="local-confirm"><p>Excluir <strong>{deletingArena.name}</strong> deste iPhone?</p>{linkedGames > 0 && <Notice tone="warning">{linkedGames === 1 ? 'Um jogo continuará no histórico com o nome desta arena e poderá ser editado normalmente.' : `${linkedGames} jogos continuarão no histórico com o nome desta arena e poderão ser editados normalmente.`}</Notice>}{error && <ErrorState message={error} />}<div className="form-actions"><Button type="button" variant="quiet" disabled={busy} onClick={() => setDeletingId(null)}>Cancelar</Button><Button type="button" variant="danger" disabled={busy} onClick={() => void remove()}>{busy ? 'Excluindo…' : 'Excluir arena'}</Button></div></div>}
    </Modal>
  </section>;
}

function ArenaEditor({ arena, defaultCity, busy, error, onClearError, onPersist, onDone }: {
  arena?: LocalArena;
  defaultCity: string;
  busy: boolean;
  error: string;
  onClearError: () => void;
  onPersist: PersistWorkspace;
  onDone: () => void;
}) {
  const [name, setName] = useState(arena?.name || '');
  const [neighborhood, setNeighborhood] = useState(arena?.neighborhood || '');
  const [city, setCity] = useState(arena?.city || defaultCity);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await onPersist((current) => arena
      ? updateLocalArena(current, arena.id, { name, neighborhood, city })
      : createLocalArena(current, { id: createId(), name, neighborhood, city }));
    if (saved) {
      await successHaptic();
      onDone();
    }
  }

  return <form className="local-form" onSubmit={submit} onChange={onClearError} aria-busy={busy}>
    <fieldset disabled={busy}>
      <Field label="Nome da arena"><input required minLength={1} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} autoFocus /></Field>
      <Field label="Bairro"><input maxLength={80} value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} /></Field>
      <Field label="Cidade"><input maxLength={80} value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" /></Field>
      {error && <ErrorState message={error} />}
      <div className="form-actions"><Button type="submit" disabled={busy || !name.trim()}>{busy ? 'Guardando…' : arena ? 'Salvar arena' : 'Adicionar arena'}</Button></div>
    </fieldset>
  </form>;
}

function LocalProfile({ workspace, busy, error, onClearError, onPersist, onExport, onLeave, onErase }: {
  workspace: LocalWorkspace & { profile: LocalProfileInput };
  busy: boolean;
  error: string;
  onClearError: () => void;
  onPersist: PersistWorkspace;
  onExport: () => Promise<boolean>;
  onLeave: () => Promise<boolean>;
  onErase: () => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [eraseOpen, setEraseOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  async function erase() {
    if (confirmation !== 'APAGAR') return;
    await onErase();
  }

  return <section className="screen local-screen local-profile" aria-labelledby="local-profile-title">
    <header className="screen-heading"><div><span>SEU ESPAÇO</span><h1 id="local-profile-title" tabIndex={-1}>Perfil</h1></div></header>
    <div className="local-profile-card"><span className="local-avatar" aria-hidden="true">{initials(workspace.profile.name)}</span><div><h2>{workspace.profile.name}</h2><p>{workspace.profile.sport}</p><span>{workspace.profile.city || 'Cidade não informada'}</span></div><Button type="button" variant="secondary" disabled={busy} onClick={() => { onClearError(); setEditing(true); }}><Pencil size={17} aria-hidden="true" />Editar</Button></div>
    <section className="local-data-section" aria-labelledby="local-data-title">
      <h2 id="local-data-title">Dados deste iPhone</h2>
      <p>Este espaço não usa conta, nuvem ou sincronização. Sair mantém tudo guardado neste aparelho.</p>
      <div className="local-data-actions">
        <Button type="button" variant="secondary" disabled={busy} onClick={() => void onExport()}><Download size={18} aria-hidden="true" />Exportar dados</Button>
        <Button type="button" variant="quiet" disabled={busy} onClick={() => void onLeave()}><LogOut size={18} aria-hidden="true" />Sair do modo local</Button>
      </div>
      {error && !editing && !eraseOpen && <ErrorState message={error} />}
    </section>
    <section className="danger-zone local-danger-zone" aria-labelledby="local-danger-title">
      <h2 id="local-danger-title">Apagar espaço local</h2>
      <p>Remove seu perfil, {workspace.arenas.length === 1 ? 'uma arena' : `${workspace.arenas.length} arenas`} e {workspace.games.length === 1 ? 'um jogo' : `${workspace.games.length} jogos`} deste iPhone.</p>
      <Button type="button" variant="danger" disabled={busy} onClick={() => { onClearError(); setConfirmation(''); setEraseOpen(true); }}><Trash2 size={18} aria-hidden="true" />Apagar tudo</Button>
    </section>
    <Modal open={editing} title="Editar perfil local" onClose={() => { if (!busy) { setEditing(false); onClearError(); } }}>
      <ProfileEditor key={`${workspace.profile.name}-${workspace.profile.sport}-${workspace.profile.city}`} profile={workspace.profile} busy={busy} error={error} onClearError={onClearError} onPersist={onPersist} onDone={() => setEditing(false)} />
    </Modal>
    <Modal open={eraseOpen} title="Apagar dados deste iPhone" onClose={() => { if (!busy) { setEraseOpen(false); setConfirmation(''); onClearError(); } }}>
      <div className="local-confirm local-erase-confirm"><Notice tone="warning">Esta ação não pode ser desfeita. Nada será apagado de uma conta conectada.</Notice><Field label="Digite APAGAR para confirmar"><input value={confirmation} onChange={(event) => { setConfirmation(event.target.value); onClearError(); }} autoCapitalize="characters" autoCorrect="off" /></Field>{error && <ErrorState message={error} />}<div className="form-actions"><Button type="button" variant="quiet" disabled={busy} onClick={() => setEraseOpen(false)}>Cancelar</Button><Button type="button" variant="danger" disabled={busy || confirmation !== 'APAGAR'} onClick={() => void erase()}>{busy ? 'Apagando…' : 'Apagar deste iPhone'}</Button></div></div>
    </Modal>
  </section>;
}

function ProfileEditor({ profile, busy, error, onClearError, onPersist, onDone }: {
  profile: LocalProfileInput;
  busy: boolean;
  error: string;
  onClearError: () => void;
  onPersist: PersistWorkspace;
  onDone: () => void;
}) {
  const [name, setName] = useState(profile.name);
  const [sport, setSport] = useState<LocalSport>(profile.sport);
  const [city, setCity] = useState(profile.city);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await onPersist((current) => setupLocalProfile(current, { name, sport, city }));
    if (saved) {
      await successHaptic();
      onDone();
    }
  }

  return <form className="local-form" onSubmit={submit} onChange={onClearError} aria-busy={busy}>
    <fieldset disabled={busy}>
      <Field label="Seu nome"><input required minLength={2} maxLength={60} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" autoFocus /></Field>
      <Field label="Modalidade principal"><select required value={sport} onChange={(event) => setSport(event.target.value as LocalSport)}>{LOCAL_SPORTS.map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field label="Cidade" hint="Opcional"><input maxLength={80} value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" /></Field>
      {error && <ErrorState message={error} />}
      <div className="form-actions"><Button type="submit" disabled={busy || !name.trim()}>{busy ? 'Salvando…' : 'Salvar perfil'}</Button></div>
    </fieldset>
  </form>;
}

function localDateValue(date = new Date()) {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sortedGames(games: LocalGame[]) {
  return [...games].sort((left, right) => right.playedOn.localeCompare(left.playedOn) || right.createdAt.localeCompare(left.createdAt));
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}
