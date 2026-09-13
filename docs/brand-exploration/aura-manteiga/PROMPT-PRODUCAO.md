# Prompt para implementar e publicar a identidade Aura Manteiga

Copie o texto abaixo para uma nova tarefa no projeto Pico.app. Ele autoriza a implementação e, depois das verificações, a publicação pelo fluxo existente. Esta preparação do prompt não executou a publicação.

---

Implemente integralmente a identidade visual **Pico Social / Aura Manteiga** no aplicativo real deste repositório e publique a versão validada no ambiente principal existente. A estética Aura e a paleta Manteiga já foram escolhidas por mim; não reabra a escolha de conceito, fonte ou paleta. Trabalhe como designer sênior e engenheiro de frontend, concluindo a adaptação visual de todas as superfícies existentes.

## Fonte de verdade

1. Leia `AGENTS.md`, `docs/pico-product-plan.md`, `docs/deslopify.md`, `docs/pico-design-system.md`, `docs/pwa-roadmap.md`, `docs/OFFICIAL_COMMUNITY_AUTH.md`, `docs/POST_GAME.md`, `docs/GITHUB_GOVERNANCE.md` e `docs/ENVIRONMENTS.md`. Confira o código atual; documentos históricos podem descrever restrições já substituídas.
2. A identidade escolhida está em `docs/brand-exploration/aura-manteiga/`: `MANUAL.md`, `tokens.json`, `tokens.css`, `logo/`, `fonts/`, `IMPLEMENTACAO.md` e `manual.html`. O PDF consolidado é `output/pdf/Pico-Social-Manual-Aura-Manteiga.pdf`.
3. A referência comparável de todas as telas é `docs/brand-exploration/aura-cores.html?palette=manteiga&screen=profile&mode=light`, com versão escura disponível. O PDF anterior `docs/brand-exploration/Pico-Social-Identidade.pdf` é histórico; sua recomendação de Ritual e a lavanda original não prevalecem sobre Aura Manteiga.
4. Use as skills locais `brand-identity`, `brand-style-guide`, `art-direction` e `impeccable` conforme a etapa. Reaproveite a direção aprovada; não gere uma nova identidade por defaults dessas skills. Leia a documentação da versão instalada do Next.js antes de alterar suas APIs.

## Resultado visual obrigatório

- Marca: Pico Social, assinatura curta Pico. Slogan: “O ponto de encontro da areia.” Campanha: “Me acha no Pico.” Aura Manteiga é o nome interno da direção, não um novo nome comercial do aplicativo.
- Paleta fixa: Manteiga `#F2E3B5`, Cacau `#44342F`, Papel `#F8F3E7`, Lavanda de apoio `#CBBBE0`. Nenhum verde-água ou cobalto legado deve continuar como acento padrão de marca. Preserve cores próprias de conteúdo enviado por usuários e identidades de arenas/comunidades.
- Claro: fundo `#F8F3E7`, superfície `#FCF9F3`, texto `#44342F`, secundário `#73665F`, destaque suave `#F4E9C9`, borda funcional `#958A82`, botão cacau com texto papel.
- Escuro: fundo `#282121`, superfície `#352E2B`, texto `#F8F3E7`, secundário `#C4BEB6`, destaque suave `#4A423A`, borda funcional `#7D7772`, botão manteiga com texto cacau.
- A entrada editorial mantém o campo manteiga com texto cacau em ambos os modos. Em telas de operação, use os tokens semânticos do modo, com predominância de superfícies calmas. A lavanda é apoio pontual, não cor de texto sobre papel.
- Syne 600–800 nas aberturas, títulos e momentos de marca; Manrope 400–700 em corpo, campos, navegação e ações. Carregue somente as duas famílias WOFF2 locais via `next/font/local`, preservando suas licenças OFL. Use as faixas variáveis dos arquivos e fallbacks corretos. O logo é o SVG em contornos; não redigite “pico”, não acrescente o ponto do logo antigo e não recrie com uma fonte parecida.
- Corpo e valores de input com 16 px; labels 14 px; metadados 13 px; navegação no mínimo 12 px com toque de 44 px. Aberturas em 32–64 px conforme largura; títulos de página 28–36 px. Use as medidas de produção do manual, não copie os textos pequenos das miniaturas no PDF. Sem truncar nomes, informações de privacidade ou ações essenciais.
- Curvas editoriais assimétricas em capas e destaques, usadas com contenção. Controles 16 px de raio, cards 22 px e painéis 30 px; pílulas e avatares seguem seus formatos. Preserve composições específicas de pessoas, comunidades, arenas, publicações e diário privado. As curvas não devem recortar rostos ou esconder texto.
- Interfaces com leitura clara, espaço livre e fotografia como protagonista. Evite gradientes decorativos, blur em tudo, sombras em cada card e excesso de caixas. Preserve a acessibilidade dos diálogos e a estrutura funcional.
- Movimento breve em 160/220 ms; 280 ms reservado à marca. Respeite `prefers-reduced-motion`. Nenhuma animação obrigatória para entender ou usar a interface.

## Implementação no código real

