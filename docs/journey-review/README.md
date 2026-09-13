# Jornada, identidade e pós-jogo — evidências locais

> Este relatório descreve a revisão local anterior. A publicação posterior foi autorizada; evidências do Supabase real e operação em [JOURNEY_RELEASE.md](../JOURNEY_RELEASE.md).

Revisão de 12/09/2026 (horário de São Paulo). Base antes: `05b6f01c864f`. Incremento de jogos integrado por `c66e83e` (origem `160a557c`). O commit que contém este relatório reúne o restante da jornada, composição e compartilhamento. Nenhum push, merge remoto, deploy ou migration remota foi executado.

## O que foi avaliado

Início previsível com vínculos próprios e primeira ação para quem chega sem turma. Navegação fixa Início/Pessoas/Comunidades/Arenas/Perfil. Pessoas em linhas abertas; grupos com propósito/condições; arenas com fotografia e informações secundárias recolhidas; posts com autoria/conteúdo/contextos; jogos em histórico privado. [Alternativas e escolhas](../JOURNEY_REFINEMENT.md).

**Ambientes de prova:** build real do Next em `127.0.0.1:3004`, com todas as APIs interceptadas pela fixture em `127.0.0.1:3002`; e build separado explicitamente demo, sem URL/chave Supabase, em `127.0.0.1:3005`. A fixture nunca encaminha cookies ou chamadas `/api` ao serviço conectado. Nenhuma conta ou conteúdo real foi alterado.

CUA no navegador do Codex capturou o viewport real; as imagens não foram editadas nem costuradas. São renderizações do aplicativo com dados simulados, **não prova de Auth/Supabase/Vercel**. PGlite executa separadamente o SQL/RLS real com fronteira de identidade simulada.

## Antes e depois

| Tela · 390 × 844 | Antes | Depois |
| --- | --- | --- |
| Início/feed | [Antes](before/feed-390.png) | [Depois](after/feed-390.png) |
| Pessoas | [Antes](before/people-390.png) | [Depois](after/people-390.png) |
| Comunidades | [Antes](before/communities-390.png) | [Depois](after/communities-390.png) |
| Comunidade | [Antes](before/community-390.png) | [Depois](after/community-390.png) |
| Arena | [Antes](before/arena-390.png) | [Depois](after/arena-390.png) |
| Perfil | [Antes](before/profile-390.png) | [Depois](after/profile-390.png) |
| Registro | [Fluxo antigo](before/record-flow-390.png) | [Jogo privado](after/games-390.png) |

Baseline e resultado usam Alice/Bruno Teste, Areia da Vila e Turma do fim de tarde. A fixture anterior não filtrava corretamente posts por autor/destino; isso foi corrigido para a revisão atual. O perfil final vazio é consequência desse filtro, não exclusão de um post real. A captura da comunidade após o fluxo inclui o post compartilhado pelo teste, enquanto a comparação de lista/feed foi recapturada com a semente original. Não usar diferenças de conteúdo como métrica de layout.

## Fluxos exercitados

- Descobrir pessoa → acompanhar → confirmação de vínculo unilateral, sem convite enviado.
- Comunidades → criar com modalidade → abrir resultado → editar descrição → conferir audiência imutável e conteúdo atualizado. Apenas fixture.
- Membro com acesso vê mural; participação pendente em comunidade privada não monta mural nem lista de membros. [Captura](after/community-pending-390.png). RLS correspondente foi testada no SQL, com outro usuário.
- Arena → Joguei aqui → data civil passada → guardar só para mim. Resposta perdida após gravação: campos/chave preservados, fechar/reabrir preserva o rascunho; retry resulta em um registro, sem post automático.
- Compartilhar jogo → texto opcional e destinos explícitos → resposta perdida → repetir → mesmo post → link canônico. [Falha](after/share-retry-390.png), [resultado](after/shared-post-390.png). `fixture-actions.json` registra as duas tentativas com o mesmo ID/chave; antes da exclusão havia um jogo e dois posts (um original, um compartilhado).
- Corrigir jogo (03/01 → 04/01), excluir somente o registro e abrir legado vazio. A publicação continua com 03/01, comprovada novamente no perfil e no teste SQL. Exclusão do post e retry tardio também são cobertos em SQL.
- Perfil → editar bio → confirmação e retorno. Nenhum campo de disponibilidade/presença é oferecido.
- Erro conectado apresenta Tentar novamente; a repetição recupera os dados. Sem fallback demo. [Erro](after/connected-error-390.png), [sem vínculos/posts](after/new-user-empty-390.png).
- Demo separado: explorar Primeiros saques → participar localmente → Alto da Areia → registrar jogo → compartilhar com o grupo, sem texto obrigatório e sem mural pré-selecionado → abrir post. [Resultado](after/demo-shared-post-390.png). Recarregar descarta o estado local e mostra ausência honesta: [captura](after/demo-reload-390.png). Pedido de entrada privado permanece pendente, sem conteúdo: [captura](after/demo-pending-390.png).

