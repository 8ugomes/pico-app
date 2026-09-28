import type { Database as HostedDatabase, Json } from './database';

// The generated contract remains the source of truth for the hosted primary
// database. These functions belong to the pending local social-safety migration
// and can be removed after that migration is applied and `npm run db:types`
// regenerates the canonical contract.
type PendingFunctions = {
  read_connection_state: {
    Args: { p_player: string };
    Returns: Json;
  };
  report_direct_message: {
    Args: { p_details: string; p_message: string; p_reason: string };
    Returns: string;
  };
  record_product_event: {
    Args: {
      p_actor: string;
      p_context_id?: string;
      p_context_type?: string;
      p_event_type: string;
      p_release: string;
    };
    Returns: boolean;
  };
  heartbeat_product_measurement_edge: {
    Args: { p_collecting: boolean; p_protocol: number; p_release: string };
    Returns: boolean;
  };
  mark_product_measurement_edge_failure: {
    Args: never;
    Returns: undefined;
  };
  preview_scope_invitation: {
    Args: { p_kind: string; p_token: string };
    Returns: string;
  };
  export_product_measurement: {
    Args: { p_user: string };
    Returns: Json;
  };
  invite_arena_player: {
    Args: { p_arena: string; p_role: string; p_username: string };
    Returns: Json;
  };
  accept_arena_player_invite: {
    Args: { p_token: string };
    Returns: string;
  };
  invite_community_player: {
    Args: { p_id: string; p_username: string };
    Returns: Json;
  };
  accept_community_player_invite: {
    Args: { p_token: string };
    Returns: string;
  };
};

export type Database = Omit<HostedDatabase, 'public'> & {
  public: Omit<HostedDatabase['public'], 'Functions'> & {
    Functions: HostedDatabase['public']['Functions'] & PendingFunctions;
  };
};
