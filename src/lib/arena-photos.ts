import type { ReadArena } from '../types/read';

export function arenaPhotoSources(arena: ReadArena, cover?: string | null) {
  const gallery = arena.directory?.photos ?? [];
  const sources = [cover, arena.image, ...gallery.map(photo => photo.src)]
    .filter((src): src is string => Boolean(src));
  return [...new Set(sources)].map(src => ({
    src,
    width: gallery.find(photo => photo.src === src)?.width ?? 1440,
    height: gallery.find(photo => photo.src === src)?.height ?? 960,
    sourcePage: gallery.find(photo => photo.src === src)?.sourcePage,
  }));
}
