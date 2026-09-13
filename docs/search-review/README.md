# Revisão da busca · 13/09/2026

Implementação em worktree isolado `codex/people-community-search`. Contratos em [SEARCH.md](../SEARCH.md).

- Banco local: consultas antes da paginação, nomes/@usuários, acentos, símbolos literais, filtros, autoexclusão, perfis incompletos, bloqueio bilateral, admissão revogada e diretório privado.
- Navegador sobre o app Next real com APIs interceptadas: 15 verificações, nenhum erro de execução e nenhuma escrita social; inclui paginação reiniciada, resposta atrasada descartada, erro/retry, ampliação de Minhas comunidades para Explorar e links para destinos corretos.
- Amostra visual: 390 px/claro, 1280 px/escuro e 320 px/escuro com texto em 200%. Corrigidas quebra do título junto ao link de busca e duplicação do contorno de foco. Aparelho físico não exercitado.
- Fixtures visuais são ilustrativas; os arquivos de execução em `.vercel/search-review` distinguem simulação e Supabase real.

105 testes locais, lint, typecheck, build conectado e auditoria npm sem vulnerabilidades passaram. Supabase de desenvolvimento: 61 verificações reais em Auth, API, RPC, Storage e navegador; duas contas, um grupo privado e suas fotos removidos. O teste confirmou busca de perfil real, acesso por link, normalização, limites/anonimato, bloqueio e manutenção da privacidade ao abrir a comunidade encontrada. [Resultado hospedado](hosted.json). Demo: cinco verificações sem backend/escritas.

[Resultado de UI](browser.json), [demo](demo.json), [pessoas 390px](people-light-390.png), [comunidades 390px](communities-light-390.png) e [desktop escuro](communities-dark-desktop.png). Capturas são fixtures ilustrativas; nenhum perfil de usuário foi exposto.

Publicação segue a ordem acordada com a tarefa do catálogo de arenas. PR/CI e revisão efetivamente servida ficam no recibo de release e no relatório final.
