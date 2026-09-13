# Pico Social — três propostas de identidade

**Identidade escolhida e consolidada:** [Pico Social / Aura Manteiga](aura-manteiga/README.md). O [novo manual](aura-manteiga/manual.html), os [ativos](aura-manteiga/Pico-Social-Aura-Manteiga.zip) e o [prompt de implementação/publicação](aura-manteiga/PROMPT-PRODUCAO.md) incorporam a decisão posterior do responsável. As comparações abaixo preservam o histórico da exploração.

Estudo de 13/09/2026 para a direção **editorial de moda: jovem, expressiva e refinada**. As alternativas iniciais são **Ritual**, **Pulso** e **Aura**; o aplicativo continua se chamando Pico Social. O responsável escolheu **Aura para continuar a exploração**, pedindo somente novas cores. A paleta final ainda não foi escolhida e o estudo não foi aplicado ao produto.

**Entrega mais recente:** [Aura em seis paletas](aura-cores.html?screen=profile&palette=all&mode=light), com as mesmas 32 telas, claro/escuro, logo, tipografia, fotos e composição. [Guia das cores](AURA-CORES.md) · [Prancha comparativa](preview/aura-palettes-welcome.png) · [Tokens das paletas](aura-palettes.json).

## Abrir o estudo

- [Galeria interativa](index.html): escolha uma tela, compare as três identidades e alterne claro/escuro. Também é possível abrir o arquivo diretamente no navegador.
- [Relatório visual completo, 47 páginas](Pico-Social-Identidade.pdf): posicionamento, voz, logos, regras, tipografia, cores, direção de arte, campanhas, telas e recomendação.
- [Relatório em HTML](report.html): fonte editável da versão impressa. `report.js` contém os textos; `report.css`, a composição editorial.
- [Comparação de feed](preview/feed-comparison.png), [boas-vindas](preview/welcome-comparison.png) e [jogos no modo escuro](preview/games-dark-comparison.png).
- [Tokens das três identidades](tokens.json), [verificação de contraste](contrast-audit.json) e [cobertura de QA](QA.json).
- [Pacote de logos, fontes e imagens](Pico-Social-Assets.zip), com guia próprio e proveniência.

Para abrir com servidor local, a partir da raiz do repositório:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory docs/brand-exploration
```

Depois acesse `http://127.0.0.1:8765`. O servidor é apenas de leitura e não usa o backend do Pico.

## Recomendação do estudo inicial

O relatório inicial recomendou **Ritual**, aproximando refinamento editorial e encontros na areia. A preferência posterior do responsável por **Aura** orienta a continuidade. Na exploração cromática da Aura, a recomendação é **Pistache**, seguida de **Azul névoa**. São julgamentos autorais a partir do briefing, sem teste de preferência com público nesta etapa.

| Direção | Cores principais | Tipografia | Personalidade |
| --- | --- | --- | --- |
| Ritual | Vinho `#521F35`, areia `#F5ECDD`, terracota `#E96B43`, oliva `#667348` | Bodoni Moda + Manrope | Editorial, solar, refinada |
| Pulso | Cobalto `#254CF1`, noite `#101735`, gelo `#EDF2FA`, lima `#D9F56E` | Bricolage Grotesque + Manrope | Gráfica, energética, coletiva |
| Aura | Figo `#302238`, lavanda `#C7B5E8`, coral `#FF9878`, papel `#F6F1E9` | Syne + Manrope | Artística, sensorial, acolhedora |

Os modos escuros têm pares próprios de fundo, texto e ação. Não inverter cores automaticamente: usar os tokens documentados.

## O que está entregue

São **32 telas e estados por identidade, em dois modos: 192 combinações na galeria**. O PDF reúne as 96 primeiras vistas claras e 12 vistas escuras selecionadas; conteúdo abaixo da dobra é rolável na galeria.

Cobertura: boas-vindas, login, cadastro, recuperação e redefinição de senha, confirmação de e-mail, restrição de acesso, feed, descoberta, comunidades, detalhe/criação/gestão de comunidade, arenas, detalhe/gestão de arena, perfil próprio e público, edição de perfil, jogos privados, registro, compartilhamento separado, publicação, composição, conta, privacidade, instalação, convites, administração, apresentação introdutória e estados vazio/erro/carregamento.

As páginas atuais estão mapeadas em `gallery.js`. Fluxos de formulário e estados não são promessas de novas rotas. `/checkin` continua como redirecionamento para `/jogos`. O estudo introdutório é uma apresentação visual opcional e não substitui o tutorial já existente.

Cada pasta `assets/ritual`, `assets/pulso` e `assets/aura` contém:

