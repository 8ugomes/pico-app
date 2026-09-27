'use client';
import { resetAccountView } from '@/lib/auth/navigation';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { clearPushBeforeSignOut, reconcileDevicePush } from '@/lib/push/client';
export function SessionGuard() {
  useEffect(()=>{
    const client=createClient();
    let identity:string|null=null; let initialized=false;
    const subscription=client?.auth.onAuthStateChange((event,session)=>{
      const next=session?.user.id??null;
      if(event==='INITIAL_SESSION'){identity=next;initialized=true;queueMicrotask(()=>{void reconcileDevicePush(next)});return;}
      if(initialized && identity && identity!==next){
        // Full navigation discards all account-scoped component drafts and
        // decoded photos, including across tabs and browser history restores.
        // Discard the previous identity's view immediately. Initial-session
        // reconciliation on the next page also revokes any surviving endpoint.
        queueMicrotask(()=>{void clearPushBeforeSignOut();resetAccountView(Boolean(next))});
      } else if(event==='SIGNED_OUT') {
        queueMicrotask(()=>{void reconcileDevicePush(null)});
      }
      identity=next;
    }).data.subscription;
    let validating=false;
    const foreground=async()=>{
      if(document.visibilityState==='hidden'||!navigator.onLine||validating||!client)return;
      validating=true;
      try{const {data,error}=await client.auth.getUser();if((error&&(error.status===401||error.status===403))||(!error&&!data.user&&identity)){await clearPushBeforeSignOut();await client.auth.signOut({scope:'local'});resetAccountView();}else if(!error){void reconcileDevicePush(data.user?.id??null)}}
      catch{}finally{validating=false;}
    };
    window.addEventListener('focus',foreground);document.addEventListener('visibilitychange',foreground);
    const restore=(event:PageTransitionEvent)=>{if(event.persisted)window.location.reload();};
    window.addEventListener('pageshow',restore);
    return()=>{subscription?.unsubscribe();window.removeEventListener('pageshow',restore);window.removeEventListener('focus',foreground);document.removeEventListener('visibilitychange',foreground);};
  },[]);
  return null;
}
