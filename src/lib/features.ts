// Enable only after the additive migration and connected checks have completed.
// Server-owned: clients cannot enable a feature with a query or request body.
export function directMessagesEnabled() {
  return process.env.PICO_DIRECT_MESSAGES_ENABLED === 'true';
}

// Collection also requires the private database gate, an approved retention and
// a current request-edge lease. When this flag is off the event helper reports
// only that fixed operational state; it sends no player or request identifier.
export function productMeasurementEnabled() {
  return process.env.PICO_PRODUCT_MEASUREMENT_ENABLED === 'true';
}
