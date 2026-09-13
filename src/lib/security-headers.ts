// Runtime scripts need a fresh nonce; photo cropping uses inline styles and a
// local WebAssembly decoder. Neither exception permits arbitrary inline scripts.
export function contentSecurityPolicy(nonce: string, supabaseUrl?: string, development = false) {
  const backend = supabaseUrl ? new URL(supabaseUrl).origin : '';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${development ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' ${backend}${development ? ' ws: http://localhost:* http://127.0.0.1:*' : ''}`,
    "img-src 'self' blob: data:", "font-src 'self'", "worker-src 'self' blob:",
    "media-src 'self' blob:", "object-src 'none'", "frame-src 'none'",
    "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'",
  ].join('; ');
}
