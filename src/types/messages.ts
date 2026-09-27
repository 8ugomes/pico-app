export type MessagePeer = { id: string; username: string; name: string; avatar: string | null };
export type DirectMessage = { id: string; conversationId: string; senderId: string; body: string; createdAt: string };
export type ConversationItem = { id: string; peer: MessagePeer; lastMessage: DirectMessage | null; unreadCount: number };
export type ConversationPage = { items: ConversationItem[]; nextCursor: string | null; unreadCount: number };
export type MessagePage = { conversation: { id: string; peer: MessagePeer; canSend: boolean; unreadCount: number }; items: DirectMessage[]; nextCursor: string | null };
