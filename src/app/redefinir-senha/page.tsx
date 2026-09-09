import { RecoveryForm } from '@/components/pico/RecoveryForm';
import { Brand } from '@/components/pico/Brand';
export const metadata = {title:'Nova senha'};
export default function ResetPage() {
  return <div className="landing-shell auth-shell"><header className="site-header"><Brand /></header><main id="main-content" className="auth-main"><section className="auth-panel"><h1>Uma nova senha.</h1><p className="auth-description">Escolha pelo menos 8 caracteres. Ao salvar, entre novamente.</p><RecoveryForm reset /></section></main></div>;
}
