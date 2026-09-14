# Revisão de design do guia de instalação

Inspeção documental de 13/09/2026, no handoff `impeccable_documenter`. Escopo: extensão de `/instalar` e convite posterior ao onboarding. A implementação mantém a identidade Aura Manteiga existente; não cria um sistema visual nem acrescenta raster. `DESIGN.md` e `.impeccable/design.json` foram consultados e preservados.

Esta revisão compara fontes e código. Não executou navegador, detector, build, testes ou instalação em aparelho. O fechamento visual e os resultados finais pertencem ao [registro da rodada](README.md); não são certificados por este documento.

## Evidências consultadas

- Direção e limites: [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md), [AGENTS.md](../../AGENTS.md), [contexto institucional](../pico-company-context.md), [domínios](../pico-domains.md), [design system](../pico-design-system.md) e [roadmap PWA](../pwa-roadmap.md).
- Contrato da superfície: [brief de `/instalar`](../../.impeccable/surfaces/src-app-instalar-page-tsx.md). Referência de documentação: [Impeccable document](../../.agents/skills/impeccable/reference/document.md). O espelho [design.json](../../.impeccable/design.json) é derivado dos tokens e não substitui sua autoridade.
- Apresentação e estados: [InstallGuide](../../src/components/pico/InstallGuide.tsx), [InstallInvitation](../../src/components/pico/InstallInvitation.tsx), [install.css](../../src/app/install.css), [rota](../../src/app/instalar/page.tsx) e [regras de instalação](../../src/lib/install-guide.ts).
- Ordem da jornada: [GuidedOnboarding](../../src/components/pico/GuidedOnboarding.tsx), [OfficialWelcome](../../src/components/pico/OfficialWelcome.tsx) e [PwaExperience](../../src/components/pico/PwaExperience.tsx).
- Fundação e ativo: [globals.css](../../src/app/globals.css), [Button](../../src/components/ui/Button.tsx), [registro da capa Pico Club](../brand-exploration/aura-manteiga/pico-club/README.md), [exportações](../brand-exploration/aura-manteiga/pico-club/exports.json) e [script de composição](../../scripts/render-pico-club-icon.mjs). O PNG utilizado foi inspecionado visualmente e identificado por formato e hash.

## Aderência ao sistema existente

| Aspecto | Evidência no código e interpretação |
| --- | --- |
| Cor e identidade | O entorno herda fundo, texto, bordas, foco e estados semânticos do app. A moldura e os alvos usam Cacau/Manteiga; a última cena usa Lavanda e o ícone Pico Club existente. Não há nova paleta global. |
| Tipografia | Syne identifica o título da página. Manrope sustenta legenda, escolhas, ajuda e convite. A fonte do sistema dentro do telefone representa a interface nativa do navegador; não altera as famílias do produto. |
| Controles | Reprodução, navegação entre etapas, instalação nativa e recusa reaproveitam `Button`. Seletores têm `aria-pressed`, altura mínima de 44px e o foco global. A ajuda usa `details`/`summary` nativos. |
| Composição | Telefone e instrução formam o centro da tarefa. O desktop usa duas colunas; até 700px o fluxo é vertical. Margens laterais móveis de 20px, reduzidas a 16px até 360px, e preenchimento com `safe-area-inset-*` preservam o espaço do dispositivo. A largura própria de 980px atende esta página de orientação. |
| Texto | Uma legenda curta por cena, progresso numérico, nomes reconhecíveis dos comandos e ajuda complementar recolhida. A cena final diz “Assim fica na sua tela”; o rótulo de demonstração orienta fazer os passos no navegador. |
| Movimento | Folhas do Safari entram de baixo; menus do Chrome entram de cima. As entradas usam 220ms e a mesma curva do token `motion-ease`, declarados localmente no CSS. O indicador vazado marca o controle sem preencher seu centro; confirmação e toggle recebem contorno ajustado ao alvo. |
| Ritmo e controle | O intervalo implementado é 4.200ms por etapa. Há uma passagem e parada na última cena, com ação Rever. Pausa, avanço e retorno são explícitos. Visibilidade da aba e interseção da área suspendem o relógio e o movimento. Movimento reduzido começa pausado e remove animações CSS. |
| Acessibilidade sem simulação de controle | O telefone é uma figura `aria-hidden`; os comandos desenhados não são botões falsos. Uma descrição equivalente fora da figura explica cada etapa para tecnologia assistiva. O anúncio é desativado durante a reprodução automática e fica educado nas mudanças controladas. |

