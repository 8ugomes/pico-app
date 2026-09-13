'use client';
import { useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Volleyball } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ReadArena } from '@/types/read';
export function ArenaImage({ arena, detail = false, cover }: { arena: ReadArena; detail?: boolean; cover?: string | null }) {
  return <div className={detail ? 'arena-detail-photo' : 'arena-card-photo'}>
    {cover || arena.image ? <Image unoptimized={Boolean(cover)} src={cover || arena.image!} alt={arena.isDemo ? `Imagem ilustrativa de ${arena.name}.` : `Foto de ${arena.name}.`} width={1440} height={960} sizes={detail ? '(max-width: 700px) 100vw, 700px' : '(max-width: 599px) 100vw, 350px'} /> : <div className="read-arena-placeholder"><Volleyball size={40} strokeWidth={1} aria-hidden="true" /><span>Um lugar para jogar.</span></div>}
    {arena.isDemo && <span className="arena-label-badge">Arena de demonstração</span>}
  </div>;
}


export function ArenaGallery({ arena, cover }: { arena: ReadArena; cover?: string | null }) {
  const [index, setIndex] = useState(0);
  const photos = arena.directory?.photos ?? [];
  const photo = photos[index] ?? photos[0];
  // A photo confirmed by the arena team replaces the imported gallery.
  if (cover || !photo) return <ArenaImage arena={arena} detail cover={cover} />;
  return <figure className="arena-gallery">
    <div className="arena-gallery-frame" style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
      <Image src={photo.src} alt={`${arena.name}: foto ${index + 1} do espaço.`} width={photo.width} height={photo.height} sizes="(max-width: 700px) 100vw, 700px" loading="eager" />
    </div>
    <figcaption className="arena-gallery-caption">
      <a href={photo.sourcePage} target="_blank" rel="noopener noreferrer">Fotos divulgadas pela arena</a>
      {photos.length > 1 && <div className="arena-gallery-controls">
        <Button variant="quiet" size="small" aria-label="Foto anterior" disabled={index === 0} onClick={() => setIndex(index - 1)}><ArrowLeft size={18} aria-hidden="true" /></Button>
        <span role="status" aria-live="polite">{index + 1} / {photos.length}</span>
        <Button variant="quiet" size="small" aria-label="Próxima foto" disabled={index >= photos.length - 1} onClick={() => setIndex(index + 1)}><ArrowRight size={18} aria-hidden="true" /></Button>
      </div>}
    </figcaption>
  </figure>;
}
