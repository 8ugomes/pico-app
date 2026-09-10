'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { ArrowLeft, Camera, MapPin, UserRound, Volleyball } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import type { ReadProfile } from '@/types/read';
import type { Level } from '@/types/social';
import { AvatarEditor } from './AvatarEditor';
import { RemoteAvatar } from './Media';
import { useRemoteRead } from './useRemoteRead';
import { ReadFailure, ReadLoading } from './ReadState';
import { useMutation, MutationNotice } from './useMutation';
import styles from './Profile.module.css';

function fields(profile: ReadProfile) {
  const primary = profile.sports.find(sport => sport.isPrimary);
  return { name: profile.name, username: profile.username, bio: profile.bio, city: profile.city, neighborhood: profile.neighborhood, sportId: primary?.sport.id ?? '', level: primary?.level ?? 'Iniciante', available: profile.available };
}

export function ProfileEditor({ profile, done, onPhotoChange = () => {} }: {
  profile: ReadProfile;
  done: (saved: boolean) => void;
  onPhotoChange?: () => void;
}) {
  const { state, retry } = useRemoteRead('resource=sports');
  const mutation = useMutation();
  const prefix = useId();
  const [initial] = useState(() => fields(profile));
  const [draft, setDraft] = useState(initial);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoPending, setPhotoPending] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial) || photoPending;
  const busy = mutation.busy || photoBusy;
  const sports = state.status === 'success' && state.data.kind === 'sports' ? state.data.sports : [];

  useEffect(() => {
    if (!dirty && !photoBusy) return;
    const protectDraft = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', protectDraft);
    return () => window.removeEventListener('beforeunload', protectDraft);
  }, [dirty, photoBusy]);

  function cancel() {
    if (busy) return;
    if (dirty) setConfirmLeave(true);
    else done(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || photoPending) return;
    if (await mutation.run({ action: 'save_profile', ...draft, level: draft.level as Level }, 'Perfil salvo.')) done(true);
  }

  return <section className={styles.editor} data-testid="profile-editor" aria-labelledby={`${prefix}-heading`}>
    <header className={styles.editorHeading}>
      {profile.onboardingCompleted && <Button type="button" variant="quiet" disabled={busy} onClick={cancel}><ArrowLeft size={17} aria-hidden="true" />Voltar ao perfil</Button>}
      <span className={styles.eyebrow}>DO SEU JEITO</span>
      <h1 id={`${prefix}-heading`}>{profile.onboardingCompleted ? 'Editar perfil' : 'Qual é o seu jogo?'}</h1>
      <p>Uma boa apresentação ajuda sua turma a encontrar você.</p>
    </header>

    <section className={styles.editSection} aria-labelledby={`${prefix}-photo`}>
      <h2 id={`${prefix}-photo`}><Camera size={19} aria-hidden="true" />Sua foto</h2>
      <div className={styles.photoIdentity}><div className={styles.avatar}><RemoteAvatar src={profile.avatar} name={profile.name} /></div><p>Escolha a foto e ajuste o enquadramento. A foto é salva ao confirmar “Usar esta foto”. Os outros campos são salvos abaixo.</p></div>
      <AvatarEditor currentPath={profile.avatarPath} onChange={onPhotoChange} expanded onBusyChange={setPhotoBusy} onPendingChange={setPhotoPending} />
    </section>

    {state.status === 'loading' && <ReadLoading />}
    {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    <form className={styles.form} onSubmit={submit} aria-label="Dados do perfil">
      <fieldset className={styles.editSection} disabled={busy}>
        <legend><UserRound size={19} aria-hidden="true" />Sobre você</legend>
        <Input id={`${prefix}-name`} name="name" label="Nome" value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} minLength={2} maxLength={60} autoComplete="nickname" required />
        <Input id={`${prefix}-username`} name="username" label="Nome de usuário" value={draft.username} onChange={event => setDraft({ ...draft, username: event.target.value })} minLength={3} maxLength={40} pattern="[a-z0-9_]{3,40}" autoCapitalize="none" spellCheck={false} hint="Seu @ no Pico. Use letras minúsculas, números ou _." required />
        <label className="input-group" htmlFor={`${prefix}-bio`}>Bio<textarea className="input" id={`${prefix}-bio`} name="bio" value={draft.bio} onChange={event => setDraft({ ...draft, bio: event.target.value })} maxLength={160} rows={3} placeholder="Seu esporte, seus dias de jogo, sua resenha…" aria-describedby={`${prefix}-bio-count`} /></label>
        <p className={styles.fieldHint} id={`${prefix}-bio-count`}>{draft.bio.length}/160 caracteres · visível para quem pode acessar seu perfil.</p>
      </fieldset>
      <fieldset className={styles.editSection} disabled={busy}>
        <legend><Volleyball size={19} aria-hidden="true" />Seu jogo</legend>
        <div className={styles.fieldGrid}>
          <label className="input-group" htmlFor={`${prefix}-sport`}>Esporte principal<select id={`${prefix}-sport`} className="input" name="sportId" value={draft.sportId} onChange={event => setDraft({ ...draft, sportId: event.target.value })} required><option value="" disabled>Escolha seu esporte</option>{sports.map(sport => <option value={sport.id} key={sport.id}>{sport.name}</option>)}</select></label>
          <label className="input-group" htmlFor={`${prefix}-level`}>Nível<select id={`${prefix}-level`} className="input" name="level" value={draft.level} onChange={event => setDraft({ ...draft, level: event.target.value as Level })}>{['Iniciante', 'Intermediário', 'Avançado'].map(level => <option key={level}>{level}</option>)}</select></label>
        </div>
        <label className={styles.toggle}><span><strong>Disponível pra jogar</strong><small>Mostre à turma que você está procurando um jogo.</small></span><input type="checkbox" name="available" checked={draft.available} onChange={event => setDraft({ ...draft, available: event.target.checked })} /></label>
      </fieldset>
      <fieldset className={styles.editSection} disabled={busy}>
        <legend><MapPin size={19} aria-hidden="true" />Onde você joga</legend>
        <p className={styles.fieldHint}>Cidade e bairro são opcionais. Não informe seu endereço pessoal.</p>
        <div className={styles.fieldGrid}><Input id={`${prefix}-city`} name="city" label="Cidade" value={draft.city} onChange={event => setDraft({ ...draft, city: event.target.value })} maxLength={80} autoComplete="address-level2" /><Input id={`${prefix}-neighborhood`} name="neighborhood" label="Bairro" value={draft.neighborhood} onChange={event => setDraft({ ...draft, neighborhood: event.target.value })} maxLength={80} /></div>
      </fieldset>
      <MutationNotice message={mutation.message} />
      {photoPending && <p className={styles.notice} role="status">Use ou remova a foto selecionada antes de salvar os outros dados.</p>}
      <footer className={styles.savebar}>
        <span>{busy ? 'Confirmando alterações…' : 'Seu e-mail não aparece no perfil.'}</span>
        <div>{profile.onboardingCompleted && <Button type="button" variant="quiet" disabled={busy} onClick={cancel}>Cancelar</Button>}<Button type="submit" disabled={busy || photoPending || !sports.length}>{mutation.busy ? 'Salvando…' : 'Salvar perfil'}</Button></div>
      </footer>
    </form>
    <Modal open={confirmLeave} title="Descartar alterações?" onClose={() => setConfirmLeave(false)}><p>Os campos e a foto ainda não confirmados serão descartados. Uma foto já salva não será desfeita.</p><div className="read-message-actions"><Button type="button" variant="secondary" onClick={() => setConfirmLeave(false)}>Continuar editando</Button><Button type="button" variant="quiet" onClick={() => done(false)}>Descartar e voltar</Button></div></Modal>
  </section>;
}
