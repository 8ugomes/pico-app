'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ProfileEditor } from './ProfileEditor';
import { MapPin, UserRound, ArrowUpRight } from 'lucide-react';
import { PageHeading, EmptyState, SportIcon } from '../SocialUI';
import { Button, buttonVariants } from '@/components/ui/Button';
import { useRemoteRead } from './useRemoteRead';
import { ConnectedSource, ReadFailure, ReadLoading } from './ReadState';

export function ConnectedProfile() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const { state, retry } = useRemoteRead('resource=profile');
  const profile = state.status === 'success' && state.data.kind === 'profile' ? state.data.profile : null;
  return <>
    <PageHeading eyebrow="ME ACHA NO PICO" title="Seu perfil." />
    {state.status === 'loading' && <ReadLoading />}
    {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    {profile && <>
      <ConnectedSource />
      {saved && <p className="auth-notice notice-success" role="status">Perfil atualizado.</p>}
      {(editing || !profile.onboardingCompleted) && <ProfileEditor profile={profile} done={(wasSaved) => { setEditing(false); setSaved(wasSaved); if (wasSaved) retry(); }} />}
      <div className="read-profile-identity"><span className="read-profile-avatar" role="img" aria-label="Perfil sem foto"><UserRound size={40} strokeWidth={1.3} aria-hidden="true" /></span><div><h2>{profile.name}</h2><p>@{profile.username}</p>{profile.isDemo && <span className="sport-label">Perfil de demonstração</span>}</div></div>
      {(profile.city || profile.neighborhood) && <p className="location-line"><MapPin size={15} aria-hidden="true" />{[profile.neighborhood, profile.city].filter(Boolean).join(' · ')}</p>}
      {profile.bio ? <p className="profile-bio">{profile.bio}</p> : <p className="profile-bio muted-text">Sua bio ainda não foi adicionada.</p>}
      <div className="profile-sports">{profile.sports.map(({ sport, level, isPrimary }) => <div key={sport.id}><SportIcon sport={sport.slug} size={20} /><span><strong>{sport.name}</strong><small>{level}{isPrimary ? ' · Principal' : ''}</small></span></div>)}</div>
      {!profile.sports.length && <EmptyState title="Qual é o seu jogo?">Seu perfil ainda não tem modalidades cadastradas.</EmptyState>}
      <p className={`availability profile-availability ${profile.available ? 'available' : ''}`}><span />{profile.available ? 'Disponível pra jogar' : 'Indisponível para jogar agora'}</p>

      <div className="read-message-actions"><Button variant="secondary" onClick={() => { setEditing(true); setSaved(false); }}>Editar perfil</Button><Link href="/login" className={buttonVariants({ variant: 'quiet' })}>Gerenciar acesso <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
    </>}
  </>;
}
