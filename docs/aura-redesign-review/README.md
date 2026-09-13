# Aura Manteiga — implementação e revisão do app

Redesign integral sobre `3bd6dc4`, em `codex/aura-manteiga-redesign`, solicitado e autorizado em 13/09/2026. O manual aprovado define identidade; APIs, contratos de domínio, autorização e dados existentes definem comportamento. [Cobertura completa por domínio e rota](coverage.md).

## O que mudou

- Sete folhas CSS integradas aos tokens claro/escuro, seguindo o dispositivo sem novo estado de conta. Papéis funcionais de borda, foco, seleção, hover, erro, sucesso e disabled; entradas nativas acompanham o modo.
- Logo original em contornos; Syne e Manrope WOFF2 locais com OFL. Favicon, Apple, SVG, ícones 192/512 e maskable próprios. Fotos existentes e mídia de usuários preservadas; nenhuma imagem sintética do estudo foi enviada ao backend.
- Entrada editorial Manteiga, autenticação, navegação, Início compacto, perfil aberto e formulários com menos repetição. Pessoas, comunidades, arenas, posts e jogos mantêm composições específicas. Gestão, conta, convites, administração, instalação e privacidade recebem a fundação compartilhada.
- Perfil inicial mostra preenchimento dos três dados essenciais e separa detalhes opcionais. Convite e guia mais curtos, “Mostrar onde” e “Pausar” visíveis. As seis etapas e `pico.tour.v1:account:<id>`/`pico.tour.v1:demo` permanecem; aviso institucional continua reconhecido por conta no servidor. Nenhuma ação social é executada pelo passeio.

## Evidências e verificações

Capturas do app Next real compilado, com APIs substituídas por fixtures locais do repositório. Rede externa bloqueada. Nomes, fotos, relações e métricas das capturas são dados de teste, sem comprovação de contas reais. Arquivos `before-*` mostram o baseline anterior. Os demais são viewports finais; conteúdo abaixo da dobra continua rolável. Referências visuais: manual completo de 32 páginas e galeria Aura/Manteiga. Não houve uma nova exploração de marca.

| Verificação | Resultado local |
| --- | --- |
| Lint, typecheck e build conectado | Passaram |
| Build demo explícito | Passou, sem configuração Supabase |
| `npm test` | 87/87 passaram |
| [Onboarding conectado](onboarding/checks.json) | Oito grupos de comportamento, oito layouts, zero gravações sociais ou erros JS |
| [Onboarding demo](onboarding/demo-checks.json) | Seis etapas, persistência local distinta, somente `/api/version` |
| [Formulário de perfil](profile-smoke.json) | Falha preserva texto, descarte permite continuar, um salvamento confirmado, nome longo com acentos sem overflow |
| [Jogos](games/checks.json) | Criar/corrigir/excluir, redirect `/checkin`, data futura, falha/repetição sem duplicar, rascunho e Escape |
| [Amostra visual](visual-checks.json) | 39 verificações; zero overflow horizontal, imagens visíveis quebradas ou erros JS |
| [Contraste renderizado](rendered-contrast.json) | Textos sólidos da amostra atingem 4,5:1 ou 3:1 para texto grande |
| [CSS final e assets](assets-contrast.json) | 50 pares sólidos aprovados; dez arquivos idênticos aos mestres; contornos preservados; maskable 512 opaco |
| Fontes e fallback | Somente dois WOFF2 de mesma origem; ambas carregadas; texto pt-BR e fallback sem overflow a 320 px |
| [Detector](detector.json) | Nenhum achado nos targets alterados |
| [Revisão independente](finish-review.md) | `ship` no escopo dos dois ajustes: rótulos repetidos removidos e navegação sem hifenização |

Amostra representativa: 320/390/1280 px e ambos os modos. Regressão do guia amplia para 430/768, altura curta, texto 200%, teclado/foco, reduced motion, vazio/erro, outra conta/aba e armazenamento negado. Os roteiros existentes ganharam opções de canal/URL/diretório para uso local, mantendo checks. Dois seletores antigos de jogos foram ajustados ao texto/contexto já vigente (resumo de compartilhamento e aviso oficial independente).

O PR executa também o check existente de perfil em Chromium/WebKit, cobrindo edição repetida, revalidação sem perder rascunho, falha/salvamento, navegação por teclado, recorte, uploads de imagem/HEIC e retorno de foco. A evidência remota desse check pertence ao PR; não confundir com os testes locais acima.

## Capturas representativas

[Entrada clara](arrival-light-390.png) · [Entrada escura](arrival-dark-390.png) · [Início claro](feed-light-390.png) · [Início escuro](feed-dark-390.png) · [Desktop](feed-light-desktop.png) · [Perfil claro](profile-light-390.png) · [Perfil escuro](profile-dark-390.png) · [Editor](editor-light-390.png) · [Configuração inicial](setup-light-390.png) · [Aviso oficial](official-light-390.png) · [Compositor](composer-dark-390.png) · [Comunidades 320](communities-light-320.png) · [Arena](arena-light-390.png) · [Guia claro](tour-light-390.png) · [Guia escuro](tour-dark-390.png).

## Publicação e limites

Esta documentação fecha a implementação antes dos gates remotos. O pedido autoriza PR, CI, merge protegido e publicação de `main` pelo `npm run deploy` no projeto Vercel **pico-app**, em **pico-app-sepia.vercel.app**. O recibo operacional local `.vercel/aura-redesign-release.json` registra PR/checks, revisão anterior/rollback, artefato publicado e resposta de `/api/version`, sem segredos. A revisão efetivamente pública pode ser conferida em [api/version](https://pico-app-sepia.vercel.app/api/version). Publicação não é inferida das capturas locais.

Nenhuma migration, tabela, variável de ambiente, permissão ou dependência foi alterada. Registros de jogo continuam privados, com compartilhamento separado e snapshot. Sem nova validação de Supabase real, envio/entrega de e-mail, instalação em aparelho físico, safe areas/teclado físico ou pesquisa com jogadores. SMTP configurado para divulgação continua pendente; não há novo service worker ou fila offline. Auditoria de contraste cobre pares sólidos e amostra renderizada, não uma certificação integral de acessibilidade.
