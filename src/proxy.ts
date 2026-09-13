import { NextResponse, type NextRequest } from 'next/server';
import { contentSecurityPolicy } from './lib/security-headers';

// This proxy sets document policy only. Auth remains verified in Route Handlers
// and RLS; it is not the session-refresh proxy required by private server pages.
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const policy = contentSecurityPolicy(nonce, process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NODE_ENV === 'development');
  const headers = new Headers(request.headers);
  headers.set('Content-Security-Policy', policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', policy);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  return response;
}

export const config = { matcher: ['/((?!api/|_next/|images/|icons/|brand/|fonts/|favicon.ico|manifest.webmanifest|robots.txt).*)'] };
