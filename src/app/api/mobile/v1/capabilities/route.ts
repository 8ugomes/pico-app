import {
  MOBILE_API_VERSION,
  MOBILE_CLIENT_VERSION,
  MOBILE_MINIMUM_VERSION,
  mobileError,
  mobileJson,
  mobileOptions,
  validateMobileRequest,
} from '@/lib/mobile/api-contract';
import { MOBILE_VIDEO_PUBLISHING_ENABLED } from '@/lib/mobile/features';

export const dynamic = 'force-dynamic';

export function OPTIONS(request: Request) {
  return mobileOptions(request);
}

export function GET(request: Request) {
  try {
    validateMobileRequest(request, { requireAuth: false });
    return mobileJson(request, {
      data: {
        apiVersion: MOBILE_API_VERSION,
        currentClientVersion: MOBILE_CLIENT_VERSION,
        minimumClientVersion: process.env.PICO_MOBILE_MINIMUM_VERSION?.trim() || MOBILE_MINIMUM_VERSION,
        features: {
          accountDeletion: true,
          accountExport: true,
          communities: true,
          games: true,
          privateMedia: true,
          videoPublishing: MOBILE_VIDEO_PUBLISHING_ENABLED,
        },
      },
      apiVersion: MOBILE_API_VERSION,
    });
  } catch (error) {
    return mobileError(request, error);
  }
}
