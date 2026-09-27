import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, Camera as CameraIcon, Check, LoaderCircle } from 'lucide-react';
import { api, query } from './api';
import { drafts, type ProfileDraft } from './drafts';
import { choosePhoto, successHaptic } from './native';
import type { Profile, Sport } from './types';
import { Avatar, Button, ErrorState, Field, LoadingState, Notice, errorMessage } from './ui';

export function ProfileSetup({ profile, onDone, onCancel, onAccount }: { profile: Profile; onDone: () => void; onCancel?: () => void; onAccount?: () => void }) {
  const accountId = api.user?.id || '';
  const initialDraft = profileDraft(profile);
  const uploadController = useRef<AbortController | null>(null);
  const draftRef = useRef<ProfileDraft>(initialDraft);
  const [sports, setSports] = useState<Sport[]>([]);
  const [draft, setDraft] = useState<ProfileDraft>(initialDraft);
  const [draftReady, setDraftReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState('');
  const { avatarPath, name, username, bio, city, neighborhood, sportId, level } = draft;
  const displayedAvatar = avatarPreview?.startsWith('blob:')
    ? avatarPreview
    : avatarPath && avatarPath !== profile.avatarPath
      ? `/api/media?bucket=avatars&path=${encodeURIComponent(avatarPath)}`
      : avatarPreview;

  useEffect(() => {
    let active = true;
    void api.request<{ kind: 'sports'; sports: Sport[] }>(query('/social', { resource: 'sports' }))
      .then((data) => { if (active) setSports(data.sports); })
      .catch((cause) => { if (active) setError(errorMessage(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!accountId) return;
    void drafts.loadProfile(accountId).then((stored) => {
      if (!active) return;
      const next = stored || profileDraft(profile);
      draftRef.current = next;
      setDraft(next);
      setRestored(Boolean(stored));
      setDraftReady(true);
    }).catch(() => {
      if (!active) return;
      setDraftError('Não foi possível retomar as alterações neste aparelho.');
      setDraftReady(true);
    });
    return () => { active = false; };
  }, [accountId, profile]);

  useEffect(() => () => {
    uploadController.current?.abort();
    if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  function updateDraft(change: (current: ProfileDraft) => ProfileDraft) {
    const next = change(draftRef.current);
    draftRef.current = next;
    setDraft(next);
    setRestored(false);
    if (!accountId || !draftReady) return;
    void drafts.saveProfile(accountId, next).catch(() => setDraftError('Não foi possível guardar as alterações neste aparelho.'));
  }

  async function removeDraftAvatar(path: string | null) {
    if (!path || path === profile.avatarPath) return;
    await api.request('/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, bucket: 'avatars' }),
    }).catch(() => undefined);
  }

  async function photo() {
    setPhotoBusy(true);
    setError('');
    try {
      const image = await choosePhoto(true);
      const preview = URL.createObjectURL(image);
      const controller = new AbortController();
      uploadController.current = controller;
      const path = await api.uploadMedia('avatars', image, controller.signal);
      await removeDraftAvatar(avatarPath);
      setAvatarPreview(preview);
      updateDraft((current) => ({ ...current, avatarPath: path }));
      await successHaptic();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      uploadController.current = null;
      setPhotoBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!avatarPath || busy) return;
    setBusy(true);
    setError('');
    try {
      if (avatarPath !== profile.avatarPath) {
        await api.request('/social', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set_avatar', path: avatarPath }),
        });
      }
      await api.request('/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_profile',
          name,
          username,
          bio,
          city,
          neighborhood,
          sportId,
          level,
          available: false,
        }),
      });
      await drafts.clearProfile(accountId);
      await successHaptic();
      onDone();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return <main className="setup-screen" id="main-content">
    {onCancel && <button type="button" className="back-button" onClick={onCancel}><ArrowLeft size={19} aria-hidden="true" />Continuar depois</button>}
    <header className="editorial-heading"><span>SEU PICO</span><h1>Deixa seu perfil com a sua cara.</h1><p>É o que ajuda sua turma a te reconhecer na areia. Você pode ajustar depois.</p></header>
    {onAccount && <Button type="button" variant="quiet" onClick={onAccount}>Conta e privacidade</Button>}
    {loading || !draftReady ? <LoadingState>Retomando seu perfil…</LoadingState> : <form className="setup-form" onSubmit={submit} aria-busy={busy || photoBusy}>
      <fieldset disabled={busy || photoBusy}>
        {restored && <Notice>Suas alterações deste aparelho foram retomadas.</Notice>}
        <div className="avatar-editor">
          <Avatar src={displayedAvatar} name={name || 'Pico'} size="large" />
          <Button type="button" variant="secondary" onClick={photo}>{photoBusy ? <LoaderCircle className="spinner" size={18} aria-hidden="true" /> : <CameraIcon size={18} aria-hidden="true" />}{photoBusy ? 'Enviando foto…' : avatarPath ? 'Trocar foto' : 'Escolher foto'}</Button>
          {photoBusy && <Button type="button" variant="quiet" onClick={() => uploadController.current?.abort()}>Cancelar envio</Button>}
        </div>
        {avatarPath && avatarPath !== profile.avatarPath && !avatarPreview?.startsWith('blob:') && <Notice>Uma foto já está anexada às alterações salvas.</Notice>}
        {!avatarPath && <Notice tone="warning">Confirme uma foto para terminar o perfil.</Notice>}
        <Field label="Nome"><input name="name" required minLength={2} maxLength={60} value={name} onChange={(event) => updateDraft((current) => ({ ...current, name: event.target.value }))} autoComplete="name" /></Field>
        <Field label="Nome de usuário" hint="Use letras minúsculas, números ou _. (3 a 40 caracteres)"><div className="username-field"><span>@</span><input name="username" required minLength={3} maxLength={40} pattern="[a-z0-9_]+" value={username} onChange={(event) => updateDraft((current) => ({ ...current, username: event.target.value.toLocaleLowerCase('pt-BR') }))} autoCapitalize="none" autoCorrect="off" /></div></Field>
        <Field label="Uma frase sobre você"><textarea name="bio" maxLength={160} rows={3} value={bio} onChange={(event) => updateDraft((current) => ({ ...current, bio: event.target.value }))} placeholder="Sua modalidade, seu ritmo, sua praia." /></Field>
        <div className="field-pair">
          <Field label="Cidade"><input name="city" maxLength={80} value={city} onChange={(event) => updateDraft((current) => ({ ...current, city: event.target.value }))} autoComplete="address-level2" /></Field>
          <Field label="Bairro"><input name="neighborhood" maxLength={80} value={neighborhood} onChange={(event) => updateDraft((current) => ({ ...current, neighborhood: event.target.value }))} /></Field>
        </div>
        <Field label="Modalidade principal"><select name="sportId" required value={sportId} onChange={(event) => updateDraft((current) => ({ ...current, sportId: event.target.value }))}><option value="" disabled>Escolha</option>{sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></Field>
        <Field label="Seu nível"><select name="level" required value={level} onChange={(event) => updateDraft((current) => ({ ...current, level: event.target.value as ProfileDraft['level'] }))}><option>Iniciante</option><option>Intermediário</option><option>Avançado</option></select></Field>
        <Button type="submit" className="full-width" disabled={!avatarPath || busy}>{busy && <LoaderCircle className="spinner" size={18} aria-hidden="true" />}{busy ? 'Salvando…' : 'Entrar no Pico'}{!busy && <Check size={18} aria-hidden="true" />}</Button>
      </fieldset>
      {draftError && <ErrorState message={draftError} />}{error && <ErrorState message={error} />}
    </form>}
  </main>;
}

function profileDraft(profile: Profile): ProfileDraft {
  return {
    avatarPath: profile.avatarPath,
    name: profile.name,
    username: profile.username,
    bio: profile.bio,
    city: profile.city,
    neighborhood: profile.neighborhood,
    sportId: profile.sports[0]?.sport.id || '',
    level: profile.sports[0]?.level || 'Iniciante',
  };
}
