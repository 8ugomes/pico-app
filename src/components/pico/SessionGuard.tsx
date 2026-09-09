'use client';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
export function SessionGuard() {
  useEffect(()=>{
    const client=createClient();
    let identity:string|null=null; let initialized=false;
    const subscription=client?.auth.onAuthStateChange((event,session)=>{
      const next=session?.user.id??null;
      if(event==='INITIAL_SESSION'){identity=next;initialized=true;return;}
      if(initialized && identity && identity!==next){
        // Full navigation discards all account-scoped component drafts and
        // decoded photos, including across tabs and browser history restores.
        window.location.replace(next?'/perfil':'/login');
      }
      identity=next;
    }).data.subscription;
    const restore=(event:PageTransitionEvent)=>{if(event.persisted)window.location.reload();};
    window.addEventListener('pageshow',restore);
    return()=>{subscription?.unsubscribe();window.removeEventListener('pageshow',restore);};
  },[]);
  return null;
}
