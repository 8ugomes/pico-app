# Pico — roadmap PWA

## Base existente

- Next.js, manifesto, ícones 192/512/maskable e apple-icon.
- display standalone, tema escuro e viewport com safe areas.

## Entregue nesta rodada

- start_url apontando ao feed.
- Navegação de cinco destinos, páginas sociais e estados locais sem backend obrigatório.
- Layout preparado para 390px, toque, teclado e movimento reduzido.
- Service worker adiado: os estados demonstrativos são em memória e nenhuma tela promete feed persistente offline.

Manifesto e arquivos de ícones verificados via HTTP no build de produção. Instalação, atualização e comportamento offline em aparelhos reais ainda não foram testados.

## Próxima rodada

- Validar instalação e atualização em iOS/Safari e Android/Chrome reais.
- Estratégia de service worker versionado: assets públicos e fallback offline.
- Nunca cachear Auth, callback, tokens, respostas privadas ou mutations.
- Publicação HTTPS na Vercel e associação correta com URLs Supabase.
- Testar rede lenta, teclado aberto, modo standalone, safe areas, 200% de zoom e retomada de sessão.

## Fora do escopo

Push notifications, background sync de posts, geolocalização contínua e app nativo.
