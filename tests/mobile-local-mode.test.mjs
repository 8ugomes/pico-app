import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LOCAL_SPORTS,
  LocalWorkspaceError,
  createLocalArena,
  createLocalGame,
  createLocalWorkspace,
  deleteLocalArena,
  deleteLocalGame,
  parseLocalWorkspace,
  setupLocalProfile,
  updateLocalArena,
  updateLocalGame,
} from '../apps/mobile/local-model.ts';
import { createLocalRepository } from '../apps/mobile/local-store.ts';

const NOW = '2026-10-18T15:00:00.000Z';
const LATER = '2026-10-18T16:00:00.000Z';
const TODAY = '2026-10-18';
const ARENA_ID = '11111111-1111-4111-8111-111111111111';
const SECOND_ARENA_ID = '22222222-2222-4222-8222-222222222222';
const GAME_ID = '33333333-3333-4333-8333-333333333333';

function indexedId(index) {
  const hex = index.toString(16);
  return `${hex.padStart(8, '0')}-0000-4000-8000-${hex.padStart(12, '0')}`;
}

function repositoryHarness(initialWorkspace = null) {
  const modeValues = new Map();
  const workspaceState = {
    value: initialWorkspace,
    writes: 0,
    clears: 0,
    failWrite: false,
  };
  const modeStorage = {
    async get({ key }) { return { value: modeValues.get(key) ?? null }; },
    async set({ key, value }) { modeValues.set(key, value); },
    async remove({ key }) { modeValues.delete(key); },
  };
  const workspaceStorage = {
    async read() { return { value: workspaceState.value }; },
    async write({ value }) {
      workspaceState.writes += 1;
      if (workspaceState.failWrite) throw new Error('Falha simulada de escrita.');
      workspaceState.value = value;
    },
    async clear() {
      workspaceState.clears += 1;
      workspaceState.value = null;
    },
  };
  return {
    modeValues,
    workspaceState,
    repository: createLocalRepository({ modeStorage, workspaceStorage }),
  };
}

function configuredWorkspace() {
  return setupLocalProfile(createLocalWorkspace(NOW), {
    name: 'Bia da Areia',
    sport: 'Futevôlei',
    city: 'Santos',
  }, NOW);
}

function workspaceWithArena() {
  return createLocalArena(configuredWorkspace(), {
    id: ARENA_ID,
    name: 'Arena do Canal',
    neighborhood: 'Gonzaga',
    city: 'Santos',
  }, NOW);
}

test('cria workspace versionado e configura somente o perfil local esperado', () => {
  const empty = createLocalWorkspace(NOW);
  assert.deepEqual(empty, {
    version: 1,
    updatedAt: NOW,
    profile: null,
    arenas: [],
    games: [],
  });

  const configured = setupLocalProfile(empty, {
    name: '  Bia da Areia  ',
    sport: 'Futevôlei',
    city: '  Santos ',
  }, LATER);

  assert.deepEqual(configured.profile, {
    name: 'Bia da Areia',
    sport: 'Futevôlei',
    city: 'Santos',
  });
  assert.equal(configured.updatedAt, LATER);
  assert.equal(empty.profile, null);
  assert.deepEqual(LOCAL_SPORTS, ['Futevôlei', 'Beach tennis', 'Vôlei de praia']);
});

test('parseia JSON e objeto persistidos sem confiar em campos extras', () => {
  const workspace = workspaceWithArena();
  const persisted = JSON.stringify({ ...workspace, accessToken: 'não deve sobreviver' });

  assert.deepEqual(parseLocalWorkspace(persisted, TODAY), workspace);
  assert.deepEqual(parseLocalWorkspace(structuredClone(workspace), TODAY), workspace);
  assert.equal(parseLocalWorkspace(null, TODAY), null);
  assert.throws(() => parseLocalWorkspace({ ...workspace, arenas: 'não é uma lista' }, TODAY), /Lista de arenas/);
  assert.throws(() => parseLocalWorkspace({ ...workspace, profile: { name: '', sport: 'Futevôlei', city: '' } }, TODAY), /Nome/);
});

