> Segurança de documentos: HTML dinâmico com nonce único e `no-store`; assets de build continuam cacheáveis. Sem service worker ou armazenamento offline privado. [Revisão do beta](BETA_SECURITY.md).

## Transição para aplicativo · 15/09/2026

A regra do Ciclo 9 que deixava aplicativo nativo fora da rodada foi superada pelo pedido de iniciar o empacotamento iOS/Android. A PWA continua sendo o produto publicado e não será removida. A primeira entrega é uma fundação Capacitor e um preview interno; não é um pacote de loja. Arquitetura, comandos e gates estão em [Pico em aplicativo](MOBILE_APP.md). Push, geolocalização contínua e cache offline social permanecem fora.

## Guia visual depois do onboarding · 13/09/2026

`/instalar` agora usa figuras de iPhone/Safari e Android/Chrome, com animação controlável, variantes de Safari e alternativa estática. O convite imediato foi retirado: perfil completo, boas-vindas conferidas e tutorial concluído/dispensado liberam uma chamada discreta após 15 segundos de pausa no Início. Edição, formulário, diálogo, aba oculta, offline e modo instalado suspendem a oferta. Recusa e abertura ficam registradas por conta/navegador. Instalar continua opcional e a página pode ser aberta manualmente. [Implementação, fontes e evidências](install-guide-review/README.md).

## Capa de instalação Pico Club · 13/09/2026

Pico Club substitui o nome Pico na identificação de instalação; desenvolvimento mantém sufixo próprio. A arte exibe Pico / Clube com grão. PWA 192/512, maskable 512, Apple 180, favicon SVG e ICO atualizados. Id `/`, scope `/`, start_url `/feed`, modo standalone e dados do usuário permanecem iguais. URLs novas no manifesto permitem detectar os novos arquivos; Apple recebe o identificador de conteúdo gerado pelo Next.js. A troca do ícone de instalações existentes depende do navegador/sistema e não é garantida imediatamente, especialmente no iOS. Não apagar dados ou encerrar sessão para atualizar a capa. [Mestres e redução](brand-exploration/aura-manteiga/pico-club/README.md).


# Pico — PWA no Ciclo 9

Notificações internas de comunidade disponíveis no principal em `/notificacoes`: entradas e menções em publicações, com atualização ao abrir/retomar e a cada 30s com aba visível, sem push do dispositivo ou service worker. [Menções e publicação](COMMUNITY_MENTIONS.md); [contrato da caixa](NOTIFICATIONS.md).

## Aura Manteiga integrada · 13/09/2026

[Aura Manteiga](brand-exploration/aura-manteiga/README.md) aplicada a favicon, Apple, ícones 192/512, maskable, manifesto, metadados de tema e telas de instalação/retomada. Os arquivos entregues foram copiados e comparados byte a byte; maskable 512 com fundo totalmente opaco. `id`, `scope`, `start_url`, nomes por ambiente e instalação existente preservados. Metadados claro/escuro seguem o dispositivo; manifesto usa Papel. [Auditoria de assets](aura-redesign-review/assets-contrast.json). Instalação em aparelho físico continua sem nova validação. O onboarding assistido pode explicar instalação quando pertinente, sem transformar o convite dispensável em requisito de acesso. Seguir [domínios](pico-domains.md) e [skill principal](../.agents/skills/pico-redesign/SKILL.md).

## Base implementada

Implementado: manifesto com id estável, nome Pico Club no principal e identificação distinta no desenvolvimento, ícones 192/512/maskable/apple, standalone, safe areas, alvos de toque e navegação móvel. `/instalar` orienta Chrome/Android, Safari/iOS e saída de navegadores internos. O convite de instalação é dispensável e o prompt de instalação do navegador só aparece quando disponível. O pacote interno se identifica e não oferece instalar a PWA dentro dele.

Versão compilada é exposta por endpoint sem dados pessoais; foco/retomada verificam versão e sessão. Atualizar exige ação explícita e avisa sobre edição não salva. Identidade trocada/logout descartam a árvore anterior; bfcache recarrega. Falha temporária preserva rascunho e indica rede indisponível, sem anunciar sucesso nem agendar publicação.

Não há service worker, conteúdo privado offline, fila de escrita, background sync ou push notification. APIs e mídia respondem `private, no-store`. Instalação não significa suporte offline.

## Evidência

Chromium móvel emulado em 320/390/430 px: login, grupos, feed/perfil/admin, recorte de imagem grande, rede offline, rascunho preservado, logout entre abas e manifesto/versão. Imagem EXIF usada no recorte é sintética. [Resultados](INTERNAL_REVIEW.md).

## Pendências físicas

Validar em Android/Chrome e iPhone/Safari reais: instalação pela tela inicial, teclado/câmera/galeria, orientação EXIF real, safe areas, zoom, relançamento, retomada de sessão e atualização entre versões. Emulação não comprova estes itens. Navegador, PWA e pacote podem manter sessões distintas; links externos não transportam sessão entre eles.

Decisão histórica superada: o app nativo estava fora do Ciclo 9 e entrou no escopo em 15/09/2026. Continuam fora desta rodada: push, geolocalização contínua e estratégia de cache offline social. Avaliar service worker futuro somente com modelo explícito de privacidade e invalidação.

## Pós-jogo · 2026-09-12

`/jogos` precisa de conexão no ambiente conectado. Não há fila de registros, sincronização em segundo plano ou publicação automática. A navegação aposentou presença ao vivo; versão/sessão ainda são verificadas ao retomar o app. Esta rodada local não comprova instalação, teclado ou safe areas em aparelho físico.

Compartilhar um jogo também exige confirmação online e usa chave de tentativa preservada. Fechar/reabrir o diálogo mantém o rascunho enquanto a tela/sessão permanece montada. Recarregar ou trocar de identidade descarta esse estado; não há promessa de armazenamento offline. Na demonstração, jogos/grupos/posts são locais e identificados; o link canônico deixa de encontrar o post ao recarregar a sessão.
## Evolução de 18/09/2026

O pedido atual amplia o escopo para mensagens, push e preparação para lojas. A versão pública auditada continua sem esses novos recursos. Nesta branch, um service worker exclusivo de notificações e a entrega por fila estão implementados sob ativação explícita de servidor e banco; não há cache de páginas/conteúdo privado nem fila offline de escrita. [Configuração e limites](PUSH_NOTIFICATIONS.md). [Diagnóstico e sequência para aparelhos/lojas](PICO_DEVELOPMENT_REVIEW_2026-09-18.md).

As afirmações abaixo de ausência de service worker/push descrevem a versão pública anterior. Instalar não habilita avisos automaticamente; o jogador precisa escolher ativar no dispositivo. Cadastro sem confirmação/SMTP continua a política atual da beta. Nada nesta revisão comprova build nativo, recebimento push ou funcionamento em aparelho físico.
