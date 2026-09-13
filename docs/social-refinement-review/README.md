# Posts, comentários e preservação do histórico — 13/09/2026

## Entrega

Posts têm contorno, identidade com nome mais forte e separação das ações. Comentários têm avatar, balão próprio, fundo distinto da publicação e acentos Manteiga/Lavanda/Cacau por identidade. A cor é decorativa; o comentário próprio também diz **Você**. As fotos das publicações mantêm proporção e usam `contain`.

O botão **•••** reúne editar/excluir conteúdo próprio e denunciar/bloquear conteúdo alheio. Moderadores mantêm retirada apenas do mural autorizado. O menu usa o diálogo nativo existente, alvos de 44 px, Escape, foco preso ao diálogo e retorno ao acionador. Editar comentário agora grava somente `body`, validado entre 1 e 280 caracteres; identidade vem do servidor e a RLS continua decidindo o acesso. A leitura do avatar usa a rota privada de mídia. A demonstração altera somente dados em memória.

## Publicação que desapareceu

A consulta somente de leitura ao banco principal encontrou **dois posts armazenados**, sendo **um ligado a arena demonstrativa arquivada**, sem moderação nem revogação da admissão do autor. A importação anterior manteve as linhas; porém `post_audience_visible` exigia que a arena fosse pública. Ao retirar a arena fictícia do catálogo, essa condição passou a esconder o original. Isso comprova uma causa presente no principal; sem identificação adicional do post relatado, não prova que todo relato de desaparecimento tenha a mesma causa.

O problema foi reproduzido antes da migration no desenvolvimento. A migration `20260913210000_preserve_retired_arena_posts.sql` permite ler o histórico das **três identidades fictícias conhecidas**, somente quando continuam demonstrativas, arquivadas e fora do catálogo. O mesmo ajuste preserva referências de republicação. Não altera dados de posts, autoria, datas, fotos, comentários nem FKs; não transfere relatos para arenas reais. A arena retirada continua invisível e indisponível para novos posts. O original aparece sem link para a arena fictícia.

Admissão, bloqueios, moderação, exclusão e audiência privada continuam obrigatórios. Arenas reais e outras arenas privadas/arquivadas não recebem a exceção. Testes exercitam feed, perfil, permalink, leitor anterior, mídia, comentários, republicações e repetição da importação.

**Estado ao concluir a implementação (`b9c0930`):** migration validada e aplicada somente no Supabase de desenvolvimento. O banco principal foi consultado, sem aplicação da correção naquela rodada. O responsável autorizou a publicação na rodada seguinte, pelo fluxo main/PR/CI, migration e artefato Vercel verificado. A aplicação efetiva e versão servida são conferidas no recibo operacional e no PR; o commit isolado não publica o frontend nem aplica automaticamente a migration principal.

## Verificação

- **118 testes locais** aprovados; lint, typecheck e build conectado aprovados.
- **63 verificações hospedadas** de edição/exclusão/autoria/RLS e HTTP: [recibo](hosted.json).
- **41 verificações hospedadas do histórico:** [15 antes](history-before-result.json) reproduzem o desaparecimento; [26 depois](history-after-result.json) confirmam o mesmo post e comentários, incluindo resposta do app já compilado.
- Inventário do desenvolvimento: nove linhas de conteúdo antes/depois, nenhuma ausente, nenhuma identidade ou conteúdo alterado pela migration. Comparação usa IDs e hashes, e não apenas totais.
- A suíte detecta substituição de um post por outro mesmo quando a contagem continua igual. Edições e novas contribuições concorrentes são registradas sem sobrescrever dados.
- [Principal antes/depois da rodada](primary-preservation.json): 15 linhas de conteúdo/referências, nenhuma ausente, editada ou com identidade alterada. Consulta somente de leitura; isso não significa aplicação da correção principal.

