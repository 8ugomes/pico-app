const KEY='pico.pending-invitation.v1';
const paths=['/acesso','/convite/arena','/convite/comunidade'];
export function safeNext(value:string|null){return value&&/^\/(?:arenas|comunidades|publicacoes|perfil)(?:\/[a-zA-Z0-9_-]+){0,2}$/.test(value)?value:'/perfil'}
export function pendingInvitation(){try{const data=JSON.parse(sessionStorage.getItem(KEY)||'null');if(data&&paths.includes(data.path)&&/^[a-f0-9]{64}$/.test(data.token)&&data.expires>Date.now()&&data.expires<Date.now()+31*60*1000)return data as{path:string;token:string;expires:number};sessionStorage.removeItem(KEY)}catch{}return null}
export function rememberInvitation(path:string,token:string){if(paths.includes(path)&&/^[a-f0-9]{64}$/.test(token))try{sessionStorage.setItem(KEY,JSON.stringify({path,token,expires:Date.now()+30*60*1000}))}catch{}}
export function clearInvitation(){try{sessionStorage.removeItem(KEY)}catch{}}
export function invitationToken(){const token=location.hash.slice(1);history.replaceState(null,'',location.pathname);if(/^[a-f0-9]{64}$/.test(token)){rememberInvitation(location.pathname,token);return token}const pending=pendingInvitation();return pending?.path===location.pathname?pending.token:''}
export function afterLogin(){return pendingInvitation()?.path||safeNext(new URL(location.href).searchParams.get('next'))}
