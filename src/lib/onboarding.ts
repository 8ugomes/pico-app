export const tourSteps = [
  { id: 'arenas', path: '/arenas', label: 'Arenas', title: 'Encontre seus lugares.', description: 'Busque uma arena e acompanhe o que acontece por lá.', instruction: 'Use a busca para abrir uma arena. Acompanhar cria um vínculo com o lugar, sem indicar presença ao vivo.', targets: ['arena-search'] },
  { id: 'people', path: '/descobrir', label: 'Pessoas', title: 'Encontre sua turma.', description: 'Veja quem compartilha seu esporte e seus lugares.', instruction: 'Use os filtros para chegar às pessoas certas. Comunidades ficam na aba ao lado e participar é sempre uma escolha.', targets: ['people-arena', 'people-filters'] },
  { id: 'games', path: '/jogos', label: 'Meus jogos', title: 'Guarde o que você jogou.', description: 'Registre um jogo só para você.', instruction: 'Registrar não publica no Início. Compartilhar é outra ação, com a audiência escolhida por você.', targets: ['register-game'] },
] as const;

type TourStatus = 'active' | 'paused' | 'dismissed' | 'complete';
export type TourProgress = { version: 2; status: TourStatus; step: number };
const tourStatuses: TourStatus[] = ['active', 'paused', 'dismissed', 'complete'];
const legacyStepToCurrent = [0, 1, 1, 1, 2, 2] as const;

export function parseTourProgress(raw: string | null): TourProgress | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!tourStatuses.includes(value?.status) || !Number.isInteger(value.step) || value.step < 0) return null;
    if (value.version === 2 && value.step < tourSteps.length) return { version: 2, status: value.status, step: value.step };
    if (value.version === 1 && value.step < legacyStepToCurrent.length) return { version: 2, status: value.status, step: legacyStepToCurrent[value.step] };
    return null;
  } catch { return null; }
}

export function tourStepAt(path: string): number | null {
  const exact = tourSteps.findIndex(step => step.path === path);
  if (exact >= 0) return exact;
  if (/^\/arenas\/[^/]+$/.test(path)) return 0;
  if (/^\/perfil\/[^/]+$/.test(path)) return 1;
  if (path === '/comunidades' || /^\/comunidades\/[^/]+$/.test(path)) return 1;
  return null;
}

export function tourStorageKey(identity: string) {
  return `pico.tour.v1:${identity}`;
}
