# Pico — PWA no Ciclo 9

Implementado: manifesto com id estável, identificação do beta, ícones 192/512/maskable/apple, standalone, safe areas, alvos de toque e navegação móvel. `/instalar` orienta Chrome/Android, Safari/iOS e saída de navegadores internos. O convite de instalação é dispensável e o prompt nativo só aparece quando disponível.

Versão compilada é exposta por endpoint sem dados pessoais; foco/retomada verificam versão e sessão. Atualizar exige ação explícita e avisa sobre edição não salva. Identidade trocada/logout descartam a árvore anterior; bfcache recarrega. Falha temporária preserva rascunho e indica rede indisponível, sem anunciar sucesso nem agendar publicação.

Não há service worker, conteúdo privado offline, fila de escrita, background sync ou push notification. APIs e mídia respondem `private, no-store`. Instalação não significa suporte offline.

## Evidência

Chromium móvel emulado em 320/390/430 px: login, grupos, feed/perfil/admin, recorte de imagem grande, rede offline, rascunho preservado, logout entre abas e manifesto/versão. Imagem EXIF usada no recorte é sintética. [Resultados](INTERNAL_REVIEW.md).

## Pendências físicas

Validar em Android/Chrome e iPhone/Safari reais: instalação pela tela inicial, teclado/câmera/galeria, orientação EXIF real, safe areas, zoom, relançamento, retomada de sessão e atualização entre versões. Emulação não comprova estes itens. Navegador e PWA podem manter sessões distintas; links externos não transportam sessão entre eles.

Fora da rodada: app nativo, push, geolocalização contínua e estratégia de cache offline social. Avaliar service worker futuro somente com modelo explícito de privacidade e invalidação.
