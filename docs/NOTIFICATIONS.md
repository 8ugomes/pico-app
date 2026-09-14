> 14/09/2026: a leitura agora inclui `actor_avatar_path` atual para entradas e menções. A central mostra a foto da pessoa que causou o aviso, não a capa da comunidade; sem foto usa símbolo humano. A migration aditiva posterior às menções preserva `post_id`, RLS e revogação de audiência. Testes SQL e o gate hospedado conferiram o campo; amostra de navegador a 320 px e texto ampliado preserva o avatar.

## Publicado no principal · 14/09/2026

Responsável solicitou publicação principal e revisão da base. Integração sobre a main 7cc4352 preserva busca, avatar real, configuração inicial e instalação. Checks atuais: lint/typecheck/build, 140 testes locais e 85 verificações hospedadas incluindo limpeza; [registro da integração](notifications-review/integration-hosted.json). Publicado pelo PR #23 no artefato `a4aa9628fbcb`, com migrations aplicadas e conteúdo preservado. [Publicação e revisão da base](notifications-review/release.md). As notas abaixo preservam a entrega inicial em desenvolvimento.

# Notificações de comunidades

Implementação de 13/09/2026. `/notificacoes` apresenta novas participações em comunidades, com sino no cabeçalho, contador de não lidas e aba na navegação lateral. A navegação inferior conserva suas cinco posições.

## Comportamento

- “Nome entrou na comunidade X”, com data/hora local e link para o grupo. Não lida/Lida também aparecem em texto.
- A transição para membro ativo gera um aviso por participante ativo já existente: entrada aberta, aprovação, convite aceito, reentrada/reativação e matrícula institucional confirmada usam o mesmo trigger.
- Pedidos pendentes, convite apenas criado, troca de papel, repetição de entrada já ativa e criação do grupo pelo próprio dono não geram avisos indevidos. Não há autoaviso ou backfill de participantes antigos.
- Abrir a aba não marca como lida. Leitura individual e “Marcar todas como lidas” são persistidas por conta; repetição preserva a primeira data de leitura.
- Vinte avisos por página, em ordem decrescente por data/ID, com Mais antigas/Mais recentes. A ação de ler todas inclui páginas anteriores, apenas dentro da audiência atualmente permitida.
- Atualização ao montar o shell, retomar/focar o app, a cada 30 segundos enquanto a aba está visível e pelo botão Atualizar. Não há conexão realtime, push do sistema, e-mail ou service worker.
- Demo mostra vazio identificado e não consulta o endpoint nem fabrica chegadas.

## Persistência e autorização

Migrations aditivas `20260914010000_community_notifications.sql` e `20260914011000_notification_recipient_scope.sql`; a segunda explicita a igualdade do destinatário na policy para que a leitura use o índice da própria caixa antes de avaliar cada aviso. `public.notifications` tem RLS e somente SELECT para authenticated; nenhuma escrita direta do cliente. O trigger `pico_private.notify_community_join` grava os avisos na mesma transação da participação. As RPCs `read_notifications`, `mark_notifications_read` e `mark_all_notifications_read` conferem a autorização atual. `/api/notifications` usa `getUser`, origem estrita para escrita, validação de corpo e respostas privadas sem cache.

Destinatário e pessoa que entrou precisam continuar membros ativos; comunidade ativa, admissões vigentes, exclusão pendente e bloqueio bilateral são considerados. Administradores externos ao grupo não recebem avisos por seu papel. Sair/ser removido/suspenso do grupo apaga os próprios avisos daquele grupo, inclusive antes de uma reentrada; os avisos dos demais deixam de aparecer enquanto o ator não participa. Exclusão de pessoa ou comunidade remove referências por FK. Não se armazena cópia do nome ou conteúdo privado; a leitura resolve a identidade atual.

A geração exclui destinatários suspensos, em exclusão e bloqueados. Atualizações de status já ativo não duplicam eventos; reentrar é uma nova participação e pode gerar novo aviso. Erro de leitura descarta a lista/contador anterior; troca de identidade invalida requisições e estado locais. Não há cache de notificações no localStorage.

## Validação e estado

- Lint, typecheck e build aprovados. Suíte local: 101 testes, incluindo quatro novos testes SQL de notificações.
- Desenvolvimento hospedado: 100 verificações com três identidades controladas, incluindo limpeza; Auth real, API Next, PostgREST/RLS, entrada, aprovação, convite, bloqueio, antifalsificação, leitura e persistência.
- Navegador Chrome: sino/aba, link ao grupo, leitura individual/todas, duplo clique, falha recuperável, reload; 390px claro, 320px escuro, desktop 1280px e texto 200%.
- Verificação final por fixtures HTTP: carregamento, vazio, erro sem dados antigos, retry e paginação. Em contêiner estreito, ícone decorativo cede espaço ao texto e ao controle de leitura.
- [Evidências](notifications-review/README.md). Contas e comunidades de teste removidas; nenhum cadastro de teste matriculado no grupo institucional.

As duas migrations foram aplicadas somente no desenvolvimento exclusivo, cada uma após dry-run listar apenas seu arquivo. O banco de desenvolvimento já contém migrations de outras branches: suas versões foram preservadas; a nova usa identificador posterior ao ledger existente. Tipos foram gerados do schema hospedado e também refletem as RPCs de busca já existentes ali. Não foram alteradas a publicação principal, sua base de dados nem a landing.

Para disponibilizar no principal: integrar a implementação com a main vigente e suas migrations, aplicar as duas migrations novas no destino correto, publicar via `scripts/deploy.mjs` e verificar a versão e o fluxo. Esta rodada entrega código e validação em desenvolvimento; não comprova push do dispositivo, aparelho físico ou release de produção.
> 14/09/2026: menções individuais e `@todos` em publicações de comunidades compartilham esta caixa, com link direto ao post e leitura sujeita à audiência atual. Publicadas no principal via PR #27 e versão `b74208012480`. [Contrato e recibo](COMMUNITY_MENTIONS.md).
