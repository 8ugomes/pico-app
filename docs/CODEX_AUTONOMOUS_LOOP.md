# Pico — Ciclo Autônomo de Evolução

## Contrato de execução

Um avanço principal por ciclo: AUDIT → PLAN → IMPLEMENT → VERIFY → DOCUMENT → COMMIT → NEXT.
Ler AGENTS.md, plano, Deslopify e schema antes da implementação. Rodar lint, typecheck e build em cada ciclo; corrigir falhas antes do commit. Registrar evidências e limitações sem confundir demonstração, banco local e serviço hospedado.

Escopo permanente: rede social mobile-first para esportes de areia. Sem reservas, pagamentos, B2B, chat, ranking avançado, IA ou comunidades implementadas. Preservar todas as rotas canônicas e o funcionamento sem Supabase. Nunca versionar secrets; autoria de produção deriva de auth.uid().

## Sequência

| Ciclo | Avanço | Estado |
| --- | --- | --- |
| 0.5 | Premium visual pass | Concluído |
| 1 | Supabase foundation | Concluído localmente |
| 2 | Real read layer | Planejado |
| 3 | Real auth and profile | Planejado |
| 4 | Real checkin | Planejado |
| 5 | Real social feed | Planejado |
| 6 | Connections and discovery | Planejado |
| 7 | Product hardening | Planejado |

## Cycle 0.5 — Premium visual pass

### AUDIT

Base: main limpa em 4ca4e57. Seis jornadas sociais funcionam em memória; Auth tem formulários/PKCE opcionais; queries e tipos ainda não conectam o produto ao banco. Sem migrations. A revisão CSS encontrou areia aplicada a CTAs, filtros, navegação, presença e fundos inteiros. Há foco/reduced motion e estrutura mobile, mas o excesso de cor quente compete com pessoas e conteúdo.

### PLAN — antes de implementar

Avanço único: refinar o sistema visual, sem funcionalidades novas. Background #07080A, superfícies #111317, texto #F7F3EA; champagne #C8A96A só na marca/contexto. Verde-água #4DE1C1 para ação/presença. Neutralizar fundos e filtros, refinar navegação/cards/inputs e respostas a toque/hover, preservar áreas de 44px e safe areas.

Aceite: nenhuma superfície principal amarela/bege; ações consistentes; seis rotas preservadas; foco e movimento reduzido mantidos; lint, typecheck e build aprovados. Inspeção visual e verificações HTTP serão registradas separadamente.

### IMPLEMENT

Tokens globais/Tailwind, cores do manifesto/viewport, cards, ações, filtros, navegação, seleção e respostas a hover/tap refinados. Champagne restrito à marca/indicador demo; cores quentes removidas das superfícies sociais. Funcionalidades preservadas.

### VERIFY

`npm run lint`, `npm run typecheck`, `npm run build`: aprovados, sem correções necessárias. Navegador em viewport 390×844: feed, arenas, detalhe, check-in, descoberta e perfil renderizam; cinco destinos móveis; largura de conteúdo não excedeu o viewport. Capturas do feed/check-in confirmaram superfícies escuras e ações verde-água. Não equivale a testes em dispositivos físicos.

### DOCUMENT / COMMIT

Plano, Deslopify, design system, schema (estado de integração) e changelog atualizados. Commit: `Cycle 0.5: premium visual pass`.

### NEXT

Concluído: refinamento visual sem novas funções. Ainda mock: todas as ações e dados sociais. Risco: Auth hospedado e instalação móvel não verificados. Próximo: Cycle 1, SQL versionado e RLS. Prompt: “Execute Cycle 1 conforme CODEX_AUTONOMOUS_LOOP.md, teste as migrations/seeds/policies localmente, documente limites e faça commit.”

## Cycle 1 — Supabase foundation

### AUDIT

Cycle 0.5 commitado em 075fcf6; árvore limpa. Sem .env.local, Supabase CLI, Docker ou Postgres instalados. Contrato SQL existe apenas em documentação; tipos manuais não possuem cidade, nível principal ou identificação demo. As telas continuam independentes do backend. Auth opcional existente não foi exercitado contra serviço hospedado.

### PLAN — antes de implementar

