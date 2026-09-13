# Pico Social — Aura Manteiga

Identidade consolidada a partir da estética Aura, da paleta Manteiga escolhida pelo responsável e do PDF inicial. Versão 1.0, 13/09/2026. Nome de produto: **Pico Social**; assinatura curta: **Pico**. A implementação em produção será uma rodada posterior.

O [prompt principal](PROMPT-PRODUCAO.md) foi ampliado para redesign integral e onboarding assistido, com validação proporcional durante criação. Ele usa a [skill pico-redesign](../../../.agents/skills/pico-redesign/SKILL.md), o [catálogo de 13 skills](../../pico-skills.md), o [contexto institucional](../../pico-company-context.md) e o [mapa de domínios](../../pico-domains.md). O PDF e os ativos visuais permanecem na versão 1.0 escolhida; as instruções de implementação refletem o pedido posterior.

## Entregas

- [Manual visual](manual.html): 32 páginas, com logo, cores, tipografia, arte, voz, movimento, aplicações e 32 telas em cada modo.
- [Manual em texto](MANUAL.md): referência consultável e valores de cor RGB/HSL/HEX.
- [PDF consolidado](../../../output/pdf/Pico-Social-Manual-Aura-Manteiga.pdf).
- [Prompt completo para implementar e publicar](PROMPT-PRODUCAO.md) e [mapa do código atual](IMPLEMENTACAO.md).
- [Tokens JSON](tokens.json), [CSS de referência para migração](tokens.css) e [pares de contraste](contrast.json).
- [Logos e ícones](logo/): SVG, PNG e ICO; versões cacau, manteiga, papel, preto e branco. Contornos originais da Aura preservados.
- [Fontes](fonts/): Syne e Manrope em WOFF2/TTF, com licenças e hashes.
- [Post 1080 × 1350](applications/social-post.png) e [story 1080 × 1920](applications/story.png), exemplos com fotografia sintética identificada.
- [Pacote de entrega](Pico-Social-Aura-Manteiga.zip): manual, prompt, tokens, fontes, logos, exemplos e PDF em um arquivo.

Galeria navegável das 32 telas: `../aura-cores.html?palette=manteiga&screen=profile&mode=light`. Claro e escuro disponíveis. Com o servidor local da exploração em execução, abra `http://127.0.0.1:8765/aura-manteiga/manual.html`.

## Decisões

Manteiga `#F2E3B5`, Cacau `#44342F`, Papel `#F8F3E7`, Lavanda `#CBBBE0`. Syne nos títulos; Manrope na operação. O claro é a referência editorial, com escuro próprio e recomendação de acompanhar o tema do dispositivo. Curvas amplas nas capas e momentos de marca; geometria consistente em controles. Dados e fotografia do estudo não viram conteúdo real do aplicativo.

O PDF inicial mantém recomendações históricas. Esta edição e os seus tokens prevalecem para a continuidade da identidade escolhida. Medidas reais de corpo, campos e navegação estão documentadas separadamente das miniaturas de apresentação.

## Arquivos e manutenção

`manual-content.json` fornece o conteúdo de `manual.js`; `build-manual.py` gera essa fonte, a versão JavaScript e MANUAL.md. `build-identity.py` gera tokens e aplica as cores aos contornos mestres. `export.mjs` renderiza a apresentação, o PDF e os PNGs a partir de SVG/HTML. Fotografias não são editadas por esses scripts. `build-favicon.mjs` embala as versões 16/32 em ICO. `package.py` reúne os arquivos finais.

```sh
python3 docs/brand-exploration/aura-manteiga/build-identity.py
python3 docs/brand-exploration/aura-manteiga/build-manual.py
node docs/brand-exploration/aura-manteiga/export.mjs
node docs/brand-exploration/aura-manteiga/build-favicon.mjs
python3 docs/brand-exploration/aura-manteiga/package.py
```

Exportação usa Chrome local, Sharp da dependência existente e Playwright. Defina `PICO_PLAYWRIGHT_PATH` quando o runtime de Playwright estiver fora do ambiente padrão. `PICO_BRAND_URL` permite alterar o servidor da galeria. A apresentação HTML reutiliza `gallery.js`, `gallery.css`, `icons.js` e a fotografia da pasta de origem; o PDF e o pacote são independentes dessa execução local.

## Conferência e limites

`render-qa.json` registra 32 páginas/64 telefones, imagens carregadas, ausência de overflow do conteúdo editorial e de erros JavaScript. `contrast.json` calcula 50 pares sólidos, incluindo bordas em fundos elevados. `file-qa.json` registra texto/rodapés, geometria dos SVGs, dimensões de raster, favicon e margem do maskable. Páginas do PDF foram renderizadas e inspecionadas; a galeria original já foi testada em cinco larguras e nos dois modos.

Esses registros verificam os artefatos, não certificam WCAG, desempenho, registro de marca ou funcionamento do app publicado. Sem ensaio fotográfico, pesquisa primária ou teste em aparelho físico nesta edição. Nenhuma alteração de backend, fonte de dados, frontend de produção ou deploy foi executada.
