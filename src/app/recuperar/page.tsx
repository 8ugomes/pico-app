import Link from 'next/link';
import { RecoveryForm } from '@/components/pico/RecoveryForm';
import { Brand } from '@/components/pico/Brand';
export const metadata = {title:'Recuperar acesso'};
export default function RecoverPage() {
  return <div className="landing-shell auth-shell"><header className="site-header"><Brand /><Link href="/login">Entrar</Link></header><main id="main-content" className="auth-main"><section className="auth-panel"><h1>Volte pro Pico.</h1><p className="auth-description">Receba um link para escolher uma nova senha.</p><RecoveryForm /></section></main></div>;
}
