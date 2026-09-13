# Pico — mapa de domínios para design e desenvolvimento

“Domínios” neste projeto são as responsabilidades de produto e seus contratos. O código existente as distribui por `src/components/pico`, `src/lib` e `src/app`; não há exigência de criar uma pasta `domains/` ou reorganizar a arquitetura para fazer o redesign. Este índice conecta os documentos e pontos de entrada atuais; confira o código antes de editar.

## Mapa de leitura e cobertura

| Domínio | Fontes e pontos de entrada | Preservar ao redesenhar |
| --- | --- | --- |
| Marca e empresa | [Contexto](pico-company-context.md), [manual](brand-exploration/aura-manteiga/MANUAL.md), [design system](pico-design-system.md), `Brand.tsx`, `globals.css` | Aura Manteiga, ativos originais, nomes e voz; estado implementado distinto da proposta. |
| Entrada e autenticação | [Contrato oficial](OFFICIAL_COMMUNITY_AUTH.md), [ambientes](ENVIRONMENTS.md), `AuthForm`, `AuthPage`, `AccessGate`, `SessionGuard`, `src/lib/auth` | Cadastro aberto com confirmação, admissão vigente e recuperação; suspensão/revogação/exclusão não restauradas pelo redesign. |
| Configuração e assistência | [ONBOARDING.md](ONBOARDING.md), [contrato oficial](OFFICIAL_COMMUNITY_AUTH.md), `GuidedOnboarding`, `OfficialWelcome`, `src/lib/onboarding.ts`, `connected/ProfileEditor` | Perfil obrigatório separado de guia opcional e aviso institucional; preferências isoladas por conta; progresso do guia não é sucesso social. |
| Início e publicações | [Contratos](CYCLE9_CONTRACTS.md), [jornada](JOURNEY_REFINEMENT.md), `FeedView`, `HomeContexts`, `connected/ConnectedFeed`, `connected/PublicationComposer` | Destino e audiência explícitos, rascunho, autoria, privacidade e feedback real de envio. |
| Pessoas e perfis | [Perfil](CYCLE10_PROFILE.md), [contratos](CYCLE9_CONTRACTS.md), `DiscoverView`, `PlayerCard`, `connected/ConnectedDiscovery`, `connected/ConnectedProfile` | Acompanhar é unilateral; histórico privado não alimenta descoberta; nenhum e-mail alheio no perfil. |
| Arenas | [Contratos](CYCLE9_CONTRACTS.md), `connected/ConnectedArenas`, `connected/ArenaManagement`, `connected/ArenaCommunities` | Vínculo com local não é presença; modalidades, custódia, papéis e gestão preservados. |
| Comunidades | [Contratos](CYCLE9_CONTRACTS.md), [comunidade oficial](OFFICIAL_COMMUNITY_AUTH.md), `connected/Communities`, `DemoCommunities` | Independentes ou vinculadas; aberta/aprovação/convite; leitura privada depende de participação. Gestão da arena não concede leitura de todo grupo. |
| Jogos e compartilhamento | [POST_GAME.md](POST_GAME.md), `GameJournal`, `connected/ConnectedGames`, `src/lib/supabase/games.ts`, `game-sharing.ts` | Registro retrospectivo privado; compartilhar é separado, com audiência e snapshot; editar jogo não altera post. `/checkin` só redireciona. |
| Fotos e mídia | [Perfil/HEIC](CYCLE10_PROFILE.md), [contratos](CYCLE9_CONTRACTS.md), `photos/PhotoCropper`, `connected/EntityPhotos`, `src/lib/photos`, `src/lib/supabase/media.ts` | Dono, limites, recorte, remoção e acesso à mídia; não usar fotos sintéticas como pessoas reais. |
| Conta, segurança e gestão | [Contratos](CYCLE9_CONTRACTS.md), [contrato oficial](OFFICIAL_COMMUNITY_AUTH.md), `connected/ConnectedAccount`, `SafetyActions`, `Management`, `ScopeInvitation` | Bloqueio, denúncia, convites, exclusão e confirmações sensíveis continuam claros e funcionais. |
| PWA e retomada | [Roadmap](pwa-roadmap.md), `PwaExperience`, `AppShell`, `BottomNav`, `src/app/manifest.ts` | Identidade estável de instalação, safe areas, sessão/versão e rascunhos; sem promessa offline ou sincronização inexistente. |
| Dados e operação | [Schema](04_SUPABASE_SCHEMA.md), [ambientes](ENVIRONMENTS.md), [governança](GITHUB_GOVERNANCE.md), `src/lib/supabase`, `src/app/api`, `supabase/migrations` | RLS/autoria/audiência, segredos e dados existentes. Uma atualização visual não exige migrations. Publicação depende do pedido em execução. |

Os nomes de componentes acima são relativos a `src/components/pico/`, salvo caminho explícito. Os contratos históricos de convite/admissão foram substituídos pela abertura documentada em `OFFICIAL_COMMUNITY_AUTH.md`; as demais permissões continuam vigentes.

## Dimensões do redesign integral

Cruzar cada domínio com: arquitetura de informação e próxima ação; hierarquia visual; claro/escuro; conteúdo e voz; controles e estados; acessibilidade e responsividade; assistência e continuidade; privacidade e confiança; desempenho e PWA. Usar apenas dimensões aplicáveis, sem criar telas ou estados artificiais para preencher uma matriz.

Inventariar **todas** as superfícies existentes e registrar o que mudou, já estava conforme ou ficou bloqueado. A cobertura do projeto é integral; a amostra visual durante a criação pode ser pequena. Começar por entrada/onboarding, Início, perfil e um fluxo de criação; propagar os componentes aprovados e verificar exceções. Ampliar a amostra se um defeito indicar alcance maior.

## Onboarding assistido na próxima implementação

1. Explicar o valor na chegada e pedir apenas os dados necessários ao perfil existente; ajuda junto do campo, progresso compreensível, erros recuperáveis e teclado utilizável.
2. Mostrar a confirmação de entrada na comunidade oficial somente após inclusão confirmada. Seu reconhecimento no servidor permanece separado da preferência local do tutorial.
3. Oferecer guia curto, opcional e contextual, ligado aos controles reais de arenas, pessoas, comunidades, publicação, jogos e perfil. Simplificar ordem, texto e apresentação quando melhorar a jornada; manter saída e retomada visíveis.
4. Orientar “Mostrar onde” sem clicar no controle de gravação. Pausar ao abrir diálogo/editor; não disputar foco ou sobrepor ações. Catálogo vazio, erro, alvo ausente e pessoa já experiente devem ter continuação útil.
5. Preservar isolamento por identidade e origem, modo demo separado, retomada voluntária após recarregar e progresso já dispensado. Se mudar a estrutura das etapas, adaptar a versão da preferência local sem herdar progresso entre contas; não criar banco só para o passeio.

Assistência significa orientação de interface, sem IA, voz, acompanhamento automático, pedidos de entrada ou publicações automáticas. Verificar as interações realmente alteradas; não repetir toda a suíte remota para cada ajuste de espaçamento.
