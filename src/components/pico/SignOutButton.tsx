'use client';

import { useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { resetAccountView } from '@/lib/auth/navigation';

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  async function signOut() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true); setError('');
    try {
      const client = createClient();
      if (!client) throw new Error('unavailable');
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
      resetAccountView();
    } catch {
      setError('Não foi possível sair. Confira sua conexão e tente de novo.');
      pending.current = false; setBusy(false);
    }
  }
  return <div className="sign-out-control">
    <Button size="small" variant="quiet" disabled={busy} onClick={signOut}><LogOut size={17} aria-hidden="true" />{busy ? 'Saindo…' : 'Sair da conta'}</Button>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>;
}
