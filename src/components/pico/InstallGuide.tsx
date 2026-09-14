'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowLeft, ArrowRight, BatteryFull, Check, ChevronDown, Copy, Ellipsis, EllipsisVertical, Globe, Pause, Play, PlusSquare, RotateCcw, Share, Signal, Wifi } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/Button';
import { installDevice, installationScenes, type InstallScene, type SafariLayout } from '@/lib/install-guide';

type Platform = 'ios' | 'android';
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
const captions: Record<Platform, Record<InstallScene, string>> = {
  ios: { menu: 'Toque nos três pontos', share: 'Toque em Compartilhar', 'home-option': 'Deslize e escolha esta opção', 'web-app': 'Ative Abrir como App da Web', confirm: 'Toque em Adicionar', home: 'Assim fica na sua tela' },
  android: { menu: 'Abra o menu do Chrome', share: 'Abra o menu de instalação', 'home-option': 'Escolha a opção de instalar', 'web-app': 'Escolha Instalar', confirm: 'Confirme em Instalar', home: 'Assim fica na sua tela' },
};
const accessible: Record<Platform, Record<InstallScene, string>> = {
  ios: { menu: 'No Safari, com o Pico aberto, toque em Mais, o botão de três pontos na barra inferior.', share: 'Toque no ícone Compartilhar, um quadrado com seta para cima.', 'home-option': 'Na lista de ações de compartilhamento, deslize para cima até encontrar Adicionar à Tela de Início e toque nessa opção.', 'web-app': 'Na tela de confirmação, mantenha Abrir como App da Web ativado.', confirm: 'Confira o nome Pico Club e toque em Adicionar, no canto superior direito.', home: 'Exemplo de como o ícone do Pico Club aparece na tela inicial. Assistir ao guia não instala o aplicativo.' },
  android: { menu: 'No Chrome, com o Pico aberto, toque em Mais, os três pontos no canto superior direito.', share: 'Abra o menu de instalação do Chrome.', 'home-option': 'Escolha Instalar e criar atalho. Em outras versões, essa opção se chama Adicionar à tela inicial ou Instalar app.', 'web-app': 'Se aparecer um submenu, escolha Instalar.', confirm: 'Na confirmação do navegador, toque em Instalar e siga as instruções do aparelho.', home: 'Exemplo de como o ícone do Pico Club aparece na tela inicial. Assistir ao guia não instala o aplicativo.' },
};

function ClubIcon({ size = 56 }: { size?: number }) { return <Image src="/icons/pico-club-192.png" alt="" width={size} height={size} />; }
function Touch() { return <span className="install-touch" />; }
function BrowserPage() { return <div className="install-browser-page"><ClubIcon size={64} /><span>Pico Club</span><div className="install-browser-lines"><i /><i /><i /></div></div>; }