1. Preserve trabalho existente; crie uma branch `codex/` para esta alteração. Atualize plano e Deslopify antes de codar. Faça inventário dos tokens, cores literais, imagens, fontes, componentes e rotas atuais.
2. Integre `tokens.json`/`tokens.css` aos tokens existentes de `src/app/globals.css` e ao `@theme inline`. O CSS fornecido é um mapa de migração, não um override para colar ao final. Remova conflitos e aplique os tokens nos pontos de uso. Atenção ao alias atual `--color-sand: var(--accent)`, que precisa deixar de confundir areia de marca e ação; também confira `--green`, estados hover e `::selection`.
3. Adapte `social.css`, `social-pages.css`, `forms.css`, `journey.css`, `profile.css` e `onboarding.css`, inclusive valores fixos de preto/branco/verde, placeholders, avisos PWA, badges, painéis, menus e estados. `select.input` tem `color-scheme: dark` fixo e precisa acompanhar o modo.
4. A referência editorial é clara. Implemente claro e escuro seguindo `prefers-color-scheme` inicialmente, com `color-scheme` e metadados coerentes e sem flash de tema errado. Não introduza preferência persistida, tabela ou recurso de conta só para o tema. Se o código atual já tiver seleção de tema, preserve sua escolha explícita e adapte os dois conjuntos de tokens.
5. Atualize `Brand.tsx`, `layout.tsx`, `icon.svg`, `favicon.ico`, `apple-icon.png`, `manifest.ts` e os ícones em `public/icons`. Use os ativos entregues. Preserve `id`, `scope`, `start_url`, nome por ambiente e fluxo atual de instalação. O maskable tem arquivo próprio e fundo completo: não use a versão com cantos transparentes como maskable. Atualize as cores de interface do navegador; confira todos os ícones antigos para evitar marca mista.
6. Reaproveite `Button`, `Input`, `ChoiceChip`, `Modal`, `Avatar`, `BottomNav`, `AppShell` e componentes de domínio conectados/demo. Preserve React/Next.js App Router e o fluxo de dados. Server Components continuam padrão; crie componentes cliente apenas quando a interação exigir.
7. Cubra entrada, autenticação, confirmação/recuperação/redefinição/acesso, Início, Pessoas, Comunidades e gestão, Arenas e gestão, perfis e editor, Meus jogos/registro/compartilhamento, posts/compositor, conta, privacidade, instalação, convites, administração, tutorial e mensagens institucionais. Inclua menu, modal, loading, vazio, erro, sucesso, foco, seleção, hover e disabled.
8. A navegação segue Início/Pessoas/Comunidades/Arenas/Perfil. Jogos ficam em perfil/conta; `/checkin` continua redirecionando para `/jogos`. Os 32 estudos não são instrução para criar 32 rotas nem trocar o tutorial existente por um novo fluxo.
9. Aplique as regras às fotos reais e vazios existentes. Não envie fotografias sintéticas do estudo ao Supabase nem as transforme em fotos de pessoas, arenas ou comunidades reais. Não substitua conteúdo, rótulos de audiência, formulários completos ou termos jurídicos por textos resumidos dos mockups. Peças de campanha permanecem exemplos separados do feed real.

## Comportamento e dados preservados

Mantenha cadastro aberto com confirmação de e-mail, admissão vigente, suspensões/revogações/exclusão, sessão, autenticação, permissões, RLS, convites, papéis e audiências. Registros de jogo são retrospectivos privados; compartilhar é ação separada, com destinatário/audiência explícitos e snapshot da data. Não adicione presença ao vivo, reservas, pagamentos, IA, ranking ou novas funcionalidades de produto. Não crie migrations para uma atualização visual. Não altere URLs/chaves de ambiente nem registre segredos. Demo deve continuar explicitamente identificado, local e separado do ambiente conectado.

## Verificação antes de publicar

Execute `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`, além do smoke pertinente do app real. Compare capturas antes/depois em 320, 390, 430, 768 e 1440 px nos dois modos. Confira aumento de texto a 200%, nomes longos, conteúdo vazio/denso, teclado virtual, teclado/Tab/Escape, foco que retorna ao acionador, navegação fixa e safe areas.

Calcule o contraste no CSS final: texto comum mínimo 4,5:1; texto grande 3:1; limites/ícones funcionais relevantes 3:1. Não sinalize apenas por cor. Teste fontes locais, acentos pt-BR, fallback, ausência de overflow, carregamento de fotos e ícones, cookies/sessão e ausência de gravações involuntárias. Confira favicon/Apple/manifest/maskable e comportamento instalado quando houver dispositivo disponível. Não declare validação em aparelho físico ou Supabase real sem tê-la realizado. Os testes do manual não substituem QA da implementação.

## Entrega e publicação autorizada por este prompt

Atualize `docs/pico-design-system.md` para refletir a identidade implementada, o plano, Deslopify e changelog. Faça commits coerentes; abra PR e respeite os checks/proteções do repositório. Não force push nem contorne a CI. Com verificações aprovadas e a alteração integrada à `main`, sincronize `origin/main`, confirme árvore limpa e publique pelo `scripts/deploy.mjs`/`npm run deploy` no projeto Vercel existente **pico-app**, domínio **pico-app-sepia.vercel.app**, conforme as guardas atuais. Não crie outro projeto ou use `cycle-9-internal` como destino. Preserve o Supabase principal e seus dados.

Após publicar, confira `/api/version`, manifesto, assets e smoke visual público; registre o commit servido e o resultado. Se uma guarda, credencial ou verificação impedir a publicação, resolva o que estiver no escopo e descreva exatamente o impedimento, sem declarar deploy concluído. Preserve uma referência à última versão estável para rollback pelo procedimento existente. Esta instrução já autoriza implementar e publicar após os gates; não peça novamente confirmação para as etapas aqui descritas.

Ao finalizar, entregue URL, commit, resumo das superfícies atualizadas, evidências visuais, verificações e limitações reais. Continue até concluir o trabalho autorizado; não pare em um plano ou em uma landing page isolada.

### Bordas sobre superfícies elevadas

`border-control` atende os fundos padrão e de campo. Quando o limite funcional estiver sobre `surface-raised` ou `accent-soft`, usar `border-control-raised`: `#84786F` no claro e `#9D948C` no escuro. As bordas decorativas continuam discretas; os 50 pares auditados incluem estes contextos adicionais.
