'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { PageHeading } from '../SocialUI';
import { useRemoteRead } from './useRemoteRead';
import { useMutation, MutationNotice } from './useMutation';
import { ReadLoading, ReadFailure } from './ReadState';
import { removePhoto } from './Media';

function DeleteAccount() {
  const [open,setOpen]=useState(false), [busy,setBusy]=useState(false), [error,setError]=useState<string|null>(null);
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();if(busy)return;const form=new FormData(e.currentTarget);
    setBusy(true);setError(null);
    try {
      const response=await fetch('/api/account',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:form.get('password'),confirmation:form.get('confirmation')}),cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(60000)});
      const result=await response.json();
      if(!response.ok)throw new Error(result.message);
      await createClient()?.auth.signOut({scope:'local'});
      window.location.replace('/login?account=deleted');
    }catch(failure){setError(failure instanceof Error?failure.message:'Não foi possível concluir. Tente novamente.');}finally{setBusy(false);}
  }
  return <section className="connected-panel"><h2>Excluir minha conta</h2><p className="form-note">Remove seu perfil, fotos, publicações, comentários, conexões e check-ins. A exclusão é definitiva.</p><Button variant="quiet" onClick={()=>setOpen(true)}>Quero excluir minha conta</Button>
    <Modal open={open} onClose={()=>{if(!busy)setOpen(false);}} title="Excluir sua conta?">
      <p className="form-note">Confirme a senha da conta atual. Se a conexão cair após iniciar, repita aqui para concluir. Dados já removidos não poderão ser recuperados.</p>
      <form className="connected-form" onSubmit={submit}><fieldset disabled={busy}><Input id="delete-password" name="password" type="password" label="Sua senha atual" autoComplete="current-password" minLength={8} maxLength={128} required /><Input id="delete-confirmation" name="confirmation" label="Digite EXCLUIR para confirmar" autoComplete="off" pattern="EXCLUIR" required /><Button type="submit">{busy?'Excluindo…':'Excluir definitivamente'}</Button></fieldset>{error && <p role="alert" className="auth-notice notice-error">{error}</p>}</form>
    </Modal></section>;
}
export function ConnectedAccount() {
  const {state,retry,refresh}=useRemoteRead('resource=account');
  const data=state.status==='success' && state.data.kind==='account'?state.data:null;
  const mutation=useMutation();const [photoError,setPhotoError]=useState<string|null>(null), [removing,setRemoving]=useState<string|null>(null);
  return <><PageHeading eyebrow="SEU PICO" title="Privacidade e conta." /><p className="form-note"><Link href="/privacidade">Como o Pico usa seus dados</Link> · <Link href="/recuperar">Recuperar acesso</Link> · <Link href="/login">Gerenciar acesso e sair</Link></p>
    {state.status==='loading' && <ReadLoading />}{(state.status==='error'||state.status==='demo') && <ReadFailure state={state} retry={retry} />}
    {data?.deletionPending && <p role="status" className="auth-notice">Sua exclusão está em andamento. Confirme a senha novamente abaixo para concluir.</p>}
    {data && !data.deletionPending && <div key={data.viewerId}>
      <section className="connected-panel"><h2>Pessoas bloqueadas</h2><p className="form-note">O bloqueio vale nos dois sentidos. Desbloquear não recria conexões.</p>{!data.blocks.length && <p className="form-note">Você ainda não bloqueou ninguém.</p>}{data.blocks.map(b=><div className="account-row" key={b.blocked_id}><span>{b.blocked_name}</span><Button variant="quiet" size="small" disabled={mutation.busy} onClick={async()=>{if(await mutation.run({action:'set_block',playerId:b.blocked_id,blocked:false},'Jogador desbloqueado.'))refresh();}}>Desbloquear</Button></div>)}<MutationNotice message={mutation.message} /></section>
      <section className="connected-panel"><h2>Suas denúncias</h2><p className="form-note">As 20 mais recentes. Denunciar não revela sua identidade para a pessoa denunciada.</p>{!data.reports.length && <p className="form-note">Nenhuma denúncia registrada.</p>}{data.reports.map(r=><div className="account-row" key={r.id}><span>{({spam:'Spam',harassment:'Assédio ou ofensa',unsafe:'Conteúdo indevido',other:'Outro motivo'} as Record<string,string>)[r.reason]} · {new Date(r.created_at).toLocaleDateString('pt-BR')}</span><span>{r.status==='pending'?'Aguardando análise':r.status==='action_taken'?'Medida aplicada':'Análise concluída'}</span></div>)}</section>
      <section className="connected-panel"><h2>Suas fotos</h2><p className="form-note">Fotos enviadas e ainda não publicadas ficam visíveis só para você. Remova as que não usa para liberar espaço.</p>{!data.media.length && <p className="form-note">Você ainda não enviou fotos.</p>}{data.media.map((m,i)=><div className="account-row" key={m.path}><span>{m.bucket==='avatars'?'Foto de perfil':'Foto de publicação'} {i+1} · {m.inUse?'Em uso':m.ready?'Sem uso':'Envio incompleto'}</span>{!m.inUse && <Button size="small" variant="quiet" disabled={Boolean(removing)} onClick={async()=>{
        setRemoving(m.path);setPhotoError(null);
        try {await removePhoto(m.bucket as 'avatars'|'post-media',m.path);refresh();}catch(failure){setPhotoError(failure instanceof Error?failure.message:'Não foi possível remover.');}finally{setRemoving(null);}
      }}>{removing===m.path?'Removendo…':'Remover'}</Button>}</div>)}{photoError && <p role="alert" className="auth-notice notice-error">{photoError}</p>}</section>
    </div>}
    {/* Kept available when a deletion is pending and social reads are denied. */}
    <DeleteAccount />
  </>;
}
