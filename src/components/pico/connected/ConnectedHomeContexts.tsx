'use client';
import { HomeContexts, type HomePlaces } from '../HomeContexts';
import { Button } from '@/components/ui/Button';
import { useEntity } from './useEntity';

export function ConnectedHomeContexts({ viewerId }: { viewerId: string }) {
  const { data, error, reload } = useEntity<HomePlaces>(`/api/activity?kind=places&player=${viewerId}`);
  if (error) return <section className="home-contexts"><header className="home-intro"><h1>Seu Pico.</h1></header><p role="alert">Seus vínculos não carregaram. Você ainda pode acessar as áreas pela navegação.</p><Button size="small" variant="quiet" onClick={reload}>Tentar novamente</Button></section>;
  if (!data) return <section className="home-contexts" aria-busy="true"><header className="home-intro"><h1>Seu Pico.</h1></header><p role="status">Buscando suas comunidades e arenas…</p></section>;
  return <HomeContexts places={data} />;
}
