'use client';
import {useEffect,useState,type ReactNode}from'react';import Link from'next/link';import{buttonVariants,Button}from'@/components/ui/Button';
import { ArrowRight } from 'lucide-react';
export function AccessGate({children}:{children:ReactNode}){
 const[state,setState]=useState<'loading'|'allowed'|'login'|'denied'|'error'>('loading');
 useEffect(()=>{let live=true;async function read(){try{const r=await fetch('/api/access',{cache:'no-store'});const d=await r.json();if(live)setState(previous=>r.status===401?'login':r.ok?(d.admitted?'allowed':'denied'):previous==='allowed'?'allowed':'error');}catch{if(live)setState(previous=>previous==='allowed'?'allowed':'error')}}void read();const focus=()=>{if(document.visibilityState!=='hidden')void read()};window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);return()=>{live=false;window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus)}},[]);
 if(state==='allowed')return children;
 if(state==='login')return <section className="arrival" aria-labelledby="arrival-title">
   <h1 id="arrival-title">Me acha no Pico.</h1>
   <p>O ponto de encontro da areia. Conheça pessoas, encontre sua turma e continue a conversa depois do jogo.</p>
   <p className="arrival-sports">Futevôlei · Beach tennis · Vôlei de praia</p>
   <div className="arrival-actions"><Link href="/signup" className={buttonVariants()}>Criar conta <ArrowRight size={20} aria-hidden="true" /></Link><Link href={'/login?next='+encodeURIComponent(typeof location==='undefined'?'/feed':location.pathname)}>Já tenho uma conta</Link></div>
 </section>;
 return <section className="read-message" role="status"><h1>{state==='loading'?'Conferindo seu acesso…':state==='denied'?'Seu acesso está indisponível.':'Não foi possível conferir o acesso.'}</h1><p>{state==='denied'?'Confirme seu e-mail para entrar. Contas suspensas ou em exclusão permanecem sem acesso.':'O acesso depende de uma conexão disponível.'}</p>{state!=='loading'&&<div className="read-message-actions"><Link href="/acesso" className={buttonVariants()}>Acesso e minha conta</Link><Button variant="quiet" onClick={()=>location.reload()}>Tentar novamente</Button></div>}</section>
}
