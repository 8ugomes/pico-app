export type CommunityNotification = {
  id: string;
  kind: 'community_join';
  created_at: string;
  read_at: string | null;
  actor_name: string;
  community_name: string;
  community_slug: string;
};
export type NotificationPage = {
  items: CommunityNotification[];
  unreadCount: number;
  nextCursor: string | null;
};
