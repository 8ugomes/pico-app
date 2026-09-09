# Pico — Ciclo Autônomo de Evolução

## Contrato de execução

Um avanço principal por ciclo: AUDIT → PLAN → IMPLEMENT → VERIFY → DOCUMENT → COMMIT → NEXT.
Ler AGENTS.md, plano, Deslopify e schema antes da implementação. Rodar lint, typecheck e build em cada ciclo; corrigir falhas antes do commit. Registrar evidências e limitações sem confundir demonstração, banco local e serviço hospedado.

Escopo permanente: rede social mobile-first para esportes de areia. Sem reservas, pagamentos, B2B, chat, ranking avançado, IA ou comunidades implementadas. Preservar todas as rotas canônicas e o funcionamento sem Supabase. Nunca versionar secrets; autoria de produção deriva de auth.uid().

## Sequência

| Ciclo | Avanço | Estado |
| --- | --- | --- |
| 0.5 | Premium visual pass | Concluído |
| 1 | Supabase foundation | A seguir |
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
