'use client';
import{ConnectedFeed}from'./ConnectedFeed';
import Link from 'next/link';
import { useState } from 'react';
import { ProfileEditor } from './ProfileEditor';
import { RemoteAvatar } from './Media';
import { AvatarEditor } from './AvatarEditor';
import { MapPin, ArrowUpRight } from 'lucide-react';
import { PageHeading, EmptyState, SportIcon } from '../SocialUI';
import { Button, buttonVariants } from '@/components/ui/Button';
import { useRemoteRead } from './useRemoteRead';
import { ConnectedSource, ReadFailure, ReadLoading } from './ReadState';

export function ConnectedProfile() {
  const [editing, setEditing] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const { state, retry } = useRemoteRead('resource=profile');
  const profile = state.status === 'success' && state.data.kind === 'profile' ? state.data.profile : null;
  return <>
    <PageHeading eyebrow="ME ACHA NO PICO" title="Seu perfil." />
    {state.status === 'loading' && <ReadLoading />}
    {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    {profile && <>
      <ConnectedSource /><p className="form-note"><Link href="/admin">Gerenciar meus Picos</Link></p>
      {savedId === profile.id && <p className="auth-notice notice-success" role="status">Perfil atualizado.</p>}
      {(editing || !profile.onboardingCompleted) && <ProfileEditor key={profile.id} profile={profile} done={(wasSaved) => { setEditing(false); setSavedId(wasSaved ? profile.id : null); if (wasSaved) retry(); }} />}
      {!editing && profile.onboardingCompleted && <><div className="read-profile-identity"><RemoteAvatar src={profile.avatar} name={profile.name} /><div><h2>{profile.name}</h2><p>@{profile.username}</p>{profile.isDemo && <span className="sport-label">Perfil de demonstração</span>}</div></div>
      {(profile.city || profile.neighborhood) && <p className="location-line"><MapPin size={15} aria-hidden="true" />{[profile.neighborhood, profile.city].filter(Boolean).join(' · ')}</p>}
      {profile.bio ? <p className="profile-bio">{profile.bio}</p> : <p className="profile-bio muted-text">Sua bio ainda não foi adicionada.</p>}
      <div className="profile-sports">{profile.sports.map(({ sport, level, isPrimary }) => <div key={sport.id}><SportIcon sport={sport.slug} size={20} /><span><strong>{sport.name}</strong><small>{level}{isPrimary ? ' · Principal' : ''}</small></span></div>)}</div>
      {!profile.sports.length && <EmptyState title="Qual é o seu jogo?">Seu perfil ainda não tem modalidades cadastradas.</EmptyState>}
      <p className={`availability profile-availability ${profile.available ? 'available' : ''}`}><span />{profile.available ? 'Disponível pra jogar' : 'Indisponível para jogar agora'}</p>

      <div className="read-message-actions"><Button variant="secondary" onClick={() => { setEditing(true); setSavedId(null); }}>Editar perfil</Button></div></>}
      <ConnectedFeed authorId={profile.id} readOnly/><AvatarEditor key={profile.id} currentPath={profile.avatarPath} onChange={retry} />
      <div className="read-message-actions"><Link href="/conta" className={buttonVariants({ variant: 'quiet' })}>Privacidade e conta</Link><Link href="/login" className={buttonVariants({ variant: 'quiet' })}>Gerenciar acesso <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
    </>}
  </>;
}
