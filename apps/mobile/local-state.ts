import { Preferences } from '@capacitor/preferences';
import { draftStorageKey } from './drafts';

const LAST_ACCOUNT_KEY = 'pico.mobile.session.v1.last-account';
const DELETION_INTENT_KEY = 'pico.mobile.session.v1.deletion-intent';
const SESSION_CLEAR_PENDING_KEY = 'pico.mobile.session.v1.clear-pending';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeAccountId(value: string | null) {
  return value && UUID.test(value) ? value : null;
}

export async function rememberAccountForCleanup(accountId: string) {
  const safe = safeAccountId(accountId);
  if (!safe) throw new Error('Identificador da conta inválido.');
  await Preferences.set({ key: LAST_ACCOUNT_KEY, value: safe });
}

export async function readRememberedAccount() {
  const { value } = await Preferences.get({ key: LAST_ACCOUNT_KEY });
  return safeAccountId(value);
}

export async function markAccountDeletionIntent(accountId: string) {
  const safe = safeAccountId(accountId);
  if (!safe) throw new Error('Identificador da conta inválido.');
  await Preferences.set({ key: DELETION_INTENT_KEY, value: safe });
}

export async function clearAccountDeletionIntent(accountId: string) {
  const { value } = await Preferences.get({ key: DELETION_INTENT_KEY });
  if (safeAccountId(value) === accountId) await Preferences.remove({ key: DELETION_INTENT_KEY });
}

export async function readAccountDeletionIntent() {
  const { value } = await Preferences.get({ key: DELETION_INTENT_KEY });
  return safeAccountId(value);
}

export async function forgetRememberedAccount(accountId: string) {
  const { value } = await Preferences.get({ key: LAST_ACCOUNT_KEY });
  if (safeAccountId(value) === accountId) await Preferences.remove({ key: LAST_ACCOUNT_KEY });
}

export async function markSessionClearPending() {
  await Preferences.set({ key: SESSION_CLEAR_PENDING_KEY, value: '1' });
}

export async function readSessionClearPending() {
  const { value } = await Preferences.get({ key: SESSION_CLEAR_PENDING_KEY });
  return value === '1';
}

export async function clearSessionClearPending() {
  await Preferences.remove({ key: SESSION_CLEAR_PENDING_KEY });
}

export async function clearAccountLocalContent(accountId: string) {
  await Promise.all([
    Preferences.remove({ key: draftStorageKey(accountId, 'publication') }),
    Preferences.remove({ key: draftStorageKey(accountId, 'game') }),
    Preferences.remove({ key: draftStorageKey(accountId, 'profile') }),
    Preferences.remove({ key: `pico.mobile.tour.v1.${accountId}` }),
    Preferences.remove({ key: `pico.mobile.comment-attempts.v1.${accountId}` }),
    Preferences.remove({ key: `pico.mobile.game-share-attempts.v1.${accountId}` }),
  ]);
}
