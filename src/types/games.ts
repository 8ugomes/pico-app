import type { SportId } from './social';
export type PlayedGame = {
  id: string; arena_id: string; arena_slug: string; arena_name: string; is_demo: boolean;
  sport_id: string; sport_name: string; sport_slug: SportId; played_on: string;
  created_at: string; updated_at: string; version: number;
};
