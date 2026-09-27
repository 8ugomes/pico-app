import { MobileRequestError } from './api-contract';
import { MutationError } from '@/lib/supabase/mutations';
import { ReadError } from '@/lib/supabase/read-errors';

export function asMobileError(error: unknown) {
  if (error instanceof MobileRequestError) return error;
  if (error instanceof ReadError) return new MobileRequestError(error.status, error.code, error.message);
  if (error instanceof MutationError) {
    return new MobileRequestError(error.status, error.status === 409 ? 'conflict' : 'request_failed', error.message);
  }
  return error;
}
