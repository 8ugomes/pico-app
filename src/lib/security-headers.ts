// Runtime scripts need a fresh nonce; photo cropping uses inline styles and a
// local WebAssembly decoder. Neither exception permits arbitrary inline scripts.
export function contentSecurityPolicy(nonce: string, supabaseUrl?: string, development = false) {
  const backendUrl = supabaseUrl ? new URL(supabaseUrl) : null;
  const backend = backendUrl?.origin ?? '';
  // Signed resumable uploads use Supabase's direct Storage host, a separate
  // origin from the API host. Keep the allowance exact for this project.
  const storageBackend = backendUrl && /^[a-z0-9-]+\.supabase\.co$/.test(backendUrl.hostname)
    ? ` ${backendUrl.protocol}//${backendUrl.hostname.replace(/\.supabase\.co$/, '.storage.supabase.co')}`
    : '';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${development ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    // renderCrop reads the locally prepared object URL with fetch before encoding.
    `connect-src 'self' blob: ${backend}${storageBackend}${development ? ' ws: http://localhost:* http://127.0.0.1:*' : ''}`,
    "img-src 'self' blob: data:", "font-src 'self'", "worker-src 'self' blob:",
    "media-src 'self' blob:", "object-src 'none'", "frame-src 'none'",
    "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'",
  ].join('; ');
}
