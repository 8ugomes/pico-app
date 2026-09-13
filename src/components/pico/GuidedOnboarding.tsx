'use client';

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ChevronDown, Compass, LocateFixed, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/Button';
import { parseTourProgress, tourSteps, tourStepAt, tourStorageKey, type TourProgress } from '@/lib/onboarding';
import { useRemoteRead } from './connected/useRemoteRead';

type TourContext = { progress: TourProgress | null; start: (step?: number) => void };
const Tour = createContext<TourContext | null>(null);

// The connected boundary lives inside AccessGate. This read identifies the
// preference owner; it never grants access or changes profile onboarding.
export function GuidedOnboarding({ children, demo }: { children: ReactNode; demo: boolean }) {
  return demo ? <TourProvider identity="demo" demo>{children}</TourProvider> : <ConnectedTour>{children}</ConnectedTour>;
}

function ConnectedTour({ children }: { children: ReactNode }) {
  const { state } = useRemoteRead('resource=profile');
  const identity = state.status === 'success' && state.data.kind === 'profile' ? state.data.profile.id : null;
  // Loading optional preferences must not remount forms already in use.
  // A real switch between two known accounts still discards the old subtree.
  const [scope, setScope] = useState<{ id: string | null; generation: number }>({ id: null, generation: 0 });
  if (identity && scope.id !== identity) setScope({ id: identity, generation: scope.id ? scope.generation + 1 : scope.generation });
  return <TourProvider key={scope.generation} identity={identity ? `account:${identity}` : null}>{children}</TourProvider>;
}

export function TourLauncher() {
  const tour = useContext(Tour);
  if (!tour) return null;
  const resume = tour.progress?.status === 'paused';
  return <div className="tour-launcher">
    <Button variant="quiet" size="small" onClick={() => tour.start(resume ? tour.progress?.step : 0)}><Compass size={18} aria-hidden="true" />{resume ? 'Retomar tutorial' : 'Conhecer o Pico'}</Button>
    {resume && <Button variant="quiet" size="small" onClick={() => tour.start(0)}>Recomeçar</Button>}
  </div>;
}

