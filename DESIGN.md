# Pico Social — direção visual vigente

Referência de design do aplicativo: **Aura Manteiga**. Leia [o brief](BRIEF.md), [o design system](docs/pico-design-system.md) e [todo o manual](docs/brand-exploration/aura-manteiga/MANUAL.md) antes de um redesign integral. Inspecione também as páginas visuais de logo, cores, tipografia, arte, componentes, estados e telas em [manual.html](docs/brand-exploration/aura-manteiga/manual.html) ou no PDF consolidado em `output/pdf/Pico-Social-Manual-Aura-Manteiga.pdf`.

Fontes e valores canônicos ficam no pacote `docs/brand-exploration/aura-manteiga/`: Syne/Manrope locais, SVGs em contornos e `tokens.json`. Não criar outra cópia concorrente dos tokens nesta raiz. As miniaturas mostram direção e composição, não medidas de texto para produção.

Estado em 13/09/2026: manual aprovado e ativos entregues; `src/app/globals.css` ainda contém o sistema legado. Implemente a direção apenas quando a tarefa solicitar alterações no aplicativo. O `.impeccable/design.json` dentro da exploração registra os estudos daquele escopo, não tokens atuais do app.

Para execução integral, usar [pico-redesign](.agents/skills/pico-redesign/SKILL.md); para decisões por jornada, consultar [pico-domains.md](docs/pico-domains.md). Durante a criação, revisar uma amostra representativa e corrigir em lote; ampliar testes somente por risco, falha ou mudança. Validações obrigatórias do repositório continuam vigentes.
