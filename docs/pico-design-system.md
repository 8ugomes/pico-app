# Pico Social — design system Aura Manteiga

**Direção escolhida e vigente: Aura Manteiga.** O [manual e os ativos](brand-exploration/aura-manteiga/README.md) estão entregues; a migração do aplicativo ainda está pendente em 13/09/2026. Este documento descreve primeiro o alvo aprovado e preserva, ao final, o baseline do código anterior. Atualizar o estado somente após implementação e verificação reais.

## Fontes e identidade

[Contexto institucional](pico-company-context.md), [brief criativo](../BRIEF.md), [manual completo](brand-exploration/aura-manteiga/MANUAL.md), [tokens.json](brand-exploration/aura-manteiga/tokens.json) e [mapa de implementação](brand-exploration/aura-manteiga/IMPLEMENTACAO.md). O manual define a identidade; [domínios](pico-domains.md) e código definem contratos de uso. A skill [pico-redesign](../.agents/skills/pico-redesign/SKILL.md) conduz a execução integral.

Nome completo Pico Social; assinatura curta Pico. “O ponto de encontro da areia.” e “Me acha no Pico.” Aura Manteiga é nome interno da direção. Editorial de moda jovem, artístico, premium e refinado, com pertencimento e operação clara. Os SVGs em `logo/` são mestres; preservar contornos e proporções, sem redigitar a marca ou recuperar o ponto do logo legado.

## Cor e temas — alvo aprovado

Cores de marca: Manteiga `#F2E3B5`, Cacau `#44342F`, Papel `#F8F3E7`, Lavanda `#CBBBE0`. Manteiga dá reconhecimento, Papel sustenta leitura, Cacau dá contraste e Lavanda entra como apoio pontual. Cores funcionais de sucesso/erro/aviso/informação seguem os tokens próprios, sem transformar toda a UI em arco-íris.

| Papel | Claro | Escuro |
| --- | --- | --- |
| Fundo | `#F8F3E7` | `#282121` |
| Superfície | `#FCF9F3` | `#352E2B` |
| Superfície elevada | `#FFFFFF` | `#403733` |
| Texto principal | `#44342F` | `#F8F3E7` |
| Texto de apoio | `#73665F` | `#C4BEB6` |
| Destaque suave | `#F4E9C9` | `#4A423A` |
| Ação / texto da ação | `#44342F` / `#F8F3E7` | `#F2E3B5` / `#44342F` |
| Borda funcional padrão | `#958A82` | `#7D7772` |
| Borda funcional sobre elevada/suave | `#84786F` | `#9D948C` |

Este quadro resume os papéis; `tokens.json` mantém o conjunto completo, incluindo hover, active, focus e estados. `tokens.css` é referência para migração, não uma camada para colar sobre o CSS antigo. O claro é a referência editorial; o escuro usa sua própria paleta. Na implementação, seguir `prefers-color-scheme` inicialmente, preservando escolha explícita de tema caso exista; não criar schema de preferência apenas para isso. Atualizar `color-scheme`, seleção, controles nativos, metadados e PWA de forma coerente.

## Tipografia, geometria e arte

Syne 600–800 em títulos e aberturas; Manrope 400–700 em texto, navegação, formulários e ações. Fontes locais WOFF2 entregues com OFL em `fonts/`; integrar com `next/font/local`. Corpo e valores de campo 16 px, labels 14 px, metadados 13 px, navegação no mínimo 12 px com alvo de 44 px. Títulos de página 28–36 px e aberturas 32–64 px conforme a largura. Os tamanhos das miniaturas do PDF não são escala de produção.

Controles com raio 16 px, cards 22 px, painéis 30 px, pílulas/avatares conforme forma. Curvas editoriais assimétricas são reservadas a capas e momentos de marca; não recortar rostos, texto ou alvos. Usar composições específicas por conteúdo, sem caixas e capas universais. Espaçamento na base de 4 px com respiro adequado ao conteúdo.

Fotografia protagonista: pele, areia, gestos, luz difusa e sinais reconhecíveis dos três esportes. Preservar cor e conteúdo de pessoas, arenas e comunidades. Fotos sintéticas do estudo são ilustrativas; não podem ser publicadas como contas ou locais reais. Textura pertence às peças/aberturas, sem ruído nos campos ou prejuízo à leitura. Movimento breve 160/220 ms, 280 ms reservado à marca; respeitar redução de movimento.

## Interação e jornadas

