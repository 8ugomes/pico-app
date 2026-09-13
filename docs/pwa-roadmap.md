> Segurança de documentos: HTML dinâmico com nonce único e `no-store`; assets de build continuam cacheáveis. Sem service worker ou armazenamento offline privado. [Revisão do beta](BETA_SECURITY.md).

# Pico — PWA no Ciclo 9

## Aura Manteiga integrada · 13/09/2026

[Aura Manteiga](brand-exploration/aura-manteiga/README.md) aplicada a favicon, Apple, ícones 192/512, maskable, manifesto, metadados de tema e telas de instalação/retomada. Os arquivos entregues foram copiados e comparados byte a byte; maskable 512 com fundo totalmente opaco. `id`, `scope`, `start_url`, nomes por ambiente e instalação existente preservados. Metadados claro/escuro seguem o dispositivo; manifesto usa Papel. [Auditoria de assets](aura-redesign-review/assets-contrast.json). Instalação em aparelho físico continua sem nova validação. O onboarding assistido pode explicar instalação quando pertinente, sem transformar o convite dispensável em requisito de acesso. Seguir [domínios](pico-domains.md) e [skill principal](../.agents/skills/pico-redesign/SKILL.md).

## Base implementada

Implementado: manifesto com id estável, nome Pico no principal e identificação distinta no desenvolvimento, ícones 192/512/maskable/apple, standalone, safe areas, alvos de toque e navegação móvel. `/instalar` orienta Chrome/Android, Safari/iOS e saída de navegadores internos. O convite de instalação é dispensável e o prompt nativo só aparece quando disponível.

Versão compilada é exposta por endpoint sem dados pessoais; foco/retomada verificam versão e sessão. Atualizar exige ação explícita e avisa sobre edição não salva. Identidade trocada/logout descartam a árvore anterior; bfcache recarrega. Falha temporária preserva rascunho e indica rede indisponível, sem anunciar sucesso nem agendar publicação.

Não há service worker, conteúdo privado offline, fila de escrita, background sync ou push notification. APIs e mídia respondem `private, no-store`. Instalação não significa suporte offline.

## Evidência

Chromium móvel emulado em 320/390/430 px: login, grupos, feed/perfil/admin, recorte de imagem grande, rede offline, rascunho preservado, logout entre abas e manifesto/versão. Imagem EXIF usada no recorte é sintética. [Resultados](INTERNAL_REVIEW.md).

## Pendências físicas

Validar em Android/Chrome e iPhone/Safari reais: instalação pela tela inicial, teclado/câmera/galeria, orientação EXIF real, safe areas, zoom, relançamento, retomada de sessão e atualização entre versões. Emulação não comprova estes itens. Navegador e PWA podem manter sessões distintas; links externos não transportam sessão entre eles.

Fora da rodada: app nativo, push, geolocalização contínua e estratégia de cache offline social. Avaliar service worker futuro somente com modelo explícito de privacidade e invalidação.

## Pós-jogo · 2026-09-12

`/jogos` precisa de conexão no ambiente conectado. Não há fila de registros, sincronização em segundo plano ou publicação automática. A navegação aposentou presença ao vivo; versão/sessão ainda são verificadas ao retomar o app. Esta rodada local não comprova instalação, teclado ou safe areas em aparelho físico.

Compartilhar um jogo também exige confirmação online e usa chave de tentativa preservada. Fechar/reabrir o diálogo mantém o rascunho enquanto a tela/sessão permanece montada. Recarregar ou trocar de identidade descarta esse estado; não há promessa de armazenamento offline. Na demonstração, jogos/grupos/posts são locais e identificados; o link canônico deixa de encontrar o post ao recarregar a sessão.
