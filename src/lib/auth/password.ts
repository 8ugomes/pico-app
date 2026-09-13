// Supabase Auth hashes passwords with bcrypt. The byte limit also avoids
// misleading length promises for multi-byte characters.
export function newPasswordError(password: string): string | null {
  if ([...password].length < 12) return 'Use pelo menos 12 caracteres na senha.';
  if (new TextEncoder().encode(password).length > 72) return 'Use uma senha menor: o limite é 72 bytes. Acentos e emojis ocupam mais espaço.';
  return null;
}
