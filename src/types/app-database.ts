import type { Database as HostedDatabase, Json } from './database';

// The generated contract remains the source of truth for the hosted primary
// database. These functions belong to the pending local social-safety migration
// and can be removed after that migration is applied and `npm run db:types`
// regenerates the canonical contract.
type PendingSocialSafetyFunctions = {
  read_connection_state: {
    Args: { p_player: string };
    Returns: Json;
  };
  report_direct_message: {
    Args: { p_details: string; p_message: string; p_reason: string };
    Returns: string;
  };
};

export type Database = Omit<HostedDatabase, 'public'> & {
  public: Omit<HostedDatabase['public'], 'Functions'> & {
    Functions: HostedDatabase['public']['Functions'] & PendingSocialSafetyFunctions;
  };
};