As cores literais claras, os azuis/verdes, os raios e as sombras dos menus ficam restritos ao desenho de Safari/Chrome. São elementos didáticos que representam outro software, não novos tokens nem componentes canônicos do Pico. O telefone permanece claro no tema escuro; o entorno utiliza os papéis escuros do produto. A legibilidade da composição e o comportamento com zoom dependem das capturas e verificações finais da rodada.

## Convite após as etapas anteriores

`installationJourneyReady` exige perfil completo, boas-vindas resolvidas, tutorial `complete` ou `dismissed`, ausência da tela final do tutorial e ausência de edição. Tutorial pausado continua pendente. `OfficialWelcome` sinaliza pendência antes da consulta e só libera a condição após resposta sem pendência ou reconhecimento bem-sucedido; erro não libera o convite. Essas condições não substituem admissão nem concedem acesso social.

O convite existe somente no Início conectado, em dispositivo móvel fora do modo instalado. Aguarda 15 segundos sem interação; diálogo, menu, formulário em foco, edição, aba oculta ou falta de conexão adiam a apresentação. Fica no fluxo ao fim do conteúdo, com “Ver como” e “Agora não”, sem modal automático ou abertura automática do guia.

A apresentação é marcada em preferência local por identidade. Abrir o guia ou recusar encerra a oferta; a preferência antiga de dispensa também é respeitada. Quando armazenamento local não está disponível, a garantia se limita à montagem atual do componente. A página de instalação continua acessível por escolha da pessoa, inclusive sem receber o convite.

## Proveniência do raster utilizado

O único raster referenciado pelos dois componentes é [`public/icons/pico-club-192.png`](../../public/icons/pico-club-192.png). É um ativo anterior a esta extensão, introduzido no commit `61bb705` (`feat: replace app icon with Pico Club grain identity`). Identificação durante a inspeção: PNG RGB opaco de 192 × 192 pixels, SHA-256 `7327ca5d7fee387e3d59d0c9cc708c6948a5f62e1c93eabe83224629fb4dc6e8`.

Sua composição registrada usa os contornos originais de `logo/wordmark-cacau.svg`, a linha “Clube” em Manrope 300 convertida em contornos e fundo Manteiga/Lavanda com grão reproduzível por semente fixa. O [mestre `icon.svg`](../brand-exploration/aura-manteiga/pico-club/icon.svg), o script e o inventário de exportações ligam o arquivo de entrega à composição. O nome de instalação “Pico Club” e a grafia “Clube” na arte seguem a decisão do responsável documentada na capa.

O guia apenas reapresenta esse arquivo em tamanhos de 32 a 64px; o convite usa 48px. Arredondamentos são aplicados pela composição CSS. Nenhuma geração de imagem, troca de logo, nova fotografia ou regeneração do ativo foi realizada neste handoff. As demais figuras são HTML/CSS e ícones vetoriais Lucide. Capturas da revisão são evidências do produto, não ativos incorporados à interface.

## Limites e manutenção documental

O desenho simplifica menus nativos, com alternativas de Safari e ajuda para variações de nomenclatura. Assistir não instala o aplicativo. O prompt nativo exige ação explícita quando disponível; aceite do prompt recebe mensagem para conferir no aparelho. O estado instalado depende de `appinstalled` ou standalone, não da última figura. Esta inspeção não valida instalação, relançamento, atualização do ícone ou safe areas em aparelho físico e não acrescenta suporte offline.

O handoff recebido informa correções no indicador, nas safe areas e na entrada do menu Chrome; esses ajustes estão presentes no código consultado. O parecer visual final depende da recaptura do lote corrigido. Nenhum resultado de CI, build ou teste final é inferido da existência dos arquivos de evidência.

Há uma divergência preexistente fora desta superfície: o exemplo “Superfície de publicação” em `.impeccable/design.json` ainda usa `border: 0`, enquanto a regra posterior de `.post-card` em `src/app/social.css` aplica o contorno do refino social já registrado em `docs/pico-design-system.md`. Uma futura atualização do espelho deve refletir esse contorno; nenhum reparo foi feito aqui. As primitivas omitidas no frontmatter de `DESIGN.md` são uma decisão documental expressa para preservar as fontes canônicas, não uma lacuna a preencher nesta tarefa.

A extensão de instalação não exige alteração de `DESIGN.md` nem do espelho global: sua composição, temporização e figuras pertencem ao brief da superfície e a este registro. O intervalo de 4.200ms está explicitado no brief da superfície. O único arquivo criado por este handoff é `docs/install-guide-review/design-review.md`; plano, Deslopify, changelog, validação final e publicação permanecem sob responsabilidade da rodada principal.