test('distingue ausência de payload corrompido, versão futura e valor persistido acima do limite', () => {
  const workspace = workspaceWithArena();

  assert.throws(() => parseLocalWorkspace('{json quebrado', TODAY), (cause) => {
    assert.ok(cause instanceof LocalWorkspaceError);
    assert.equal(cause.code, 'corrupt');
    assert.match(cause.message, /Nada foi apagado/);
    return true;
  });
  assert.throws(() => parseLocalWorkspace(JSON.stringify({ ...workspace, version: 2 }), TODAY), (cause) => {
    assert.ok(cause instanceof LocalWorkspaceError);
    assert.equal(cause.code, 'future_version');
    assert.match(cause.message, /versão mais nova/);
    return true;
  });
  assert.throws(() => parseLocalWorkspace(JSON.stringify({
    ...workspace,
    padding: 'x'.repeat(1_000_000),
  }), TODAY), (cause) => {
    assert.ok(cause instanceof LocalWorkspaceError);
    assert.equal(cause.code, 'too_large');
    assert.match(cause.message, /limite/);
    return true;
  });
});

test('cria, edita e exclui arenas sem modificar versões anteriores', () => {
  const configured = configuredWorkspace();
  const created = createLocalArena(configured, {
    id: ARENA_ID,
    name: 'Arena do Canal',
    neighborhood: '',
    city: 'Santos',
  }, NOW);
  const edited = updateLocalArena(created, ARENA_ID, {
    name: 'Arena do Canal 7',
    neighborhood: 'Gonzaga',
  }, LATER);

  assert.equal(configured.arenas.length, 0);
  assert.equal(created.arenas[0].name, 'Arena do Canal');
  assert.deepEqual(edited.arenas[0], {
    id: ARENA_ID,
    name: 'Arena do Canal 7',
    neighborhood: 'Gonzaga',
    city: 'Santos',
    createdAt: NOW,
    updatedAt: LATER,
  });

  const removed = deleteLocalArena(edited, ARENA_ID, LATER);
  assert.deepEqual(removed.arenas, []);
  assert.equal(edited.arenas.length, 1);
});

test('cria, edita e exclui jogos privados com data civil válida', () => {
  const withArena = workspaceWithArena();
  const created = createLocalGame(withArena, {
    id: GAME_ID,
    arenaId: ARENA_ID,
    sport: 'Beach tennis',
    playedOn: TODAY,
    notes: '  Jogo no fim da tarde.  ',
  }, { now: NOW, today: TODAY });
  const edited = updateLocalGame(created, GAME_ID, {
    sport: 'Vôlei de praia',
    playedOn: '2026-10-17',
    notes: '',
  }, { now: LATER, today: TODAY });

  assert.equal(withArena.games.length, 0);
  assert.deepEqual(created.games[0], {
    id: GAME_ID,
    arenaId: ARENA_ID,
    arenaSnapshot: 'Arena do Canal, Gonzaga, Santos',
    sport: 'Beach tennis',
    playedOn: TODAY,
    notes: 'Jogo no fim da tarde.',
    createdAt: NOW,
    updatedAt: NOW,
  });
  assert.equal(created.games[0].sport, 'Beach tennis');
  assert.equal(edited.games[0].sport, 'Vôlei de praia');
  assert.equal(edited.games[0].playedOn, '2026-10-17');
  assert.equal(edited.games[0].notes, '');
  assert.equal(edited.games[0].updatedAt, LATER);

  const removed = deleteLocalGame(edited, GAME_ID, LATER);
  assert.deepEqual(removed.games, []);
  assert.equal(edited.games.length, 1);
});

