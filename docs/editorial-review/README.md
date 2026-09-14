# Revisão da escrita do Pico

Pedido do responsável em 13/09/2026: retirar travessões decorativos e texto com aparência artificial, em conjunto com as entregas de fluxo, arenas e estabilidade. Base main a88cec8; branch codex/editorial-deslopify.

## Mudanças

Comunidade oficial do Pico passa a ser o nome persistido da mesma comunidade. ID, slug pico-oficial, membros, avisos, regras, posts e ligações permanecem. O bloqueio de renomeação é suspenso apenas dentro da transação exclusiva da migration e restaurado antes do commit; timeout ou falha desfazem toda a operação.

Título da aplicação e nome acessível da marca deixam de usar travessão. Dois complementos de endereço do catálogo usam parênteses; valores salvos só mudam se ainda corresponderem exatamente ao original revisado. Textos de tutorial, entrada, estado vazio e publicação usam frases curtas e concretas. Não há normalização de nomes/publicações de usuários, remoção de hífens ortográficos ou mudança de controles e permissões.

A regra permanente está em Deslopify, AGENTS, skill e guia de revisão, manual, contexto institucional e design system. As tarefas de fluxo/arenas e estabilidade foram avisadas; o checkout main foi liberado pelo responsável da publicação anterior. A tarefa da landing revisa seus materiais na própria branch, sem deploy concorrente ou mistura de alterações.

## Verificação

- Lint, typecheck e build conectado aprovados.
- Seis testes pertinentes aprovados: migration sobre banco existente, preservação de posts/membros/avisos/edições, idempotência, proteção do nome, nome consistente em busca/detalhe/boas-vindas, admissão e preferências do tutorial.
- Migration aplicada no desenvolvimento por scripts/database.mjs, sem seed/reset; inventário antes/depois preservado, nome novo confirmado e trigger habilitado.
- Oito verificações de navegador aprovadas em Chrome: cadastro 320/390px, nome no Início, comunidade 320/390px claro e 1280px escuro, jogos vazios e tutorial 390px escuro. Sem overflow horizontal ou erros JavaScript. Amostra do Next real com respostas de API ilustrativas interceptadas em loopback, sem dados ou gravações remotas. [Resultado](browser.json), [comunidade no celular](community-390.png), [desktop escuro](community-1280-dark.png) e [tutorial](tutorial-390-dark.png).
- Nenhum travessão/meia-risca em src/public. SQL de migrations anteriores e comparações mantêm o valor histórico de propósito.

## Publicação e limites

PR, CI, aplicação principal e deploy seguem o fluxo de main no projeto pico-app, com inventários privados antes/depois. O recibo operacional registra a revisão efetivamente promovida e as verificações de saúde. A alteração não modifica Auth, Storage, RLS, monitoramento ou conteúdo dos jogadores. Não representa teste em aparelho físico nem comprovação de ganho de engajamento.
