export type CommunityNotification = {
  id: string;
  kind: 'community_join' | 'post_mention' | 'community_mention_all';
  post_id: string | null;
  created_at: string;
  read_at: string | null;
  actor_name: string;
  actor_avatar_path: string | null;
  community_name: string;
  community_slug: string;
};
export type NotificationPage = {
  items: CommunityNotification[];
  unreadCount: number;
  nextCursor: string | null;
};
