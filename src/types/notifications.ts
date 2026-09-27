type NotificationBase = {
  id: string;
  created_at: string;
  read_at: string | null;
  actor_id: string;
  actor_name: string;
  actor_username: string;
  actor_avatar_path: string | null;
  recipient_follows_actor: boolean;
};

export type CommunityNotification = NotificationBase & (
  | {
    kind: 'community_join';
    post_id: null;
    community_name: string;
    community_slug: string;
  }
  | {
    kind: 'post_mention' | 'community_mention_all';
    post_id: string;
    community_name: string;
    community_slug: string;
  }
  | {
    kind: 'new_follower';
    post_id: null;
    community_name: null;
    community_slug: null;
  }
);

export type NotificationItem = CommunityNotification;

export type NotificationPage = {
  items: NotificationItem[];
  unreadCount: number;
  nextCursor: string | null;
};
