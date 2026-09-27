import type { ReactNode } from 'react';
import Link from 'next/link';
import { Brand } from '@/components/pico/Brand';

type PublicPolicyPageProps = {
  title: string;
  updated: string;
  lead: ReactNode;
  children: ReactNode;
};

const policyLinks = [
  { href: '/privacidade', label: 'Privacidade' },
  { href: '/termos', label: 'Termos' },
  { href: '/diretrizes', label: 'Diretrizes' },
  { href: '/suporte', label: 'Suporte' },
];

export function PublicPolicyPage({ title, updated, lead, children }: PublicPolicyPageProps) {
  return (
    <div className="landing-shell policy-shell">
      <header className="site-header policy-site-header">
        <Brand />
        <Link className="back-link" href="/feed">Abrir o Pico</Link>
      </header>
      <main id="main-content" className="policy-page">
        <header className="policy-intro">
          <h1>{title}</h1>
          <p className="policy-updated">Atualizado em {updated}.</p>
          <div className="policy-lead">{lead}</div>
        </header>
        <div className="policy-body">{children}</div>
        <nav className="policy-links" aria-label="Informações públicas do Pico">
          {policyLinks.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
      </main>
    </div>
  );
}
