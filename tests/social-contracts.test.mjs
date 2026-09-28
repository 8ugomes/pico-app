import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mutateSocial, parseMutation } from '../src/lib/supabase/mutations.ts';
import { readSocial } from '../src/lib/supabase/read-service.ts';
import { ALICE, BOB } from './helpers/database.mjs';

const profile = {
  id: BOB,
  username: 'bia',
  display_name: 'Bia',
  bio: 'Bora jogar',
  city: 'São Paulo',
  neighborhood: 'Pinheiros',
  avatar_path: null,
  available: true,
  is_demo: false,
  onboarding_completed: true,
  player_sports: [],
};

test('message reports accept only the public contract and use the dedicated RPC', async () => {
  const input = parseMutation({
    action: 'report',
    target: 'message',
    id: BOB,
    reason: 'harassment',
    details: '  Contexto da conversa  ',
  });
  assert.deepEqual(input, {
    action: 'report',
    target: 'message',
    id: BOB,
    reason: 'harassment',
    details: 'Contexto da conversa',
  });
  assert.throws(() => parseMutation({ ...input, reporterId: ALICE }), error => error.status === 400);

  let call;
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: ALICE } }, error: null }) },
    from: () => { throw Error('message reports must not insert directly'); },
    rpc: async (name, args) => {
      call = { name, args };
      return { data: BOB, error: null };
    },
  };
  await mutateSocial(client, input);
  assert.deepEqual(call, {
    name: 'report_direct_message',
    args: { p_message: BOB, p_reason: 'harassment', p_details: 'Contexto da conversa' },
  });
});

test('player reads use the exact relationship RPC without querying inbound connections', async () => {
  let rpcCall;
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: ALICE } }, error: null }) },
    from: table => {
      assert.equal(table, 'profiles');
      return {
        select: () => ({
          eq: (column, username) => {
            assert.equal(column, 'username');
            assert.equal(username, 'bia');
            return { maybeSingle: async () => ({ data: profile, error: null }) };
          },
        }),
      };
    },
    rpc: async (name, args) => {
      rpcCall = { name, args };
      return { data: { following: false, followsYou: true, mutual: false }, error: null };
    },
  };
  const result = await readSocial(client, { resource: 'player', username: 'bia' });
  assert.deepEqual(rpcCall, { name: 'read_connection_state', args: { p_player: BOB } });
  assert.equal(result.kind, 'player');
  assert.equal(result.connected, false);
  assert.equal(result.followsYou, true);
  assert.equal(result.mutual, false);
});

test('player reads reject malformed relationship state instead of guessing', async () => {
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: ALICE } }, error: null }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile, error: null }) }) }) }),
    rpc: async () => ({ data: { following: true, followsYou: false, mutual: true }, error: null }),
  };
  await assert.rejects(
    readSocial(client, { resource: 'player', username: 'bia' }),
    error => error.code === 'unavailable',
  );
});

test('player reads fall back conservatively while the additive RPC is not installed', async () => {
  const calls = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: ALICE } }, error: null }) },
    from: table => {
      calls.push(table);
      if (table === 'profiles') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile, error: null }) }) }) };
      assert.equal(table, 'connections');
      return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { followed_id: BOB }, error: null }) }) }) }) };
    },
    rpc: async () => ({ data: null, error: { code: 'PGRST202' } }),
  };
  const result = await readSocial(client, { resource: 'player', username: 'bia' });
  assert.deepEqual(calls, ['profiles', 'connections']);
  assert.equal(result.kind, 'player');
  assert.equal(result.connected, true);
  assert.equal(result.followsYou, false);
  assert.equal(result.mutual, false);
});