function visibleTarget(ids: readonly string[]) {
  for (const id of ids) {
    const found = [...document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`)].find(element => {
      if (!element.getClientRects().length || element.matches(':disabled') || element.closest('[hidden], [inert]') || getComputedStyle(element).visibility === 'hidden') return false;
      // Chromium can retain a layout rect for a control in a closed disclosure.
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        if (parent instanceof HTMLDetailsElement && !parent.open && !parent.querySelector(':scope > summary')?.contains(element)) return false;
      }
      return true;
    });
    if (found) return found;
  }
  return null;
}

function TourProvider({ children, identity, demo = false }: { children: ReactNode; identity: string | null; demo?: boolean }) {
  const path = usePathname();
  const router = useRouter();
  const [progress, setProgress] = useState<TourProgress | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [targetAvailable, setTargetAvailable] = useState(false);
  const [editing, setEditing] = useState(false);
  const boundary = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const target = useRef<HTMLElement | null>(null);
  const focusNext = useRef(false);
  const descriptionId = useId();
  const titleId = useId();
  const key = identity ? tourStorageKey(identity) : null;
  const ready = Boolean(key && loadedKey === key);
  const active = ready && progress?.status === 'active';
  const routeStep = tourStepAt(path);
  const stepIndex = active ? routeStep ?? progress.step : progress?.step ?? 0;
  const step = tourSteps[stepIndex];
  const onTourRoute = routeStep !== null;

  function save(next: TourProgress) {
    setProgress(next);
    if (key) { try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Still usable in memory. */ } }
  }

  useEffect(() => {
    let live = true;
    function read() {
      if (!key) return;
      let stored: TourProgress | null = null;
      try { stored = parseTourProgress(localStorage.getItem(key)); } catch { /* Private browsing can deny storage. */ }
      // A reload or another tab never opens a guide or redirects unexpectedly.
      if (stored?.status === 'active') stored = { ...stored, status: 'paused' };
      if (live) { setProgress(stored); setLoadedKey(key); setFinished(false); setCollapsed(false); focusNext.current = false; }
    }
    queueMicrotask(read);
    const changed = (event: StorageEvent) => { if (event.key === key || event.key === null) read(); };
    window.addEventListener('storage', changed);
    return () => { live = false; window.removeEventListener('storage', changed); };
  }, [key]);

  useEffect(() => {
    if (!active || !key || routeStep === null || routeStep === progress?.step) return;
    const next: TourProgress = { version: 1, status: 'active', step: routeStep };
    queueMicrotask(() => setProgress(next));
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Preference only. */ }
  }, [active, key, routeStep, progress?.step]);

  useEffect(() => {
    const root = boundary.current;
    if (!root) return;
    const observeEditing = () => setEditing(Boolean(root.querySelector('[data-testid="profile-editor"]')));
    const observer = new MutationObserver(observeEditing);
    observer.observe(root, { childList: true, subtree: true });
    queueMicrotask(observeEditing);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active || editing || !onTourRoute) return;
    let live = true;
    let current: HTMLElement | null = null;
    let previousDescription: string | null = null;
    function clear() {
      if (!current) return;
      current.removeAttribute('data-tour-highlight');
      if (previousDescription === null) current.removeAttribute('aria-describedby');
      else current.setAttribute('aria-describedby', previousDescription);
      current = null;
      target.current = null;
    }
    function mark() {
      if (!live) return;
      const arenaDetail = stepIndex === 0 && path !== '/arenas';
      const communityDetail = stepIndex === 2 && path !== '/comunidades';
      const ids = arenaDetail ? ['arena-follow'] : communityDetail ? ['community-conditions'] : demo && stepIndex === 1 ? ['people-search'] : step.targets;
      const next = visibleTarget(ids);
      if (next !== current) {
        clear();
        current = next;
        target.current = next;
        if (next) {
          previousDescription = next.getAttribute('aria-describedby');
          next.setAttribute('data-tour-highlight', 'true');
          next.setAttribute('aria-describedby', [previousDescription, descriptionId].filter(Boolean).join(' '));
        }
      }
      setTargetAvailable(Boolean(next));
    }
    const observer = new MutationObserver(mark);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open', 'hidden', 'disabled'] });
    window.addEventListener('resize', mark);
    queueMicrotask(mark);
    return () => { live = false; observer.disconnect(); window.removeEventListener('resize', mark); clear(); };
  }, [active, editing, onTourRoute, path, stepIndex, step.targets, descriptionId, demo]);

  useEffect(() => {
    const element = panel.current;
    if (!element || !active) return;
    const resize = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--tour-height', `${element.getBoundingClientRect().height + 32}px`);
    });
    resize.observe(element);
    if (focusNext.current) { heading.current?.focus({ preventScroll: true }); focusNext.current = false; }
    return () => { resize.disconnect(); document.documentElement.style.removeProperty('--tour-height'); };
  }, [active, stepIndex, collapsed, editing]);

  function start(index = 0) {
    focusNext.current = true;
    setCollapsed(false);
    setFinished(false);
    save({ version: 1, status: 'active', step: index });
    router.push(tourSteps[index].path);
  }

  function pause() {
    save({ version: 1, status: 'paused', step: stepIndex });
    setFinished(false);
    // The close control is removed. Give keyboard users a stable destination.
    const main = document.getElementById('main-content');
    main?.setAttribute('tabindex', '-1');
    main?.focus({ preventScroll: true });
  }

  function pointToTarget() {
    const element = target.current;
    if (!element) return;
    setCollapsed(true);
    requestAnimationFrame(() => {
      if (!element.isConnected) return;
      document.documentElement.style.setProperty('--tour-height', `${(panel.current?.getBoundingClientRect().height ?? 0) + 32}px`);
      element.scrollIntoView({ behavior: 'instant', block: 'start' });
      const control = element.matches('button, a, input, select, summary') ? element : element.querySelector<HTMLElement>('input, button, a, select, summary');
      if (control) control.focus({ preventScroll: true });
      else { element.setAttribute('tabindex', '-1'); element.focus({ preventScroll: true }); }
    });
  }

  let instruction: string = step.instruction;
  if (stepIndex === 0 && path !== '/arenas') instruction = '“Acompanhar arena” cria um vínculo com esse lugar. “Joguei aqui” registra uma experiência passada, só para você. Nenhuma dessas ações indica presença ao vivo.';
  if (stepIndex === 2 && path !== '/comunidades') instruction = 'Confira as condições deste grupo. Um pedido em análise ainda não libera conteúdo privado. Participar é uma escolha sua.';
  if (demo && stepIndex === 1) instruction = 'Nesta demonstração, busque por nome, bairro ou esporte. Na conta conectada, você também pode filtrar pela arena acompanhada.';

  const context = ready && identity ? { progress, start } : null;
  return <Tour.Provider value={context}><div ref={boundary} className="tour-boundary">
    {ready && !progress && path === '/feed' && <section className="tour-welcome" aria-labelledby={titleId}>
      <h2 id={titleId}>Seu primeiro passo na areia.</h2>
      <p>Um guia rápido para encontrar pessoas, comunidades e seus lugares no Pico.</p>
      <div className="tour-welcome-actions"><Button onClick={() => start()}>Conhecer o Pico <ArrowRight size={17} aria-hidden="true" /></Button><Button variant="quiet" onClick={() => save({ version: 1, status: 'dismissed', step: 0 })}>Agora não</Button></div>
      <small>Opcional. Explore no seu ritmo e retome no Perfil.</small>
    </section>}
    {active && <aside ref={panel} className="tour-guide" aria-labelledby={titleId} data-testid="guided-tour" onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); pause(); }
    }}>
      <header className="tour-guide-header"><span className="tour-eyebrow">GUIA · {stepIndex + 1}/{tourSteps.length}</span><div>
        <button type="button" className="icon-button" aria-label={collapsed ? 'Expandir tutorial' : 'Recolher tutorial'} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}><ChevronDown size={18} className={collapsed ? 'tour-chevron-up' : ''} aria-hidden="true" /></button>
        <Button variant="quiet" size="small" className="tour-pause" aria-label="Pausar tutorial" onClick={pause}><X size={16} aria-hidden="true" />Pausar</Button>
      </div></header>
      <h2 ref={heading} id={titleId} tabIndex={-1}>{collapsed ? step.label : step.title}</h2>
      {collapsed && <p id={descriptionId} className="sr-only">{instruction}</p>}
      {!collapsed && <>
        <div className="tour-guide-copy" tabIndex={0} aria-label="Dica desta etapa">
          {editing ? <p>Seu perfil está em edição. Salve ou cancele no formulário para continuar o passeio.</p> : !onTourRoute ? <p>Você saiu do percurso. O tutorial pode esperar: volte quando quiser.</p> : <><p>{step.description}</p><p id={descriptionId} className="tour-instruction">{instruction}</p>{!targetAvailable && <p className="tour-fallback">Você pode continuar mesmo que esta área esteja vazia ou ainda carregando.</p>}</>}
          {demo && <p className="tour-demo-note">Demonstração: pessoas e ações são ilustrativas.</p>}
        </div>
        {!editing && <footer className="tour-guide-actions">
          {onTourRoute && targetAvailable && <Button variant="quiet" size="small" className="tour-point" onClick={pointToTarget}><LocateFixed size={18} aria-hidden="true" />Mostrar onde</Button>}
          {stepIndex > 0 && <Link href={tourSteps[stepIndex - 1].path} className={buttonVariants({ variant: 'quiet', size: 'small' })} aria-label={`Voltar: ${tourSteps[stepIndex - 1].label}`} onClick={() => { focusNext.current = true; }}><ArrowLeft size={16} aria-hidden="true" /></Link>}
          {!onTourRoute ? <Link href={step.path} className={buttonVariants({ size: 'small' })}>Voltar ao passeio</Link> : stepIndex < tourSteps.length - 1 ? <Link href={tourSteps[stepIndex + 1].path} className={buttonVariants({ size: 'small' })} onClick={() => { focusNext.current = true; }}>Próxima: {tourSteps[stepIndex + 1].label}<ArrowRight size={16} aria-hidden="true" /></Link> : <Button size="small" onClick={() => { save({ version: 1, status: 'complete', step: stepIndex }); setFinished(true); }}>Concluir tutorial</Button>}
        </footer>}
      </>}
    </aside>}
    {ready && finished && <section className="tour-welcome tour-finish" aria-labelledby={titleId}>
      <p className="tour-eyebrow" role="status">PASSEIO CONCLUÍDO</p><h2 id={titleId}>Agora, encontre seu Pico.</h2>
      <p>Comece por uma arena que faz parte da sua história. Conhecer pessoas, participar e compartilhar ficam no seu ritmo.</p>
      <div className="tour-welcome-actions"><Link href="/arenas" className={buttonVariants()} onClick={() => setFinished(false)}>Explorar arenas <ArrowRight size={17} aria-hidden="true" /></Link><Button variant="quiet" onClick={() => setFinished(false)}>Ficar no perfil</Button></div>
    </section>}
    {children}
  </div></Tour.Provider>;
}
