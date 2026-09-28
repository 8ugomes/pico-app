const KEY='pico.pending-invitation.v1';
const paths=['/acesso','/convite/arena','/convite/comunidade'];
type AuthMode='login'|'signup';
type NextValue=string|string[]|null|undefined;
export function safeNext(value:NextValue){return typeof value==='string'&&(paths.includes(value)||/^\/(?:feed|descobrir|arenas|comunidades|publicacoes|perfil|jogos|notificacoes|mensagens)(?:\/[a-zA-Z0-9_-]+){0,2}$/.test(value))?value:'/perfil'}
export function authDestination(mode:AuthMode,value:NextValue){return`/${mode}?next=${encodeURIComponent(safeNext(value))}`}
export function pendingInvitation(){try{const data=JSON.parse(sessionStorage.getItem(KEY)||'null');if(data&&paths.includes(data.path)&&/^[a-f0-9]{64}$/.test(data.token)&&data.expires>Date.now()&&data.expires<Date.now()+31*60*1000)return data as{path:string;token:string;expires:number};sessionStorage.removeItem(KEY)}catch{}return null}
export function rememberInvitation(path:string,token:string){if(paths.includes(path)&&/^[a-f0-9]{64}$/.test(token))try{sessionStorage.setItem(KEY,JSON.stringify({path,token,expires:Date.now()+30*60*1000}))}catch{}}
export function clearInvitation(){try{sessionStorage.removeItem(KEY)}catch{}}
export function invitationToken(){const token=location.hash.slice(1);history.replaceState(null,'',location.pathname);if(/^[a-f0-9]{64}$/.test(token)){rememberInvitation(location.pathname,token);return token}const pending=pendingInvitation();return pending?.path===location.pathname?pending.token:''}
export function afterLogin(value:NextValue){
  const next=safeNext(value),pending=pendingInvitation();
  if(!pending)return next;
  if(pending.path===next)return pending.path;
  clearInvitation();
  return next;
}

// Both the auth event and the clicked control can finish the same logout.
// One full navigation prevents competing replacements and clears account UI.
let redirectedWindow:Window|null=null;
let invitationAccountSwitch:{path:string;expires:number}|null=null;

export function prepareInvitationAccountSwitch(value:NextValue){
  const next=safeNext(value),pending=pendingInvitation();
  invitationAccountSwitch=pending?.path===next?{path:next,expires:Date.now()+30_000}:null;
  return Boolean(invitationAccountSwitch);
}

export function cancelInvitationAccountSwitch(){invitationAccountSwitch=null}

function accountSwitchDestination(){
  const switchRequest=invitationAccountSwitch;
  invitationAccountSwitch=null;
  if(!switchRequest||switchRequest.expires<Date.now())return null;
  return pendingInvitation()?.path===switchRequest.path?switchRequest.path:null;
}

export function resetAccountView(hasUser = false) {
  if(redirectedWindow===window)return;
  redirectedWindow=window;
  const invitationPath=hasUser?null:accountSwitchDestination();
  if(!invitationPath)clearInvitation();
  window.location.replace(hasUser?'/perfil':invitationPath?authDestination('login',invitationPath):'/login');
}
