// Isolated browser-review server for the real messaging components and shell.
// All accounts/messages are synthetic and kept in memory. No browser automation,
// credentials, Supabase connection, service worker or external writes.
// Run: node tests/helpers/messages-ui-preview.mjs [port, default 3042]
// Open /mensagens, /mensagens/<conversation>, /descobrir, ?demo=1 or ?disabled=1.
// Review: explicit read only after clicking; lost confirmation + retry keeps one
// stored message/key; paused follow disables send; revocation hides old text;
// identity clears draft/history; offline stops polling; 40 incoming messages
// retain a route through older history. Check 320/390/1280px, themes and 200% text.
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';

const root = process.cwd(), output = resolve('.vercel/messages-ui-preview');
mkdirSync(output, { recursive: true });
const me = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const conversationId = '33333333-3333-4333-8333-333333333333';
const peer = { id: other, username: 'lia_teste', name: 'Lia Teste da Areia', avatar: null };
const controls = [
  ['success', 'Restaurar conversa'], ['lost-response', 'Perder a próxima confirmação'],
  ['paused', 'Pausar acompanhamento mútuo'], ['denied', 'Revogar acesso'],
  ['empty', 'Esvaziar conversa'], ['slow', 'Resposta em 10 segundos'],
  ['burst', 'Receber 40 mensagens fictícias'],
];
const entry = `import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MessagesProvider} from '@/components/pico/MessagesProvider';
import {MessagesView,MessageThreadView} from '@/components/pico/MessagesView';
import {OpenMessageButton} from '@/components/pico/MessageLink';
import {AppShell} from '@/components/pico/AppShell';
import {DemoProvider} from '@/components/pico/DemoProvider';
import {NotificationsProvider} from '@/components/pico/NotificationsProvider';
const cid=${JSON.stringify(conversationId)}, peer=${JSON.stringify(peer)};
function Controls(){const [feedback,setFeedback]=useState('Todas as pessoas e mensagens são fictícias.');return <details className="fixture-controls"><summary>Controles da revisão local</summary><p role="status">{feedback}</p><div>${controls.map(([mode, label]) => `<button onClick={async()=>{await fetch('/__fixture',{method:'POST',body:JSON.stringify({mode:${JSON.stringify(mode)}})});setFeedback(${JSON.stringify(label)});window.dispatchEvent(new Event('focus'))}}>${label}</button>`).join('')}<button onClick={()=>{window.fixtureOffline=!window.fixtureOffline;Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>!window.fixtureOffline});window.dispatchEvent(new Event(window.fixtureOffline?'offline':'online'));setFeedback(window.fixtureOffline?'Rede simulada: offline':'Rede simulada: online')}}>Alternar rede simulada</button><button onClick={async()=>{await fetch('/__fixture',{method:'POST',body:JSON.stringify({mode:'identity'})});window.dispatchEvent(new CustomEvent('fixture-auth',{detail:{event:'SIGNED_IN',session:{user:{id:'44444444-4444-4444-8444-444444444444'}}}}));setFeedback('Conta de teste trocada; mensagens anteriores devem sumir.')}}>Trocar conta de teste</button><button onClick={()=>{document.documentElement.style.fontSize=document.documentElement.style.fontSize?'':'200%'}}>Alternar texto 200%</button><a href="/mensagens?demo=1">Demonstração</a><a href="/mensagens?disabled=1">Recurso desativado</a><a href="/mensagens">Caixa de entrada</a><a href={'/mensagens/'+cid}>Conversa</a><a href="/descobrir">Perfil de teste</a></div></details>}
const query=new URLSearchParams(location.search),demo=query.has('demo'),enabled=!query.has('disabled');
const screen=location.pathname.startsWith('/mensagens/')?<MessageThreadView conversationId={cid}/>:location.pathname==='/descobrir'?<section><div className="page-heading"><h1>{peer.name}</h1></div><p>Perfil fictício para verificar o início de uma conversa.</p><OpenMessageButton playerId={peer.id}/></section>:<MessagesView/>;
createRoot(document.getElementById('root')).render(<React.StrictMode><Controls/><DemoProvider><NotificationsProvider demo><MessagesProvider enabled={enabled} demo={demo}><AppShell environment={demo?'demo':'configured'}>{screen}</AppShell></MessagesProvider></NotificationsProvider></DemoProvider></React.StrictMode>);`;
const framework = {
  'next/link': `import React from 'react';export const useLinkStatus=()=>({pending:false});export default function Link({href,children,prefetch,...props}){return <a href={href} {...props}>{children}</a>}`,
  'next/image': `import React from 'react';export default function Image({unoptimized,fill,priority,...props}){return <img {...props}/>}`,
  'next/dynamic': `import React,{lazy,Suspense}from'react';export default function dynamic(load,options={}){const Component=lazy(load);return props=><Suspense fallback={options.loading?.()||null}><Component {...props}/></Suspense>}`,
  'next/navigation': `export const usePathname=()=>location.pathname;export const useRouter=()=>({push:url=>location.assign(url),replace:url=>location.replace(url),refresh:()=>location.reload()});`,
};
const plugins = [{ name: 'isolated-framework', setup(api) {
  api.onResolve({ filter: /^next\/(link|image|dynamic|navigation)$/ }, args => ({ path: args.path, namespace: 'framework' }));
  api.onLoad({ filter: /.*/, namespace: 'framework' }, args => ({ contents: framework[args.path], loader: 'tsx', resolveDir: root }));
  api.onResolve({ filter: /(^@\/lib\/supabase\/client$|\/lib\/supabase\/client$)/ }, () => ({ path: 'auth', namespace: 'auth-fixture' }));
  api.onLoad({ filter: /.*/, namespace: 'auth-fixture' }, () => ({ contents: `export function createClient() {
    return { auth: { onAuthStateChange(callback) {
      const listener = event => callback(event.detail.event, event.detail.session);
      window.addEventListener('fixture-auth', listener);
      queueMicrotask(() => callback('INITIAL_SESSION', { user: { id: ${JSON.stringify(me)} } }));
      return { data: { subscription: { unsubscribe() { window.removeEventListener('fixture-auth', listener); } } } };
    } } };
  }`, loader: 'ts' }));
  api.onResolve({ filter: /(^\.\/PwaExperience$|^\.\/connected\/OwnProfile$)/ }, args => ({ path: args.path, namespace: 'shell-fixture' }));
  api.onLoad({ filter: /.*/, namespace: 'shell-fixture' }, args => ({ contents: args.path.includes('PwaExperience') ? 'export function PwaStatus(){return null}' : `export const useOwnProfile=()=>({state:{status:'success',data:{kind:'profile',profile:{name:'Alex Teste',username:'alex_teste',avatar:null}}}});`, loader: 'ts' }));
} }];
await build({ stdin: { contents: entry, loader: 'tsx', resolveDir: root }, outdir: join(output, 'app'), entryNames: 'app', bundle: true, splitting: true, format: 'esm', jsx: 'automatic', platform: 'browser', target: 'es2022', plugins, alias: { '@': join(root, 'src') }, define: { 'process.env.NODE_ENV': '"development"', 'process.env.NEXT_PUBLIC_PICO_ENV': '"demo"', 'process.env.NEXT_PUBLIC_PICO_VERSION': '"ui-fixture"', 'process.env.NEXT_PUBLIC_SUPABASE_URL': 'undefined', 'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': 'undefined' } });
const styles = ['globals.css', 'forms.css', 'social.css', 'social-pages.css', 'journey.css', 'notifications.css', 'messages.css'].map(file => readFileSync(join(root, 'src/app', file), 'utf8').replace(/^@import.*$/gm, '').replace(/@theme inline\s*\{[^}]*\}/g, '')).join('\n');
writeFileSync(join(output, 'style.css'), `@font-face{font-family:Syne;src:url('/fonts/syne.woff2')}@font-face{font-family:Manrope;src:url('/fonts/manrope.woff2')}\n${styles}\n:root{--font-syne:Syne;--font-manrope:Manrope}.fixture-controls{padding:.7rem 1rem;background:var(--surface);border-bottom:1px solid var(--border-subtle);font-size:14px}.fixture-controls summary{cursor:pointer}.fixture-controls>div{display:flex;flex-wrap:wrap;gap:.5rem}.fixture-controls button,.fixture-controls a{padding:.5rem;border:1px solid var(--border-control);border-radius:8px;background:var(--surface);color:var(--foreground);cursor:pointer;min-height:44px}`);

