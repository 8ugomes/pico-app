import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "./Brand";
import { AuthForm } from "./AuthForm";
import { GlassPanel } from "@/components/ui/GlassPanel";

export function AuthPage({ mode, confirmationError = false }: { mode: "login" | "signup"; confirmationError?: boolean }) {
  const signup = mode === "signup";
  return (
    <div className="landing-shell auth-shell">
      <header className="site-header"><Brand /><Link className="back-link" href="/"><ArrowLeft size={16} aria-hidden="true" /> Voltar ao início</Link></header>
      <main id="main-content" className="auth-main">
        <p className="eyebrow"><span className="sand-dot" /> O ponto de encontro da areia.</p>
        <GlassPanel className="auth-panel">
          <h1>{signup ? <>Seu próximo encontro<br />começa <span>aqui.</span></> : <>Bom te ver<br />no <span>Pico.</span></>}</h1>
          <p className="auth-description">{signup ? "Uma conta. Sua turma. Muitos jogos pela frente." : "Entre para continuar de onde a areia te deixou."}</p>
          {confirmationError && <p className="auth-notice notice-error" role="alert">Não conseguimos confirmar seu e-mail. O link pode ter expirado ou ter sido aberto em outro navegador. Abra o link mais recente no navegador em que fez o cadastro.</p>}
          <AuthForm mode={mode} />
        </GlassPanel>
        <p className="auth-footnote">Me acha no Pico.</p>
      </main>
    </div>
  );
}
