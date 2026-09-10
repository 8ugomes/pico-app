'use client';

import Link from 'next/link';
import { useId, useState, type KeyboardEvent } from 'react';
import { MapPin, Pencil, Settings2, ShieldCheck } from 'lucide-react';
import type { ReadProfile } from '@/types/read';
import { Button } from '@/components/ui/Button';
import { ProfileEditor } from './ProfileEditor';
import { RemoteAvatar } from './Media';
import { ActivityHistory, ProfilePlaces } from './ActivityHistory';
import { ConnectedFeed } from './ConnectedFeed';
import { useRemoteRead } from './useRemoteRead';
import { ReadFailure, ReadLoading } from './ReadState';
import { SportIcon } from '../SocialUI';
import styles from './Profile.module.css';

const tabs = [
  { id: 'posts', label: 'Publicações' },
  { id: 'places', label: 'Meus Picos' },
  { id: 'activity', label: 'Atividade' },
] as const;
type ProfileTab = typeof tabs[number]['id'];

export function ConnectedProfile() {
  const { state, retry, refresh, refreshError } = useRemoteRead('resource=profile');
  if (state.status === 'loading') return <ReadLoading />;
  if (state.status === 'error' || state.status === 'demo') return <ReadFailure state={state} retry={retry} />;
  if (state.data.kind !== 'profile' || !state.data.profile) return null;

  // A different identity gets a fresh workspace. Photo refreshes do not reset drafts.
  return <ProfileWorkspace key={state.data.profile.id} profile={state.data.profile} refresh={refresh} refreshError={refreshError} />;
}

export function ProfileWorkspace({ profile, refresh, refreshError = false }: {
  profile: ReadProfile;
  refresh: () => void;
  refreshError?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<ProfileTab>('posts');
  const prefix = useId();
  const isEditing = editing || !profile.onboardingCompleted;

  function changeTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    setTab(tabs[next].id);
    document.getElementById(`${prefix}-${tabs[next].id}`)?.focus();
  }

  return <div className={styles.page}>
    {refreshError && <p className={styles.notice} role="status">Não foi possível atualizar agora. Seus campos foram preservados.</p>}
    {isEditing ? (
      // One editor, no second sibling AvatarEditor sharing profile.id.
      <ProfileEditor key={`profile-editor:${profile.id}`} profile={profile} onPhotoChange={refresh} done={(wasSaved) => {
        setEditing(false);
        setSaved(wasSaved);
        if (wasSaved) refresh();
      }} />
    ) : <>
      <header className={styles.hero}>
        <div className={styles.topline}><span className={styles.eyebrow}>ME ACHA NO PICO</span><Link className={styles.settingsLink} href="/conta" aria-label="Privacidade e configurações da conta"><Settings2 size={20} aria-hidden="true" /></Link></div>
        <div className={styles.identity}>
          <div className={styles.avatar}><RemoteAvatar src={profile.avatar} name={profile.name} /></div>
          <div className={styles.identityText}><h1>{profile.name}</h1><p className={styles.username}>@{profile.username}</p>{profile.isDemo && <span className={styles.demo}>Perfil de demonstração</span>}</div>
        </div>
        {(profile.city || profile.neighborhood) && <p className={styles.location}><MapPin size={15} aria-hidden="true" />{[profile.neighborhood, profile.city].filter(Boolean).join(' · ')}</p>}
        <p className={profile.bio ? styles.bio : styles.placeholder}>{profile.bio || 'Seu jogo, sua turma, sua história. Adicione uma bio para se apresentar.'}</p>
        <div className={styles.sports}>{profile.sports.map(({ sport, level, isPrimary }) => <div className={styles.sport} key={sport.id}><SportIcon sport={sport.slug} size={20} /><span><strong>{sport.name}</strong><small>{level}{isPrimary ? ' · Principal' : ''}</small></span></div>)}</div>
        <div className={styles.heroActions}>
          <p className={styles.availability} data-available={profile.available}><span aria-hidden="true" />{profile.available ? 'Disponível pra jogar' : 'No meu ritmo'}</p>
          <Button type="button" variant="secondary" onClick={() => { setEditing(true); setSaved(false); }}><Pencil size={16} aria-hidden="true" />Editar perfil</Button>
        </div>
      </header>
      {saved && <p className={styles.notice} role="status">Perfil atualizado.</p>}
      <div className={styles.tabs} role="tablist" aria-label="Conteúdo do seu perfil">{tabs.map((item, index) => <button key={item.id} type="button" id={`${prefix}-${item.id}`} role="tab" aria-selected={tab === item.id} aria-controls={`${prefix}-panel`} tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)} onKeyDown={event => changeTab(event, index)}>{item.label}{item.id === 'activity' && <ShieldCheck size={14} aria-hidden="true" />}</button>)}</div>
      <section className={styles.content} id={`${prefix}-panel`} role="tabpanel" aria-labelledby={`${prefix}-${tab}`} tabIndex={0}>
        {tab === 'posts' && <ConnectedFeed authorId={profile.id} readOnly />}
        {tab === 'places' && <ProfilePlaces playerId={profile.id} />}
        {tab === 'activity' && <><p className={styles.privateNote}><ShieldCheck size={16} aria-hidden="true" />Seu histórico detalhado é visível somente para você.</p><ActivityHistory /></>}
      </section>
      <nav className={styles.secondaryLinks} aria-label="Ações da sua conta"><Link href="/admin">Gerenciar meus Picos</Link><Link href="/instalar">Instalar o Pico</Link><Link href="/login">Acesso e sessão</Link></nav>
    </>}
  </div>;
}
