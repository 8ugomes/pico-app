# Republicações

Pedido de 13/09/2026 autoriza implementação e publicação no Pico principal, após o redesign Aura Manteiga. Implementação e verificação concluídas; publicação pelo fluxo PR/CI/main. A revisão servida é confirmada por `/api/version` e pelo recibo operacional local `.vercel/reposts-release.json`.

## Comportamento

- Republicar referencia uma publicação alheia; não copia conteúdo ou imagem e não cria um novo post. Não inclui comentário próprio, mensagem direta ou compartilhamento externo.
- Aparece no perfil de quem republicou e no Início de quem acompanha essa pessoa. A relação existente é unilateral: o destinatário acompanha quem republicou. Não pressupõe reciprocidade.
- No Início, publicações originais mantêm a audiência existente. A republicação elegível mais recente de si ou de alguém acompanhado pode trazê-las ao topo. Há uma entrada por post, ordenada por data efetiva e ID; o perfil inclui originais e republicações da pessoa. Paginação mantém 20 itens e um item de lookahead.
- Murais de arena/comunidade e permalink exibem o original, sem distribuição adicional. Republicar de novo a partir de uma republicação referencia o mesmo original. Curtidas, comentários, denúncias e edição continuam nele.
- Ação explícita mostra audiência antes do envio. Desfazer remove apenas a referência própria. Repetir o mesmo estado é idempotente e não renova a data; republicar depois de desfazer cria nova data.

## Acesso

Leitura exige admissão atual do espectador, acesso ao original e visibilidade de quem republicou. Este também precisa manter admissão, acesso ao post e não ter bloqueio bilateral com o autor. Grupos privados continuam restritos a participantes ativos (ou proprietário) não suspensos. Perda de acesso oculta a referência; restauração de acesso pode torná-la visível novamente. Publicações de arena arquivada não admitem republicação.

Não é permitido republicar a própria publicação. Exclusão do post ou perfil remove referências por FK; moderação, bloqueios, exclusão pendente e suspensão ocultam imediatamente em novas leituras. O endpoint de mídia continua verificando a audiência do original. Retirada de um mural não apaga o post ou suas referências, conforme contrato de distribuição vigente. Jogos privados nunca são republicados; apenas um post previamente compartilhado, com seu snapshot público/privado explícito.

Nova tabela com RLS e escrita exclusiva por RPC autenticada; ator vem de `auth.uid()`. Limite de 60 mudanças por hora, serialização por pessoa/post e estado desejado booleano. Nenhuma escrita offline, automática ou durante onboarding. Demonstração só em memória e identificada.

## Publicação e verificação

Lint, typecheck, builds conectado/demo e 93 testes locais aprovados. `tests/reposts.test.mjs` cobre referências, seguidores, idempotência, RLS, acesso privado, bloqueios, suspensão, exclusão, paginação, limites e compatibilidade com o leitor antigo. `tests/hosted-reposts.mjs` passou 112 verificações de Auth/Data API/Next HTTP e UI real no desenvolvimento; quatro identidades controladas limpas. [Relatório e capturas](reposts-review/README.md). O navegador usa `PLAYWRIGHT_MODULE` e opcionalmente `PLAYWRIGHT_CHANNEL`, sem nova dependência do produto.

Migration 23 aplicada no desenvolvimento. Principal recebe tabela, índices, políticas e funções após backup e PR/CI. Auditoria antes/depois compara 36 tabelas preexistentes, inventário Auth e SHA-256 dos três objetos de Storage, sem imprimir dados pessoais. Versão Aura `308b86b16109` permanece compatível: `read_social_feed` e demais contratos anteriores não foram substituídos. Em falha essencial de acesso/publicação, interromper promoção ou promover o artefato Aura anterior; não apagar tabelas, referências ou dados. SMTP, aparelho físico e carga real de produção não foram revalidados nesta funcionalidade.
