import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/app-database';
import type { ConversationPage, DirectMessage, MessagePage, MessagePeer } from '../../types/messages';
import { exactKeys, MutationError, uuid, textField } from './mutations.ts';

export type MessageAction =
  | { action: 'open'; playerId: string }
  | { action: 'send'; conversationId: string; key: string; body: string }
  | { action: 'read'; conversationId: string; throughId: string };

export function parseMessageAction(body: Record<string, unknown>): MessageAction {
  if (body.action === 'open') {
    exactKeys(body, ['action', 'playerId']);
    return { action: 'open', playerId: uuid(body.playerId) };
  }
  if (body.action === 'send') {
    exactKeys(body, ['action', 'conversationId', 'key', 'body']);
    const content = textField(body.body, 1, 2000);
    if (content.includes('\0')) throw new MutationError(400, 'Confira o texto da mensagem.');
    return { action: 'send', conversationId: uuid(body.conversationId), key: uuid(body.key), body: content };
  }
  if (body.action === 'read') {
    exactKeys(body, ['action', 'conversationId', 'throughId']);
    return { action: 'read', conversationId: uuid(body.conversationId), throughId: uuid(body.throughId) };
  }
  throw new MutationError(400, 'Ação inválida.');
}

export function parseMessageQuery(url: string) {
  const query = new URL(url).searchParams;
  if ([...query.keys()].some(key => !['conversation', 'before'].includes(key)) || ['conversation', 'before'].some(key => query.getAll(key).length > 1)) {
    throw new MutationError(400, 'Consulta inválida.');
  }
  return {
    conversation: query.has('conversation') ? uuid(query.get('conversation')) : undefined,
    before: query.has('before') ? uuid(query.get('before')) : undefined,
  };
}

type Row = Record<string, unknown>;
function row(value: unknown): Row {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid message response');
  return value as Row;
}
function string(value: unknown) {
  if (typeof value !== 'string') throw new Error('Invalid message response');
  return value;
}
function count(value: unknown) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Invalid message count');
  return value;
}
function peer(value: unknown): MessagePeer {
  const data = row(value);
  const path = data.avatar_path;
  return {
    id: string(data.id), username: string(data.username), name: string(data.display_name),
    avatar: typeof path === 'string' ? `/api/media?bucket=avatars&path=${encodeURIComponent(path)}` : null,
  };
}
export function messageDto(value: unknown, conversationId?: string): DirectMessage {
  const data = row(value);
  return { id: string(data.id), conversationId: string(data.conversation_id ?? conversationId), senderId: string(data.sender_id), body: string(data.body), createdAt: string(data.created_at) };
}
function items(data: Row): unknown[] {
  if (!Array.isArray(data.items)) throw new Error('Invalid message response');
  return data.items;
}
function cursor(data: Row): string | null { return data.nextCursor === null ? null : string(data.nextCursor); }
export function conversationPageDto(value: unknown): ConversationPage {
  const data = row(value);
  return {
    items: items(data).map(value => {
      const item = row(value); const id = string(item.id);
      return { id, peer: peer(item.peer), lastMessage: item.last_message ? messageDto(item.last_message, id) : null, unreadCount: count(item.unread_count) };
    }),
    nextCursor: cursor(data), unreadCount: count(data.unreadCount),
  };
}
export function messagePageDto(value: unknown): MessagePage {
  const data = row(value); const conversation = row(data.conversation);
  if (typeof conversation.can_send !== 'boolean') throw new Error('Invalid conversation response');
  return {
    conversation: {
      id: string(conversation.id), peer: peer(conversation.peer), canSend: conversation.can_send,
      unreadCount: count(conversation.unread_count),
    },
    items: items(data).map(value => messageDto(value)), nextCursor: cursor(data),
  };
}
export function messageFailure(error: { code?: string }): never {
  if (error.code === '42501') throw new MutationError(403, 'Conversa indisponível. Para enviar, vocês precisam se acompanhar e ter contas ativas.');
  if (error.code === 'P0409') throw new MutationError(409, 'Essa tentativa já foi recebida com outro texto. Confira a conversa antes de enviar novamente.');
  if (error.code === 'P0429') throw new MutationError(429, 'Muitas mensagens em pouco tempo. Aguarde um momento para continuar.');
  if (['23514', '22P02', '22023', '23502'].includes(error.code ?? '')) throw new MutationError(400, 'Confira a mensagem e tente novamente.');
  throw new MutationError(503, 'Não foi possível confirmar agora. Seu texto foi preservado; confira a conversa e tente novamente.');
}

export async function readMessages(client: SupabaseClient<Database>, query: ReturnType<typeof parseMessageQuery>) {
  if (query.conversation) {
    const result = await client.rpc('read_direct_messages', { p_conversation: query.conversation, p_before: query.before });
    if (result.error) messageFailure(result.error);
    return messagePageDto(result.data);
  }
  const result = await client.rpc('read_direct_conversations', { p_before: query.before });
  if (result.error) messageFailure(result.error);
  return conversationPageDto(result.data);
}
export async function mutateMessages(client: SupabaseClient<Database>, input: MessageAction) {
  if (input.action === 'open') {
    const result = await client.rpc('open_direct_conversation', { p_player: input.playerId });
    if (result.error) messageFailure(result.error);
    return { id: string(row(result.data).id) };
  }
  if (input.action === 'send') {
    const result = await client.rpc('send_direct_message', { p_conversation: input.conversationId, p_key: input.key, p_body: input.body });
    if (result.error) messageFailure(result.error);
    return messageDto(result.data);
  }
  const result = await client.rpc('mark_direct_messages_read', { p_conversation: input.conversationId, p_through: input.throughId });
  if (result.error) messageFailure(result.error);
  return { saved: true };
}
