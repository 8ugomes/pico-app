---
name: pico-dev
description: Implementar ou corrigir funcionalidades, componentes, integrações e telas do Pico Social em Next.js, TypeScript e Supabase, preservando os contratos de domínio e a identidade Aura Manteiga.
---

# Desenvolvimento Pico

Leia [AGENTS.md](../../../AGENTS.md), [guia técnico](../../../docs/skill_pico_dev.md) e [contexto institucional](../../../docs/pico-company-context.md). Use o [mapa de domínios](../../../docs/pico-domains.md) para encontrar os contratos da mudança; consulte a documentação local da versão instalada do Next.js ao alterar suas APIs.

Em trabalho visual, leia o [design system](../../../docs/pico-design-system.md) e as partes pertinentes do [manual](../../../docs/brand-exploration/aura-manteiga/MANUAL.md). Para redesign integral, use [pico-redesign](../pico-redesign/SKILL.md), que exige o manual completo e cobertura de toda a jornada.

Reutilize o código existente e preserve diferenças entre demo e conectado. Jogos privados, audiências, sessão, autoria e RLS não mudam por causa da marca. Documente antes/depois, rode lint/typecheck/build ao fechar e testes pertinentes ao comportamento alterado. Não criar testes que apenas repitam valores de estilo ou rodar validação remota a cada ajuste visual.
