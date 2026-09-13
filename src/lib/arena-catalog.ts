import data from '../data/arena-catalog.json' with { type: 'json' };
import type { ArenaDirectory } from '../types/read';

type Entry = {
  id: string; slug: string; address: string; region: string; note: string;
  sourceUrl: string; checkedOn: string;
  photos: { src: string; width: number; height: number; sourcePage: string }[];
};
const entries = data.arenas as Entry[];

// Curated provenance belongs to the imported identity, never to a user-supplied URL.
export function getArenaDirectory(id: string, slug: string): ArenaDirectory | undefined {
  const entry = entries.find(a => a.id === id && a.slug === slug);
  if (!entry) return;
  return {
    address: entry.address, region: entry.region, note: entry.note,
    sourceUrl: entry.sourceUrl, checkedOn: entry.checkedOn,
    photos: entry.photos.map(p => ({ src: p.src, width: p.width, height: p.height, sourcePage: p.sourcePage })),
  };
}
