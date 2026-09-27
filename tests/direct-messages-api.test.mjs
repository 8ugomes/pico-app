import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMessageAction, parseMessageQuery, conversationPageDto, messagePageDto, mutateMessages, messageFailure } from '../src/lib/supabase/direct-messages.ts';
import { directMessagesEnabled } from '../src/lib/features.ts';
import { safeNext } from '../src/lib/auth/navigation.ts';

const conversationId = '70000000-0000-4000-8000-000000000001';
const playerId = '30000000-0000-4000-8000-000000000001';
const messageId = '71000000-0000-4000-8000-000000000001';
const key = '72000000-0000-4000-8000-000000000001';
const rawMessage = { id: messageId, conversation_id: conversationId, sender_id: playerId, body: 'Depois do jogo?', created_at: '2026-09-18T12:00:00Z', client_key: key, sequence: 9 };
const rawPeer = { id: playerId, username: 'jogador', display_name: 'Jogador', avatar_path: `${playerId}/photo.webp`, email: 'never-expose@example.invalid' };

test('a notification destination survives sign-in without accepting external or token-bearing redirects', () => {
  assert.equal(safeNext('/mensagens'), '/mensagens');
  assert.equal(safeNext(`/mensagens/${conversationId}`), `/mensagens/${conversationId}`);
  for (const path of ['//evil.invalid/mensagens', '/mensagens?token=private', '/mensagens/../admin', '/mensagens#token']) assert.equal(safeNext(path), '/perfil');
});

test('direct messages accept bounded text and reject identity forgery, unknown fields and ambiguous queries', () => {
  const send = { action: 'send', conversationId, key, body: '  Bora jogar?  ' };
  assert.equal(parseMessageAction(send).body, 'Bora jogar?');
  for (const body of ['', ' '.repeat(30), 'a'.repeat(2001), '\0']) assert.throws(() => parseMessageAction({ ...send, body }));
  assert.throws(() => parseMessageAction({ ...send, senderId: playerId }));
  assert.throws(() => parseMessageAction({ ...send, conversationId: '../perfil' }));
  assert.throws(() => parseMessageAction({ action: 'read', conversationId, throughId: messageId, playerId }));
  assert.throws(() => parseMessageAction({ action: 'open', playerId, recipientId: playerId }));
  assert.deepEqual(parseMessageQuery(`https://pico.invalid/api/messages?conversation=${conversationId}&before=${messageId}`), { conversation: conversationId, before: messageId });
  for (const query of [`conversation=${conversationId}&conversation=${conversationId}`, 'before=', `playerId=${playerId}`, 'conversation=nope']) assert.throws(() => parseMessageQuery(`https://pico.invalid/api/messages?${query}`));
});

test('message responses expose only the peer and content contract, never delivery or idempotency internals', () => {
  const page = conversationPageDto({ items: [{ id: conversationId, peer: rawPeer, last_message: rawMessage, unread_count: 1 }], unreadCount: 1, nextCursor: null });
  assert.equal(page.items[0].peer.avatar, `/api/media?bucket=avatars&path=${encodeURIComponent(rawPeer.avatar_path)}`);
  assert.equal(page.items[0].lastMessage.body, rawMessage.body);
  const serialized = JSON.stringify(page);
  assert.ok(!serialized.includes('never-expose'));
  assert.ok(!serialized.includes('client_key'));
  assert.ok(!serialized.includes('sequence'));
  assert.ok(!serialized.includes(key));
  const thread = messagePageDto({ conversation: { id: conversationId, peer: rawPeer, can_send: false, unread_count: 1 }, items: [rawMessage], nextCursor: null });
  assert.equal(thread.conversation.canSend, false);
  assert.equal(thread.conversation.unreadCount, 1);
  assert.throws(() => messagePageDto({ conversation: { id: conversationId, peer: rawPeer, can_send: false, unread_count: -1 }, items: [], nextCursor: null }));
  assert.throws(() => conversationPageDto({ items: [], unreadCount: -1, nextCursor: null }));
});

test('retry uses the same attempt key and read acknowledges only the supplied message cursor', async () => {
  const calls = [];
  const client = { rpc: async (name, args) => { calls.push({ name, args }); return { data: name === 'send_direct_message' ? rawMessage : null, error: null }; } };
  const send = parseMessageAction({ action: 'send', conversationId, key, body: rawMessage.body });
  const first = await mutateMessages(client, send);
  assert.deepEqual(await mutateMessages(client, send), first);
  assert.deepEqual(calls[0], calls[1]);
  assert.deepEqual(calls[0].args, { p_conversation: conversationId, p_key: key, p_body: rawMessage.body });
  assert.deepEqual(await mutateMessages(client, { action: 'read', conversationId, throughId: messageId }), { saved: true });
  assert.deepEqual(calls[2], { name: 'mark_direct_messages_read', args: { p_conversation: conversationId, p_through: messageId } });
  assert.throws(() => messageFailure({ code: '42501', message: 'secret backend detail' }), error => error.status === 403 && !error.message.includes('secret'));
  assert.throws(() => messageFailure({ code: 'P0409' }), error => error.status === 409);
  assert.throws(() => messageFailure({ code: 'P0429' }), error => error.status === 429);
});

test('messages are off until explicitly enabled by the server operator', () => {
  const old = process.env.PICO_DIRECT_MESSAGES_ENABLED;
  try {
    delete process.env.PICO_DIRECT_MESSAGES_ENABLED;
    assert.equal(directMessagesEnabled(), false);
    process.env.PICO_DIRECT_MESSAGES_ENABLED = 'false';
    assert.equal(directMessagesEnabled(), false);
    process.env.PICO_DIRECT_MESSAGES_ENABLED = 'true';
    assert.equal(directMessagesEnabled(), true);
  } finally {
    if (old === undefined) delete process.env.PICO_DIRECT_MESSAGES_ENABLED;
    else process.env.PICO_DIRECT_MESSAGES_ENABLED = old;
  }
});
