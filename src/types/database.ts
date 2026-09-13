export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_deletions: {
        Row: {
          player_id: string
          requested_at: string
        }
        Insert: {
          player_id: string
          requested_at?: string
        }
        Update: {
          player_id?: string
          requested_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_members: {
        Row: {
          arena_id: string
          created_at: string
          player_id: string
          status: string
        }
        Insert: {
          arena_id: string
          created_at?: string
          player_id?: string
          status?: string
        }
        Update: {
          arena_id?: string
          created_at?: string
          player_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_members_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arena_members_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_requests: {
        Row: {
          arena_id: string | null
          city: string
          created_at: string
          details: string
          id: string
          kind: string
          name: string
          neighborhood: string
          requester_id: string
          reviewed_at: string | null
          status: string
        }
        Insert: {
          arena_id?: string | null
          city: string
          created_at?: string
          details: string
          id?: string
          kind: string
          name: string
          neighborhood: string
          requester_id?: string
          reviewed_at?: string | null
          status?: string
        }
        Update: {
          arena_id?: string | null
          city?: string
          created_at?: string
          details?: string
          id?: string
          kind?: string
          name?: string
          neighborhood?: string
          requester_id?: string
          reviewed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_requests_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arena_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_sports: {
        Row: {
          arena_id: string
          enabled: boolean
          sport_id: string
        }
        Insert: {
          arena_id: string
          enabled?: boolean
          sport_id: string
        }
        Update: {
          arena_id?: string
          enabled?: boolean
          sport_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_sports_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arena_sports_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_staff: {
        Row: {
          arena_id: string
          player_id: string
          role: string
        }
        Insert: {
          arena_id: string
          player_id: string
          role: string
        }
        Update: {
          arena_id?: string
          player_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_staff_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arena_staff_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      arenas: {
        Row: {
          avatar_path: string | null
          city: string
          cover_path: string | null
          created_at: string
          description: string
          id: string
          image_path: string | null
          is_demo: boolean
          is_public: boolean
          name: string
          neighborhood: string
          owner_id: string | null
          public_info: string
          slug: string
          status: string
          version: number
        }
        Insert: {
          avatar_path?: string | null
          city: string
          cover_path?: string | null
          created_at?: string
          description?: string
          id?: string
          image_path?: string | null
          is_demo?: boolean
          is_public?: boolean
          name: string
          neighborhood: string
          owner_id?: string | null
          public_info?: string
          slug: string
          status?: string
          version?: number
        }
        Update: {
          avatar_path?: string | null
          city?: string
          cover_path?: string | null
          created_at?: string
          description?: string
          id?: string
          image_path?: string | null
          is_demo?: boolean
          is_public?: boolean
          name?: string
          neighborhood?: string
          owner_id?: string | null
          public_info?: string
          slug?: string
          status?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "arena_avatar_asset"
            columns: ["avatar_path"]
            isOneToOne: false
            referencedRelation: "entity_media_assets"
            referencedColumns: ["path"]
          },
          {
            foreignKeyName: "arena_cover_asset"
            columns: ["cover_path"]
            isOneToOne: false
            referencedRelation: "entity_media_assets"
            referencedColumns: ["path"]
          },
          {
            foreignKeyName: "arenas_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocked_name: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocked_name?: string
          blocker_id?: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocked_name?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          arena_id: string
          ended_at: string | null
          expires_at: string
          id: string
          player_id: string
          sport_id: string
          started_at: string
        }
        Insert: {
          arena_id: string
          ended_at?: string | null
          expires_at: string
          id?: string
          player_id: string
          sport_id: string
          started_at?: string
        }
        Update: {
          arena_id?: string
          ended_at?: string | null
          expires_at?: string
          id?: string
          player_id?: string
          sport_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_arena_id_sport_id_fkey"
            columns: ["arena_id", "sport_id"]
            isOneToOne: false
            referencedRelation: "arena_sports"
            referencedColumns: ["arena_id", "sport_id"]
          },
          {
            foreignKeyName: "checkins_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          moderated_at: string | null
          post_id: string
        }
        Insert: {
          author_id?: string
          body: string
          created_at?: string
          id?: string
          moderated_at?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          moderated_at?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          avatar_path: string | null
          cover_path: string | null
          created_at: string
          description: string
          entry_mode: string
          id: string
          name: string
          owner_id: string | null
          rules: string
          slug: string
          status: string
          version: number
          visibility: string
        }
        Insert: {
          avatar_path?: string | null
          cover_path?: string | null
          created_at?: string
          description?: string
          entry_mode: string
          id?: string
          name: string
          owner_id?: string | null
          rules?: string
          slug: string
          status?: string
          version?: number
          visibility: string
        }
        Update: {
          avatar_path?: string | null
          cover_path?: string | null
          created_at?: string
          description?: string
          entry_mode?: string
          id?: string
          name?: string
          owner_id?: string | null
          rules?: string
          slug?: string
          status?: string
          version?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_avatar_asset"
            columns: ["avatar_path"]
            isOneToOne: false
            referencedRelation: "entity_media_assets"
            referencedColumns: ["path"]
          },
          {
            foreignKeyName: "community_cover_asset"
            columns: ["cover_path"]
            isOneToOne: false
            referencedRelation: "entity_media_assets"
            referencedColumns: ["path"]
          },
        ]
      }
      community_arena_links: {
        Row: {
          arena_id: string
          community_id: string
          is_official: boolean
          requested_by: string | null
          status: string
        }
        Insert: {
          arena_id: string
          community_id: string
          is_official?: boolean
          requested_by?: string | null
          status?: string
        }
        Update: {
          arena_id?: string
          community_id?: string
          is_official?: boolean
          requested_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_arena_links_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_arena_links_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: true
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_arena_links_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          created_at: string
          player_id: string
          role: string
          status: string
        }
        Insert: {
          community_id: string
          created_at?: string
          player_id: string
          role?: string
          status: string
        }
        Update: {
          community_id?: string
          created_at?: string
          player_id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_sports: {
        Row: {
          community_id: string
          sport_id: string
        }
        Insert: {
          community_id: string
          sport_id: string
        }
        Update: {
          community_id?: string
          sport_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_sports_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_sports_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id?: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_media_assets: {
        Row: {
          arena_id: string | null
          community_id: string | null
          created_at: string
          deleting: boolean
          path: string
          ready: boolean
          slot: string
          uploaded_by: string | null
        }
        Insert: {
          arena_id?: string | null
          community_id?: string | null
          created_at?: string
          deleting?: boolean
          path: string
          ready?: boolean
          slot: string
          uploaded_by?: string | null
        }
        Update: {
          arena_id?: string | null
          community_id?: string | null
          created_at?: string
          deleting?: boolean
          path?: string
          ready?: boolean
          slot?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_media_assets_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_media_assets_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_media_assets_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          bucket: string
          created_at: string
          deleting: boolean
          path: string
          player_id: string
          ready: boolean
        }
        Insert: {
          bucket: string
          created_at?: string
          deleting?: boolean
          path: string
          player_id: string
          ready?: boolean
        }
        Update: {
          bucket?: string
          created_at?: string
          deleting?: boolean
          path?: string
          player_id?: string
          ready?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      played_games: {
        Row: {
          arena_id: string
          created_at: string
          id: string
          played_on: string
          player_id: string
          sport_id: string
          updated_at: string
          version: number
        }
        Insert: {
          arena_id: string
          created_at?: string
          id: string
          played_on: string
          player_id: string
          sport_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          arena_id?: string
          created_at?: string
          id?: string
          played_on?: string
          player_id?: string
          sport_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "played_games_arena_id_sport_id_fkey"
            columns: ["arena_id", "sport_id"]
            isOneToOne: false
            referencedRelation: "arena_sports"
            referencedColumns: ["arena_id", "sport_id"]
          },
          {
            foreignKeyName: "played_games_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_sports: {
        Row: {
          is_primary: boolean
          level: Database["public"]["Enums"]["player_level"]
          player_id: string
          sport_id: string
        }
        Insert: {
          is_primary?: boolean
          level?: Database["public"]["Enums"]["player_level"]
          player_id?: string
          sport_id: string
        }
        Update: {
          is_primary?: boolean
          level?: Database["public"]["Enums"]["player_level"]
          player_id?: string
          sport_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_sports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_sports_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      post_destinations: {
        Row: {
          arena_id: string | null
          community_id: string | null
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          arena_id?: string | null
          community_id?: string | null
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          arena_id?: string | null
          community_id?: string | null
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_destinations_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_destinations_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_destinations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_game_context: {
        Row: {
          played_on: string
          post_id: string
        }
        Insert: {
          played_on: string
          post_id: string
        }
        Update: {
          played_on?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_game_context_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          player_id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          player_id?: string
          post_id: string
        }
        Update: {
          created_at?: string
          player_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reposts: {
        Row: {
          created_at: string
          player_id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          player_id: string
          post_id: string
        }
        Update: {
          created_at?: string
          player_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reposts_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reposts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          arena_id: string | null
          audience: string
          author_id: string
          body: string
          created_at: string
          distribution_explicit: boolean
          id: string
          idempotency_key: string | null
          image_path: string | null
          moderated_at: string | null
          private_community_id: string | null
          request_digest: string | null
          sport_id: string | null
        }
        Insert: {
          arena_id?: string | null
          audience?: string
          author_id?: string
          body: string
          created_at?: string
          distribution_explicit?: boolean
          id?: string
          idempotency_key?: string | null
          image_path?: string | null
          moderated_at?: string | null
          private_community_id?: string | null
          request_digest?: string | null
          sport_id?: string | null
        }
        Update: {
          arena_id?: string | null
          audience?: string
          author_id?: string
          body?: string
          created_at?: string
          distribution_explicit?: boolean
          id?: string
          idempotency_key?: string | null
          image_path?: string | null
          moderated_at?: string | null
          private_community_id?: string | null
          request_digest?: string | null
          sport_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_image_asset"
            columns: ["image_path"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["path"]
          },
          {
            foreignKeyName: "posts_arena_id_sport_id_fkey"
            columns: ["arena_id", "sport_id"]
            isOneToOne: false
            referencedRelation: "arena_sports"
            referencedColumns: ["arena_id", "sport_id"]
          },
          {
            foreignKeyName: "posts_arena_optional"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_private_community_id_fkey"
            columns: ["private_community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_sport_optional"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          available: boolean
          avatar_path: string | null
          bio: string
          city: string
          created_at: string
          display_name: string
          id: string
          is_demo: boolean
          neighborhood: string
          onboarding_completed: boolean
          share_activity_summary: boolean
          username: string
        }
        Insert: {
          available?: boolean
          avatar_path?: string | null
          bio?: string
          city?: string
          created_at?: string
          display_name: string
          id: string
          is_demo?: boolean
          neighborhood?: string
          onboarding_completed?: boolean
          share_activity_summary?: boolean
          username: string
        }
        Update: {
          available?: boolean
          avatar_path?: string | null
          bio?: string
          city?: string
          created_at?: string
          display_name?: string
          id?: string
          is_demo?: boolean
          neighborhood?: string
          onboarding_completed?: boolean
          share_activity_summary?: boolean
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_avatar_asset"
            columns: ["avatar_path"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["path"]
          },
        ]
      }
      reports: {
        Row: {
          comment_id: string | null
          created_at: string
          details: string
          id: string
          player_id: string | null
          post_id: string | null
          reason: string
          reporter_id: string
          reviewed_at: string | null
          status: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          details?: string
          id?: string
          player_id?: string | null
          post_id?: string | null
          reason: string
          reporter_id?: string
          reviewed_at?: string | null
          status?: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          details?: string
          id?: string
          player_id?: string | null
          post_id?: string | null
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sports: {
        Row: {
          id: string
          name: string
          slug: Database["public"]["Enums"]["sport_slug"]
        }
        Insert: {
          id?: string
          name: string
          slug: Database["public"]["Enums"]["sport_slug"]
        }
        Update: {
          id?: string
          name?: string
          slug?: Database["public"]["Enums"]["sport_slug"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_arena_invite: { Args: { p_token: string }; Returns: string }
      accept_beta_invite: { Args: { p_token: string }; Returns: Json }
      accept_community_invite: { Args: { p_token: string }; Returns: string }
      activity_summary: { Args: { p_player: string }; Returns: Json }
      arena_invitations: { Args: { p_arena: string }; Returns: Json }
      arena_link_requests: { Args: { p_arena: string }; Returns: Json }
      arena_profile: { Args: { p_slug: string }; Returns: Json }
      beta_before_user_created: { Args: { event: Json }; Returns: Json }
      beta_status: { Args: never; Returns: Json }
      bootstrap_operator: { Args: { p_uid: string }; Returns: undefined }
      can_read_entity_media: { Args: { p_path: string }; Returns: boolean }
      can_read_media: {
        Args: { p_bucket: string; p_path: string }
        Returns: boolean
      }
      claim_entity_media: { Args: { p_path: string }; Returns: undefined }
      claim_unused_media: {
        Args: { p_bucket: string; p_path: string }
        Returns: undefined
      }
      community_directory: {
        Args: {
          p_arena?: string
          p_mine?: boolean
          p_offset?: number
          p_search?: string
        }
        Returns: Json
      }
      community_invitations: {
        Args: { p_id: string; p_revoke?: string }
        Returns: Json
      }
      community_link: {
        Args: {
          p_action: string
          p_arena: string
          p_community: string
          p_official?: boolean
        }
        Returns: undefined
      }
      community_membership: {
        Args: {
          p_action: string
          p_id: string
          p_role?: string
          p_target?: string
        }
        Returns: undefined
      }
      community_page: { Args: { p_slug: string }; Returns: Json }
      create_community: { Args: { p_data: Json }; Returns: Json }
      create_official_community: { Args: { p_arena: string }; Returns: string }
      delete_played_game: { Args: { p_id: string }; Returns: undefined }
      discover_common_players: { Args: { p_offset?: number }; Returns: Json }
      discover_players: {
        Args: {
          p_active?: boolean
          p_arena_id?: string
          p_level?: Database["public"]["Enums"]["player_level"]
          p_offset?: number
          p_sport_id?: string
        }
        Returns: {
          arena_name: string
          arena_slug: string
          available: boolean
          bio: string
          city: string
          connected: boolean
          display_name: string
          expires_at: string
          id: string
          is_demo: boolean
          level: Database["public"]["Enums"]["player_level"]
          neighborhood: string
          sport_name: string
          sport_slug: Database["public"]["Enums"]["sport_slug"]
          username: string
        }[]
      }
      end_checkin: { Args: never; Returns: undefined }
      ensure_pico_membership: { Args: never; Returns: undefined }
      environment_identity: { Args: never; Returns: Json }
      erase_account_private_data: {
        Args: { p_user: string }
        Returns: undefined
      }
      export_account_data: { Args: { p_user: string }; Returns: Json }
      invite_arena_manager: {
        Args: { p_arena: string; p_email: string; p_role: string }
        Returns: Json
      }
      invite_community_member: {
        Args: { p_email: string; p_id: string }
        Returns: Json
      }
      management_context: { Args: never; Returns: Json }
      moderate_report: {
        Args: { p_action: string; p_report: string }
        Returns: undefined
      }
      operator_action: {
        Args: {
          p_action: string
          p_scope_id?: string
          p_target_id?: string
          p_value?: string
        }
        Returns: Json
      }
      operator_catalog: { Args: never; Returns: Json }
      operator_read: {
        Args: { p_context: string; p_scope_id?: string }
        Returns: Json
      }
      operator_resource_action: {
        Args: {
          p_action: string
          p_id: string
          p_kind: string
          p_target?: string
        }
        Returns: undefined
      }
      pico_welcome: { Args: { p_acknowledge?: boolean }; Returns: Json }
      profile_places: { Args: { p_player?: string }; Returns: Json }
      publication_options: { Args: never; Returns: Json }
      publish_post: {
        Args: {
          p_arena?: string
          p_audience?: string
          p_body: string
          p_groups?: string[]
          p_image_path?: string
          p_key: string
          p_sport?: string
          p_wall_arena?: string
        }
        Returns: string
      }
      read_checkin_history: { Args: { p_offset?: number }; Returns: Json }
      read_feed: {
        Args: { p_arena_id?: string; p_offset?: number }
        Returns: {
          arena_id: string
          arena_is_demo: boolean
          arena_name: string
          arena_slug: string
          author_id: string
          body: string
          comment_count: number
          created_at: string
          display_name: string
          id: string
          like_count: number
          liked: boolean
          sport_id: string
          sport_name: string
          sport_slug: Database["public"]["Enums"]["sport_slug"]
          username: string
        }[]
      }
      read_played_games: { Args: { p_offset?: number }; Returns: Json }
      read_repost_feed: {
        Args: {
          p_arena?: string
          p_author?: string
          p_community?: string
          p_offset?: number
          p_post?: string
        }
        Returns: Json
      }
      read_retired_checkins: { Args: { p_offset?: number }; Returns: Json }
      read_social_feed: {
        Args: {
          p_arena?: string
          p_author?: string
          p_community?: string
          p_offset?: number
          p_post?: string
        }
        Returns: Json
      }
      remove_distribution: {
        Args: { p_arena?: string; p_community?: string; p_post: string }
        Returns: undefined
      }
      report_media: { Args: { p_report: string }; Returns: string }
      request_arena: {
        Args: { p_arena?: string; p_data?: Json; p_kind: string }
        Returns: string
      }
      reserve_entity_media: {
        Args: { p_id: string; p_kind: string; p_slot: string }
        Returns: string
      }
      reserve_media: { Args: { p_bucket: string }; Returns: string }
      review_arena_and_group: {
        Args: { p_approve: boolean; p_official?: boolean; p_request: string }
        Returns: string
      }
      review_arena_request: {
        Args: { p_approve: boolean; p_request: string }
        Returns: string
      }
      revoke_arena_invite: { Args: { p_id: string }; Returns: undefined }
      save_arena: {
        Args: { p_data: Json; p_id: string; p_version: number }
        Returns: Json
      }
      save_community: {
        Args: { p_data: Json; p_id: string; p_version: number }
        Returns: undefined
      }
      save_played_game: {
        Args: {
          p_arena: string
          p_id: string
          p_played_on: string
          p_sport: string
          p_version?: number
        }
        Returns: string
      }
      save_profile: {
        Args: {
          p_available: boolean
          p_bio: string
          p_city: string
          p_level: Database["public"]["Enums"]["player_level"]
          p_name: string
          p_neighborhood: string
          p_sport_id: string
          p_username: string
        }
        Returns: undefined
      }
      set_arena_membership: {
        Args: { p_arena: string; p_join: boolean }
        Returns: undefined
      }
      set_entity_photo: {
        Args: { p_id: string; p_kind: string; p_path?: string; p_slot: string }
        Returns: undefined
      }
      set_post_repost: {
        Args: { p_post: string; p_reposted: boolean }
        Returns: boolean
      }
      share_played_game: {
        Args: {
          p_audience?: string
          p_body?: string
          p_groups?: string[]
          p_id: string
          p_image_path?: string
          p_key: string
          p_version: number
          p_wall_arena?: string
        }
        Returns: string
      }
      start_checkin: {
        Args: { arena_id: string; sport_id: string }
        Returns: string
      }
    }
    Enums: {
      player_level: "Iniciante" | "Intermediário" | "Avançado"
      sport_slug: "futevolei" | "beach-tennis" | "volei-praia"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      player_level: ["Iniciante", "Intermediário", "Avançado"],
      sport_slug: ["futevolei", "beach-tennis", "volei-praia"],
    },
  },
} as const
