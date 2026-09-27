import type { Session } from '@supabase/supabase-js';
import {
  MOBILE_API_VERSION,
  MobileRequestError,
  mobileError,
  mobileJson,
  mobileOptions,
  readMobileJson,
  validateMobileRequest,
} from '@/lib/mobile/api-contract';
import { createMobileAuthClient } from '@/lib/mobile/supabase';

export const dynamic = 'force-dynamic';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown, minimum: number, maximum: number) {
  if (typeof value !== 'string') throw new MobileRequestError(400, 'invalid_input', 'Confira os campos e tente de novo.');
  const result = value.trim();
  if (result.length < minimum || result.length > maximum) {
    throw new MobileRequestError(400, 'invalid_input', 'Confira os campos e tente de novo.');
  }
  return result;
}

function secret(value: unknown, minimum: number, maximum: number) {
  if (typeof value !== 'string' || value.length < minimum || value.length > maximum) {
    throw new MobileRequestError(400, 'invalid_input', 'Confira os campos e tente de novo.');
  }
  return value;
}

function exactKeys(body: Record<string, unknown>, keys: string[]) {
  if (Object.keys(body).some((key) => !keys.includes(key))) {
    throw new MobileRequestError(400, 'invalid_input', 'Confira os campos e tente de novo.');
  }
}

function sessionData(session: Session | null) {
  if (!session) {
    throw new MobileRequestError(503, 'session_unavailable', 'A conta foi criada, mas não foi possível entrar. Tente entrar novamente.');
  }
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? null,
    user: { id: session.user.id, email: session.user.email ?? null },
  };
}

function authFailure(error: { code?: string; status?: number } | null) {
  if (!error) return;
  if (error.code === 'over_request_rate_limit' || error.code === 'over_email_send_rate_limit' || error.status === 429) {
    throw new MobileRequestError(429, 'rate_limited', 'Muitas tentativas por agora. Aguarde um pouco e tente de novo.');
  }
  if (error.code === 'weak_password') {
    throw new MobileRequestError(400, 'weak_password', 'Escolha uma senha mais forte, com pelo menos 12 caracteres.');
  }
  if (error.code === 'user_already_exists') {
    throw new MobileRequestError(409, 'account_unavailable', 'Não foi possível criar a conta. Tente entrar com seu e-mail.');
  }
  throw new MobileRequestError(401, 'authentication_failed', 'E-mail ou senha incorretos. Confira e tente de novo.');
}

export function OPTIONS(request: Request) {
  return mobileOptions(request);
}

export async function POST(request: Request) {
  try {
    const requestContext = validateMobileRequest(request, { requireAuth: false });
    const body = await readMobileJson(request);
    const action = body.action;
    const client = createMobileAuthClient();

    if (action === 'sign_in') {
      exactKeys(body, ['action', 'email', 'password']);
      const email = text(body.email, 3, 254).toLowerCase();
      const password = secret(body.password, 1, 128);
      if (!emailPattern.test(email)) throw new MobileRequestError(400, 'invalid_input', 'Confira o e-mail e tente de novo.');
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      authFailure(error);
      return mobileJson(request, { data: sessionData(data.session), apiVersion: MOBILE_API_VERSION });
    }

    if (action === 'sign_up') {
      exactKeys(body, ['action', 'email', 'password', 'name']);
      const email = text(body.email, 3, 254).toLowerCase();
      const password = secret(body.password, 12, 128);
      const name = text(body.name, 2, 60);
      if (!emailPattern.test(email)) throw new MobileRequestError(400, 'invalid_input', 'Confira o e-mail e tente de novo.');
      const { data, error } = await client.auth.signUp({ email, password, options: { data: { display_name: name } } });
      authFailure(error);
      return mobileJson(request, { data: sessionData(data.session), apiVersion: MOBILE_API_VERSION }, { status: 201 });
    }

    if (action === 'refresh') {
      exactKeys(body, ['action', 'refreshToken']);
      const refreshToken = secret(body.refreshToken, 20, 4096);
      const { data, error } = await client.auth.refreshSession({ refresh_token: refreshToken });
      if (error || !data.session) {
        throw new MobileRequestError(401, 'invalid_refresh_token', 'Sua sessão terminou. Entre novamente.');
      }
      return mobileJson(request, { data: sessionData(data.session), apiVersion: MOBILE_API_VERSION });
    }

    if (action === 'sign_out') {
      exactKeys(body, ['action', 'refreshToken']);
      if (!requestContext.accessToken) {
        throw new MobileRequestError(401, 'authentication_required', 'Entre novamente para continuar.');
      }
      const refreshToken = secret(body.refreshToken, 20, 4096);
      const { error: sessionError } = await client.auth.setSession({
        access_token: requestContext.accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) {
        throw new MobileRequestError(401, 'invalid_session', 'Sua sessão terminou. Entre novamente.');
      }
      const { error: signOutError } = await client.auth.signOut({ scope: 'local' });
      if (signOutError) {
        throw new MobileRequestError(503, 'sign_out_unavailable', 'Não foi possível revogar a sessão no servidor.');
      }
      return mobileJson(request, { data: { signedOut: true }, apiVersion: MOBILE_API_VERSION });
    }

    throw new MobileRequestError(400, 'invalid_action', 'A ação enviada não é válida.');
  } catch (error) {
    return mobileError(request, error);
  }
}
