'use client';
import{EntityPhotos,EntityImages}from'./EntityPhotos';
import{ConnectedFeed}from'./ConnectedFeed';
import{useId,useState}from'react';import Link from'next/link';import{useRouter}from'next/navigation';import{Button}from'@/components/ui/Button';import{Modal}from'@/components/ui/Modal';import{PageHeading,EmptyState}from'../SocialUI';import{useEntity,entityAction}from'./useEntity';import{useRemoteRead}from'./useRemoteRead';import type{ReadSport}from'@/types/read';
import { Plus, UsersRound, LoaderCircle, ArrowRight, LockKeyhole, MapPin } from 'lucide-react';
import { ChoiceChip } from '@/components/ui/ChoiceChip';
export type CommunityCard={id:string;slug:string;name:string;entry_mode:'open'|'approval'|'invite';visibility:'beta'|'private';membership:string|null;description:string|null;arena_name?:string;is_official?:boolean;pico_official?:boolean};
export type CommunityPage=CommunityCard&{editorial?:{id:string;title:string;body:string;published_at:string}[];readable:boolean;rank:number;version:number;rules:string|null;sports:ReadSport[];owner:{id:string;name:string;username:string}|null;members:{id:string;name:string;username:string;role:string;status:string}[];arena:{id:string;name:string;slug:string;official:boolean;status:string}|null;avatar_path:string|null;cover_path:string|null};
export function Communities({ arenaId }: { arenaId?: string }) {
  const [mine, setMine] = useState(true), [search, setSearch] = useState(''), [offset, setOffset] = useState(0), [create, setCreate] = useState(false);
  const { data, error, reload } = useEntity<CommunityCard[]>(`/api/communities?search=${encodeURIComponent(search)}&mine=${arenaId ? false : mine}&offset=${offset}${arenaId ? '&arena=' + arenaId : ''}`);
  return <>
    {!arenaId && <><PageHeading eyebrow="ENCONTRE QUEM JOGA COM VOCÊ" title="Comunidades" /><p className="page-intro">Cada grupo tem seu jeito de jogar e conversar. Conheça o propósito e as condições de entrada.</p></>}
    <div className="community-toolbar">
      {!arenaId && <>
        <div className="feed-tabs" aria-label="Filtrar comunidades">
          <button type="button" className={mine ? 'active-tab' : ''} aria-pressed={mine} onClick={() => { setMine(true); setOffset(0); }}>Minhas comunidades</button>
          <button data-tour="community-explore" type="button" className={!mine ? 'active-tab' : ''} aria-pressed={!mine} onClick={() => { setMine(false); setOffset(0); }}>Explorar</button>
        </div>
      </>}
      <label className="input-group">Buscar comunidades<input className="input" type="search" placeholder="Nome da comunidade" value={search} onChange={e => { setSearch(e.target.value); setOffset(0); }} /></label>
    </div>
    {error && <div className="read-message"><p className="form-error" role="alert">{error}</p><Button size="small" variant="secondary" onClick={reload}>Tentar novamente</Button></div>}
    {!data && !error && <p className="read-source" role="status"><LoaderCircle className="spinner" size={18} aria-hidden="true" />Carregando comunidades…</p>}
    <div className="community-list">{data?.slice(0, 20).map(c => <article className="community-card" key={c.id}>
      <Link className="community-card-title" href={`/comunidades/${c.slug}`}><span className="community-symbol"><UsersRound size={22} aria-hidden="true" /></span><h2>{c.name}</h2><ArrowRight size={18} aria-hidden="true" /></Link>
      {c.pico_official && <p className="community-membership">Oficial do Pico · Todas as modalidades</p>}{c.description && <p className="community-purpose">{c.description}</p>}
      <p className="community-meta">{c.visibility === 'private' ? 'Somente participantes ativos' : 'Pessoas do Pico'} · {({ open: 'Entrada aberta', approval: 'Entrada por aprovação', invite: 'Por convite' })[c.entry_mode]}</p>
      {c.arena_name && <p className="community-place"><MapPin size={14} aria-hidden="true" />{c.arena_name}{c.is_official ? ' · Oficial' : ''}</p>}
      {c.membership && <p className="community-membership">{({ active: 'Você participa', pending: 'Pedido de entrada em análise', suspended: 'Participação suspensa', rejected: 'Pedido de entrada recusado' })[c.membership as 'active'] || 'Consulte as condições de entrada.'}</p>}
    </article>)}</div>
    {data?.length === 0 && <div className="community-empty"><EmptyState title={search ? 'Nenhum grupo com esse nome.' : mine && !arenaId ? 'Encontre uma turma para chamar de sua.' : 'Ainda não há comunidades por aqui.'}>{search ? 'Tente outro nome ou limpe a busca.' : mine && !arenaId ? 'Os grupos de que você participa e seus pedidos de entrada aparecem aqui.' : 'Você pode conhecer outros grupos ou criar uma comunidade.'}</EmptyState><div className="read-message-actions">{search ? <Button variant="secondary" onClick={() => setSearch('')}>Limpar busca</Button> : mine && !arenaId ? <Button onClick={() => { setMine(false); setOffset(0); }}>Explorar comunidades</Button> : <Link href="/comunidades">Conhecer outras comunidades</Link>}</div></div>}
    {data && (offset > 0 || data.length > 20) && <nav className="read-pagination" aria-label="Páginas de comunidades"><Button variant="secondary" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 20))}>Anterior</Button><Button disabled={data.length <= 20} onClick={() => setOffset(offset + 20)}>Próxima</Button></nav>}
    {!arenaId && <footer className="community-create"><div><h2>Já tem uma turma?</h2><p>Crie um espaço com o propósito e as regras do seu grupo.</p></div><Button variant="secondary" size="small" onClick={() => setCreate(true)}><Plus size={18} aria-hidden="true" />Criar comunidade</Button></footer>}
    <Modal open={create} onClose={() => setCreate(false)} title="Criar comunidade"><CommunityForm onDone={() => { setCreate(false); reload(); }} /></Modal>
  </>;
}
export function CommunityForm({ community, onDone }: { community?: CommunityPage; onDone: () => void }) {
  const router = useRouter();
  const hintId = useId(), messageId = useId();
  const [data, setData] = useState({ name: community?.name || '', description: community?.description || '', rules: community?.rules || '', entry_mode: community?.entry_mode || 'open', visibility: community?.visibility || 'beta', sports: community?.sports.map(s => s.id) || [] });
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const { state } = useRemoteRead('resource=sports');
  const sports = state.status === 'success' && state.data.kind === 'sports' ? state.data.sports : [];
  return <form className="connected-form community-form" aria-busy={busy} aria-describedby={message ? messageId : undefined} onSubmit={async e => {
    e.preventDefault(); setBusy(true);
    try {
      const r = await entityAction('/api/communities', { action: community ? 'edit' : 'create', id: community?.id, version: community?.version, data });
      if (!community) router.push('/comunidades/' + r.slug);
      onDone();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Não foi possível salvar.'); }
    finally { setBusy(false); }
  }}>
    <fieldset className="form-section" disabled={busy}>
      <legend>Sobre a comunidade</legend>
      <label className="input-group">Nome<input className="input" required minLength={2} maxLength={100} value={data.name} onChange={e => setData({ ...data, name: e.target.value })} /></label>
      <label className="input-group">Descrição<textarea className="input" rows={2} maxLength={1000} value={data.description} onChange={e => setData({ ...data, description: e.target.value })} /></label>
      <label className="input-group">Regras<textarea className="input" rows={2} maxLength={2000} value={data.rules} onChange={e => setData({ ...data, rules: e.target.value })} /></label>
    </fieldset>
    <fieldset className="form-section" disabled={busy}>
      <legend>Acesso e participação</legend>
      <label className="input-group">Quem vê o conteúdo<select className="input" aria-describedby={hintId} disabled={!!community} value={data.visibility} onChange={e => setData({ ...data, visibility: e.target.value as 'beta' | 'private' })}><option value="beta">Pessoas do Pico</option><option value="private">Somente participantes ativos</option></select><span id={hintId} className="input-hint">A audiência é preservada depois da criação.</span></label>
      <label className="input-group">Como participar<select className="input" value={data.entry_mode} onChange={e => setData({ ...data, entry_mode: e.target.value as 'open' | 'approval' | 'invite' })}><option value="open">Entrada aberta</option><option value="approval">Aprovação da equipe</option><option value="invite">Convite individual</option></select></label>
    </fieldset>
    <fieldset className="form-section" disabled={busy}>
      <legend>Modalidades</legend>
      <div className="choice-chips">{sports.map(s => <ChoiceChip key={s.id} checked={data.sports.includes(s.id)} onChange={e => setData({ ...data, sports: e.target.checked ? [...data.sports, s.id] : data.sports.filter(id => id !== s.id) })}>{s.name}</ChoiceChip>)}</div>
    </fieldset>
    <p id={messageId} className="form-error" role="status">{message}</p>
    <div className="form-actions"><Button type="submit" disabled={busy}>{busy && <LoaderCircle size={18} className="spinner" aria-hidden="true" />}{busy ? 'Salvando…' : community ? 'Salvar comunidade' : 'Criar minha comunidade'}</Button></div>
  </form>;
}
export function Community({ slug }: { slug: string }) {
  const { data: c, error, reload } = useEntity<CommunityPage>('/api/communities?kind=page&slug=' + encodeURIComponent(slug));
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  async function membership() {
    if (!c) return;
    setBusy(true); setMessage('');
    try {
      await entityAction('/api/communities', { action: 'membership', id: c.id, memberAction: c.membership === 'active' ? 'leave' : 'join' });
      setMessage(c.membership === 'active' ? 'Você saiu da comunidade.' : c.entry_mode === 'approval' ? 'Pedido enviado. A equipe da comunidade vai analisar sua entrada.' : 'Você entrou na comunidade. O mural está logo abaixo.');
      reload();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Não foi possível confirmar.'); }
    finally { setBusy(false); }
  }
  return <><Link className="detail-back" href="/comunidades">← Comunidades</Link>
    {error && <div className="read-message"><p role="alert">{error}</p><Button variant="secondary" onClick={reload}>Tentar novamente</Button></div>}
    {!c && !error && <p role="status">Carregando comunidade…</p>}
    {c && <>
      <header className="community-identity">
        {c.readable && <EntityImages avatar={c.avatar_path} cover={c.cover_path} name={c.name} />}
        <PageHeading eyebrow={c.pico_official ? "OFICIAL DO PICO" : "COMUNIDADE"} title={c.name} />
        <p className="community-description">{c.description || (c.readable ? 'A comunidade ainda não adicionou uma descrição.' : 'Confira as condições para participar.')}</p>
        {c.arena?.status === 'approved' && <Link className="community-place" href={`/arenas/${c.arena.slug}`}><MapPin size={16} aria-hidden="true" />{c.arena.name}{c.arena.official ? ' · Grupo oficial' : ''}</Link>}
        <p data-tour="community-conditions" className="community-conditions">{c.visibility === 'private' && <LockKeyhole size={15} aria-hidden="true" />}{c.visibility === 'private' ? 'Conteúdo só para participantes ativos' : 'Conteúdo para pessoas do Pico'} · {({ open: 'entrada aberta', approval: 'entrada por aprovação', invite: 'entrada por convite' })[c.entry_mode]}</p>
      </header>
      <div className="community-participation">
        {c.membership === 'active' ? <p className="membership-confirmed">Você participa desta comunidade.</p> : c.membership === 'pending' ? <p role="status">Seu pedido está em análise. {c.visibility === 'private' ? 'O mural fica disponível após a aprovação.' : 'Você pode ler o mural; publicar exige participação aprovada.'}</p> : c.membership === 'suspended' ? <p>Participação suspensa. As ações de membro estão indisponíveis.</p> : c.membership === 'rejected' ? <p>Seu pedido de entrada foi recusado.</p> : c.entry_mode === 'invite' ? <p>Para participar, é preciso um convite individual da equipe.</p> : <Button disabled={busy} onClick={membership}>{busy ? 'Enviando…' : c.entry_mode === 'approval' ? 'Solicitar participação' : 'Participar da comunidade'}</Button>}
        <p role="status">{message}</p>
        {c.rank >= 20 && <Link className="community-manage-link" href={`/comunidades/${slug}/gestao`}>Gerenciar comunidade <ArrowRight size={16} aria-hidden="true" /></Link>}
        {(c.pico_official || c.rank < 40) && c.membership === 'active' && <details><summary>Opções de participação</summary><Button variant="quiet" disabled={busy} onClick={membership}>Sair da comunidade</Button></details>}
      </div>
      {c.readable ? <>
        <details className="community-about"><summary>Sobre o grupo e participantes</summary><div><h2>Modalidades</h2><p>{c.sports.map(s => s.name).join(' · ') || 'As modalidades ainda não foram informadas.'}</p><h2>Regras da comunidade</h2><p>{c.rules || 'As regras ainda não foram informadas.'}</p><h2>Quem participa</h2><ul className="member-rows">{c.members.filter(m => m.status === 'active').map(m => <li key={m.id}><Link href={`/perfil/${m.username}`}><span className="member-initial" aria-hidden="true">{m.name.slice(0, 1)}</span><span>{m.name}<small>{({ owner: 'Proprietário', admin: 'Administrador', moderator: 'Moderador', member: 'Participante' })[m.role as 'member']}</small></span><ArrowRight size={16} aria-hidden="true" /></Link></li>)}</ul></div></details>
        {c.pico_official && <section className="official-editorial" aria-label="Publicações do Pico">{c.editorial?.map(post => <article key={post.id}><p className="eyebrow">PICO · PUBLICAÇÃO OFICIAL</p><h2>{post.title}</h2><p>{post.body}</p></article>)}</section>}
        <section id="community-wall" aria-label="Mural da comunidade"><ConnectedFeed communityId={c.id} readOnly={c.rank < 10} moderate={c.rank >= 20 ? { community: c.id } : undefined} /></section>
      </> : <section className="community-private"><LockKeyhole size={24} aria-hidden="true" /><h2>Um espaço reservado ao grupo</h2><p>Publicações e informações de participantes ficam disponíveis para quem tem acesso aprovado nesta comunidade.</p><Link href="/comunidades">Conhecer outras comunidades <ArrowRight size={16} aria-hidden="true" /></Link></section>}
    </>}
  </>;
}
export function CommunityAction({label,id,memberAction,target,role,onDone}:{label:string;id:string;memberAction:string;target?:string;role?:string;onDone:()=>void}){const[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');return <><Button size="small" variant="secondary" onClick={()=>setOpen(true)}>{label}</Button><Modal open={open} onClose={()=>{if(!busy)setOpen(false)}} title={label}><p>A alteração vale apenas para esta comunidade. A transferência passa a responsabilidade ao participante escolhido.</p><Button disabled={busy} onClick={async()=>{setBusy(true);try{await entityAction('/api/communities',{action:'membership',id,memberAction,target,role});setOpen(false);onDone()}catch(e){setMessage(e instanceof Error?e.message:'Não foi possível confirmar.')}finally{setBusy(false)}}}>Confirmar</Button><p role="status">{message}</p></Modal></>}
export function CommunityManagement({slug}:{slug:string}){const{data:c,error,reload}=useEntity<CommunityPage>('/api/communities?kind=page&slug='+encodeURIComponent(slug));const[email,setEmail]=useState(''),[link,setLink]=useState(''),[arena,setArena]=useState(''),[message,setMessage]=useState('');const{state}=useRemoteRead('resource=arenas&offset=0');const arenas=state.status==='success'&&state.data.kind==='arenas'?state.data.arenas:[];return <><Link className="detail-back" href={`/comunidades/${slug}`}>← Voltar à comunidade</Link>{error&&<p role="alert">{error}</p>}{c&&<><PageHeading eyebrow="GESTÃO DO GRUPO" title={c.name}/>{c.rank<20?<p>Você não tem permissão para gerir esta comunidade.</p>:<>{c.rank>=30&&<><CommunityForm key={c.version} community={c} onDone={reload}/><EntityPhotos kind="community" id={c.id} avatar={c.avatar_path} cover={c.cover_path} onDone={reload}/></>}<section className="arena-about"><h2>Participação</h2>{c.members.map(m=><article className="arena-about" key={m.id}><strong>{m.name}</strong><p>{({owner:'Proprietário',admin:'Administrador',moderator:'Moderador',member:'Participante'} as Record<string,string>)[m.role] || m.role} · {({active:'Ativo',pending:'Em análise',suspended:'Suspenso',rejected:'Recusado',removed:'Removido'} as Record<string,string>)[m.status] || m.status}</p>{m.role!=='owner'&&<div className="read-message-actions">{m.status==='pending'&&<><CommunityAction label="Aprovar entrada" id={c.id} target={m.id} memberAction="approve" onDone={reload}/><CommunityAction label="Recusar entrada" id={c.id} target={m.id} memberAction="reject" onDone={reload}/></>}<CommunityAction label={m.status==='suspended'?'Reativar':'Suspender'} id={c.id} target={m.id} memberAction={m.status==='suspended'?'reactivate':'suspend'} onDone={reload}/><CommunityAction label="Remover" id={c.id} target={m.id} memberAction="remove" onDone={reload}/>{c.rank>=30&&<><CommunityAction label="Moderador" id={c.id} target={m.id} memberAction="role" role="moderator" onDone={reload}/><CommunityAction label="Membro" id={c.id} target={m.id} memberAction="role" role="member" onDone={reload}/></>}{c.rank===40&&<><CommunityAction label="Administrador" id={c.id} target={m.id} memberAction="role" role="admin" onDone={reload}/><CommunityAction label="Transferir propriedade" id={c.id} target={m.id} memberAction="transfer" onDone={reload}/></>}</div>}</article>)}</section><section className="arena-about"><h2>Convidar participante</h2><CommunityInvitations id={c.id}/><form onSubmit={async e=>{e.preventDefault();try{const r=await entityAction('/api/communities',{action:'invite',id:c.id,email});setLink(`${location.origin}/convite/comunidade#${r.token}`);setEmail('')}catch(e){setMessage(e instanceof Error?e.message:'Não foi possível criar convite.')}}}><label className="input-group">E-mail<input className="input" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><Button type="submit">Criar convite individual</Button>{link&&<label className="input-group">Link, sem envio automático<input className="input" readOnly value={link}/><Button type="button" variant="quiet" onClick={()=>setLink('')}>Ocultar</Button></label>}</form></section>{c.rank>=30&&<section className="arena-about"><h2>Vincular a uma arena</h2><p>{c.arena?`${c.arena.name} · ${c.arena.status}`:'Comunidade independente. O vínculo exige aprovação da arena.'}</p><label className="input-group">Arena<select className="input" value={arena} onChange={e=>setArena(e.target.value)}><option value="">Escolha uma arena</option>{arenas.map(a=><option value={a.id} key={a.id}>{a.name}{a.isDemo?' · demo':''}</option>)}</select></label><Button disabled={!arena} onClick={async()=>{try{await entityAction('/api/communities',{action:'link',id:c.id,arena,linkAction:'request'});reload()}catch(e){setMessage(e instanceof Error?e.message:'Não foi possível solicitar.')}}}>Solicitar vínculo</Button></section>}<p role="status">{message}</p></>}</>}</>}

function CommunityInvitations({id}:{id:string}){const{data,error,reload}=useEntity<{id:string;email:string;expires_at:string;accepted_at:string|null;revoked_at:string|null}[]>('/api/communities?kind=invites&id='+id);const[message,setMessage]=useState('');return <details><summary>Convites emitidos</summary>{error&&<p role="alert">{error}</p>}{data?.map(i=><p key={i.id}>{i.email} · {i.accepted_at?'aceito':i.revoked_at?'revogado':'validade: '+new Date(i.expires_at).toLocaleDateString('pt-BR')} {!i.accepted_at&&!i.revoked_at&&<Button size="small" variant="quiet" onClick={async()=>{try{await entityAction('/api/communities',{action:'revoke',id,inviteId:i.id});reload()}catch(e){setMessage(e instanceof Error?e.message:'Não foi possível revogar.')}}}>Revogar convite</Button>}</p>)}<p role="status">{message}</p></details>}
