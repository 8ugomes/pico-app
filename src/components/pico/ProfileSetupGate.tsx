'use client';

import '@/app/profile.css';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { profileSetupComplete } from '@/lib/profile-setup';
import { SignOutButton } from './SignOutButton';
import { ProfileEditor } from './connected/ProfileEditor';
import { useOwnProfile } from './connected/OwnProfile';
import { ReadFailure, ReadLoading } from './connected/ReadState';

export function ProfileSetupGate({ children }: { children: ReactNode }) {
  const { state, retry, refresh, refreshError } = useOwnProfile();
  const path = usePathname();
  const router = useRouter();
  const [flow, setFlow] = useState<{ id: string; editing: boolean } | null>(null);
  // Account rights and sign-out must remain available without a completed profile.
  if (path === '/conta') return children;
  if (state.status === 'loading') return <ReadLoading />;
  if (state.status !== 'success') return <ReadFailure state={state} retry={retry} />;
  if (state.data.kind !== 'profile') return null;
  const profile = state.data.profile;
  // Keep an existing profile editor mounted when its photo is removed/replaced.
  // Other social destinations still require the confirmed photo.
  if (path === '/perfil' && profile.onboardingCompleted && !(flow?.id === profile.id && flow.editing)) return children;
  const incomplete = !profileSetupComplete(profile);
  if (incomplete && flow?.id !== profile.id) setFlow({ id: profile.id, editing: true });
  // Confirming a photo must not close the form and discard its other fields.
  if (incomplete || (flow?.id === profile.id && flow.editing)) return <>
    <header className="profile-v2-toolbar"><Link className="profile-account-link" href="/conta">Minha conta</Link><SignOutButton /></header>
    {refreshError && <p role="status">Não foi possível atualizar o perfil. Seus campos foram preservados.</p>}
    <ProfileEditor key={profile.id} profile={profile} setup onAvatarChange={refresh} done={saved => {
      if (saved) { setFlow({ id: profile.id, editing: false }); refresh(); if (path === '/perfil') router.replace('/feed'); }
    }} />
  </>;
  return children;
}
