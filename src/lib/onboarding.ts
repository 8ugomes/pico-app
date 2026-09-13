export const tourSteps = [
  { id: 'arenas', path: '/arenas', label: 'Arenas', title: 'Comece pelos seus lugares.', description: 'Encontre uma arena onde você joga ou já jogou e conheça as comunidades ligadas a ela.', instruction: 'Toque na busca e abra uma arena. Não encontrou a sua? Pode continuar o passeio.', targets: ['arena-search'] },
  { id: 'people', path: '/descobrir', label: 'Pessoas', title: 'Um lugar em comum aproxima.', description: 'Encontre pessoas por esporte, nível e vínculos com arenas. Acompanhar alguém não envia convite.', instruction: 'Abra “Filtrar pessoas” e escolha “Arena acompanhada”. São vínculos com o lugar, não presença ao vivo.', targets: ['people-arena', 'people-filters'] },
  { id: 'communities', path: '/comunidades', label: 'Comunidades', title: 'Encontre a sua turma.', description: 'Conheça grupos independentes ou ligados a arenas. Cada comunidade tem sua proposta e suas regras.', instruction: 'Toque em “Explorar” e abra um grupo. A entrada pode ser aberta, por aprovação ou por convite.', targets: ['community-explore'] },
  { id: 'feed', path: '/feed', label: 'Início', title: 'A conversa continua aqui.', description: 'Volte aos seus grupos e arenas e acompanhe publicações. Tem uma experiência para contar?', instruction: '“Compartilhe com sua turma” abre o editor. Confira quem pode ver e onde o post vai aparecer antes de publicar.', targets: ['publish'] },
  { id: 'games', path: '/jogos', label: 'Meus jogos', title: 'Jogou? Guarde a lembrança.', description: 'Arena, modalidade e data ficam só para você. Compartilhar é outra ação, com audiência escolhida por você.', instruction: 'Abra “Registrar jogo”. Pode fechar sem salvar. Depois, encontre Meus jogos no Perfil.', targets: ['register-game'] },
  { id: 'profile', path: '/perfil', label: 'Perfil', title: 'Deixe a turma conhecer você.', description: 'Nome, foto, esportes e bio ajudam a turma a te reconhecer. Meus Picos reúne seus vínculos.', instruction: 'Use “Editar perfil”. Aqui também ficam Meus jogos, Privacidade e conta e o acesso a este tutorial.', targets: ['edit-profile'] },
] as const;

export type TourProgress = { version: 1; status: 'active' | 'paused' | 'dismissed' | 'complete'; step: number };
export function parseTourProgress(raw: string | null): TourProgress | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !['active', 'paused', 'dismissed', 'complete'].includes(value.status) || !Number.isInteger(value.step) || value.step < 0 || value.step >= tourSteps.length) return null;
    return { version: 1, status: value.status, step: value.step };
  } catch { return null; }
}

export function tourStepAt(path: string): number | null {
  const exact = tourSteps.findIndex(step => step.path === path);
  if (exact >= 0) return exact;
  if (/^\/arenas\/[^/]+$/.test(path)) return 0;
  if (/^\/perfil\/[^/]+$/.test(path)) return 1;
  if (/^\/comunidades\/[^/]+$/.test(path)) return 2;
  if (/^\/publicacoes\/[^/]+$/.test(path)) return 3;
  return null;
}

export function tourStorageKey(identity: string) {
  return `pico.tour.v1:${identity}`;
}
