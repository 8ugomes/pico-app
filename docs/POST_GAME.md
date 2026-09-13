# Jogos realizados — jornada integrada de 12/09/2026

Substitui a presença ao vivo. A pessoa declara um jogo já terminado, guarda arena/modalidade/data e pode corrigir ou excluir seu registro. `/jogos` é privado; `/checkin` só redireciona links antigos, preservando a arena. Não há estado ativo, prazo, encerramento, consulta periódica ou inferência de disponibilidade. Perfil e arena dão acesso contextual. A navegação fixa usa Início, Pessoas, Comunidades, Arenas e Perfil, sem uma ação central privilegiada.

## Contrato de dados

Migrations `20260912090000_played_games.sql` e `20260912091000_game_sharing.sql`, adicionais às 19 anteriores. Ambas foram exercitadas em PostgreSQL/PGlite descartável e aplicadas no Supabase exclusivo de desenvolvimento. Ledger, backup e validação da entrega estão em [JOURNEY_RELEASE.md](JOURNEY_RELEASE.md).

- `played_games`: UUID, dono, arena/modalidade, `played_on` como data civil, timestamps de gravação e versão. RLS permite leitura somente pelo dono com admissão vigente; cliente não tem escrita direta.
- `save_played_game`: dono vem da sessão, datas futuras/inválidas são recusadas, arena/modalidade novas precisam estar disponíveis. A data civil usa `America/Sao_Paulo` no cliente e no banco; não coleta fuso ou localização do dispositivo. A validação é sobre a data declarada, sem prova de presença ou horário de término.
- O UUID da tentativa é retido em falha. Mesmo UUID/payload retorna o mesmo registro; payload diferente sem versão é conflito. Correções exigem a versão atual; a repetição da mesma correção é idempotente. Uma correção de data continua possível se a arena original foi arquivada ou a modalidade foi desativada.
- `delete_played_game` só exclui registro próprio e é idempotente. A linha do jogo é removida; `pico_private.deleted_game_keys` retém somente UUID/dono, sem arena/data/conteúdo, para recusar retry atrasado que recriaria um registro excluído. Essa chave também é removida ao excluir a conta. Não altera conteúdo social alheio. Exclusão da conta continua removendo registros pessoais por FK.
- `read_played_games`: histórico exclusivamente próprio, página de 20 com 1 item de antecipação. Ordenação por data e ID. Não aceita usuário de destino.
- `/api/games`: GET paginado e POST `{action: save|delete}`; valida origem, sessão, corpo, campos, UUID/data/versão. Respostas privadas sem cache; a confirmação depende do retorno da RPC.

O legado `checkins` fica intacto, mas sem grants para clientes e com política restritiva. EXECUTE de start/end/history/summary foi revogado. Nenhum backfill de jogos ou posts. `discover_players` preserva sua assinatura para compatibilidade: `p_active=true` falha, colunas legadas de presença retornam null e disponibilidade retorna false; filtro de arena usa participação ativa visível. O DTO social já não expõe esses sinais. Preferências legadas de perfil ficam preservadas sem UI ou efeito sobre jogos.

`src/types/database.ts` foi regenerado pelo Supabase CLI a partir do desenvolvimento hospedado com as 21 migrations. `app-database.ts` reexporta esse contrato completo; a extensão temporária do catálogo local foi removida.

## Registro e publicação

Registrar não produz publicação, aviso, destino de mural ou resumo compartilhado. `Jogado em` identifica a data da experiência. Não há data de publicação em um registro privado. Publicações continuam no compositor existente, com audiência e destinos explícitos; a sugestão derivada de presença foi removida.

O botão **Compartilhar jogo** abre uma ação separada. Arena, modalidade e data vêm da versão do registro próprio; texto e foto são opcionais. Sem texto, o banco gera uma frase factual com arena e data. Nenhum mural é selecionado automaticamente ao partir do jogo. Audiência e destinos são visíveis; beta permite perfil/feed e destinos elegíveis, privado mantém exatamente um grupo com participação ativa, conforme `publish_post` existente.

`share_played_game` valida autoria/admissão/versão e reutiliza `publish_post` para regras de mídia, distribuição, bloqueios e cotas. O post é canônico. `post_game_context` armazena apenas post/data da experiência, com RLS igual à leitura do post; não expõe o UUID do jogo privado. `read_social_feed` entrega essa data e nomes/slugs de contextos sujeitos às regras de leitura. “Jogado em” e “Publicado em” são distintos.

A chave de envio permanece no rascunho ao falhar. O ledger privado `game_publications` guarda dono/chave/digest/post para recuperar a mesma confirmação. Repetir a mesma tentativa não duplica; reutilizar a chave com outro payload é conflito. Editar/excluir o jogo não muda o snapshot publicado. Excluir o post apaga o contexto público e mantém só a confirmação privada mínima, com post nulo, para rejeitar recriação por retry. A conta removida elimina também essas chaves. A UI informa que correção/exclusão do registro não altera a publicação.

`/api/games/share` verifica origem/sessão/campos e retorna o UUID do post; a confirmação abre `/publicacoes/[id]`. Erros preservam os campos. Não existe fila offline nem envio posterior automático.

O expansor **Histórico anterior · só você vê** usa `/api/games/legacy` e `read_retired_checkins`: paginação própria de 20+1, arena/modalidade/data civil, sem duração, expiração, estado ativo ou autor-alvo. A tabela original continua fechada aos clientes; não há conversão em novos jogos/posts.

Demo continua explícito, em memória e vazio de jogos inicialmente; não é fallback de falha conectada. As pessoas e imagens ilustrativas já existentes mantêm os rótulos. Foram retirados os registros/sinais fictícios de presença, os filtros de disponibilidade e a atividade lateral que sugeria chegada.

## Integração e publicação

O incremento de jogos foi integrado por cherry-pick local `c66e83e` (origem `160a557c`) à main em `/Users/8ugo/Documents/picoapp`, junto ao refinamento e ao compartilhamento. O registro de evidências do incremento anterior continua em `visual-review/post-game/README.md`; os resultados integrados estão em `journey-review/README.md`.

A publicação completa foi autorizada após o fechamento local. O fluxo exige backup, gate hospedado de desenvolvimento, PR com CI, main sincronizada, ledger principal completo e `scripts/deploy.mjs` no projeto existente. Não editar/reaplicar migrations anteriores, recriar projeto ou converter dados legados. Não reativar UI de presença contra o novo contrato revogado como rollback. Evidências e estado da entrega em [JOURNEY_RELEASE.md](JOURNEY_RELEASE.md).

Os tipos completos agora vêm do schema hospedado; geração protegida em `npm run db:types`.

## Verificação e limites

81 testes locais passaram, incluindo dois usuários, anônimo, admissão revogada, private/pending/aprovação/bloqueio, autoria, correção, datas, retry, exclusão, snapshot de post e legado. Lint, typecheck e builds conectado/demo passaram. A UI real foi exercitada por navegador com API simulada e, separadamente, demo em memória. Isso não comprova Supabase hospedado, concorrência entre múltiplas conexões, autenticação real, SMTP ou aparelho físico.

A suíte atual `npm run test:hosted` foi ampliada com gravações e compartilhamentos concorrentes reais. Roteiros históricos de browser/HTTP não substituem esse gate. O helper SQL/Auth/REST antigo iniciou com todas as migrations; seu setup histórico não é compatível com a guarda atual de ambientes sem uma estratégia isolada de transporte de teste. Não alterar a guarda para fazer esse roteiro passar. O relatório de release distingue a evidência remota dos testes locais e da inspeção CUA anteriores.
