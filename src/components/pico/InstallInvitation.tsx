'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { installDevice, installInvitationKey } from '@/lib/install-guide';

export function InstallInvitation({ eligible, identity }: { eligible: boolean; identity: string | null }) {
  const path = usePathname();
  const [visibleFor, setVisibleFor] = useState<string | null>(null);
  useEffect(() => {
    if (!eligible || !identity || path !== '/feed') return;
    const key = installInvitationKey(identity);
    const mode = matchMedia('(display-mode: standalone)');
    const standalone = () => mode.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (installDevice(navigator.userAgent, navigator.maxTouchPoints).platform === 'desktop' || standalone()) return;
    try { if (localStorage.getItem(key) || localStorage.getItem('pico.install-dismissed')) return; } catch { /* Optional preference. */ }
    let timer: ReturnType<typeof setTimeout> | undefined;
    let shown = false;
    const blocked = () => document.visibilityState !== 'visible' || !navigator.onLine || standalone()
      || Boolean(document.querySelector('dialog[open], [role="dialog"], [role="menu"], [data-testid="profile-editor"]'))
      || Boolean(document.activeElement?.matches('input, textarea, select, [contenteditable="true"]'));
    const defer = () => {
      clearTimeout(timer);
      if (blocked()) { setVisibleFor(null); return; }
      if (shown) return;
      timer = setTimeout(() => {
        if (blocked() || shown) return;
        try { if (localStorage.getItem(key) || localStorage.getItem('pico.install-dismissed')) return; localStorage.setItem(key, 'shown'); } catch { /* Still shown only once during this mount. */ }
        shown = true;
        setVisibleFor(identity);
      }, 15000);
    };
    const changed = (event: StorageEvent) => { if (event.key === key || event.key === 'pico.install-dismissed') { clearTimeout(timer); setVisibleFor(null); } };
    const installed = () => { clearTimeout(timer); setVisibleFor(null); };
    let wasBlocked = blocked();
    const observer = new MutationObserver(() => { const next = blocked(); if (next !== wasBlocked) { wasBlocked = next; defer(); } });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
    for (const event of ['pointerdown', 'keydown', 'focusin', 'focusout', 'visibilitychange']) document.addEventListener(event, defer);
    window.addEventListener('online', defer); window.addEventListener('offline', defer);
    window.addEventListener('appinstalled', installed); window.addEventListener('storage', changed); mode.addEventListener('change', installed);
    defer();
    return () => {
      clearTimeout(timer); observer.disconnect();
      for (const event of ['pointerdown', 'keydown', 'focusin', 'focusout', 'visibilitychange']) document.removeEventListener(event, defer);
      window.removeEventListener('online', defer); window.removeEventListener('offline', defer);
      window.removeEventListener('appinstalled', installed); window.removeEventListener('storage', changed); mode.removeEventListener('change', installed);
    };
  }, [eligible, identity, path]);
  if (!eligible || !identity || path !== '/feed' || visibleFor !== identity) return null;
  const dismiss = () => { try { localStorage.setItem(installInvitationKey(identity), 'dismissed'); } catch {} setVisibleFor(null); };
  return <aside className="install-invitation" aria-label="Pico Club na tela inicial">
    <Image src="/icons/pico-club-192.png" width={48} height={48} alt="" />
    <div><h2>Pico Club na tela inicial</h2><Link href="/instalar" onClick={dismiss}>Ver como <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
    <Button variant="quiet" size="small" onClick={dismiss}>Agora não</Button>
  </aside>;
}