Manter Início/Pessoas/Comunidades/Arenas/Perfil. Pessoas em linhas de identidade; arenas priorizam o lugar; comunidades mostram propósito e condições; posts priorizam conteúdo e audiência; jogos ficam na cronologia privada. Registro de jogo não indica presença. Compartilhar é separado e explícito. Formulários preservam campos, validações, audiência, rascunhos e feedback real.

Onboarding assistido integra a nova experiência: perfil inicial orientado, boas-vindas institucionais após confirmação real e tutorial opcional com dicas contextuais. Pausar/dispensar/retomar continuam acessíveis. “Mostrar onde” aponta controles sem executar gravação. Preservar isolamento por conta/origem/demo, respeito a dispensas e retomada voluntária. Refinar apresentação e ordem segundo [ONBOARDING.md](ONBOARDING.md) e o [mapa de domínios](pico-domains.md).

Diálogos mantêm foco, Escape e retorno ao acionador; rolagem/teclado não escondem fechamento e ação. `ChoiceChip` preserva controle nativo e indicação além da cor. Estados vazio, carregando, erro, sucesso, indisponível, selecionado e disabled usam semântica e texto honesto. Uma ação principal por contexto.

## Qualidade e aplicação

Contraste do CSS final: texto comum 4,5:1; texto grande 3:1; elementos funcionais relevantes 3:1. Foco, labels, teclado, texto a 200%, toque de 44 px e reduced motion. Preferir superfícies estáveis; transparência discreta apenas onde houver função e contraste, com fallback opaco. Reduzir peso visual de sombras, blur, bordas e texto repetido.

Durante criação, revisar amostra representativa de jornadas nos dois temas e em mobile/desktop; corrigir em lote e confirmar os pontos afetados. Não repetir o QA extenso do PDF após cada ajuste de UI. No fechamento, lint/typecheck/build, CI, smoke e testes pertinentes ao comportamento alterado. Ampliar por risco ou defeito. O manual e seus 50 pares de contraste não comprovam o funcionamento do app final.

## Baseline legado — registro do código anterior à migração

As especificações abaixo documentam a etapa anterior e a implementação ainda encontrada no código nesta rodada. **Cores verde-água, fonte nativa única, material de carvão e referências antigas não são a direção para novas telas.** Interações e contratos descritos continuam a ser preservados quando compatíveis com os documentos atuais. Capturas e QA antigos não comprovam Aura Manteiga implementada.

O baseline anterior usa preto e carvão, acento verde-água e conteúdo social em primeiro plano. O refino de setembro de 2026 aplica o mesmo sistema à interface conectada e aos componentes existentes de demonstração. Não altera audiência, admissão ou regras de dados.

### Tokens canônicos

`src/app/globals.css` define as cores, escala e geometria. `forms.css` centraliza controles e diálogos; `social.css`, `social-pages.css` e `profile.css` aplicam suas variantes. Não duplicar regras de input nas telas.

| Token | Valor | Uso |
| --- | --- | --- |
| `--background` | `#07080a` | Fundo |
| `--graphite` | `#111317` | Cards de leitura |
| `--surface-overlay` | `#1c2026` | Elevação e fallback opaco |
| `--surface-input` | Branco a 5% | Campos integrados |
| `--foreground` | `#f2f3f4` | Texto principal |
| `--text-secondary` | `#c2c6cb` | Labels e apoio |
| `--text-muted` | `#b4bac3` | Metadados |
| `--accent` | `#4de1c1` | Ação principal, seleção e foco |
| `--accent-ink` | `#08221e` | Texto da ação principal |
| `--sand` | `#c8a96a` | Champagne restrito à assinatura da marca |
| `--error` | `#ffb5a7` | Erro |
| `--radius-control` | `1rem` | Campos e botões |
| `--radius-card` | `1.375rem` | Cards |
| `--radius-panel` | `1.875rem` | Diálogos e painéis elevados |
| `--radius-pill` | `999px` | Seleções compactas |

