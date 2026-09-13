# Pico — skills do projeto

Conjunto local em `.agents/skills`: **13 skills**, sendo oito referências externas contextualizadas e cinco skills próprias. A revisão de 13/09/2026 consolida Aura Manteiga, empresa/produto e redesign com onboarding assistido. Não atualiza skills globais, plugins de outros projetos ou as revisões upstream das oito referências.

## Entrada principal

Para redesenhar o app inteiro, use **[pico-redesign](../.agents/skills/pico-redesign/SKILL.md)**. Ela conecta o manual completo, todas as dimensões do produto, os domínios e as skills pertinentes. O [prompt de execução](brand-exploration/aura-manteiga/PROMPT-PRODUCAO.md) detalha a implementação e publicação futura.

| Skill | Papel no Pico |
| --- | --- |
| [pico-redesign](../.agents/skills/pico-redesign/SKILL.md) | Redesign integral e onboarding assistido; coordena aplicação da identidade às jornadas reais. |
| [pico-context](../.agents/skills/pico-context/SKILL.md) | Empresa, propósito, público, voz, marca, fatos conhecidos e lacunas. |
| [pico-product-plan](../.agents/skills/pico-product-plan/SKILL.md) | Plano corrente, prioridades, dependências, aceite e estado de entrega. |
| [pico-dev](../.agents/skills/pico-dev/SKILL.md) | Implementação na stack e preservação dos contratos. |
| [pico-deslopify](../.agents/skills/pico-deslopify/SKILL.md) | Clareza, densidade, personalidade, acessibilidade e revisão proporcional. |
| [brand-discovery](../.agents/skills/brand-discovery/SKILL.md) | Pesquisa de lacunas reais de audiência/categoria; não reinicia a escolha de marca. |
| [brand-ideation](../.agents/skills/brand-ideation/SKILL.md) | Exploração de aplicações; nova identidade/naming apenas se solicitado. |
| [creative-direction](../.agents/skills/creative-direction/SKILL.md) | Mantém os quatro eixos do brief quando for necessário revisá-lo. |
| [brand-identity](../.agents/skills/brand-identity/SKILL.md) | Logo, cor, tipografia, imagem, ícones e movimento a partir dos mestres Aura Manteiga. |
| [art-direction](../.agents/skills/art-direction/SKILL.md) | Fotografia, campanhas, composição e aplicações da direção aprovada. |
| [brand-style-guide](../.agents/skills/brand-style-guide/SKILL.md) | Mantém o manual e sua consistência com os ativos. |
| [brandkit](../.agents/skills/brandkit/SKILL.md) | Pranchas e mockups ilustrativos quando pedidos; não substitui os ativos canônicos. |
| [impeccable](../.agents/skills/impeccable/SKILL.md) | Design e acabamento da interface, apoiados no contexto da raiz do projeto. |

## Como as referências se conectam

[pico-company-context.md](pico-company-context.md) centraliza o contexto institucional. [PRODUCT.md](../PRODUCT.md), [BRIEF.md](../BRIEF.md) e [DESIGN.md](../DESIGN.md) dão entrada ao trabalho de produto/design. [pico-domains.md](pico-domains.md) aponta contratos e componentes reais; não introduz uma nova arquitetura de pastas.

Em redesign integral, ler todo o manual em texto e inspecionar suas seções visuais, incluindo logo, cor, tipos, arte, componentes e todas as telas. Consultar tokens e ativos fornecidos. Abrir as referências internas das skills conforme a etapa; não executar todas as ferramentas de todas as skills só porque estão instaladas. O contexto aprovado substitui defaults que proponham outra estética ou repitam decisões já tomadas.

Cobertura integral do produto não significa teste exaustivo a cada ajuste. Criar e inspecionar um conjunto representativo, propagar o sistema, corrigir em lote e confirmar os pontos afetados. Lint/typecheck/build no fechamento, CI e testes dos comportamentos alterados continuam. Suíte remota e novos testes precisam de relação com o risco da mudança.

## Manutenção e procedência

As oito skills externas mantêm corpo upstream, referências, scripts e licenças; o bloco inicial contém o contexto Pico. Os campos de catálogo das seis skills Ramp foram movidos para `metadata` para compatibilidade do frontmatter. `UPSTREAM.json` preserva revisão/hash de origem e registra hash local da adaptação. O [manifesto](branding-skills-sources.json) registra ambas as versões e as cinco skills locais; não tratar o hash de origem como se ainda descrevesse o arquivo personalizado.

Ao atualizar um upstream, preservar/reaplicar o contexto local após revisão. Ao mudar uma decisão de marca, atualizar primeiro a fonte canônica, depois entradas e índices afetados. O PDF histórico e seus resultados permanecem históricos. Use o validador da skill-creator para formato, confira referências e faça revisão de escopo; validação sintática não prova qualidade de decisões.

As skills são descobertas a partir do diretório do projeto. Em uma sessão que já carregou o catálogo antigo, os arquivos podem ser lidos pelos links acima; novas tarefas usam o conjunto presente no disco. A leitura da skill ou do prompt não dispara publicação ou mudanças no aplicativo.
