# Jornada integrada — setembro de 2026

## Decisão atual e limite

Hipótese de produto: encontrar pessoas com um esporte em comum, participar de comunidades e manter a conversa depois do jogo. A retirada de presença ao vivo foi decidida pelo responsável por segurança; substitui as instruções históricas. Esta rodada implementa e verifica localmente, sem push, deploy ou mudanças remotas. Não representa pesquisa com jogadores.

## Organização comparada

| Alternativa | Primeira ação / pouca atividade | Retorno | Custo e compromisso |
| --- | --- | --- | --- |
| Feed puro | Familiar, mas vazio não explica onde encontrar relações | Boa leitura de publicações | Menor custo; deixa comunidades e arenas desconectadas |
| Comunidades na entrada | Explica grupos, mas pede uma escolha antes de conhecer pessoas/lugares | Ótimo para quem já participa | Pressiona todos a entrar em grupo e reduz descoberta individual |
| Início contextual e previsível — escolhida | Apresenta proposta e caminhos existentes quando faltam vínculos | Atalhos aos próprios grupos/arenas, seguidos de publicações | Usa relações já autorizadas; sem recomendações avançadas ou navegação mutável |

Navegação fixa: **Início, Pessoas, Comunidades, Arenas, Perfil**. Nomes correspondem aos destinos. Publicar continua no feed e nos murais. **Meus jogos** fica no perfil; **Joguei aqui** parte da arena ou do histórico. Nenhuma ação central privilegiada substitui automaticamente o antigo check-in.

## Duas direções de composição

**Editorial de quadra — escolhida:** área aberta na entrada, contatos compactos, comunidades com propósito e condições, fotografia reservada aos lugares/publicações e registros em linhas cronológicas. Hierarquia e espaços separam conteúdos antes de bordas. Mantém carvão, fonte nativa, verde-água funcional e assinatura areia discreta.

**Mural de capas:** imagens maiores em todas as entidades e blocos colecionáveis. Tem reconhecimento imediato quando há fotos, mas repete capas, aumenta rolagem e cria vazios artificiais no catálogo real. Não adotada como organização global.

## Mapa de jornada e atritos observados no código

As capturas históricas não são auditoria atual. A inspeção renderizada e suas limitações estão em [journey-review/README.md](journey-review/README.md).

| Tela | Motivo / prioridade | Ação / consequência | Saída útil e ajuste |
| --- | --- | --- | --- |
| Entrada e perfil inicial | Entender proposta e construir identidade mínima | Entrar/completar perfil confirmado | Pessoas e comunidades; sem exigir post ou jogo |
| Início | Acompanhar relações e conteúdo permitido | Abrir um contexto ou publicação | Autor, arena, comunidade; vazio aponta à descoberta |
| Pessoas | Encontrar afinidade por esporte e vínculos | Acompanhar, sem sugerir reciprocidade/convite | Perfil e comunidades; retirar filtro, prazo e indicadores ao vivo |
| Comunidades | Entender propósito e condições | Participar ou solicitar, com feedback distinto | Abrir mural quando autorizado; pending não revela conteúdo |
| Arena | Reconhecer lugar e relações permitidas | Acompanhar arena; registro passado secundário | Comunidades, mural, pessoas ligadas ao lugar |
| Meus jogos | Guardar experiência passada para si | Arena + data + modalidade; salvar confirmado | Editar/excluir próprios ou compartilhar separadamente |
| Publicação | Continuar conversa com audiência consciente | Publicar uma vez e ver o resultado | Conteúdo canônico com data de publicação e eventual data de jogo distintas |
| Perfil | Identidade e retorno a vínculos pessoais | Editar perfil / abrir contextos | Histórico privado, sem disponibilidade inferida |
| Gestão/conta | Cuidar de recursos e privacidade | Ações existentes conforme papel | Volta ao recurso; evitar controles de gestão na jornada principal |

## Contrato de jogos e legado

Registro retrospectivo é autodeclarado, privado, com data civil sem horário ou coordenadas. Data futura é inválida; salvar não cria post. A correção usa versão para evitar sobrescrever uma edição concorrente e as tentativas de criação usam chave de idempotência. Excluir o registro pessoal não deve apagar uma publicação compartilhada por suposição. Compartilhar cria conteúdo canônico apenas após escolha explícita de audiência e destinos, preservando os controles existentes.

Linhas antigas de check-ins não são apagadas nem convertidas automaticamente em jogos/posts. Seu acesso fica restrito ao próprio titular e identificado como legado. RPCs e consultas de presença foram desativadas no contrato local; preferência antiga de resumo não autoriza publicar um novo histórico. A migration remota será uma dependência explícita, sem alegação de atualização do site publicado.

## Validação executada e limites

81 testes passaram em banco descartável/contratos: autor, outro usuário e anônimo; passado/futuro, versão, exclusão própria, idempotência, admissão e compartilhamento. UI real com API isolada e demo explícito exercitaram a continuidade de grupo/arena/jogo/post. 25 medições em 320/390/430/768/1280 px, nove telas auxiliares, altura reduzida, teclado e texto a 200%; sem overflow horizontal. Lint, tipagem e builds conectado/demo aprovados. [Evidências e limites](journey-review/README.md). Não houve pesquisa com jogadores, teste físico, push/deploy ou exercício remoto nesta rodada.

## Hipóteses a validar com pessoas

Teste curto com praticantes de diferentes modalidades e níveis: encontrar uma comunidade, explicar quem vê uma publicação, registrar um jogo passado e explicar a diferença entre guardar e compartilhar. Observar conclusão, hesitação, voltas de navegação e interpretação de rótulos. Não há métricas de adoção ou pesquisa realizada nesta rodada.

## Evolução futura, fora do escopo

Organização de partidas só deve ser avaliada após observar dificuldade real para combinar jogos; exige regras de convite/consentimento, capacidade de moderação e desenho de privacidade. Não foram autorizados chat, agenda, notificações, presença ou recomendações por localização.

## Resultado implementado

O início funciona para quem chega sem vínculos e para quem volta aos seus grupos. Pessoas e locais levam a contextos autorizados, sem presença atual. Comunidades distinguem participação, espera e acesso ao mural. O jogo fica privado; compartilhar abre uma escolha nova e termina em um link canônico. Composição e linguagem foram aplicadas nas versões conectada e demonstrativa, preservando formulários, acesso e gestão existentes.

Os compromissos são explícitos: início contextual ocupa espaço antes dos posts; grupos exigem relação ativa para atalhos próprios; disclosures acrescentam um toque a informações secundárias. Essas escolhas devem ser avaliadas com jogadores. Não se adicionou um fluxo obrigatório de onboarding, recomendação, convite, agenda ou conversa privada.
