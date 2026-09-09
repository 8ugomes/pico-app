# Pico — Deslopify

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
