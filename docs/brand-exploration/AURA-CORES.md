# Pico Social — Aura em novas cores

O responsável escolheu a linha Aura e pediu somente alternativas de cor. Este complemento de 13/09/2026 preserva logo, Syne + Manrope, fotografias, formas, espaçamento, composição, conteúdo e navegação. A paleta final ainda está em exploração.

[Abrir a comparação](aura-cores.html?screen=profile&palette=all&mode=light) · [Boas-vindas nas seis paletas](preview/aura-palettes-welcome.png) · [Perfil nas seis paletas](preview/aura-palettes-profile.png) · [Cores e tokens completos](aura-palettes.json)

## As seis paletas

| Paleta | Tinta | Cor principal | Apoio | Papel | Direção cromática |
| --- | --- | --- | --- | --- | --- |
| Lavanda original | `#302238` | `#C7B5E8` | `#FF9878` | `#F6F1E9` | Referência original: artística e suave. |
| Pistache | `#26362C` | `#D6DFC0` | `#F39B80` | `#F5F3E9` | Verde profundo e pistache, com coral pontual. Orgânica e sofisticada. |
| Azul névoa | `#23344A` | `#C2D7EB` | `#E9A185` | `#F3F4F1` | Azul suave e tinta azulada, com pêssego. Leve e contemporânea. |
| Rosa mineral | `#4F2C3B` | `#E7C4D2` | `#BBCDB7` | `#F7F0EC` | Rosa seco e ameixa, com contraponto verde. Editorial e afetiva. |
| Maré | `#173D40` | `#BFDAD5` | `#E49A80` | `#F3F1E8` | Petróleo e verde-água, com acento quente. Fresca e refinada. |
| Manteiga | `#44342F` | `#F2E3B5` | `#CBBBE0` | `#F8F3E7` | Cacau e amarelo suave, com lavanda. Solar e discreta. |

Minha recomendação é **Pistache** para continuar a Aura com uma presença orgânica e sofisticada; **Azul névoa** como segunda alternativa. **Rosa mineral** aproxima mais a proposta do editorial de moda solicitado. São avaliações autorais a partir do briefing, sem pesquisa de preferência com público.

## Como as cores se comportam

A tinta sustenta texto, assinatura e ações no modo claro; o papel é a base. O pastel ocupa os mesmos destaques e a mesma abertura da Aura original. No modo escuro, os fundos recebem um tom profundo da família e o pastel assume ações e destaques. Os pares completos estão em `aura-palettes.json`; não usar inversão automática.

A cor de apoio serve para detalhes e campanhas. Ela aparece nas amostras de paleta, mas não foi criada uma nova região na interface apenas para exibi-la. Erro, foco e texto secundário conservam seus papéis semânticos. As fotografias têm as cores originais, sem filtros ou nova geração.

Os SVGs da Aura são recoloridos na galeria preservando exatamente seus contornos. Os arquivos mestres em `assets/aura` continuam na cor original; o JSON fornece as novas cores para aplicação futura. A galeria funciona também por abertura direta do HTML e usa fontes locais.

## Cobertura e conferência

As mesmas 32 telas e estados estão disponíveis nas seis paletas e nos dois modos: **384 combinações**. O estudo abre no perfil, permite escolher qualquer tela, isolar uma paleta ou comparar todas. Pessoas, fotos e dados continuam ilustrativos; ações apenas navegam entre estudos, sem salvar ou enviar informações.

`aura-color-qa.json` registra 384 comparações e 30.156 verificações de estilo: nenhuma diferença de conteúdo, família/tamanho/peso tipográfico, entrelinha, espaçamento, dimensões, raio ou disposição entre paletas. Os 156 pares sólidos de texto auditados passam nos limiares adotados (4,5:1 para texto comum; 3:1 para texto grande). Isso não é uma auditoria WCAG completa: fotos, ícones, bordas e tecnologias assistivas não estão cobertos por essa medição.

`aura-responsive-qa.json` registra a conferência do perfil em 320, 390, 768, 1024 e 1440 px, claro e escuro, além de navegação, seleção individual, foco e download de paletas. As duas pranchas de comparação foram inspecionadas visualmente.

## Relação com o relatório inicial

O PDF de 47 páginas registra a comparação original Ritual/Pulso/Aura e a recomendação inicial de Ritual. A escolha posterior do responsável por **Aura** orienta este complemento e prevalece para a continuidade do trabalho. O PDF permanece como histórico da exploração inicial; nenhuma paleta foi aplicada ao aplicativo publicado.
