# Busca de pessoas e comunidades

Implementação solicitada em 13/09/2026. O atalho **Buscar** no cabeçalho abre `/descobrir`; cada destino permite alternar entre Pessoas e Comunidades pelas rotas existentes.

Pessoas pesquisa nome e nome de usuário; `@` restringe ao usuário. Aceita maiúsculas/minúsculas, acentos e espaços externos, com até 100 caracteres. Os filtros de esporte, nível e arena continuam combináveis. O banco filtra antes de paginar (24 resultados e uma linha de antecipação); a correspondência exata de usuário vem primeiro. A busca vazia retorna a descoberta habitual. Não utiliza e-mail, jogos privados ou disponibilidade.

Comunidades abre **Explorar**. A aba **Minhas comunidades** restringe aos grupos de participação vigente. Busca por nome usa as mesmas regras de acentuação e caracteres literais (`%` e `_` não são curingas); paginação de 20 resultados. O estado vazio em Minhas comunidades permite ampliar o escopo sem apagar o texto. Comunidades privadas mostram somente a ficha mínima já prevista: encontrar um grupo não libera descrição, regras, participantes, mídia ou mural.

O campo responde imediatamente, aguarda 250 ms para consultar e reinicia a página ao mudar o texto. Resultados anteriores não aparecem como resposta à nova busca. Requisições substituídas são canceladas/ignoradas; erros permitem nova tentativa e leituras têm limite de 15 segundos. Consulta não executa ações sociais. Demo continua local e rotulado.

## Banco e compatibilidade

Migration `20260913200000_people_community_search.sql` acrescenta `search_players`, com `SECURITY INVOKER`, admissão validada, RLS de perfis e exclusão do próprio perfil/incompletos. O `discover_players` anterior permanece para compatibilidade durante publicação. `community_directory` preserva assinatura e autorização e passa a comparar texto literalmente, com normalização. Nenhuma tabela/dado existente é removido; não há novas concessões de leitura social.

O auxiliar privado `search_text` normaliza Unicode NFC e os acentos latinos usados nos nomes em português. Não implementa busca aproximada, sinônimos nem correção ortográfica. A ordenação final usa nome e ID para estabilizar páginas. A implementação usa comparação textual sobre o catálogo autorizado; capacidade de bases grandes não foi medida.

## Verificação e publicação

[Testes e evidências](search-review/README.md). Banco local cobre correspondência por nome/usuário, acentos compostos/decompostos, caracteres literais, limites, paginação de pessoas e comunidades, bloqueio bilateral, revogação, anonimato, perfis incompletos e ficha privada. Smoke de navegador cobre consulta, paginação, resposta atrasada, erro/retry, escopos, links e layouts.

Integração coordenada: catálogo de arenas primeiro; busca depois sobre a main atualizada, por PR/CI. Materiais e landing da tarefa paralela são preservados. Estado efetivamente publicado deve ser conferido pelo SHA de `/api/version` e recibo de release, sem confundir teste local com produção.