Fonte única: `-apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. Controles, menus e diálogos herdam a mesma família. Não há download ou distribuição da SF Pro nem carregamento da Geist.

Corpo e texto digitado: `1rem`; metadados: `.8125rem`; labels: `.875rem`; seções: `1.25rem`; diálogos: `1.375rem`; títulos principais: `1.75–2rem`. Pesos 400, 500 e 600. A navegação compacta usa `.75rem`. Os tokens de espaço vão de `.25rem` a `2rem`, em passos de quatro pixels na escala padrão.

### Materiais e interação

Publicações usam fundo estável; pessoas usam linhas abertas, com identidade e esporte. Formulários elevados e diálogos usam carvão com preenchimento a 92%, blur de 18px, borda neutra e sombra discreta. A regra base é opaca; `@supports` habilita translucidez, e `prefers-reduced-transparency` retorna ao opaco. Campos não recebem outro blur.

O diálogo nativo mantém cabeçalho e fechamento de 44px fora da única área de rolagem. A ação permanece no fluxo, sem cobrir conteúdo ou teclado. Escape e eventos de fechamento não se propagam ao diálogo pai; o foco retorna ao acionador. Tab/Shift+Tab permanecem entre controles visíveis e habilitados. O recorte de foto devolve o foco ao seletor de arquivo.

`ChoiceChip` mantém um checkbox nativo, teclado e checkmark além da mudança de cor. Formulários de comunidade preservam campos, validações, seleção múltipla e as opções exatas de audiência. O compositor de publicação usa um acionador compacto e abre os mesmos campos em diálogo; o rascunho fica preservado ao fechar e reabrir.

Transições curtas, sem animação de blur. `prefers-reduced-motion` desliga movimento. Controles menores têm alvo de 44px; texto pode crescer e quebrar sem cortar conteúdo.

### Referências e evidência

Não foram encontrados prints originais do Yankee ou um anexo de imagem do formulário. Na [página pública do Yankee](https://play.google.com/store/apps/details?id=com.yankee.foretheist), foi observado um feed escuro com foto dominante, recortes arredondados e controles discretos. É apoio de composição, sem copiar pessoas, marca ou funcionalidades.

A stack de sistema e a separação entre conteúdo e superfícies elevadas seguem a direção das referências oficiais: [Apple Design](https://developer.apple.com/design/human-interface-guidelines/), [fontes Apple](https://developer.apple.com/fonts/) e [Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/). A simplicidade solicitada a partir do ChatGPT orienta agrupamento e discrição dos controles, sem prometer reprodução de um material nativo em CSS.

Capturas reais, cobertura e limites da validação estão em [visual-review/README.md](visual-review/README.md). A fixture local renderiza o app real e simula apenas APIs; não comprova infraestrutura ou persistência remota.

### Registro depois do jogo

`GameJournal` apresenta arena, modalidade e data declarada em linhas abertas, com ícone de calendário e assinatura areia discreta. Não usa bolinhas de presença, prazo, estado ativo ou contador. `Meus jogos` fica no perfil e `Joguei aqui` na arena; a navegação fixa mantém Início, Pessoas, Comunidades, Arenas e Perfil, sem botão central de mais.

### Composição por conteúdo · jornada de 12/09/2026

Direção “Editorial de quadra”: o início apresenta relações próprias; pessoas são linhas de identidade; comunidades mostram propósito e condições; arenas priorizam o lugar; posts priorizam conteúdo; jogos ficam em cronologia privada. A composição usa `journey.css` e componentes dedicados, mantendo tokens e controles compartilhados. Evitar capas universais, métricas artificiais e caixas repetidas.

Filtros de pessoas e informações complementares de arena/grupo ficam em disclosures; audiência de publicação e condições de participação permanecem visíveis. “Comunidades” é o nome do destino; “turma” aparece como linguagem contextual. Acompanhar é unilateral e não envia convite. “Joguei aqui” registra o passado; “Compartilhar jogo” publica somente após outra confirmação.

[Comparação das alternativas](JOURNEY_REFINEMENT.md) e [capturas locais](journey-review/README.md). A direção e os rótulos ainda precisam de avaliação com jogadores; não há resultado de pesquisa declarado.

### Tutorial guiado

`GuidedOnboarding` apresenta convite editorial no Início e um guia opcional em `onboarding.css`. Destaque areia conecta dica e controle real; a tela continua interativa. “Mostrar onde” recolhe a dica antes de focar o controle. O painel acompanha a rolagem, respeita a navegação e pode ser expandido/pausado; corpo rola em altura curta/texto ampliado, ações ficam acessíveis. Diálogos nativos o ocultam e editores de perfil suspendem o avanço. Não confundir progresso do passeio com ações sociais concluídas. [Escopo e evidências](ONBOARDING.md).

### Boas-vindas institucionais

Aviso em superfície editorial, título focável e rolagem após salvar o formulário. Uma ação principal para conhecer a comunidade, alternativa discreta para reconhecer. As mensagens fixas identificam autoria Pico e não exibem engajamento fictício. [Evidências](official-review/README.md).
