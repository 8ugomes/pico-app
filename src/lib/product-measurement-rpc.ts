type RpcError = { code?: string } | null;
type RpcResponse = { data?: unknown; error?: RpcError; status?: number };

export type MeasurementWriteOutcome = {
  recorded: boolean;
  operationalFailure: boolean;
  markerFailed: boolean;
};

export async function executeMeasurementWrite(
  record: () => PromiseLike<RpcResponse>,
  markFailure: () => PromiseLike<RpcResponse>,
): Promise<MeasurementWriteOutcome> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await record();
      if (!result.error) {
        return { recorded: result.data === true, operationalFailure: false, markerFailed: false };
      }
      // A validated event can become unavailable between the product read and
      // this optional edge (for example, an invitation is revoked). That is a
      // domain rejection, not evidence that the ingestion source is unhealthy.
      if (result.error.code === '23514') {
        return { recorded: false, operationalFailure: false, markerFailed: false };
      }
      if ((result.status ?? 0) < 500) break;
    } catch {
      // One idempotent retry covers a response lost after the database commit.
    }
  }

  let markerFailed = false;
  try {
    const marker = await markFailure();
    markerFailed = Boolean(marker.error);
  } catch { markerFailed = true; }
  return { recorded: false, operationalFailure: true, markerFailed };
}
