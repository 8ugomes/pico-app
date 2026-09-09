import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const client = await createClient();
  if (code && client) {
    try {
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      // Auth's PKCE exchange returns the stored recovery redirect type at
      // runtime; the public AuthTokenResponse type omits this extra field.
      if (!error) return NextResponse.redirect(new URL('redirectType' in data && data.redirectType === 'recovery' ? '/redefinir-senha' : '/perfil', url.origin), { headers: { "Cache-Control": "private, no-store" } });
    } catch {
      // Render the recoverable error state without exposing tokens or provider details.
    }
  }
  return NextResponse.redirect(new URL("/login?error=confirmation", url.origin), { headers: { "Cache-Control": "private, no-store" } });
}
