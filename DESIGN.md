---
name: Pico Social / Aura Manteiga
description: O ponto de encontro da areia.
---

# Design System: Pico Social / Aura Manteiga

## Overview

**Creative North Star: "Aura Manteiga"**

Editorial de moda jovem, artístico e refinado, com calor no encontro e clareza na operação. A expressão vem da Syne, da fotografia e do espaço; a Manrope sustenta a leitura e as ações. Premium significa cuidado com proporção e uso, com espaço para diferentes pessoas e repertórios.

Estado em 13/09/2026: identidade aplicada ao aplicativo e verificada localmente. Este documento descreve o sistema implementado; a revisão publicada depende do PR e do recibo operacional, conforme as [evidências](docs/aura-redesign-review/README.md).

**Autoridade:** o [manual completo](docs/brand-exploration/aura-manteiga/MANUAL.md) e seus [tokens canônicos](docs/brand-exploration/aura-manteiga/tokens.json) definem a identidade; [globals.css](src/app/globals.css) e os componentes definem a aplicação. O [design system de implementação](docs/pico-design-system.md) mapeia esses usos. O frontmatter contém somente metadados para evitar outra fonte de tokens. O [sidecar](.impeccable/design.json) é um espelho derivado para ferramentas, vinculado às variáveis do app, sem autoridade para alterar a marca. [PRODUCT.md](PRODUCT.md), [BRIEF.md](BRIEF.md) e [domínios](docs/pico-domains.md) mantêm os limites de produto.

**Key Characteristics:**

- Papel e Cacau na leitura; Manteiga no reconhecimento; Lavanda pontual.
- Títulos expressivos, operação legível e superfícies sólidas.
- Composição orientada ao conteúdo, com curvas editoriais em momentos específicos.
- Uma ação principal por contexto, foco visível e movimento reduzível.

## Colors

### Primary

Manteiga identifica a marca; Cacau estrutura texto, logo e ações. O botão principal usa o par semântico `accent`/`accent-ink`: Cacau/Papel no claro e Manteiga/Cacau no escuro. A entrada pública preserva o campo Manteiga e texto Cacau nos dois modos.

### Secondary

Lavanda participa de detalhes e fundos com Cacau. Não substitui estados de sucesso, erro ou seleção por semelhança de cor.

### Neutral

Papel sustenta o claro; o escuro tem fundos e superfícies quentes próprios. `foreground`, `text-secondary` e `text-muted` preservam a hierarquia. `border-subtle` separa conteúdo; limites de controles usam `border-control`, com `border-control-raised` sobre superfícies elevadas ou suaves. Valores completos ficam em `modes` do arquivo canônico, aplicados em `:root` e `prefers-color-scheme: dark` no CSS.

Sucesso, atenção, erro e informação usam seus pares de texto/fundo e uma indicação textual ou semântica. Foco e seleção têm papéis próprios. As cores de fotografias e mídia de pessoas permanecem preservadas.

## Typography

Syne local nos títulos e aberturas, com fallback Arial; Manrope local na leitura, navegação, campos e ações, com fallback de sistema. [layout.tsx](src/app/layout.tsx) carrega somente as duas famílias WOFF2 via `next/font/local`, com `display: swap` e licenças OFL junto aos arquivos. O logo é o SVG em contornos, não texto composto com a fonte.

A escala implementada usa corpo/campos de 1rem, labels de .875rem e metadados de .8125rem. Seções usam 1.5rem e diálogos 1.375rem; títulos de página variam de 1.75rem a 2.25rem e aberturas de 2rem a 4rem. Títulos de operação usam predominantemente peso 600; a abertura usa 700. A navegação móvel começa em .75rem. Usar os tokens existentes e consultar a composição real para entrelinha, peso e exceções, sem copiar a escala reduzida das miniaturas do manual.

Títulos equilibram as linhas; nomes e conteúdo longo podem quebrar. Labels persistentes identificam os campos. Não repetir uma categoria acima de um título que já a comunica.

## Layout