test('edição conserva o lugar histórico até escolher outra arena', () => {
  const originalArenaId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const withArena = createLocalArena(configuredWorkspace(), {
    id: originalArenaId,
    name: 'Arena original',
    city: 'Santos',
  }, NOW);
  const withGame = createLocalGame(withArena, {
    id: GAME_ID,
    arenaId: originalArenaId,
    sport: 'Futevôlei',
    playedOn: TODAY,
    notes: 'Nota original',
  }, { now: NOW, today: TODAY });
  const renamed = updateLocalArena(withGame, originalArenaId, {
    name: 'Arena renomeada',
    city: 'Outra cidade',
  }, LATER);
  const edited = updateLocalGame(renamed, GAME_ID, {
    arenaId: originalArenaId.toUpperCase(),
    sport: 'Beach tennis',
    playedOn: '2026-10-17',
    notes: 'Nota editada',
  }, { now: LATER, today: TODAY });

  assert.equal(edited.games[0].arenaId, originalArenaId);
  assert.equal(edited.games[0].arenaSnapshot, 'Arena original, Santos');
  assert.equal(edited.games[0].sport, 'Beach tennis');
  assert.equal(edited.games[0].playedOn, '2026-10-17');
  assert.equal(edited.games[0].notes, 'Nota editada');

  const withAnotherArena = createLocalArena(edited, {
    id: SECOND_ARENA_ID,
    name: 'Arena escolhida',
    neighborhood: 'Centro',
    city: 'São Vicente',
  }, LATER);
  const moved = updateLocalGame(withAnotherArena, GAME_ID, {
    arenaId: SECOND_ARENA_ID,
  }, { now: LATER, today: TODAY });

  assert.equal(moved.games[0].arenaId, SECOND_ARENA_ID);
  assert.equal(moved.games[0].arenaSnapshot, 'Arena escolhida, Centro, São Vicente');
  assert.equal(edited.games[0].arenaSnapshot, 'Arena original, Santos');
});

test('rejeita limites, identificadores, referências e datas inválidas ou futuras', () => {
  const configured = configuredWorkspace();
  const withArena = workspaceWithArena();

  assert.throws(() => setupLocalProfile(configured, {
    name: 'x'.repeat(61),
    sport: 'Futevôlei',
    city: 'Santos',
  }, NOW), /Nome/);
  assert.throws(() => setupLocalProfile(configured, {
    name: 'Bia',
    sport: 'Tênis',
    city: 'Santos',
  }, NOW), /Modalidade/);
  assert.throws(() => createLocalArena(configured, {
    id: 'id-inválido',
    name: 'Arena',
  }, NOW), /Identificador/);
  assert.throws(() => createLocalArena(withArena, {
    id: ARENA_ID,
    name: 'Duplicada',
  }, NOW), /já existe/);
  assert.throws(() => updateLocalArena(withArena, SECOND_ARENA_ID, { name: 'Ausente' }, NOW), /não encontrada/);
  assert.throws(() => createLocalGame(withArena, {
    id: GAME_ID,
    arenaId: SECOND_ARENA_ID,
    sport: 'Futevôlei',
    playedOn: TODAY,
  }, { now: NOW, today: TODAY }), /Arena/);
  assert.throws(() => createLocalGame(withArena, {
    id: GAME_ID,
    arenaId: ARENA_ID,
    sport: 'Futevôlei',
    playedOn: '2026-10-19',
  }, { now: NOW, today: TODAY }), /futura/);
  assert.throws(() => createLocalGame(withArena, {
    id: GAME_ID,
    arenaId: ARENA_ID,
    sport: 'Futevôlei',
    playedOn: '2026-02-30',
  }, { now: NOW, today: TODAY }), /Data/);
  assert.throws(() => createLocalGame(withArena, {
    id: GAME_ID,
    arenaId: ARENA_ID,
    sport: 'Futevôlei',
    playedOn: TODAY,
    notes: 'x'.repeat(501),
  }, { now: NOW, today: TODAY }), /Observação/);
});

