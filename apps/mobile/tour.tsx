import { useEffect, useState } from 'react';
import { Preferences } from '@capacitor/preferences';
import { ArrowRight, Compass } from 'lucide-react';
import type { MobileTab } from './deep-links';
import { Button, ErrorState, Modal } from './ui';

type TourStatus = 'active' | 'paused' | 'dismissed' | 'complete';
type TourProgress = { version: 1; status: TourStatus; step: number };

const steps: { title: string; body: string; tab: MobileTab; section?: 'games' }[] = [
  { title: 'Encontre seus lugares.', body: 'Busque uma arena e veja as informações do lugar, sem presença ao vivo.', tab: 'arenas' },
  { title: 'Encontre sua turma.', body: 'Conheça pessoas e comunidades. Conectar e participar são sempre escolhas suas.', tab: 'people' },
  { title: 'Guarde seus jogos.', body: 'Registre uma partida só para você. Compartilhar continua sendo uma ação separada.', tab: 'profile', section: 'games' },
];

function key(accountId: string) {
  return `pico.mobile.tour.v1.${accountId}`;
}

function parse(value: string | null): TourProgress | null {
  try {
    const parsed = value ? JSON.parse(value) as Partial<TourProgress> : null;
    if (!parsed || parsed.version !== 1 || !['active', 'paused', 'dismissed', 'complete'].includes(String(parsed.status)) || !Number.isInteger(parsed.step) || Number(parsed.step) < 0 || Number(parsed.step) >= steps.length) return null;
    return parsed as TourProgress;
  } catch {
    return null;
  }
}

export function MobileTour({ accountId, onNavigate }: { accountId: string; onNavigate: (target: { tab: MobileTab; section?: 'games' }) => void }) {
  const [progress, setProgress] = useState<TourProgress | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void Preferences.get({ key: key(accountId) }).then(({ value }) => {
      if (!active) return;
      const stored = parse(value);
      const safe = stored?.status === 'active' ? { ...stored, status: 'paused' as const } : stored;
      setProgress(safe);
      setWelcome(!safe);
      setOpen(!safe);
      setLoaded(true);
      if (safe !== stored && safe) void Preferences.set({ key: key(accountId), value: JSON.stringify(safe) });
    }).catch(() => {
      if (!active) return;
      setError('O guia não pôde ser retomado neste aparelho.');
      setLoaded(true);
    });
    return () => { active = false; };
  }, [accountId]);

  async function save(next: TourProgress) {
    setProgress(next);
    try {
      await Preferences.set({ key: key(accountId), value: JSON.stringify(next) });
    } catch {
      setError('Não foi possível guardar o ponto do guia.');
    }
  }

  function start() {
    const step = progress?.status === 'paused' ? progress.step : 0;
    const next: TourProgress = { version: 1, status: 'active', step };
    setWelcome(false);
    setOpen(true);
    void save(next);
    onNavigate(steps[step]);
  }

  const activeStep = progress?.status === 'active' ? steps[progress.step] : null;
  return <>
    {loaded && <button type="button" className="tour-trigger" onClick={start}><Compass size={16} aria-hidden="true" />{progress?.status === 'paused' ? 'Retomar guia' : 'Guia'}</button>}
    <Modal open={open} title={welcome ? 'Quer conhecer o Pico?' : activeStep?.title || 'Guia do Pico'} onClose={() => {
      if (activeStep) void save({ ...progress!, status: 'paused' });
      else if (welcome) void save({ version: 1, status: 'dismissed', step: 0 });
      setOpen(false);
    }}>
      {welcome ? <><p>São três passos curtos. Você pode sair e retomar quando quiser.</p><div className="form-actions"><Button type="button" variant="quiet" onClick={() => { void save({ version: 1, status: 'dismissed', step: 0 }); setOpen(false); }}>Explorar sozinho</Button><Button type="button" onClick={start}>Ver 3 passos<ArrowRight size={17} aria-hidden="true" /></Button></div></> : activeStep && <><p>{activeStep.body}</p><p className="privacy-note">Passo {progress!.step + 1} de {steps.length}</p>{error && <ErrorState message={error} />}<div className="form-actions"><Button type="button" variant="quiet" onClick={() => { void save({ ...progress!, status: 'paused' }); setOpen(false); }}>Continuar depois</Button><Button type="button" onClick={() => {
        const nextStep = progress!.step + 1;
        if (nextStep >= steps.length) {
          void save({ version: 1, status: 'complete', step: steps.length - 1 });
          setOpen(false);
          return;
        }
        const next: TourProgress = { version: 1, status: 'active', step: nextStep };
        void save(next);
        onNavigate(steps[nextStep]);
      }}>{progress!.step + 1 === steps.length ? 'Concluir' : 'Próximo'}<ArrowRight size={17} aria-hidden="true" /></Button></div></>}
      {!welcome && !activeStep && error && <ErrorState message={error} />}
    </Modal>
  </>;
}
