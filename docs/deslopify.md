# Pico — Deslopify

## Cycle 3 — Real auth and profile · antes de implementar

Uma ação principal: completar ou salvar perfil. Labels visíveis, formulário em coluna no celular, erro junto ao envio, nenhum retrato fictício em conta real. Confirmação somente após resposta do banco.

## Cycle 2 · critérios antes da implementação

Comunicar origem com texto curto, sem transformar a tela em painel técnico. “Consultando…” antes de sucesso; “Dados conectados” depois; arena is_demo continua “Arena de demonstração”. Sem contagens inventadas, retrato de pessoa fictícia ou botão de ação local em tela de dados reais. Loading com estrutura reservada e reduced motion; erro com retry; vazio com orientação útil; perfil sem sessão leva ao login. Preservar carvão/verde-água e cinco destinos móveis.

## Cycle 0.5 · direção antes da implementação

Preto #07080A e carvão #111317 predominam. Champagne #C8A96A fica na assinatura e em pequenos detalhes. Verde-água #4DE1C1 identifica ação e presença; curtidas usam esse mesmo caminho. Eliminar amarelo de botões, grandes fundos, navegação e estados selecionados. Cards neutros, texto #F7F3EA, metadata #9B9B95, contraste, respiro e transições discretas. Sem novas funções. Preservar leitura de 16px, toque de 44px, foco visível, safe areas e reduced motion. Fotos contextualizam a areia sem colorir toda a interface.

## Rodada 2 · critérios registrados antes da UI

A auditoria encontrou uma landing bem acabada, porém distante de um aplicativo social: o slogan ocupa mais espaço que pessoas e não há ação social utilizável.

## Direção obrigatória

- Abrir no feed e deixar uma pessoa começar a usar o produto sem atravessar um hero.
- Mostrar quem joga, onde joga e como encontrar a turma.
- Fazer check-in ser um comportamento central com estado, expiração e saída.
- Evitar cara de dashboard, SaaS, template e landing institucional.
- Base mobile 390px; desktop amplia a experiência existente.
- Paleta contida, sem emojis decorativos, excesso de bordas ou gradientes.
- Pessoas, contexto e conteúdo diferenciam os cards.
- Texto brasileiro: “Bora jogar?”, “Na areia”, “Sua turma”, “Conectar”.
- Dados fictícios identificados em todas as telas sociais.
- Nenhum botão sem efeito, filtro decorativo, contagem que não acompanha a ação ou link quebrado.
- Feed, busca, check-in e perfil têm estados vazios e feedback.
- Inputs com 16px, labels e mensagens; foco visível; reduced motion.
- Bottom navigation com área de toque confortável, active state e safe area.
- Nenhum conteúdo útil fica debaixo da barra inferior.
- Não usar fotos inventadas como prova de uma arena real; são ilustrações dos dados de demonstração.

## Critérios de revisão após implementar

1. Em cada tela é possível identificar uma ação útil sem ler um parágrafo.
2. Busca e filtros realmente mudam o resultado.
3. Curtir, conectar e seguir são reversíveis; o estado acompanha a navegação.
4. Um check-in iniciado aparece no feed/perfil e pode ser encerrado.
5. Perfil próprio e outro jogador têm ações diferentes.
6. Publicação e comentário exigem conteúdo válido e retornam feedback.
7. Nenhuma parte do demo tenta usar Supabase sem configuração.
8. Fotos, fontes, ícones, espaçamentos e estados pertencem ao mesmo sistema.
9. Texto continua legível em telas estreitas; overflow horizontal apenas em listas intencionais.
10. Modal tem foco, Escape, fechamento e rolagem acessíveis.

## Aprendizados da rodada

- O feed como entrada torna pessoas, presença e contexto acessíveis imediatamente; a landing anterior deixou de ser o caminho principal.
- Retratos em vez de iniciais diferenciam os jogadores sem adicionar rótulos ou informação desnecessária.
- Cards de post, arena, jogador e check-in têm composições próprias; o sistema mantém a mesma paleta e ritmo.
- O check-in é uma ação com estado compartilhado, substituição, prazo e saída. Sua presença repercute em feed, arena e perfil.
- Acompanhamento e conexão precisam alterar labels e listas de modo consistente; contagens ilustrativas estão separadas das ações locais.
- Texto técnico ficou na documentação. O produto só comunica o limite relevante: pessoas fictícias e ações nesta sessão.
- Fonte mínima de metadata revisada para 12px, corpo/inputs 16px, chips com rolagem intencional e safe area na barra inferior.
- Dialog nativo cuida de foco/Escape; o clique no backdrop foi delimitado para não fechar ao tocar o padding interno.
- O contexto de arena pré-seleciona o formulário de check-in; modalidade muda junto com a arena.
- Os testes de regras e HTTP passaram. Eles não comprovam acabamento visual em 390px, foco real, zoom ou instalação; esses cenários ainda requerem inspeção de navegador/dispositivo.

Revisão final em código: sem reserva, pagamento, ranking, botão social vazio ou tentativa de usar banco não configurado. O estado de demo é explícito. Evitar ampliar a quantidade de ações até validar essa jornada com jogadores reais.

## Cycle 0.5 · aprendizado e fechamento

Separar ação e contexto reduziu a dominância de areia: champagne na marca, verde-água no gesto social e branco na seleção de conteúdo. Fundos de check-in e cards laterais agora são carvão. Inspeção em navegador 390×844 cobriu seis jornadas sem overflow horizontal; capturas de feed/check-in revisadas. Foco, safe areas, alvos de 44px e reduced motion preservados. Lint/typecheck/build aprovados.

## Cycle 1 · critérios antes da implementação

Sem alterações visuais. A existência de migrations não autoriza remover o aviso de demonstração. Seeds têm is_demo e descrição fictícia; nenhum número de atividade inventado entra no banco. Separar catálogo real (esportes) de arenas ilustrativas. Não usar fotos de demonstração como avatar padrão de contas reais; perfis futuros devem assumir ausência de retrato.

## Cycle 1 · aprendizado e fechamento

Separar is_demo da persistência é necessário: uma arena fictícia pode estar salva no banco e ainda requer rótulo. O trigger usa avatar ausente e disponibilidade falsa para contas novas, sem atribuir retrato ou presença inventados. A fundação não altera os avisos do frontend. SQL/RLS local validado não equivale a produto social persistente; a integração começa no Cycle 2.

## Cycle 2 · aprendizados e fechamento

Origem e autenticidade são informações diferentes: “Dados conectados” confirma uma leitura bem-sucedida; “Arena de demonstração” continua visível quando is_demo é verdadeiro. Sem consultas bem-sucedidas, só loading/erro/sessão. O header conectado usa ícone neutro e a lateral omite atividade inventada. Não mostrar números de comunidade ou pessoas sem origem real. Fotos de demo ficam restritas às arenas fictícias. Campos longos podem vir do banco: nomes/descrições/username receberam quebra de linha. Navegador 390×844 confirmou catálogo, busca, detalhe e perfil sem overflow; estados vazio/erro/retry/sessão foram exercitados. O acabamento foi verificado com fixture local; não implica prontidão do backend hospedado.


## Cycle 3 · resultado

Cycle 3 concluído: onboarding e edição atômica por save_profile, identidade verificada, autenticação retorna ao perfil, dados descartados após troca de sessão. 32 testes passaram; lint/typecheck/build passaram. Corrigidos parâmetro TS incompatível com strip-only e tipos gerados duplicados em .next. Auth/e-mail/refresh hospedados seguem pendentes. Próximo: Cycle 4, start_checkin/end_checkin e presença com prazo.
