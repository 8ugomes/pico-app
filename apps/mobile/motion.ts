/** Tempo máximo de espera pela saída animada antes de desmontar à força (maior que --motion-standard). */
export const EXIT_SAFETY_MS = 400;

type MediaSource = { matchMedia?: (query: string) => { matches: boolean } };

/** Movimento reduzido: o CSS remove a animação, então não há `animationend` para esperar. */
export function prefersReducedMotion(source: MediaSource = globalThis as MediaSource): boolean {
  return typeof source.matchMedia === 'function' && source.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
