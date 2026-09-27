import { operationFailure } from '../operations.ts';

export const MOBILE_API_VERSION = '1';
export const MOBILE_CLIENT_VERSION = '1.0.0';
export const MOBILE_MINIMUM_VERSION = '1.0.0';
export const MOBILE_NATIVE_ORIGIN = 'capacitor://localhost';

const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const BEARER_PATTERN = /^Bearer ([^\s,]+)$/;

type MobileRequestOptions = {
  requireAuth?: boolean;
  environment?: NodeJS.ProcessEnv;
};

export class MobileRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message);
    this.name = 'MobileRequestError';
    this.status = status;
    this.code = code;
  }
}

function parseVersion(value: string) {
  const match = VERSION_PATTERN.exec(value);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])] as const;
}

function isOlderVersion(candidate: readonly number[], minimum: readonly number[]) {
  for (let index = 0; index < 3; index += 1) {
    if (candidate[index] < minimum[index]) return true;
    if (candidate[index] > minimum[index]) return false;
  }
  return false;
}

function allowedOrigins(environment: NodeJS.ProcessEnv) {
  const configured = environment.PICO_MOBILE_ALLOWED_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];
  return new Set([MOBILE_NATIVE_ORIGIN, ...configured]);
}

export function mobileCorsHeaders(origin: string | null, environment = process.env) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Idempotency-Key, X-Pico-Client-Version',
    'Access-Control-Allow-Methods': 'DELETE, GET, OPTIONS, POST, PUT',
    'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Length, Content-Range, X-Pico-Api-Version, X-Pico-Request-Id',
    'Access-Control-Max-Age': '600',
    'Cache-Control': 'private, no-store, max-age=0',
    Vary: 'Origin, Authorization',
    'X-Content-Type-Options': 'nosniff',
    'X-Pico-Api-Version': MOBILE_API_VERSION,
  };

  if (origin && allowedOrigins(environment).has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

export function validateMobileRequest(request: Request, options: MobileRequestOptions = {}) {
  const environment = options.environment ?? process.env;
  const origin = request.headers.get('origin');
  if (!origin || !allowedOrigins(environment).has(origin)) {
    throw new MobileRequestError(403, 'origin_not_allowed', 'Abra o app do Pico para continuar.');
  }
  if (request.headers.has('cookie')) {
    throw new MobileRequestError(400, 'ambiguous_credentials', 'O app não aceita sessão de navegador.');
  }

  const clientVersion = request.headers.get('x-pico-client-version')?.trim() ?? '';
  const parsedClientVersion = parseVersion(clientVersion);
  if (!parsedClientVersion) {
    throw new MobileRequestError(400, 'invalid_client_version', 'Não foi possível identificar esta versão do app.');
  }
  const minimumVersion = environment.PICO_MOBILE_MINIMUM_VERSION?.trim() || MOBILE_MINIMUM_VERSION;
  const parsedMinimumVersion = parseVersion(minimumVersion);
  if (!parsedMinimumVersion) {
    throw new Error('PICO_MOBILE_MINIMUM_VERSION precisa usar o formato x.y.z.');
  }
  if (isOlderVersion(parsedClientVersion, parsedMinimumVersion)) {
    throw new MobileRequestError(426, 'upgrade_required', 'Atualize o Pico Social para continuar.');
  }

  const authorization = request.headers.get('authorization');
  const bearer = authorization ? BEARER_PATTERN.exec(authorization) : null;
  const requireAuth = options.requireAuth ?? true;
  if (requireAuth && !bearer) {
    throw new MobileRequestError(401, 'authentication_required', 'Entre novamente para continuar.');
  }
  if (authorization && !bearer) {
    throw new MobileRequestError(401, 'invalid_authorization', 'Entre novamente para continuar.');
  }

  return {
    accessToken: bearer?.[1] ?? null,
    clientVersion,
    origin,
  };
}

export function mobileOptions(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || !allowedOrigins(process.env).has(origin)) {
    return new Response(null, { status: 403, headers: mobileCorsHeaders(origin) });
  }
  return new Response(null, { status: 204, headers: mobileCorsHeaders(origin) });
}

export async function readMobileJson(request: Request, limit = 16_384) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    throw new MobileRequestError(415, 'invalid_content_type', 'Envie os dados do app como JSON.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new MobileRequestError(400, 'invalid_body', 'O envio está vazio.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new MobileRequestError(413, 'body_too_large', 'O conteúdo enviado é muito grande.');
    }
    chunks.push(chunk.value);
  }
  try {
    const body: unknown = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch {
    throw new MobileRequestError(400, 'invalid_json', 'Confira os dados e tente de novo.');
  }
}

export function mobileJson(
  request: Request,
  body: unknown,
  init: { status?: number; headers?: HeadersInit; requestId?: string } = {},
) {
  const requestId = init.requestId ?? crypto.randomUUID();
  const headers = new Headers(mobileCorsHeaders(request.headers.get('origin')));
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  headers.set('X-Pico-Request-Id', requestId);
  const responseBody = body && typeof body === 'object' && !Array.isArray(body)
    ? { ...body, requestId }
    : body;
  return Response.json(responseBody, { status: init.status, headers });
}

export function mobileError(request: Request, error: unknown) {
  const known = error instanceof MobileRequestError;
  const status = known ? error.status : 503;
  const requestId = crypto.randomUUID();
  operationFailure(status, known, requestId);
  const response = mobileJson(
    request,
    {
      error: {
        code: known ? error.code : 'temporarily_unavailable',
        message: known ? error.message : 'Não foi possível concluir agora. Confira sua conexão e tente de novo.',
        retryable: !known || status >= 500,
      },
      apiVersion: MOBILE_API_VERSION,
    },
    { status, requestId },
  );
  if (status === 401) response.headers.set('WWW-Authenticate', 'Bearer realm="Pico Social"');
  return response;
}