const seeds = Array.from({ length: 12 }, (_, index) => ({ id: `55555555-5555-4555-8555-${String(index + 1).padStart(12, '0')}`, conversationId, senderId: index % 2 ? me : other, body: index === 11 ? 'Fechado! A gente combina o horário por aqui. Mensagem fictícia de revisão.' : index === 10 ? 'Bora jogar no sábado?\nPosso depois das 10h. Mensagem fictícia de revisão.' : `Mensagem fictícia anterior ${index + 1}. Texto para revisar o histórico, sem pessoas reais.`, createdAt: new Date(Date.UTC(2026, 8, 18, 15, index)).toISOString() }));
let mode = 'success', records = structuredClone(seeds), readAt = null, switched = false;
const keys = new Map(), requests = [];
const server = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  const json = (data, status = 200) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' }); response.end(JSON.stringify(data)); };
  try {
    let raw = ''; if (request.method === 'POST') for await (const chunk of request) { raw += chunk; if (raw.length > 10000) return json({ message: 'Fixture body too large.' }, 413); }
    const body = raw ? JSON.parse(raw) : {};
    if (url.pathname === '/__fixture') {
      if (request.method === 'POST') {
        mode = body.mode || 'success';
        if (mode === 'success') { records = structuredClone(seeds); keys.clear(); readAt = null; switched = false; }
        if (mode === 'empty') records = [];
        if (mode === 'identity') { switched = true; records = []; }
        if (mode === 'burst') for (let index = 0; index < 40; index += 1) records.push({ id: randomUUID(), conversationId, senderId: other, body: `Mensagem fictícia recebida na ausência ${index + 1}.`, createdAt: new Date(Date.now() + index).toISOString() });
      }
      return json({ fixture: true, mode, switched, storedMessages: records.length, uniqueSendKeys: keys.size, readAt, requests });
    }
    if (url.pathname === '/api/messages') {
      requests.push({ method: request.method, query: url.search, ...(request.method === 'POST' ? { action: body.action, key: body.key, body: body.body } : {}) });
      if (mode === 'slow') await new Promise(done => setTimeout(done, 10000));
      if (mode === 'denied') return json({ message: 'Esta conversa não está disponível.' }, 404);
      if (request.method === 'POST') {
        if (body.action === 'open') {
          if (mode === 'paused') return json({ message: 'Vocês precisam se acompanhar para trocar mensagens.' }, 403);
          return json({ data: { id: conversationId } });
        }
        if (body.action === 'read') { readAt = records.find(item => item.id === body.throughId)?.createdAt ?? null; return json({ data: { saved: true } }); }
        if (body.action === 'send') {
          if (mode === 'paused') return json({ message: 'Vocês precisam se acompanhar para trocar mensagens.' }, 403);
          if (keys.has(body.key)) return json({ data: keys.get(body.key) });
          const item = { id: randomUUID(), conversationId, senderId: me, body: body.body, createdAt: new Date().toISOString() };
          records.push(item); keys.set(body.key, item);
          if (mode === 'lost-response') { mode = 'success'; return json({ message: 'A confirmação não chegou. Tente novamente sem alterar o texto.' }, 503); }
          return json({ data: item });
        }
        return json({ message: 'Ação indisponível nesta revisão.' }, 400);
      }
      if (url.searchParams.has('conversation')) {
        const ordered = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), before = url.searchParams.get('before');
        const start = before ? ordered.findIndex(item => item.id === before) + 1 : 0;
        const items = ordered.slice(start, start + 5);
        const unreadCount = ordered.filter(item => item.senderId === other && (!readAt || item.createdAt > readAt)).length;
        return json({ data: { conversation: { id: conversationId, peer, canSend: mode !== 'paused' && !switched, unreadCount }, items, nextCursor: start + 5 < ordered.length ? items.at(-1).id : null } });
      }
      const unread = records.filter(item => item.senderId === other && (!readAt || item.createdAt > readAt)).length;
      return json({ data: { items: switched ? [] : [{ id: conversationId, peer, lastMessage: records.at(-1) ?? null, unreadCount: unread }], unreadCount: unread, nextCursor: null } });
    }
    if (url.pathname.startsWith('/api/')) return json({ message: 'Esta revisão não acessa serviços externos.' }, 403);
    if (url.pathname === '/favicon.ico') { response.writeHead(204); return response.end(); }
    if (url.pathname.startsWith('/fonts/')) {
      if (!['syne.woff2', 'manrope.woff2'].includes(url.pathname.split('/').at(-1))) return json({}, 404);
      response.writeHead(200, { 'Content-Type': 'font/woff2' }); return response.end(readFileSync(join(root, 'src/app', url.pathname)));
    }
    if (url.pathname === '/style.css' || url.pathname.startsWith('/app/')) {
      const file = resolve(output, '.' + url.pathname);
      if (!file.startsWith(output + '/')) return json({}, 404);
      response.writeHead(200, { 'Content-Type': file.endsWith('.css') ? 'text/css' : 'text/javascript' }); return response.end(readFileSync(file));
    }
    response.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
    response.end('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Pico · revisão local de mensagens</title><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/app/app.js"></script></body></html>');
  } catch { json({ message: 'Erro da fixture local.' }, 500); }
});
server.listen(Number(process.argv[2] || 3042), '0.0.0.0', () => console.log(`Mensagens UI fixture: http://127.0.0.1:${server.address().port}/mensagens · HTTP e pessoas fictícios; sem Supabase.`));