Avanço único: banco versionado para dez tabelas sociais, RLS/grants explícitos, constraints/FKs/índices, trigger após signup e seeds de catálogo/arenas fictícias. Preparar campos para onboarding futuro. Conexões ficam no Cycle 6; nenhuma interface passa a usar dados reais neste ciclo.

Check-ins terão somente leitura pelo cliente nesta fundação; escrita direta revogada. RPCs com identidade derivada e relógio do servidor serão entregues no Cycle 4. Não abrir policy permissiva temporária.

Aceite: migrations aplicam do zero, seed pode repetir sem duplicar, RLS cobre todas as tabelas, anônimo não lê dados de jogadores, usuários distintos não forjam autoria, referências inválidas e arena privada são recusadas. Usar PGlite (Postgres em WASM) para executar o SQL real com fixture mínima de auth.users/auth.uid(); a fixture não é migration de produção. Validar trigger, grants, constraints e policies. Rodar lint/typecheck/build/test, documentar diferença entre SQL local e Auth/PostgREST hospedado. Commit: `Cycle 1: supabase foundation`.


### IMPLEMENT

Criada migration atômica com dez tabelas, enums, FKs/constraints/índices, RLS/grants de operação e coluna. Trigger de perfil com identidade derivada do Auth, nome sanitizado e username único; backfill para contas pré-existentes sem copiar e-mail. Seed idempotente só de esportes e arenas fictícias is_demo. Configuração Supabase CLI local e tipos manuais alinhados ao que efetivamente existe. Adicionado PGlite apenas como devDependency e comando test:db.

### VERIFY

`npm run lint`, `npm run typecheck`, `npm run build`: aprovados. `npm test`: 20/20 (dez demo + dez grupos de SQL/RLS). Migrations aplicadas do zero, seed repetido, RLS executada com anônimo/Alice/Bob e cenário de privilégios amplos herdados para comprovar revogações. Autoria forjada, perfil alheio, timestamps, arena privada, modalidade inválida, campos vazios/longos, duplicações e escrita direta em checkins recusados. Revisão reforçou body para rejeitar newline/tab sem texto, além de espaços. Nenhum comando obrigatório falhou.

Smoke de produção: seis rotas canônicas e login/signup retornaram 200; slugs inexistentes de arena/perfil retornaram 404; / redirecionou 307 para /feed. Git diff --check aprovado. Nenhum secret adicionado.

Limite: Postgres/WASM executa SQL/RLS real, mas a identidade vem de fixture local. JWT, Auth/e-mail, PostgREST, refresh, Storage, concorrência multiconexão e ambiente hospedado ainda não foram exercitados.

### DOCUMENT / COMMIT

Schema reescrito para separar implementado e futuro; plano/Deslopify/README/changelog atualizados. Commit: `Cycle 1: supabase foundation`.

### NEXT

Concluído: fundação SQL reproduzível/testada e contratos do cliente. Ainda mock: todas as telas sociais e interações do DemoProvider. Riscos: tipos manuais devem ser gerados quando houver projeto configurado; seeds fictícios só em desenvolvimento; nenhuma RPC de presença, conexão, upload, moderação ou persistência social integrada.

Próximo ciclo recomendado: Cycle 2 — Real Read Layer. Helpers de perfil próprio, esportes, arenas e slug; integrar /arenas, /arenas/[slug], /perfil com loading/erro/vazio/autenticação e indicação de origem. Não misturar Rafa demo com usuário Auth. Banco configurado que falha deve apresentar erro; só ausência de configuração usa demo. Testar com e sem env, aplicar as migrations em ambiente de desenvolvimento e validar leituras com JWT real antes de declarar integração hospedada concluída.

Prompt sugerido: “Leia AGENTS.md e docs/CODEX_AUTONOMOUS_LOOP.md. Execute o Cycle 2: camada real de leitura de perfil próprio, esportes e arenas, integrada a /arenas, /arenas/[slug] e /perfil, preservando demo explícito e distinguindo erro/vazio/loading/sessão. Use as migrations do Cycle 1; não finja sucesso de Supabase sem testar. Rode lint, typecheck, build e testes pertinentes, atualize os quatro documentos e faça commit Cycle 2: real read layer.”