- `wordmark*.svg`: assinatura Pico em contornos.
- `lockup*.svg`: assinatura Pico Social em contornos.
- `mark*.svg`: símbolo vetorial.
- `app-icon-primary.svg` e `app-icon-reverse.svg`: composição de ícone 512 × 512.
- `logo-source.json`: fonte, eixos e construção usados.
- `board.png`: prancha de atmosfera gerada por IA.
- `photo.png`: fotografia editorial sintética.
- `prompts.md`: prompts exatos, fontes e inspeção.

Os arquivos sem sufixo usam `currentColor`; `-ink` e `-white` trazem as aplicações de cor. Os wordmarks partem de fontes licenciadas, com espaçamento/transformação e contornos; não são apresentados como uma nova família tipográfica autoral. Os símbolos foram construídos como vetores. As pranchas exploratórias podem variar em desenho: **os SVGs, os tokens e as telas da galeria são as propostas precisas**.

## Limites da demonstração

Pessoas, arenas, publicações, convites e registros são ilustrativos. Fotos foram geradas por IA; não retratam contas ou arenas cadastradas. Há identificação visível no estudo e nas telas.

Os controles navegam entre propostas. Filtros mostram seleção visual; ações de cadastro, senha, publicação, convite e salvamento não enviam nem persistem informações. Não existe conexão com Supabase, analytics ou publicação automática.

O registro de jogo permanece retrospectivo e privado. Compartilhar é uma ação separada com audiência e destino explícitos. Arenas e comunidades mantêm seus próprios papéis. Alterar o visual não muda admissão, suspensão, revogação, exclusão ou autorização.

As propostas de logo são suficientes para comparar direções. A escolha definitiva deve receber ajuste óptico final, teste em reprodução e verificação de disponibilidade de marca. Nenhuma busca de anterioridade foi feita. Não houve ensaio fotográfico real, teste com público, integração Figma ou deploy nesta entrega.

## Fontes e skills

Quatro famílias locais, com arquivos TTF, WOFF2 e licenças SIL OFL: Bodoni Moda, Manrope, Bricolage Grotesque e Syne. `assets/fonts/sources.json` registra origem, versão e hashes. Os glifos acentuados usados em pt-BR foram conferidos. Ícones: Lucide da dependência já instalada, com licença ISC em `assets/ICONS-LICENSE.txt`.

Oito skills instaladas em `.agents/skills`, com revisões fixadas e licenças: seis de branding da Ramp, brandkit e Impeccable. [Manifesto de instalação](../branding-skills-sources.json) e [pesquisa anterior](../PICO_BRANDING_SKILLS_RESEARCH.md). O launcher local do Impeccable teve permissão de execução corrigida; nenhum hook foi instalado. A instalação não altera os tokens do aplicativo. Uma nova sessão pode ser necessária para descoberta automática; nesta rodada os guias foram lidos diretamente.

## Reproduzir exportação e verificações

Os scripts usam Playwright com Chrome local. Defina `PICO_PLAYWRIGHT_PATH` se Playwright não estiver no ambiente de módulos padrão; `PICO_BRAND_URL` permite trocar o endereço do servidor. Não foram adicionadas dependências ao `package.json` do aplicativo.

```sh
node docs/brand-exploration/verify.mjs
node docs/brand-exploration/contrast.mjs
node docs/brand-exploration/typography-parity.mjs
node docs/brand-exploration/export.mjs
```

`build-assets.py` requer `fontTools` e `brotli` em um ambiente Python separado. Ele gera os contornos, os ícones e o WOFF2 a partir dos TTF incluídos; não gera nem edita as fotografias.

QA da proposta: cinco larguras (320, 390, 768, 1024 e 1440), 960 verificações de telefone, carregamento de imagens, navegação e ações explicitamente locais. A auditoria de 82 pares sólidos de texto passou nos limites de contraste adotados. Não é auditoria completa WCAG: exclui imagens, limites de controles e testes com tecnologias assistivas. O PDF foi exportado com texto e vetores, extração conferida e páginas renderizadas para revisão visual.

Documentação visual e parecer independente ficam em `DESIGN.md` e `.impeccable/review/finish-review.md`, com os limites específicos da revisão. Os arquivos de produção, dados e serviços do Pico permanecem intactos.

Correções da revisão: navegação canônica restaurada, contrato explicitado e CSS do relatório isolado das telas. O veredito final foi `ship` no escopo desses itens corrigidos. [Paridade tipográfica](typography-parity.json): 108 telefones, 531 elementos de texto, sem diferença de família, tamanho, peso, entrelinha e espaçamento entre galeria e relatório.
