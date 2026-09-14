'use client';
import { useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { arenaPhotoSources } from '@/lib/arena-photos';
import type { ReadArena } from '@/types/read';

export function ArenaImage({ arena, detail = false, cover }: { arena: ReadArena; detail?: boolean; cover?: string | null }) {
  return <ArenaPhotos key={`${arena.id}:${cover ?? ''}:${arena.image ?? ''}`} arena={arena} detail={detail} cover={cover} />;
}

function ArenaPhotos({ arena, detail, cover, gallery = false }: { arena: ReadArena; detail: boolean; cover?: string | null; gallery?: boolean }) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const sources = arenaPhotoSources(arena, cover);
  const available = sources.filter(photo => !failedSources.includes(photo.src));
  const currentIndex = Math.min(index, Math.max(0, available.length - 1));
  const photo = available[currentIndex];
  if (!sources.length) return null;
  if (!photo) return detail ? <div className="arena-photo-retry"><p>As fotos não carregaram.</p><Button variant="quiet" size="small" onClick={() => { setFailedSources([]); setIndex(0); }}>Tentar novamente</Button></div> : null;
  // A working team cover takes priority. A failure tries another photo of this same arena.
  const showControls = gallery && !photo.src.startsWith('/api/') && available.length > 1;
  const frame = <div className={detail ? 'arena-gallery-frame' : 'arena-card-photo'}>
    <Image key={photo.src} unoptimized={photo.src.startsWith('/api/')} src={photo.src} alt={arena.isDemo ? `Imagem ilustrativa de ${arena.name}.` : `Foto de ${arena.name}.`} width={photo.width} height={photo.height} sizes={detail ? '(max-width: 700px) 100vw, 700px' : '(max-width: 599px) 100vw, 350px'} loading={detail ? 'eager' : 'lazy'} onError={() => setFailedSources(previous => [...previous, photo.src])} />
    {arena.isDemo && <span className="arena-label-badge">Arena de demonstração</span>}
  </div>;
  if (!detail) return frame;
  return <figure className="arena-gallery">
    {frame}
    {(photo.sourcePage || showControls) && <figcaption className="arena-gallery-caption">
      {photo.sourcePage && <a href={photo.sourcePage} target="_blank" rel="noopener noreferrer">Fotos divulgadas pela arena</a>}
      {showControls && <div className="arena-gallery-controls">
        <Button variant="quiet" size="small" aria-label="Foto anterior" disabled={currentIndex === 0} onClick={() => setIndex(currentIndex - 1)}><ArrowLeft size={18} aria-hidden="true" /></Button>
        <span role="status" aria-live="polite">{currentIndex + 1} / {available.length}</span>
        <Button variant="quiet" size="small" aria-label="Próxima foto" disabled={currentIndex >= available.length - 1} onClick={() => setIndex(currentIndex + 1)}><ArrowRight size={18} aria-hidden="true" /></Button>
      </div>}
    </figcaption>}
  </figure>;
}

export function ArenaGallery({ arena, cover }: { arena: ReadArena; cover?: string | null }) {
  return <ArenaPhotos key={`${arena.id}:${cover ?? ''}:${arena.image ?? ''}`} arena={arena} detail cover={cover} gallery />;
}
