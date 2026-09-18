// Preserve the hosted contract; the additive RPC overlay is generated from the
// local migration catalog until the authorized hosted migration/type refresh.
import type { Database as HostedDatabase } from './database';
import type { PendingFunctions } from './pending-functions';
export type Database = HostedDatabase & { public: { Functions: PendingFunctions } };