## Layout e acessibilidade

- 25 medições: feed, pessoas, comunidades, arena e perfil em 320×740, 390×844, 430×932, 768×1024 e 1280×900, sem overflow horizontal ou estado de carregamento nas capturas. `layout-checks.json` contém dimensões e alvos da navegação. A navegação desktop substitui a móvel acima de 800 px.
- Inspeção de acesso, cadastro, admissão, conta, privacidade, instalação, gestão, recuperação e catálogo de arenas em 390 px: 9 medições adicionais sem overflow, em `auxiliary-checks.json`. Autenticação/recuperação reais não foram enviadas.
- Criar comunidade em 390×520: fechamento alcançável e ação final visível ao receber foco. Um único corpo rolável; Tab/Shift+Tab circulam no diálogo e o foco retorna ao acionador quando ele continua presente. [Altura reduzida](after/community-short-height.png).
- Texto a 200% em seis telas (fonte raiz de 32px injetada **somente pelo servidor de fixture**), sem overflow. Não é zoom nativo nem configuração de acessibilidade de um aparelho. Rótulos de navegação quebram com separação/hifenização; nenhuma ação é retirada. [Início ampliado](after/feed-text-200.png), [formulário ampliado](after/game-text-200.png), `text-checks.json`.
- Checkboxes reais, seleção de modalidades, labels de data e foco visível exercitados. Movimento reduzido, fallback de transparência e safe areas preservam as regras anteriores; não houve nova prova em hardware.

## Comandos e limites

Passaram `npm run lint`, `npm run typecheck`, `npm test` (**81/81**) e os builds conectado/demo. O gerador de tipos RPC aplicou todas as migrations em PGlite. Também passaram 11 verificações HTTP dos Route Handlers reais, sem sessão, em `localhost:3004`: autenticação exigida, autoria/query injetadas recusadas, datas futuras, origem cruzada e contratos de presença retirados (`http-guards.json`). Isso não é um teste autenticado remoto. Os testes abrangem datas, autoria/RLS de dois usuários e anônimo, admissão suspensa, privado/pending/aprovação/bloqueio, idempotência/versão, snapshot, exclusão e legado. A fixture SQL/Auth/REST antiga iniciou com o schema atual; roteiros manuais hosted/HTTP/browser foram adaptados, mas não executados contra infraestrutura nem declarados gates desta entrega.

Ainda não verificados nesta rodada: migrations em Supabase remoto; concorrência em conexões PostgreSQL independentes; Auth real, sessão entre abas/dispositivos e Storage HTTP; entrega SMTP; câmera, teclado virtual, instalação, safe areas e zoom em Android/iPhone físicos; novo run de GitHub CI ou deploy Vercel. Os fluxos de fotos/HEIC existentes foram reutilizados, sem novo upload nesta inspeção.

Os rótulos e a organização são hipóteses de design, não resultados de pesquisa. Próxima avaliação com jogadores: encontrar uma turma, explicar audiência, guardar um jogo e distinguir guardar de publicar. Não foram inventadas taxas de sucesso, adoção ou satisfação.

Antes de publicar, uma etapa autorizada deverá conferir/aplicar **somente** `20260912090000_played_games.sql` e `20260912091000_game_sharing.sql`, consolidar tipos hospedados e executar o gate real de desenvolvimento. A UI local pronta não significa que a presença antiga já foi retirada do site publicado.
