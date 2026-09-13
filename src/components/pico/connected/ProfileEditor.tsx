'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, Check, MapPin, UserRound, Volleyball } from 'lucide-react';
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

function initialDraft(profile: ReadProfile) {
  const primary = profile.sports.find(item => item.isPrimary);
  return { name: profile.name, username: profile.username, bio: profile.bio, city: profile.city,
    neighborhood: profile.neighborhood, sportId: primary?.sport.id ?? '', level: primary?.level ?? 'Iniciante' as Level,
    available: profile.available };
}

export function ProfileEditor({ profile, done, onAvatarChange = () => {} }: {
  profile: ReadProfile; done: (saved: boolean) => void; onAvatarChange?: () => void;
}) {
  const { state, retry } = useRemoteRead('resource=sports');
  const mutation = useMutation();
  const prefix = useId();
  const [baseline] = useState(() => initialDraft(profile));
  const [draft, setDraft] = useState(baseline);
  const [discard, setDiscard] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const blocked = mutation.busy || photoBusy;
  const initialSetup = !profile.onboardingCompleted;
  // This describes required form data only, never a saved profile or social action.
  const essentials = [draft.name.trim().length >= 2, /^[a-z0-9_]{3,40}$/.test(draft.username), Boolean(draft.sportId)].filter(Boolean).length;

  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => {
    if (!dirty && !photoBusy) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty, photoBusy]);

  function cancel() { if (!blocked) { if (dirty) setDiscard(true); else done(false); } }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blocked) return;
    if (await mutation.run({ action: 'save_profile', ...draft }, 'Perfil salvo.')) { window.dispatchEvent(new Event('pico:profile-saved')); done(true); }
  }
  function field<K extends keyof typeof draft>(key: K, value: typeof draft[K]) {
    setDraft(previous => ({ ...previous, [key]: value }));
  }

  return <div className="profile-v2 profile-editor-v2" data-testid="profile-editor">
    <header className="profile-v2-edit-heading">
      {profile.onboardingCompleted && <Button variant="quiet" size="small" disabled={blocked} onClick={cancel} aria-label="Voltar ao perfil"><ArrowLeft size={18} aria-hidden="true" /></Button>}
      <div><h1 ref={heading} tabIndex={-1}>{profile.onboardingCompleted ? 'Editar perfil' : 'Seu lugar no Pico'}</h1><p>{initialSetup ? 'Conte como a turma encontra você e qual é o seu esporte. O resto pode ficar para depois.' : 'Mostre quem você é dentro e fora da areia.'}</p></div>
    </header>
    {initialSetup && <nav className="profile-setup-progress" aria-label="Configuração do perfil">
      <p>{essentials} de 3 dados essenciais preenchidos</p>
      <a href={`#${prefix}-about`}>Seu nome e usuário</a><a href={`#${prefix}-sport`}>Seu esporte</a><a href={`#${prefix}-location`}>Detalhes opcionais</a>
    </nav>}
    <section className="profile-editor-v2-photo" aria-label="Foto do perfil">
      <div className="profile-v2-avatar"><RemoteAvatar src={profile.avatar} name={profile.name} /></div>
      <div className="profile-editor-v2-photo-control"><h2>Sua foto <span className="input-hint">· opcional</span></h2><p>Ajude a turma a reconhecer você.</p>
        <AvatarEditor currentPath={profile.avatarPath} onChange={onAvatarChange} onBusy={setPhotoBusy} />
      </div>
    </section>
    {state.status === 'loading' && <ReadLoading />}
    {(state.status === 'error' || state.status === 'demo') && <ReadFailure state={state} retry={retry} />}
    {state.status === 'success' && state.data.kind === 'sports' && <form className="profile-editor-v2-form" onSubmit={submit} aria-label="Editar informações do perfil">
      <fieldset disabled={blocked} className="profile-editor-v2-fields">
        <section className="profile-editor-v2-section" aria-labelledby={`${prefix}-about`}>
          <h2 id={`${prefix}-about`}><UserRound size={18} aria-hidden="true" />Sobre você</h2>
          <Input id={`${prefix}-name`} name="name" label="Nome" value={draft.name} onChange={e => field('name', e.target.value)} minLength={2} maxLength={60} autoComplete="nickname" required />
          <Input id={`${prefix}-username`} name="username" label="Nome de usuário" value={draft.username} onChange={e => field('username', e.target.value.toLowerCase())} minLength={3} maxLength={40} pattern="[a-z0-9_]{3,40}" autoCapitalize="none" spellCheck={false} hint="É como sua turma encontra você. Use letras, números ou _." required />
        </section>
        <section className="profile-editor-v2-section" aria-labelledby={`${prefix}-sport`}>
          <h2 id={`${prefix}-sport`}><Volleyball size={18} aria-hidden="true" />Seu jogo</h2>
          <p>Escolha sua modalidade principal e o nível com que você se identifica hoje.</p>
          <div className="profile-editor-v2-row">
            <label className="input-group" htmlFor={`${prefix}-sportId`}>Esporte principal<select className="input" id={`${prefix}-sportId`} name="sportId" value={draft.sportId} onChange={e => field('sportId', e.target.value)} required><option value="" disabled>Escolha seu esporte</option>{state.data.sports.map(sport => <option value={sport.id} key={sport.id}>{sport.name}</option>)}</select></label>
            <label className="input-group" htmlFor={`${prefix}-level`}>Nível<select className="input" id={`${prefix}-level`} name="level" value={draft.level} onChange={e => field('level', e.target.value as Level)}>{['Iniciante', 'Intermediário', 'Avançado'].map(level => <option key={level}>{level}</option>)}</select></label>
          </div>
        </section>
        <section className="profile-editor-v2-section" aria-labelledby={`${prefix}-location`}>
          <h2 id={`${prefix}-location`}><MapPin size={18} aria-hidden="true" />Mais sobre você <span className="input-hint">· opcional</span></h2>
          <div className="input-group"><label htmlFor={`${prefix}-bio`}>Bio</label><textarea className="input" id={`${prefix}-bio`} name="bio" value={draft.bio} onChange={e => field('bio', e.target.value)} maxLength={160} rows={3} placeholder="Seu esporte, seu ritmo, sua resenha…" /></div>
          <span className="profile-editor-v2-count">{draft.bio.length}/160</span>
          <p>Cidade e bairro aparecem no perfil. Não informe seu endereço completo.</p>
          <div className="profile-editor-v2-row"><Input id={`${prefix}-city`} name="city" label="Cidade" value={draft.city} onChange={e => field('city', e.target.value)} maxLength={80} autoComplete="address-level2" /><Input id={`${prefix}-neighborhood`} name="neighborhood" label="Bairro" value={draft.neighborhood} onChange={e => field('neighborhood', e.target.value)} maxLength={80} /></div>
        </section>
        {!profile.onboardingCompleted && <p className="form-note">Ao salvar, você entra na comunidade oficial do Pico, junto com pessoas de todas as modalidades. Seu perfil fica visível às pessoas do Pico. Você pode sair da comunidade quando quiser.</p>}
        <div className="profile-editor-v2-save"><p>{dirty ? 'Você tem alterações para salvar.' : 'Seu e-mail e sua senha ficam em Privacidade e conta.'}</p><div><Button type="submit" disabled={!state.data.sports.length || blocked}><Check size={18} aria-hidden="true" />{mutation.busy ? 'Salvando…' : 'Salvar perfil'}</Button>{profile.onboardingCompleted && <Button type="button" variant="quiet" disabled={blocked} onClick={cancel}>Cancelar edição</Button>}</div></div>
        {!state.data.sports.length && <p role="status">Ainda não há esportes disponíveis. Atualize para tentar novamente.</p>}
      </fieldset>
      <MutationNotice message={mutation.message} />
    </form>}
    <Modal open={discard} title="Descartar alterações?" onClose={() => setDiscard(false)}><p>Os dados do formulário ainda não foram salvos. Fotos já confirmadas são salvas separadamente.</p><div className="read-message-actions"><Button onClick={() => setDiscard(false)}>Continuar editando</Button><Button variant="quiet" onClick={() => { setDiscard(false); done(false); }}>Descartar e voltar</Button></div></Modal>
  </div>;
}
