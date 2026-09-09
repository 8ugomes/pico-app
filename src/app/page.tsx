import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, MapPin, MoveUpRight, Users, Volleyball } from "lucide-react";
import { Brand } from "@/components/pico/Brand";
import { SportChip } from "@/components/pico/SportChip";
import { Avatar } from "@/components/ui/Avatar";
import { buttonVariants } from "@/components/ui/Button";

export default function WelcomePage() {
  return (
    <div className="landing-shell">
      <header className="site-header">
        <Brand />
        <div className="header-right">
          <span className="header-note">Da quadra pra vida.</span>
          <Link href="/login" className={buttonVariants({ variant: "quiet", size: "small" })}>
            Entrar <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>
      <main id="main-content">
        <section className="welcome-grid" aria-labelledby="welcome-heading">
          <div className="welcome-copy">
            <p className="eyebrow"><span className="sand-dot" /> O ponto de encontro da areia.</p>
            <h1 id="welcome-heading">Me acha<br />no <span>Pico.</span></h1>
            <p className="welcome-description">Descubra quem joga onde você joga, acompanhe suas arenas e encontre sua próxima dupla.</p>
            <div className="welcome-actions">
              <Link href="/signup" className={buttonVariants({ size: "large" })}>Criar conta <ArrowUpRight size={20} aria-hidden="true" /></Link>
              <Link href="/login" className={buttonVariants({ variant: "secondary", size: "large" })}>Entrar</Link>
            </div>
            <div className="sports-list" aria-label="Esportes no Pico">
              <SportChip sport="Futevôlei" /><SportChip sport="Beach Tennis" /><SportChip sport="Vôlei de Praia" />
            </div>
            <a className="discover-link" href="#seu-pico">Tem lugar pra você na areia <ArrowDown size={16} aria-hidden="true" /></a>
          </div>
          <figure className="scene">
            <div className="scene-photo">
              <Image src="/images/pico-court.webp" alt="Amigos jogando vôlei em uma quadra de areia ao pôr do sol." fill sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 600px" preload className="court-image" />
              <div className="photo-shade" />
              <div className="scene-topline"><span className="photo-label"><Volleyball size={16} aria-hidden="true" /> O jogo aproxima.</span></div>
              <div className="scene-caption"><span>O MELHOR DO JOGO</span><p>É quem joga<br />com você.</p></div>
              <div className="check-in-toast">
                <span className="check-in-icon"><MapPin size={19} aria-hidden="true" /></span>
                <div><strong>Estou no Pico</strong><span>Marina chegou na areia.</span></div>
                <span className="status-dot" aria-hidden="true" />
              </div>
            </div>
            <div className="arena-preview">
              <div className="arena-preview-heading">
                <div><span className="card-kicker">ENCONTROS QUE COMEÇAM AQUI</span><h2>Quem tá na areia hoje?</h2></div>
                <span className="arena-icon"><MoveUpRight size={22} aria-hidden="true" /></span>
              </div>
              <div className="arena-preview-bottom">
                <div className="avatar-stack" aria-label="Jogadores fictícios: Marina, Lucas e Bia">
                  <Avatar initials="MA" tone="sand" /><Avatar initials="LU" tone="ocean" /><Avatar initials="BI" tone="coral" />
                </div>
                <div className="arena-detail"><strong>Sua próxima dupla pode estar aqui.</strong><span><MapPin size={13} aria-hidden="true" /> Arena do Sol · comunidade Pico</span></div>
              </div>
            </div>
            <figcaption className="demo-caption">Uma prévia do Pico. Pessoas e arena ilustrativas.</figcaption>
          </figure>
        </section>
        <section className="connection-strip" id="seu-pico" aria-label="Encontre seu Pico">
          <div className="connection-intro"><span className="card-kicker">MENOS DISTÂNCIA. MAIS JOGO.</span><h2>A areia conecta.<br />O Pico aproxima.</h2></div>
          <div className="connection-item"><Users size={23} aria-hidden="true" /><div><h3>Encontre sua turma</h3><p>Seu esporte. Seu ritmo. Sua galera.</p></div></div>
          <div className="connection-item"><MapPin size={23} aria-hidden="true" /><div><h3>Faça parte da sua arena</h3><p>Os encontros continuam por aqui.</p></div></div>
        </section>
      </main>
      <footer className="site-footer"><span>Pico <span className="footer-year">© 2026</span></span><span>Feito para quem vive a areia.</span></footer>
    </div>
  );
}
