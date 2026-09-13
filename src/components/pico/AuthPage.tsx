import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "./Brand";
import { AuthForm } from "./AuthForm";
import { GlassPanel } from "@/components/ui/GlassPanel";

export function AuthPage({ mode, confirmationError = false, passwordUpdated = false }: { mode: "login" | "signup"; confirmationError?: boolean; passwordUpdated?: boolean }) {
  const signup = mode === "signup";
  return (
    <div className="landing-shell auth-shell">
      <header className="site-header"><Brand /><Link className="back-link" href="/"><ArrowLeft size={16} aria-hidden="true" /> Voltar ao início</Link></header>
      <div className="auth-layout"><aside className="auth-story"><h2>O ponto de encontro da areia.</h2><p>Gente do seu esporte. Lugares em comum. A conversa depois do jogo.</p><p>Futevôlei · Beach tennis · Vôlei de praia</p></aside>
      <main id="main-content" className="auth-main">
        <GlassPanel className="auth-panel">
          <h1>{signup ? <>Seu lugar<br />na areia.</> : <>Bom te ver<br />por aqui.</>}</h1>
          <p className="auth-description">{signup ? "Crie sua conta e confirme seu e-mail para encontrar sua turma." : "Entre para continuar a conversa."}</p>
          {confirmationError && <p className="auth-notice notice-error" role="alert">Não conseguimos confirmar seu e-mail. O link pode ter expirado ou ter sido aberto em outro navegador. Abra o link mais recente no navegador em que fez o cadastro.</p>}
          {passwordUpdated && <p className="auth-notice notice-success" role="status">Senha alterada. Entre com sua nova senha.</p>}
          <AuthForm mode={mode} />
        </GlassPanel>
        <p className="auth-footnote">Me acha no Pico.</p>
      </main></div>
    </div>
  );
}