test('excluir arena destaca o vínculo e conserva o snapshot histórico do jogo', () => {
  const withGame = createLocalGame(workspaceWithArena(), {
    id: GAME_ID,
    arenaId: ARENA_ID,
    sport: 'Futevôlei',
    playedOn: '2026-10-12',
    notes: '',
  }, { now: NOW, today: TODAY });
  const removed = deleteLocalArena(withGame, ARENA_ID, LATER);

  assert.equal(removed.arenas.length, 0);
  assert.equal(removed.games[0].arenaId, null);
  assert.equal(removed.games[0].arenaSnapshot, 'Arena do Canal, Gonzaga, Santos');
  assert.equal(removed.games[0].updatedAt, LATER);
  assert.equal(withGame.games[0].arenaId, ARENA_ID);
  assert.equal(withGame.games[0].updatedAt, NOW);
  assert.deepEqual(parseLocalWorkspace(JSON.stringify(removed), TODAY), removed);
});

test('recuo do relógio não invalida um jogo que já estava persistido', async () => {
  const workspace = createLocalGame(workspaceWithArena(), {
    id: GAME_ID,
    arenaId: ARENA_ID,
    sport: 'Futevôlei',
    playedOn: TODAY,
    notes: '',
  }, { now: NOW, today: TODAY });

  assert.deepEqual(
    parseLocalWorkspace(JSON.stringify(workspace), '2026-10-17'),
    workspace,
  );
  assert.deepEqual(
    parseLocalWorkspace(structuredClone(workspace), '2026-10-17'),
    workspace,
  );

  const edited = updateLocalGame(workspace, GAME_ID, {
    playedOn: TODAY,
    notes: 'Nota preservada depois do ajuste do relógio.',
  }, { now: LATER, today: '2026-10-17' });
  assert.equal(edited.games[0].playedOn, TODAY);
  assert.equal(edited.games[0].notes, 'Nota preservada depois do ajuste do relógio.');
  assert.throws(() => updateLocalGame(workspace, GAME_ID, {
    playedOn: '2026-10-19',
  }, { now: LATER, today: '2026-10-17' }), /futura/);

  const { repository, workspaceState } = repositoryHarness(JSON.stringify(workspace));
  assert.deepEqual(await repository.load('2026-10-17T12:00:00.000Z'), workspace);
  assert.deepEqual(await repository.save(edited, '2026-10-17'), edited);
  assert.deepEqual(JSON.parse(workspaceState.value), edited);
});

test('repositório recusa workspace serializado acima do limite antes de escrever', async () => {
  const base = workspaceWithArena();
  const oversized = {
    ...base,
    profile: {
      name: 'N'.repeat(60),
      sport: 'Vôlei de praia',
      city: 'C'.repeat(80),
    },
    games: Array.from({ length: 1_000 }, (_, index) => ({
      id: indexedId(index + 1),
      arenaId: ARENA_ID,
      arenaSnapshot: 'A'.repeat(280),
      sport: 'Vôlei de praia',
      playedOn: TODAY,
      notes: 'N'.repeat(500),
      createdAt: NOW,
      updatedAt: NOW,
    })),
  };
  const { repository, workspaceState } = repositoryHarness();

  assert.ok(JSON.stringify(oversized).length > 1_000_000);
  await assert.rejects(repository.save(oversized, TODAY), (cause) => {
    assert.ok(cause instanceof LocalWorkspaceError);
    assert.equal(cause.code, 'too_large');
    return true;
  });
  assert.equal(workspaceState.writes, 0);
});

