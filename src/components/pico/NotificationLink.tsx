'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useNotifications } from './NotificationsProvider';

export function NotificationLink({ desktop = false }: { desktop?: boolean }) {
  const { data } = useNotifications();
  const path = usePathname();
  const count = data?.unreadCount ?? 0;
  const current = path === '/notificacoes';
  return <Link href="/notificacoes" className={desktop ? `nav-item notification-nav ${current ? 'nav-current' : ''}` : 'icon-button notification-link'}
    aria-label={count ? `Notificações, ${count} não ${count === 1 ? 'lida' : 'lidas'}` : 'Notificações'} aria-current={current ? 'page' : undefined}>
    <span className="notification-icon"><Bell size={22} aria-hidden="true" />{count > 0 && <span className="notification-count" aria-hidden="true">{count > 99 ? '99+' : count}</span>}</span>
    {desktop && <span>Notificações</span>}
  </Link>;
}
