'use client';

import '@/app/profile.css';
import { useId, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, MapPin, Pencil, Settings2, ShieldCheck } from 'lucide-react';
import type { ReadProfile } from '@/types/read';
import { Button, buttonVariants } from '@/components/ui/Button';
import { ActivityHistory, ProfilePlaces } from './ActivityHistory';
import { ConnectedFeed } from './ConnectedFeed';
import { ProfileEditor } from './ProfileEditor';
import { RemoteAvatar } from './Media';
import { SportIcon } from '../SocialUI';
import { useRemoteRead } from './useRemoteRead';
import { useEntity } from './useEntity';
import { ReadFailure, ReadLoading } from './ReadState';

export function ConnectedProfile() {
  const { state, retry, refresh, refreshError } = useRemoteRead('resource=profile');
  if (state.status === 'loading') return <ReadLoading />;
  if (state.status !== 'success') return <ReadFailure state={state} retry={retry} />;
  if (state.data.kind !== 'profile') return null;
  return <>
    {refreshError && <p role="status" className="form-note">Não foi possível atualizar. Suas edições nesta tela foram preservadas.</p>}
    {/* One identity boundary. Never reuse a profile ID for sibling editors. */}
    <ProfileWorkspace key={state.data.profile.id} profile={state.data.profile} refresh={refresh} />
  </>;
}

const panels = [
  { id: 'posts', label: 'Publicações' },
  { id: 'places', label: 'Meus Picos' },
  { id: 'activity', label: 'Atividade' },
] as const;
type Panel = typeof panels[number]['id'];
type ManagementOverview = { platformRole: string | null; arenas: unknown[]; communities?: unknown[] };

function ProfileWorkspace({ profile, refresh }: { profile: ReadProfile; refresh: () => void }) {
  const [editing, setEditing] = useState(!profile.onboardingCompleted);
  const [saved, setSaved] = useState(false);
  const [panel, setPanel] = useState<Panel>('posts');
  const tabId = useId();
  const { data: management } = useEntity<ManagementOverview>('/api/manage');
  const canManage = Boolean(management?.platformRole || management?.arenas.length || management?.communities?.length);
  const location = [profile.neighborhood, profile.city].filter(Boolean).join(' · ');

  // Mutually exclusive trees prevent feed/history/avatar editors from being
  // reconciled as the same child when repeatedly entering and leaving editing.
  if (editing) return <ProfileEditor profile={profile} onAvatarChange={refresh} done={wasSaved => {
    setEditing(false);
    setSaved(wasSaved);
    if (wasSaved) refresh();
  }} />;

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % panels.length;
    else if (event.key === 'ArrowLeft') next = (index + panels.length - 1) % panels.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = panels.length - 1;
    else return;
    event.preventDefault();
    setPanel(panels[next].id);
    document.getElementById(`${tabId}-${panels[next].id}`)?.focus();
  }

  return <div className="profile-v2" data-testid="profile-view">
    <header className="profile-v2-toolbar">
      <p className="profile-v2-kicker">ME ACHA NO PICO</p>
      <Link href="/conta" className="icon-button" aria-label="Privacidade e configurações"><Settings2 size={20} aria-hidden="true" /></Link>
    </header>
    <section className="profile-v2-hero" aria-labelledby="profile-name-heading">
      <div className="profile-v2-identity">
        <div className="profile-v2-avatar"><RemoteAvatar src={profile.avatar} name={profile.name} /></div>
        <div className="profile-v2-name"><h1 id="profile-name-heading">{profile.name}</h1><p>@{profile.username}</p>
          {location && <span className="profile-v2-location"><MapPin size={14} aria-hidden="true" />{location}</span>}
        </div>
      </div>
      {profile.isDemo && <span className="sport-label">Perfil de demonstração</span>}
      <p className={`profile-v2-bio ${profile.bio ? '' : 'muted-text'}`}>{profile.bio || 'Seu próximo jogo começa com uma conexão. Conte um pouco sobre você.'}</p>
      <div className="profile-v2-sports">{profile.sports.map(({ sport, level, isPrimary }) => <span className="profile-v2-sport" key={sport.id}>
        <SportIcon sport={sport.slug} size={18} /><span><strong>{sport.name}</strong><small>{level}{isPrimary ? ' · Principal' : ''}</small></span>
      </span>)}</div>
      <div className="profile-v2-actions">
        <span className={`profile-v2-availability ${profile.available ? 'is-available' : ''}`}><i aria-hidden="true" />{profile.available ? 'Disponível para jogar' : 'Sem disponibilidade agora'}</span>
        <Button variant="secondary" onClick={() => { setEditing(true); setSaved(false); }}><Pencil size={16} aria-hidden="true" />{profile.onboardingCompleted ? 'Editar perfil' : 'Completar perfil'}</Button>
      </div>
    </section>
    {saved && <p className="auth-notice notice-success" role="status">Perfil atualizado.</p>}
    <div className="profile-v2-tabs" role="tablist" aria-label="Conteúdo do seu perfil">{panels.map((item, index) => <button
      key={item.id} id={`${tabId}-${item.id}`} type="button" role="tab"
      aria-selected={panel === item.id} aria-controls={`${tabId}-panel-${item.id}`} tabIndex={panel === item.id ? 0 : -1}
      onClick={() => setPanel(item.id)} onKeyDown={event => moveTab(event, index)}
    >{item.label}</button>)}</div>
    {panels.map(item => <section key={item.id} role="tabpanel" id={`${tabId}-panel-${item.id}`} aria-labelledby={`${tabId}-${item.id}`} hidden={panel !== item.id} tabIndex={0} className="profile-v2-panel">
      {panel === item.id && (item.id === 'posts' ? <ConnectedFeed authorId={profile.id} readOnly /> : item.id === 'places' ? <ProfilePlaces playerId={profile.id} /> : <><p className="profile-v2-private"><ShieldCheck size={16} aria-hidden="true" />Só você vê seu histórico detalhado.</p><ActivityHistory /></>)}
    </section>)}
    <footer className="profile-v2-footer">
      {canManage && <Link href="/admin" className={buttonVariants({ variant: 'quiet', size: 'small' })}>Gerenciar meus Picos <ArrowUpRight size={15} aria-hidden="true" /></Link>}
      <Link href="/instalar">Instalar o Pico</Link><Link href="/conta">Privacidade e conta</Link>
      <Link href="/feed"><ArrowLeft size={14} aria-hidden="true" /> Voltar ao feed</Link>
    </footer>
  </div>;
}
