'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useMutation, MutationNotice } from './useMutation';

export function SafetyActions({ target, id, own = false, playerId, onChange }: { target:'player'|'post'|'comment'; id:string; own?:boolean; playerId?:string; onChange:()=>void }) {
  const [mode,setMode]=useState<'report'|'block'|'delete'|null>(null);
  const [reason,setReason]=useState<'spam'|'harassment'|'unsafe'|'other'>('spam');
  const [details,setDetails]=useState('');
  const mutation=useMutation(); const router=useRouter();
  return <div className="safety-actions"><details><summary>Opções {target==='player'?'do perfil':target==='post'?'da publicação':'do comentário'}</summary><div className="read-message-actions">
    {own && target!=='player' ? <Button size="small" variant="quiet" onClick={()=>setMode('delete')}>Excluir</Button> : !own && <><Button size="small" variant="quiet" onClick={()=>setMode('report')}>Denunciar</Button>{playerId && <Button size="small" variant="quiet" onClick={()=>setMode('block')}>Bloquear jogador</Button>}</>}
  </div></details><MutationNotice message={mutation.message} />
  <Modal open={mode!==null} onClose={()=>{if(!mutation.busy)setMode(null);}} title={mode==='report'?'Denunciar':mode==='block'?'Bloquear jogador?':'Excluir conteúdo?'}>
    {mode==='report' ? <form className="connected-form" onSubmit={async e=>{e.preventDefault(); if(await mutation.run({action:'report',target,id,reason,details},'Denúncia registrada. Só você e a equipe podem vê-la.')) {setMode(null);setDetails('');}}}><fieldset disabled={mutation.busy}><label className="input-group">Motivo<select className="input" value={reason} onChange={e=>setReason(e.target.value as typeof reason)}><option value="spam">Spam</option><option value="harassment">Assédio ou ofensa</option><option value="unsafe">Conteúdo perigoso ou indevido</option><option value="other">Outro motivo</option></select></label><label className="input-group">O que aconteceu? (opcional)<textarea className="input" maxLength={500} rows={3} value={details} onChange={e=>setDetails(e.target.value)} /></label><p className="form-note">A denúncia é privada. Não inclua senhas ou dados sensíveis.</p><Button type="submit">{mutation.busy?'Enviando…':'Enviar denúncia'}</Button></fieldset></form> : <><p className="form-note">{mode==='block'?'Vocês deixarão de ver os perfis, publicações, fotos e presença um do outro. As conexões serão removidas. Você pode desbloquear em Privacidade e conta.':'O conteúdo será removido e não poderá ser recuperado.'}</p><Button disabled={mutation.busy} onClick={async()=>{
      const input=mode==='block' && playerId ? {action:'set_block' as const,playerId,blocked:true} : {action:(target==='post'?'delete_post':'delete_comment') as 'delete_post'|'delete_comment',id};
      if(await mutation.run(input,mode==='block'?'Jogador bloqueado.':'Conteúdo excluído.')) {setMode(null);onChange();if(mode==='block' && target==='player')router.replace('/descobrir');}
    }}>{mutation.busy?'Aguarde…':mode==='block'?'Bloquear':'Excluir definitivamente'}</Button></>}
    <MutationNotice message={mutation.message} />
  </Modal></div>;
}
