// Fixed technical fields only: never serialize exceptions, requests, identifiers,
// query strings, content, credentials or location/activity information.
export function operationFailure(status:number,known:boolean){console.warn(JSON.stringify({event:'request_failed',requestId:crypto.randomUUID(),version:process.env.NEXT_PUBLIC_PICO_VERSION||'unknown',status,kind:known?'handled':'unexpected'}))}
