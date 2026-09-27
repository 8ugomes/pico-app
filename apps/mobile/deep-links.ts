export type MobileTab = 'home' | 'people' | 'communities' | 'arenas' | 'profile';

export type DeepLinkTarget =
  | { tab: MobileTab; kind: 'tab' }
  | { tab: 'profile'; kind: 'profile-section'; section: 'profile' | 'games' | 'account' }
  | { tab: 'home'; kind: 'post'; id: string }
  | { tab: 'people'; kind: 'player'; username: string }
  | { tab: 'communities'; kind: 'community'; slug: string }
  | { tab: 'arenas'; kind: 'arena'; slug: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const usernamePattern = /^[a-z0-9_]{3,40}$/;

export function parseDeepLink(value: string, trustedOrigin: string): DeepLinkTarget | null {
  try {
    if (/%2e|\/\.\.?([/?#]|$)/i.test(value)) return null;
    const url = new URL(value);
    const origin = new URL(trustedOrigin);
    if (url.protocol !== 'https:' || origin.protocol !== 'https:' || url.origin !== origin.origin || url.username || url.password) {
      return null;
    }
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length === 0 || (parts.length === 1 && parts[0] === 'feed')) return { tab: 'home', kind: 'tab' };
    if (parts.length === 1 && parts[0] === 'descobrir') return { tab: 'people', kind: 'tab' };
    if (parts.length === 1 && parts[0] === 'comunidades') return { tab: 'communities', kind: 'tab' };
    if (parts.length === 1 && parts[0] === 'arenas') return { tab: 'arenas', kind: 'tab' };
    if (parts.length === 1 && parts[0] === 'perfil') return { tab: 'profile', kind: 'profile-section', section: 'profile' };
    if (parts.length === 1 && parts[0] === 'jogos') return { tab: 'profile', kind: 'profile-section', section: 'games' };
    if (parts.length === 1 && parts[0] === 'conta') return { tab: 'profile', kind: 'profile-section', section: 'account' };
    if (parts.length !== 2) return null;
    const [section, valuePart] = parts;
    if (section === 'publicacoes' && uuidPattern.test(valuePart)) return { tab: 'home', kind: 'post', id: valuePart.toLowerCase() };
    if (section === 'perfil' && usernamePattern.test(valuePart)) return { tab: 'people', kind: 'player', username: valuePart };
    if (section === 'comunidades' && valuePart.length <= 80 && slugPattern.test(valuePart)) return { tab: 'communities', kind: 'community', slug: valuePart };
    if (section === 'arenas' && valuePart.length <= 80 && slugPattern.test(valuePart)) return { tab: 'arenas', kind: 'arena', slug: valuePart };
  } catch {
    return null;
  }
  return null;
}
