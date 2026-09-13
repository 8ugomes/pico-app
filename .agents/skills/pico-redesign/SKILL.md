---
name: pico-redesign
description: Conduzir o redesign integral do aplicativo Pico Social com a identidade Aura Manteiga, cobrindo todas as jornadas e estados, onboarding assistido, sistema visual e implementação real com validação proporcional.
---

# Redesign integral do Pico Social

Skill principal para transformar o aplicativo existente na direção **Aura Manteiga**. O resultado é uma experiência completa, jovem, artística, premium e refinada, com operação clara. Não se limitar a landing page, troca de cores ou protótipo quando o pedido exigir implementação.

## Contexto antes de desenhar

1. Leia [AGENTS.md](../../../AGENTS.md), [PRODUCT.md](../../../PRODUCT.md), [BRIEF.md](../../../BRIEF.md), [contexto institucional](../../../docs/pico-company-context.md), [plano](../../../docs/pico-product-plan.md) e [Deslopify](../../../docs/deslopify.md).
2. Leia **todo** o [MANUAL.md](../../../docs/brand-exploration/aura-manteiga/MANUAL.md) e inspecione as seções visuais de [manual.html](../../../docs/brand-exploration/aura-manteiga/manual.html) ou do PDF consolidado em `output/pdf/Pico-Social-Manual-Aura-Manteiga.pdf`: marca, logo, cores, tipografia, fotografia, composição, voz, movimento, aplicações, componentes e telas. Consulte [tokens.json](../../../docs/brand-exploration/aura-manteiga/tokens.json), `logo/` e `fonts/` do mesmo pacote; não se basear só na capa ou neste resumo.
3. Leia [pico-design-system.md](../../../docs/pico-design-system.md), [IMPLEMENTACAO.md](../../../docs/brand-exploration/aura-manteiga/IMPLEMENTACAO.md) e o [mapa de domínios](../../../docs/pico-domains.md). Abra os contratos de cada domínio abrangido e confronte com rotas, componentes, estados e integrações reais.
4. Consulte [o catálogo completo das skills](../../../docs/pico-skills.md). Aplique `brand-identity`, `art-direction`, `brand-style-guide` e `impeccable` nas respectivas etapas; use os guias `pico-dev` e `pico-deslopify` na implementação/revisão. Leia referências internas quando pertinentes. Descoberta e ideação só entram para lacunas reais ou pedido de nova direção; não repetir a pesquisa nem reabrir Aura Manteiga por padrão.

O manual define identidade e intenção; os contratos de domínio definem funcionalidade e acesso; o código confirma o estado atual. Mockups ilustrativos não substituem campos completos, semântica, permissões ou tamanho legível em produção. Identifique lacunas e resolva escolhas reversíveis sem interromper por detalhes de gosto.

## Cobertura e execução

Inventarie todas as superfícies existentes por domínio e registre seu estado no plano: alterar, já conforme ou bloqueada com motivo. Cubra entrada/auth, perfil inicial, boas-vindas, tutorial, Início, Pessoas, Comunidades, Arenas, perfis/edição, publicações/compositor, jogos/compartilhamento, convites/gestão, conta/privacidade, PWA e estados de exceção.

Trate arquitetura de informação, hierarquia e densidade, tipografia, cores, imagens, controles, microcopy, acessibilidade, responsividade, movimento, desempenho e continuidade. Cada conteúdo pede composição própria. Mantenha os destinos Início/Pessoas/Comunidades/Arenas/Perfil e o escopo atual; simplifique agrupamento e apresentação sem inventar funcionalidades.

Implemente primeiro tokens, fontes, logo e componentes compartilhados. Desenvolva um conjunto representativo de jornadas e propague o sistema às demais, resolvendo particularidades. Use Syne/Manrope, ativos vetoriais entregues e os dois conjuntos semânticos; preserve conteúdo de usuários. Atualize também metadados e ícones PWA, mantendo identidade estável de instalação. Evite CSS de sobreposição que deixe a marca antiga por baixo.

## Onboarding assistido

Leia [ONBOARDING.md](../../../docs/ONBOARDING.md), [OFFICIAL_COMMUNITY_AUTH.md](../../../docs/OFFICIAL_COMMUNITY_AUTH.md) e `src/lib/onboarding.ts`. A assistência é de interface, sem IA ou voz.

- Perfil inicial: dados necessários, orientação junto dos campos, progresso compreensível, erros recuperáveis e teclado livre. Não remover requisitos de cadastro/privacidade só para encurtar a tela.
- Comunidade oficial: informar a inclusão e mostrar boas-vindas após confirmação real; preservar reconhecimento por conta no servidor.
- Tutorial: convite opcional, dicas breves junto dos controles, saída, pausa e retomada. Pode reorganizar texto, sequência e apresentação para reduzir esforço; não substituir por um fluxo obrigatório nem exigir passear por todas as telas antes de usar o app.
- Preservar a preferência local isolada por conta/origem/demo. Se mudar etapas ou versão, compatibilizar progresso anterior, respeitando dispensas e retomada voluntária. Não criar persistência remota só para o guia.
- “Mostrar onde” orienta/foca; não segue pessoas, não pede entrada em grupos, não registra jogo e não publica. Pausar assistência em diálogos/edição; tratar alvo ausente, erro, catálogo vazio, navegação direta e usuário recorrente.

## Validação proporcional, com espaço para criar

Durante criação, evitar heavy testing: não rodar suíte completa, banco remoto ou matriz de todas as telas × larguras × temas após cada ajuste. Não criar teste para provar padding, classe CSS, texto exato decorativo ou cada token repetido. Revisar o conjunto representativo, corrigir em lote e confirmar o que mudou; ampliar somente por risco, falha ou mudança nova. O objetivo de cobertura integral do redesign permanece.

No fechamento, executar lint, typecheck e build do repositório uma vez sobre o conjunto final e respeitar CI. Rodar testes existentes pertinentes quando mudar comportamento. Novo teste se justifica por risco real, como regressão de foco/progresso, isolamento de conta, formulário, audiência ou publicação involuntária. Se uma falha exigir correção, repetir os checks afetados.

Smoke das jornadas alteradas, modos claro/escuro, teclado/foco, contraste, texto ampliado e uma largura estreita. Escolher larguras adicionais pela composição e defeitos observados; não repetir automaticamente o volume de QA usado na criação do PDF. Usar fixtures isoladas, sem atividade social falsa em produção. Distinguir verificação local de Supabase real e aparelho físico.

## Entrega

Atualizar fontes canônicas de design, plano, Deslopify e changelog; registrar cobertura, capturas representativas, checks e limites. Aplicar o fluxo de commit do projeto. O [prompt de produção](../../../docs/brand-exploration/aura-manteiga/PROMPT-PRODUCAO.md) reúne a execução completa para o responsável usar. Ler esse arquivo ou esta skill não autoriza publicação: seguir o pedido em execução, incluindo deploy quando ele já estiver solicitado, sem pedir nova confirmação.
