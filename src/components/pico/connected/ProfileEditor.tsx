'use client';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { ReadProfile } from '@/types/read';
import type { Level } from '@/types/social';
import { useRemoteRead } from './useRemoteRead';
import { ReadFailure, ReadLoading } from './ReadState';
import { useMutation, MutationNotice } from './useMutation';
export function ProfileEditor({ profile, done }: { profile: ReadProfile; done: (saved: boolean) => void }) {
  const { state, retry } = useRemoteRead('resource=sports');
  const mutation = useMutation();
  const primary = profile.sports.find(s => s.isPrimary);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? '');
    if (await mutation.run({ action: 'save_profile', name: value('name'), username: value('username'), bio: value('bio'), city: value('city'), neighborhood: value('neighborhood'), sportId: value('sportId'), level: value('level') as Level, available: form.get('available') === 'on' }, 'Perfil salvo.')) done(true);
  }
  return <section className="connected-panel">
    <h2>{profile.onboardingCompleted ? 'Editar perfil' : 'Qual é o seu jogo?'}</h2>
    <p className="muted-text">Seu nome, bio e esporte aparecem para outros jogadores. Seu e-mail fica na sua conta.</p>
    {state.status === 'loading' && <ReadLoading />}
    {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    {state.status === 'success' && state.data.kind === 'sports' && <form className="connected-form" onSubmit={submit}>
      <fieldset disabled={mutation.busy}>
        <Input id="profile-name" name="name" label="Nome" defaultValue={profile.name} minLength={2} maxLength={60} autoComplete="nickname" required />
        <Input id="profile-username" name="username" label="Nome de usuário" defaultValue={profile.username} minLength={3} maxLength={40} pattern="[a-z0-9_]{3,40}" autoCapitalize="none" spellCheck={false} hint="Letras minúsculas, números e _. De 3 a 40 caracteres." required />
        <label className="input-group" htmlFor="profile-bio">Bio<textarea className="input" id="profile-bio" name="bio" defaultValue={profile.bio} maxLength={160} rows={3} /></label>
        <div className="connected-form-row"><Input id="profile-city" name="city" label="Cidade" defaultValue={profile.city} maxLength={80} autoComplete="address-level2" /><Input id="profile-neighborhood" name="neighborhood" label="Bairro" defaultValue={profile.neighborhood} maxLength={80} /></div>
        <label className="input-group" htmlFor="profile-sport">Esporte principal<select id="profile-sport" className="input" name="sportId" defaultValue={primary?.sport.id ?? ''} required><option value="" disabled>Escolha seu esporte</option>{state.data.sports.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
        <label className="input-group" htmlFor="profile-level">Nível<select id="profile-level" className="input" name="level" defaultValue={primary?.level ?? 'Iniciante'}>{['Iniciante', 'Intermediário', 'Avançado'].map(level => <option key={level}>{level}</option>)}</select></label>
        <label className="connected-checkbox"><input type="checkbox" name="available" defaultChecked={profile.available} />Disponível pra jogar</label>
        <div className="read-message-actions"><Button type="submit" disabled={!state.data.sports.length}>{mutation.busy ? 'Salvando…' : 'Salvar perfil'}</Button>{profile.onboardingCompleted && <Button variant="quiet" onClick={() => done(false)}>Cancelar</Button>}</div>
        {!state.data.sports.length && <p role="status">Ainda não há esportes cadastrados. Tente atualizar em alguns instantes.</p>}
      </fieldset>
      <MutationNotice message={mutation.message} />
    </form>}
  </section>;
}
