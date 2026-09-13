# Revisão do tutorial guiado — 12/09/2026

Implementação local. Capturas renderizadas em Chromium do app Next compilado, com APIs substituídas por fixture em loopback. Nenhuma requisição externa foi permitida pelo navegador de teste; nenhum formulário social foi enviado. Imagens/pessoas das capturas são ilustrativas. Não são evidência de Supabase hospedado, aparelho físico ou pesquisa de usabilidade.

## Resultado

- Lint, typecheck, builds conectado/demo e 84 testes locais aprovados.
- Convite dispensável, percurso completo, detalhes de arena/comunidade, filtro real de descoberta por arena, conclusão, pausa/retomada/recomeço e reload verificados.
- “Mostrar onde” foca o alvo após recolher a dica. Disclosures só expõem o destaque de seleção após abrir o resumo.
- Compositor preserva o rascunho ao fechar/reabrir; editor de jogos e compositor ocultam o guia. Edição de perfil suspende avanço até salvar/cancelar.
- Conta diferente recebe preferência independente. Mudança de outra aba não navega. Armazenamento bloqueado mantém o guia em memória. Admissão negada ou erro de leitura do perfil não inicia o tutorial.
- Dados vazios e falha de API não prendem a navegação. Oito medições: 390 px com foco no alvo, 320×620, 390×844, 430×932, 768×850, 1280×900, 390×500 e texto 200%. Sem overflow horizontal ou controles do guia fora do viewport. Com texto ampliado, a dica tem rolagem e as ações quebram linha.
- Demo explícito percorreu seis etapas; Pessoas usa a busca local existente. Apenas `/api/version` foi chamada, sem APIs sociais.

[Resultados conectados com fixture](checks.json) · [Resultados do demo](demo-checks.json).

## Capturas

[Convite](welcome-390.png) · [Arena em destaque](arenas-390.png) · [Pessoas](people-390.png) · [Conclusão](complete-390.png) · [320 px](guide-320-620.png) · [Desktop](guide-1280-900.png) · [Texto 200%](text-200.png) · [Demo](demo-people-390.png).

## Reproduzir

Use a configuração local de desenvolvimento existente. Não usar o principal para testes. Os builds separados evitam substituir uma prévia em uso; o Next pode acrescentar temporariamente seus diretórios ao `tsconfig.json`.

1. `PICO_BUILD_DIR=.next-tour npm run build`
2. `PICO_BUILD_DIR=.next-tour npm run start -- --hostname 127.0.0.1 --port 3017`
3. Em outro terminal: `node tests/helpers/visual-preview.mjs 3017 <versão-do-build>` (API de fixture na porta 3002).
4. `PLAYWRIGHT_MODULE=<módulo-playwright-instalado> node tests/browser-onboarding.mjs`

O roteiro carrega a UI diretamente na porta 3017 e encaminha somente as APIs para a fixture. Isso preserva os headers de navegação RSC do Next; o proxy visual de páginas não preserva todos os headers necessários para testar a continuidade do layout entre rotas.

Para o demo, crie `.next-tour-demo` com `NEXT_PUBLIC_PICO_ENV=demo`, `PICO_ENV=demo` e URL/publishable key/secret key vazias (sem herdar credenciais), sirva-o em 3018 e execute `tests/browser-onboarding-demo.mjs` com o mesmo `PLAYWRIGHT_MODULE`. Não há migration, seed ou escrita remota neste roteiro.

## Limites

Preferências ficam neste navegador, sem sincronização entre dispositivos. Limpar armazenamento pode exibir o convite novamente. Não há telemetria de conclusão, instalação/offline novos, validação física de teclado/câmera, leitor de tela real ou teste com jogadores. A publicação vigente continua anterior a este incremento até uma entrega remota autorizada.