// A diagram of native browser controls. Its equivalents are described outside
// the figure for assistive technology; pictured controls are not fake buttons.
function Phone({ platform, scene, safari, playing }: { platform: Platform; scene: InstallScene; safari: SafariLayout; playing: boolean }) {
  const ios = platform === 'ios';
  const adding = scene === 'web-app' || scene === 'confirm';
  return <div className={`install-phone ${ios ? 'install-phone-ios' : 'install-phone-android'}`} data-playing={playing} data-scene={scene} aria-hidden="true">
    <div className="install-phone-status"><span>9:41</span><span><Signal size={12} /><Wifi size={13} /><BatteryFull size={19} /></span></div>
    <div className="install-phone-screen" key={`${platform}-${safari}-${scene}`}>
      {scene === 'home' ? <div className="install-home-screen"><div className="install-home-app"><ClubIcon size={62} /><span>Pico Club</span></div><div className="install-home-dock"><span /><span /><span /></div></div> : <>
        {!ios && <div className="install-chrome-bar"><Globe size={15} /><span>Pico Club</span><span className={scene === 'menu' ? 'install-target' : ''}><EllipsisVertical size={21} />{scene === 'menu' && <Touch />}</span></div>}
        <BrowserPage />
        {ios && <div className="install-safari-bar"><span className="install-address"><Globe size={14} />Pico Club</span><span className={scene === 'menu' || (scene === 'share' && safari === 'classic') ? 'install-target' : ''}>{safari === 'compact' ? <Ellipsis size={23} /> : <Share size={21} />}{(scene === 'menu' || (scene === 'share' && safari === 'classic')) && <Touch />}</span></div>}
        {ios && scene === 'share' && safari === 'compact' && <div className="install-native-menu install-safari-menu"><span>Recarregar <RotateCcw size={16} /></span><span className="install-target">Compartilhar <Share size={19} /><Touch /></span><span>Adicionar Favorito <PlusSquare size={17} /></span></div>}
        {scene === 'home-option' && (ios ? <div className="install-share-sheet"><span className="install-sheet-handle" /><div className="install-shared-site"><ClubIcon size={32} /><strong>Pico Club</strong></div><div className="install-share-scroll"><ArrowUp size={19} /><span>Deslize a lista</span></div><div className="install-native-menu"><span>Copiar <Copy size={16} /></span><span className="install-target">Adicionar à Tela de Início <PlusSquare size={20} /><Touch /></span><span>Editar Ações...</span></div></div> : <div className="install-native-menu install-chrome-menu"><span>Nova guia <PlusSquare size={17} /></span><span>Histórico <RotateCcw size={17} /></span><span className="install-target">Instalar e criar atalho <ArrowRight size={17} /><Touch /></span><span>Configurações</span></div>)}
        {!ios && scene === 'web-app' && <div className="install-native-menu install-chrome-menu"><span className="install-target">Instalar <PlusSquare size={19} /><Touch /></span><span>Criar atalho</span></div>}
        {adding && (ios ? <div className="install-add-sheet"><header><span>Cancelar</span><strong>Adicionar à<br />Tela de Início</strong><span className={scene === 'confirm' ? 'install-target' : ''}>Adicionar{scene === 'confirm' && <Touch />}</span></header><div className="install-add-name"><ClubIcon /><strong>Pico Club</strong></div><div className="install-toggle-row"><span>Abrir como App da Web</span><span className={`install-toggle ${scene === 'web-app' ? 'install-target' : ''}`}><i />{scene === 'web-app' && <Touch />}</span></div></div> : scene === 'confirm' && <div className="install-android-confirm"><strong>Instalar app</strong><div className="install-add-name"><ClubIcon /><span>Pico Club</span></div><footer><span>Cancelar</span><span className="install-target">Instalar<Touch /></span></footer></div>)}
      </>}
    </div>
    {ios && <span className="install-home-indicator" />}
  </div>;
}