Os testes hospedados usam duas contas descartáveis exclusivamente em desenvolvimento. Credenciais, snapshots com dados de fixture, inventários identificáveis e logs operacionais permanecem na área ignorada `.vercel/`. A limpeza remove somente essas identidades, suas fotos e a comunidade controlada.

A limpeza foi concluída. O primeiro ensaio de limpeza revelou a FK que protege comunidades referenciadas por posts privados; o roteiro passou a remover primeiro os posts das duas identidades descartáveis, mantendo a restrição do banco. Não foi necessário relaxar nenhuma FK/RLS.

### Revisão visual e funcional

| Amostra | Resultado |
|---|---|
| [320 px claro](post-320-light.png) | Post e comentários separados, nomes legíveis, opções de 44 × 44 px, sem overflow horizontal. |
| [390 px escuro](post-390-dark.png) | Superfícies distintas; avatar carregado; comentário próprio em Lavanda. |
| [1280 px claro](post-1280-light.png) | Composição do conteúdo preservada no desktop. |
| [320 px com texto em 200%](post-320-text-200.png) | Raiz de 32 px, dois comentários e avatares carregados, sem overflow horizontal. |
| [Menu próprio](actions-390-dark.png) | Editar e excluir; menu de outra pessoa mostra denunciar/bloquear. |
| [Falha ao salvar](comment-error-390-light.png) | Erro 503 controlado mantém o texto digitado; nova tentativa salva e fecha o diálogo. |

No navegador, editar comentário e publicação persistiu; Escape devolveu foco ao botão •••; o campo de edição recebeu foco ao abrir; cancelar exclusão manteve o comentário. A exclusão real foi exercitada pelo teste HTTP em conteúdo descartável. A revisão também observou o histórico recuperado no perfil. Não foi enviado comentário ou denúncia a usuário real.

Os [pares de contraste calculados no DOM](comment-contrast.json) para nomes e corpos visíveis dos balões variaram de 9,61:1 a 11,81:1 entre próprio/alheio e claro/escuro. São medidas dessa amostra, não certificação de todas as telas.

Escuro: build local ligado ao desenvolvimento. Claro: proxy local do mesmo build desativa somente a media query escura. A fonte ampliada também foi aplicada nessa fixture. A resposta 503 é simulada apenas para a escrita de comentário; a nova tentativa usa a API real. Uma sessão descartável foi invalidada pelo encerramento global inicial do ensaio; o teste foi ajustado para encerrar apenas sua própria sessão e a revisão retomada com login. Não é cobertura de aparelhos físicos, todos os navegadores ou todas as fotos possíveis.

## Próximas publicações

Código e migrations ficam no Git; conteúdo dos usuários fica no Supabase entre deployments. Não se salva uma cópia pública dos posts no commit. `database.mjs migrate` e `deploy.mjs` agora capturam inventários privados antes/depois de conteúdo, autoria/data e referências de mídia. Qualquer linha ausente ou identidade alterada interrompe o processo e exige investigar o recibo; edições e novas contribuições são contabilizadas. O procedimento não restaura nem apaga dados automaticamente.

Inventário não é backup de recuperação nem prova isolada de visibilidade ou integridade dos bytes das fotos. Para mudança de dados, manter backup cifrado conforme [continuidade](../CONTINUITY.md), verificar RLS/jornadas, aplicar migration aditiva e comparar os recibos. Nunca rodar seed/reset no principal nem restaurar tabelas inteiras por cima de novas publicações. Usar `npm run deploy -- --stage` quando a conferência deve anteceder a promoção; no deploy direto a comparação final ocorre depois da publicação do artefato.

Roteiro reproduzível em desenvolvimento: `tests/hosted-comment-actions.mjs --keep`, `tests/hosted-content-history.mjs --before`, migration revisada, `tests/hosted-content-history.mjs --after`, revisão UI e `tests/hosted-comment-actions.mjs --cleanup`. O passo `--before` pressupõe a migration de correção ainda não aplicada; usar banco isolado com o estado anterior para reproduzir novamente. Não voltar migrations em ambiente compartilhado.
