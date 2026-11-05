import { MobileRequestError } from './api-contract.ts';
import { MOBILE_TERMS_VERSION } from './terms.ts';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const invalid = () => new MobileRequestError(400, 'invalid_input', 'Confira os campos e tente de novo.');

export type MobileSignUp = {
  email: string;
  password: string;
  name: string;
  metadata: { display_name: string; terms_version: string; terms_accepted_at: string };
};

/**
 * Valida o cadastro móvel. O aceite dos Termos e das Diretrizes é explícito:
 * sem `termsAccepted: true` na versão vigente, nenhuma conta é criada.
 */
export function parseMobileSignUp(body: Record<string, unknown>, now: Date = new Date()): MobileSignUp {
  const allowed = ['action', 'email', 'password', 'name', 'termsAccepted', 'termsVersion'];
  if (Object.keys(body).some((key) => !allowed.includes(key))) throw invalid();
  if (body.termsAccepted !== true || body.termsVersion !== MOBILE_TERMS_VERSION) {
    throw new MobileRequestError(400, 'terms_required', 'Para criar a conta, aceite os Termos e as Diretrizes.');
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const password = body.password;
  if (email.length < 3 || email.length > 254 || !emailPattern.test(email)) throw invalid();
  if (name.length < 2 || name.length > 60) throw invalid();
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw invalid();
  return {
    email,
    password,
    name,
    metadata: { display_name: name, terms_version: MOBILE_TERMS_VERSION, terms_accepted_at: now.toISOString() },
  };
}