export function InstallGuide() {
  const [platform, setPlatform] = useState<Platform>('ios');
  const [safari, setSafari] = useState<SafariLayout>('compact');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [needsBrowser, setNeedsBrowser] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [prompting, setPrompting] = useState(false);
  const [message, setMessage] = useState('');
  const [copyFallback, setCopyFallback] = useState('');
  const player = useRef<HTMLDivElement>(null);
  const scenes = installationScenes(platform, safari);
  const scene = scenes[index] ?? scenes[0];
  const last = index === scenes.length - 1;

  useEffect(() => {
    const device = installDevice(navigator.userAgent, navigator.maxTouchPoints);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const standalone = matchMedia('(display-mode: standalone)');
    let live = true;
    const installedNow = () => standalone.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    queueMicrotask(() => { if (live) { setPlatform(device.platform === 'android' ? 'android' : 'ios'); setNeedsBrowser(device.needsBrowser); setInstalled(installedNow()); setPlaying(!reduced.matches && !installedNow()); } });
    const offer = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const done = () => { setInstalled(true); setPrompt(null); setPlaying(false); setMessage(''); setCopyFallback(''); };
    const motion = () => { if (reduced.matches) setPlaying(false); };
    const mode = () => { if (installedNow()) done(); };
    window.addEventListener('beforeinstallprompt', offer); window.addEventListener('appinstalled', done);
    standalone.addEventListener('change', mode); reduced.addEventListener('change', motion);
    return () => { live = false; window.removeEventListener('beforeinstallprompt', offer); window.removeEventListener('appinstalled', done); standalone.removeEventListener('change', mode); reduced.removeEventListener('change', motion); };
  }, []);

  useEffect(() => {
    let inView = false;
    const update = () => setVisible(inView && document.visibilityState === 'visible');
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); }, { threshold: .25 });
    if (player.current) observer.observe(player.current);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);

  useEffect(() => {
    if (!playing || !visible || last) return;
    const timer = setTimeout(() => setIndex(current => current + 1), 4200);
    return () => clearTimeout(timer);
  }, [playing, visible, installed, last, index, platform, safari]);

  function choosePlatform(next: Platform) { setPlatform(next); setIndex(0); setPlaying(false); setMessage(''); }
  function jump(next: number) { setIndex(next); setPlaying(false); }
  async function install() {
    if (!prompt || prompting) return;
    setPrompting(true); setPlaying(false); setMessage('');
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setMessage(choice.outcome === 'accepted' ? 'Confira a instalação no seu aparelho.' : 'Tudo bem. O guia continua disponível aqui.');
    } catch { setMessage('Não foi possível abrir a instalação. Siga as figuras abaixo.'); }
    finally { setPrompt(null); setPrompting(false); }
  }
  async function copyLink() {
    const url = `${location.origin}/feed`;
    try { await navigator.clipboard.writeText(url); setMessage('Link copiado. Abra no navegador.'); setCopyFallback(''); }
    catch { setCopyFallback(url); setMessage('Copie o endereço abaixo e abra no navegador.'); }
  }
  const animated = playing && visible && !last;
  return <main className="install-guide" id="main-content">
    <Link href="/feed" className="install-back"><ArrowLeft size={18} aria-hidden="true" />Voltar ao Pico</Link>
    <div className="install-guide-layout">
      <header className="install-guide-intro"><h1>Pico Club<br />na tela inicial</h1>
        <div className="install-platforms" role="group" aria-label="Seu aparelho"><button type="button" aria-pressed={platform === 'ios'} onClick={() => choosePlatform('ios')}>iPhone</button><button type="button" aria-pressed={platform === 'android'} onClick={() => choosePlatform('android')}>Android</button></div>
        {needsBrowser && <div className="install-browser-help"><Globe size={22} aria-hidden="true" /><p>Abra no {platform === 'ios' ? 'Safari' : 'Chrome'}.</p><Button variant="secondary" size="small" onClick={copyLink}><Copy size={16} aria-hidden="true" />Copiar link</Button></div>}
        {copyFallback && <input className="install-copy-link" readOnly aria-label="Link do Pico para copiar" value={copyFallback} onFocus={event => event.currentTarget.select()} />}
        {installed ? <p className="install-installed" role="status"><Check size={20} aria-hidden="true" />Pico Club já está instalado.</p> : prompt && platform === 'android' && <Button className="install-native-button" onClick={install} disabled={prompting}>{prompting ? 'Abrindo instalação…' : 'Instalar Pico Club'}</Button>}
        {message && <p className="install-feedback" role="status">{message}</p>}
      </header>
      <section className="install-player" ref={player} aria-label="Guia visual de instalação">
        <Phone platform={platform} scene={scene} safari={safari} playing={animated} />
        <div className="install-caption"><span>{index + 1}/{scenes.length}</span><h2>{captions[platform][scene]}</h2></div>
        <p className="sr-only" aria-live={animated ? 'off' : 'polite'}>{accessible[platform][scene]}</p>
        <div className="install-player-controls"><Button variant="quiet" aria-label="Etapa anterior" disabled={index === 0} onClick={() => jump(index - 1)}><ArrowLeft size={20} aria-hidden="true" /></Button><Button variant="secondary" onClick={() => { if (last) { setIndex(0); setPlaying(true); } else setPlaying(!playing); }} aria-label={last ? 'Rever animação' : playing ? 'Pausar animação' : 'Reproduzir animação'}>{last ? <RotateCcw size={18} aria-hidden="true" /> : playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}{last ? 'Rever' : playing ? 'Pausar' : 'Assistir'}</Button><Button variant="quiet" aria-label="Próxima etapa" disabled={last} onClick={() => jump(index + 1)}><ArrowRight size={20} aria-hidden="true" /></Button></div>
        <span className="install-example">Demonstração. Faça os passos no seu navegador.</span>
      </section>
      <div className="install-guide-help">
        {platform === 'ios' && <details><summary>Meu Safari é diferente <ChevronDown size={16} aria-hidden="true" /></summary><div className="install-safari-options" role="group" aria-label="Botão que aparece no seu Safari"><button type="button" aria-pressed={safari === 'compact'} onClick={() => { setSafari('compact'); jump(0); }}><Ellipsis size={23} aria-hidden="true" />Três pontos</button><button type="button" aria-pressed={safari === 'classic'} onClick={() => { setSafari('classic'); jump(0); }}><Share size={21} aria-hidden="true" />Compartilhar</button></div></details>}
        <details><summary>Não achei essa opção <ChevronDown size={16} aria-hidden="true" /></summary>{platform === 'ios' ? <p>No Safari, abra Compartilhar e deslize a lista. Se a opção não aparecer, toque em Editar Ações e inclua Adicionar à Tela de Início. <a href="https://support.apple.com/pt-br/guide/iphone/iphea86e5236/26/ios/26" target="_blank" rel="noreferrer">Ajuda da Apple</a></p> : <p>No Chrome, a opção também pode aparecer como Adicionar à tela inicial ou Instalar app. Depois, siga a confirmação do aparelho. <a href="https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=pt-BR" target="_blank" rel="noreferrer">Ajuda do Chrome</a></p>}</details>
        <Link href="/feed" className={buttonVariants({ variant: 'quiet', size: 'small' })}>Continuar no Pico <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </div>
  </main>;
}