Mobile-first, com margens laterais de 20px e 16px abaixo de 360px. O conteúdo social tem largura máxima de 680px. A partir de 800px, a navegação ocupa a lateral; a partir de 1160px, entra a coluna contextual e o miolo passa a até 620px. A entrada tem composição própria, com coluna editorial de autenticação a partir de 1000px.

A navegação inferior distribui cada destino pela largura necessária ao rótulo. Pode formar outra linha quando o texto aumenta, sem hifenizar palavras; a altura medida reserva espaço ao fim do conteúdo. O texto e as ações permanecem no fluxo, incluindo títulos longos, audiência e mensagens de privacidade.

O ritmo parte de quatro pixels. Pessoas usam linhas de identidade; comunidades mostram propósito e condições; arenas destacam o lugar; posts priorizam conteúdo; jogos mantêm cronologia privada. Essas diferenças não exigem uma nova biblioteca de controles para cada destino.

## Elevation & Depth

Superfícies sólidas e diferenças tonais organizam a leitura. Posts e perfis não dependem de sombra. O token `shadow-elevated` atende diálogos e guia sobreposto; o diálogo também usa backdrop escurecido. Os nomes de compatibilidade `glass` e `GlassPanel` referem-se hoje a superfícies opacas, sem um material de vidro.

Interações usam os tempos existentes de 160/220ms; 280ms fica disponível para expressão de marca. A curva é a do token `motion-ease`. `prefers-reduced-motion` remove animações e transições, mantendo feedback por estado e texto.

## Shapes

Controles têm raio de 16px, cards de 22px e painéis de 30px; pílulas usam 999px e avatares são circulares. A curva assimétrica de destaque aparece em entrada, convites editoriais, vazios e capas de arena. Não aplicar a mesma silhueta a todo bloco ou recortar informações essenciais. Os SVGs mestres preservam proporção, contornos e proteção.

## Components

- **Botões:** variantes primary, secondary e quiet do componente existente; tamanhos small/default/large com mínimos de 44/48/52px. Hover, pressionado e disabled usam papéis próprios; o foco externo permanece visível.
- **Campos:** label persistente, corpo de 16px, altura mínima de 50px, superfície de entrada e borda funcional. Erro próximo ao campo e `aria-invalid`; texto de ajuda associado ao controle. Busca e comentários reforçam a borda ao receber foco.
- **Seleções:** `ChoiceChip` conserva checkbox nativo, check visível e foco no contorno; filtros mantêm estado selecionado além do texto. Pílulas de modalidade são informação, salvo quando o componente é um controle explícito.
- **Navegação:** Início, Pessoas, Comunidades, Arenas e Perfil. Ícones Lucide a 22px, traço 1,7 e 2 no destino ativo; seleção combina peso, cor, fundo e `aria-current`. Sem quebra arbitrária dos rótulos.
- **Conteúdo:** post em superfície calma; identidade pessoal em linha aberta; fotografia de arena com recorte editorial. Dados demonstrativos permanecem identificados. Audiência e data do jogo não viram decoração descartável.
- **Diálogos:** superfície opaca, cabeçalho e fechamento acessíveis, corpo rolável, Escape, foco contido e retorno ao acionador. Compositor preserva rascunho ao fechar e reabrir.
- **Assistência:** configuração inicial, aviso institucional e tutorial são superfícies distintas. O guia tem pausa e retomada, aponta controles reais e recolhe a dica em “Mostrar onde”; o passeio não realiza ações sociais.

## Do's and Don'ts

### Do:

- **Do** reutilizar tokens, SVGs e componentes canônicos, verificando a aplicação nos dois temas.
- **Do** preservar leitura, foco, alvos de toque e ações acessíveis com texto ampliado.
- **Do** editar títulos e rótulos para que cada linha acrescente informação.
- **Do** manter audiência, privacidade, estado real e identificação de demonstração visíveis.

### Don't:

- **Don't** extrair cores de capturas, regenerar o logo ou adicionar outra família tipográfica.
- **Don't** hifenizar a navegação, cortar ações ou ocultar avisos para encaixar conteúdo.
- **Don't** substituir fotos reais por imagens sintéticas do estudo ou inventar métricas.
- **Don't** tratar evidência local, mockup ou manual como comprovação de publicação ou de uso real.
