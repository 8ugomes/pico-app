# Aura Manteiga — cobertura de implementação

Base `3bd6dc4`; inventário atualizado após implementação. Todos os componentes visuais abaixo recebem a fundação compartilhada e/ou composição específica. **Alterada** significa código próprio ou estilo compartilhado aplicado; não significa captura independente de cada estado. Providers, hooks e APIs permanecem **já conformes ao contrato**, sem alterações de dados/permissões.

| Domínio | Superfícies/componentes | Estado |
| --- | --- | --- |
| Fundação e navegação | `Brand`, `AppShell`, `SocialUI`, `SportChip`, `PlayerAvatar`, `PwaExperience` | Alterada |
| Entrada, autenticação e convites | `AccessGate`, `AuthPage`, `AuthForm`, `RecoveryForm`, `ScopeInvitation`, `SessionGuard` | Alterada |
| Configuração e assistência | `GuidedOnboarding`, `OfficialWelcome`, `connected/ProfileEditor`, `connected/AvatarEditor` | Alterada |
| Início e publicações | `FeedView`, `HomeContexts`, `PostCard`, `PostComposer`, `DemoPublication`, `connected/ConnectedFeed`, `connected/ConnectedHomeContexts`, `connected/PublicationComposer`, `connected/Media` | Alterada |
| Pessoas e perfis | `DiscoverView`, `PlayerCard`, `ProfileView`, `connected/ConnectedDiscovery`, `connected/ConnectedProfile`, `connected/ActivityHistory` | Alterada |
| Arenas | `ArenaCard`, `ArenaDetailView`, `ArenasView`, `connected/ConnectedArenas`, `connected/ArenaCommunities`, `connected/ArenaManagement`, `connected/ArenaSportPicker` | Alterada |
| Comunidades | `DemoCommunities`, `connected/Communities` | Alterada |
| Jogos privados | `GameJournal`, `GamesView`, `connected/ConnectedGames`, `connected/LegacyGameHistory` | Alterada |
| Conta, gestão, mídia e segurança | `connected/ConnectedAccount`, `connected/Management`, `connected/SafetyActions`, `connected/EntityPhotos`, `photos/PhotoCropper` | Alterada |
| Controles e exceções | `ui/Button`, `ui/Input`, `ui/ChoiceChip`, `ui/Modal`, `ui/Avatar`, `ui/BottomNav`, `ui/GlassPanel`, `connected/ReadState`, `connected/useMutation` | Alterada |

## Rotas existentes

- `src/app/(social)/admin/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/(social)/arenas/[slug]/gestao/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/(social)/arenas/[slug]/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/(social)/arenas/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/(social)/checkin/page.tsx` — já conforme: redirecionamento para `/jogos`, sem UI própria; validado no smoke.
- `src/app/(social)/comunidades/[slug]/gestao/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/(social)/comunidades/[slug]/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/(social)/comunidades/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/(social)/conta/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/(social)/descobrir/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/(social)/feed/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/(social)/jogos/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/(social)/perfil/[username]/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/(social)/perfil/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/(social)/publicacoes/[id]/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/acesso/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/auth/confirm/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/convite/arena/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/convite/comunidade/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/instalar/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/login/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/page.tsx` — já conforme: entrada redireciona para `/feed`, que recebeu o redesign.
- `src/app/privacidade/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/recuperar/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/redefinir-senha/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.
- `src/app/signup/page.tsx` — apresentação alterada por componentes/estilos compartilhados; rota/contrato preservados.

## Inventário de fundação

Sete folhas CSS: globals, social, social-pages, forms, journey, profile e onboarding. Baseline: dark fixo, fonte de sistema, acento verde-água, tons carvão/preto/branco literais, alias sand→accent, select escuro, blur/sombras repetidos. Nenhuma cor literal de UI foi encontrada em TSX fora do viewport. Fotografias existentes em public/images e mídia autorizada permanecem; nenhum retrato sintético novo. Logo textual legado e todos os ícones substituídos pelos ativos canônicos. Duas famílias WOFF2 e OFL do manual integradas via `next/font/local`. A paleta de conteúdo enviado por usuários é preservada.

## Evidência

[Relatório do conjunto](README.md), [39 verificações visuais](visual-checks.json), [contraste por elemento](rendered-contrast.json), [50 pares e assets](assets-contrast.json), [onboarding](onboarding/checks.json), [demo](onboarding/demo-checks.json) e [jogos](games/checks.json). Amostra inclui entrada/auth, Início, perfil/editor/configuração, aviso oficial, criação, pessoas, comunidades/gestão, arenas/detalhe, jogos, conta, admin, privacidade, instalação e exceções de acesso. Rotas dinâmicas compartilham componentes; a lista de rotas comprova cobertura de implementação, não teste remoto de cada permissão. Fotos, validações e salvamentos de perfil também são exercitados pelo check existente Profile browser regression em Chromium/WebKit no PR.

Nenhuma superfície de implementação foi omitida ou está bloqueada. Limites de validação: sem nova sessão de Supabase real, teste com jogadores, e-mail real, aparelho físico ou instalação. A publicação é comprovada pelo PR/recibo operacional e `/api/version`, separadamente das fixtures locais.