test('repositório não substitui payload inválido por workspace vazio', async () => {
  const { repository, workspaceState } = repositoryHarness('{json quebrado');

  await assert.rejects(repository.load(NOW), (cause) => {
    assert.ok(cause instanceof LocalWorkspaceError);
    assert.equal(cause.code, 'corrupt');
    return true;
  });
  assert.equal(workspaceState.value, '{json quebrado');
  assert.equal(workspaceState.writes, 0);

  workspaceState.value = JSON.stringify({ ...workspaceWithArena(), version: 2 });
  await assert.rejects(repository.load(NOW), (cause) => {
    assert.ok(cause instanceof LocalWorkspaceError);
    assert.equal(cause.code, 'future_version');
    return true;
  });
  assert.equal(JSON.parse(workspaceState.value).version, 2);
  assert.equal(workspaceState.writes, 0);

  workspaceState.value = JSON.stringify({ ...workspaceWithArena(), padding: 'x'.repeat(1_000_000) });
  await assert.rejects(repository.load(NOW), (cause) => {
    assert.ok(cause instanceof LocalWorkspaceError);
    assert.equal(cause.code, 'too_large');
    return true;
  });
  assert.ok(workspaceState.value.length > 1_000_000);
  assert.equal(workspaceState.writes, 0);
});

test('repositório traduz corrupção binária sinalizada pelo bridge nativo', async () => {
  const modeStorage = {
    async get() { return { value: null }; },
    async set() {},
    async remove() {},
  };
  const nativeFailure = Object.assign(new Error('Falha nativa'), { code: 'LOCAL_WORKSPACE_CORRUPT' });
  const repository = createLocalRepository({
    modeStorage,
    workspaceStorage: {
      async read() { throw nativeFailure; },
      async write() {},
      async clear() {},
    },
  });

  await assert.rejects(repository.load(NOW), (cause) => {
    assert.ok(cause instanceof LocalWorkspaceError);
    assert.equal(cause.code, 'corrupt');
    assert.match(cause.message, /Nada foi apagado/);
    return true;
  });
});

test('migração legada só remove Preferences depois de confirmar a nova escrita', async () => {
  const { repository, modeValues, workspaceState } = repositoryHarness();
  const legacyKey = 'pico.mobile.local.v1.workspace';
  const persisted = JSON.stringify(workspaceWithArena());
  modeValues.set(legacyKey, persisted);
  workspaceState.failWrite = true;

  await assert.rejects(repository.load(NOW), /Falha simulada/);
  assert.equal(modeValues.get(legacyKey), persisted);
  assert.equal(workspaceState.value, null);

  workspaceState.failWrite = false;
  assert.deepEqual(await repository.load(NOW), workspaceWithArena());
  assert.equal(modeValues.has(legacyKey), false);
  assert.equal(workspaceState.value, persisted);
});

test('repositório local separa preferência, saída e apagamento dos dados', async () => {
  const { repository, modeValues, workspaceState } = repositoryHarness();

  assert.equal(await repository.isPreferred(), false);
  assert.equal((await repository.load(NOW)).profile, null);

  const workspace = workspaceWithArena();
  await repository.save(workspace, TODAY);
  await repository.prefer();
  assert.equal(await repository.isPreferred(), true);
  assert.deepEqual([...modeValues.values()], ['local']);
  assert.deepEqual(await repository.load(NOW), workspace);

  await repository.leave();
  assert.equal(await repository.isPreferred(), false);
  assert.deepEqual(await repository.load(NOW), workspace);

  await repository.prefer();
  await repository.erase();
  assert.equal(await repository.isPreferred(), false);
  assert.equal(workspaceState.value, null);
  assert.equal(workspaceState.clears, 1);
  assert.equal((await repository.load(NOW)).profile, null);
});

test('limpeza auxiliar de Preferences não transforma save ou erase concluído em falha', async () => {
  let persisted = null;
  const modeStorage = {
    async get() { return { value: null }; },
    async set() {},
    async remove() { throw new Error('Preferences indisponível'); },
  };
  const repository = createLocalRepository({
    modeStorage,
    workspaceStorage: {
      async read() { return { value: persisted }; },
      async write({ value }) { persisted = value; },
      async clear() { persisted = null; },
    },
  });

  const workspace = workspaceWithArena();
  assert.deepEqual(await repository.save(workspace, TODAY), workspace);
  assert.deepEqual(JSON.parse(persisted), workspace);
  await repository.erase();
  assert.equal(persisted, null);
});
