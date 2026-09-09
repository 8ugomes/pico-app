import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const client = await createClient();
  if (code && client) {
    try {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL("/login", url.origin), { headers: { "Cache-Control": "private, no-store" } });
    } catch {
      // Render the recoverable error state without exposing tokens or provider details.
    }
  }
  return NextResponse.redirect(new URL("/login?error=confirmation", url.origin), { headers: { "Cache-Control": "private, no-store" } });
}
