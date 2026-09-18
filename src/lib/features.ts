// Enable only after the additive migration and connected checks have completed.
// Server-owned: clients cannot enable a feature with a query or request body.
export function directMessagesEnabled() {
  return process.env.PICO_DIRECT_MESSAGES_ENABLED === 'true';
}
