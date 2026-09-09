# Pico — roadmap PWA

## Base existente

- Next.js, manifesto, ícones 192/512/maskable e apple-icon.
- display standalone, tema escuro e viewport com safe areas.

## Estado após o Ciclo 8

- start_url apontando ao feed.
- Navegação de cinco destinos, páginas sociais conectadas e demo explícito sem configuração.
- Layout preparado para 390px, toque, teclado e movimento reduzido.
- Sem service worker ou cache offline de conteúdo privado. APIs de dados e mídia usam private/no-store; logout/troca de identidade descartam a tela anterior, e restauração via bfcache recarrega a página.

Manifesto e arquivos de ícones verificados via HTTP no build de produção. Instalação, atualização e comportamento offline em aparelhos reais ainda não foram testados.

## Próxima rodada

- Validar instalação e atualização em iOS/Safari e Android/Chrome reais.
- Estratégia de service worker versionado: assets públicos e fallback offline.
- Nunca cachear Auth, callback, tokens, respostas privadas ou mutations.
- HTTPS na Vercel e associação com o Supabase já validados. Preservar essa configuração.
- Testar rede lenta, teclado aberto, modo standalone, safe areas, 200% de zoom e retomada de sessão.

## Fora do escopo

Push notifications, background sync de posts, geolocalização contínua e app nativo.
