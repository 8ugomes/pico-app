# Pico — Deslopify

## Ciclo 9 — critérios antes da implementação

Preservar grafite, superfícies escuras, texto legível, acento verde-água e navegação enxuta. Comunidades aparecem como grupos de pessoas, arenas como locais; gestão contextual não vira aba principal de todos. Composer explicita audiência, marcação de local e distribuição. Entrada pendente não parece participação aprovada. Recorte confirma exatamente os pixels enviados; cancelar preserva a foto anterior. Sem métricas fictícias, sucesso parcial oculto, jargão de infraestrutura na jornada ou promessa de lançamento. Revisar 320/390/430 px, foco, teclado, zoom acessível, safe areas e reduced motion. Testes emulados não serão chamados de aparelhos reais.

# Pico — Deslopify

## Ciclo 8 · critérios antes da implementação

Preservar grafite, verde-água, navegação e layout social. Foto opcional no compositor e avatar editável no perfil; não inventar retratos. Ações de segurança ficam em detalhes do conteúdo/perfil e em Privacidade e conta. Explicar o efeito do bloqueio, manter desbloqueio acessível e confirmar exclusão definitiva com senha. Progresso e falha de upload devem manter o texto; falha de gravação não mostra sucesso. Nenhum dado pessoal em cache offline. Revisar 320/390 px, alvos de toque, labels, foco, estados vazios e troca de sessão na versão publicada.

## Ciclo 8 · aprendizado e verificação

Foto opcional ficou no compositor e avatar no perfil. Segurança aparece em opções do conteúdo/perfil e em Privacidade e conta; diálogo explica o efeito antes da exclusão. Preservado o layout, sem redesign. Upload e publicação mostraram progresso e confirmação real no navegador; avatar e foto carregaram após recarga. Perfil/feed em 390 px e conta em 320 px sem overflow. Diálogo nativo manteve foco, Escape e inputs de 16 px. Logout entre abas e troca de identidade descartaram os dados anteriores.

O refresh por foco preserva formulários; mudanças de identidade são tratadas por invalidação e navegação completa. Recuperação externa e aparelhos físicos continuam explicitamente pendentes. A página de privacidade comunica controles existentes sem inventar um responsável ou prazo de resposta.

## Integração hospedada · critérios antes da execução

Preservar a interface e o escopo dos Cycles 0.5–7. Com configuração real, todas as telas devem mostrar apenas leituras confirmadas, estados vazios ou erros recuperáveis. Nenhuma falha de Auth/PostgREST pode revelar o demo. Arenas fictícias persistidas continuam identificadas como demonstração; usuários descartáveis de validação devem ser removidos ao terminar. Confirmar sessão, recarga, callback e troca de conta sem expor tokens, dados anteriores ou mensagens internas do banco.

## Integração hospedada · aprendizado

A interface existente funcionou com dados reais sem redesign. Perfil permanece após recarga; check-in recebe prazo do banco; publicação, like e comentário só confirmam após persistência. Feed vazio e ausência de outros jogadores orientam sem inventar atividade. Em 390px, feed conectado sem overflow; arenas seed seguem rotuladas Demo e contas não recebem foto fictícia. Os detalhes de CLI, RLS e plano SMTP ficaram na documentação técnica.

As seções de Cycles 0.5–7 abaixo preservam o histórico anterior à validação hospedada.

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


## Cycle 4 · AUDIT / PLAN

Check-ins atuais são demo e a tabela nega toda escrita direta. Implementar RPCs start_checkin(arena_id,sport_id) e end_checkin() com auth.uid(), lock por perfil, arena pública/modalidade válidas e prazo de duas horas. Integrar formulário e presença com atualização periódica; preservar demo. Aceite: substituição atômica, saída própria, prazo do servidor, rejeição de autoria client e arena inválida. UI mostra prazo, consentimento e saída visível; nenhum tracking. Verificar SQL, lint, typecheck e build.


## Cycle 4 · resultado

Cycle 4 implementado: start_checkin/end_checkin com auth.uid(), locks por jogador, arena pública e modalidade válidas; expiração em 2h; substituição e saída própria. /checkin usa presença real, atualização periódica e demo explícito. 36 testes passaram; lint/typecheck/build passaram. Tipos duplicados gerados pelo ambiente voltaram a aparecer: tsconfig exclui somente cópias com espaço no nome dentro de .next. Testes PGlite cobrem transações/duas identidades, mas não concorrência de múltiplas conexões de Postgres hospedado. Próximo: Cycle 5, feed social.


## Cycle 5 · AUDIT / PLAN

Feed atual é demo; schema já protege autoria e visibilidade de posts/likes/comentários. Integrar feed paginado, publicação contextualizada por arena/esporte, curtir/descurtir e comentários paginados. Leituras com contagens no banco sem carregar listas ilimitadas. Aceite: autoria derivada da sessão, sem otimismos falsos, texto preservado em erro, vazio convida ao primeiro post, RLS continua protegendo ações de outras contas. Testar SQL/validação e lint/typecheck/build.


## Cycle 5 · resultado

Cycle 5 concluído: feed e mural da arena com posts persistidos, curtidas reversíveis, comentários e paginação de 20 itens. Escritas derivam autoria de auth.uid(), validação no servidor e RLS; contagens pelo banco. Atualização após mutation preserva formulário/comentário aberto; troca de conta descarta dados anteriores. 40 testes, lint, typecheck e build passaram. Upload de fotos não implementado; Auth/PostgREST hospedados pendentes. Próximo: Cycle 6, conexões e descoberta.


## Cycle 6 · AUDIT / PLAN

Descoberta e perfis alheios ainda são demo. Criar conexões unilaterais privadas do seguidor, sem auto-conexão; descoberta paginada de perfis completos por esporte/nível, arena (vínculo ou presença ativa) e check-in ativo nas últimas duas horas. Integrar perfil por username e links do feed/presença, sem e-mail. Sem grupos/comunidades novas. Aceite: RLS de autoria, identidade verificada, filtros aplicados no banco antes da paginação, ausência de falso jogador em ambiente conectado. Testes SQL/SDK, lint/typecheck/build.


## Cycle 6 · resultado

Cycle 6 concluído: connections com RLS privada do seguidor, sem auto-conexão; descoberta paginada por arena/esporte/nível/presença ativa; perfis por username e links reais no feed/check-in. Apenas perfis com onboarding e esporte entram na descoberta; nenhuma comunidade nova. 43 testes, lint, typecheck e build passaram. Próximo: Cycle 7, jornada completa no navegador, revisão mobile/erros e checklist beta. Integração hospedada ainda pendente.


## Cycle 7 · AUDIT / PLAN

Núcleo social conectado está implementado em todos os destinos, com 43 testes; ainda falta exercer a jornada integrada no navegador e revisar estados/responsividade. Expandir fixture local de transporte para Auth simulado e SQL real das migrations, testar cadastro→onboarding→arena→check-in→post→curtida/comentário→descoberta→conexão→logout. Revisar 390px/desktop, expiração, loading sem apagar rascunho, autenticação inválida e erros sem fallback oculto. Atualizar README/schema/plano/checklist beta com evidência e limite explícito: não equivale a validar Supabase hospedado, e-mail, JWT real, concorrência multi-conexão ou instalação em aparelho.


## Cycle 7 · VERIFY / DOCUMENT / NEXT

Cycle 7 concluído: jornada integrada no navegador (SQL/PGlite real, Auth/REST simulado) de cadastro até logout, incluindo onboarding, arena, check-in, post, curtir/descurtir, comentário, descoberta e conectar/desconectar. Conflito de username não grava parcialmente; falha de publicação mantém rascunho; retry não troca para demo. Formulário de arena pré-seleciona o contexto, perfil editável não repete a identidade, avisos de curtida/comentário ficam discretos, rascunho é separado por conta e presenças expiradas saem da descoberta.

Verificação visual: 390×844 e desktop 1280; cinco destinos em 320px sem overflow horizontal, um h1 por tela e inputs observados a 16px. 43 testes automatizados e 39 verificações HTTP integradas; lint/typecheck/build aprovados. A fixture serializa o Postgres descartável e não implementa segurança de Auth real. Isso não comprova e-mail, JWT, refresh hospedado, concorrência multi-conexão nem aparelhos físicos.

Ainda demo: todas as jornadas quando falta configuração; seeds continuam fictícios mesmo no banco conectado. Limites conectados: sem upload, acompanhamento de arenas na UI, edição/exclusão de posts/comentários na UI, recuperação de senha, bloqueios/moderação ou service worker. README e BETA_CHECKLIST.md documentam o que falta antes do beta hospedado.

Próximo avanço: validar o ambiente Supabase de desenvolvimento com duas contas reais e executar os itens pendentes do checklist beta. Prompt: “Execute a validação hospedada do BETA_CHECKLIST.md com o projeto de desenvolvimento configurado, mantenha o escopo dos Cycles 0.5–7 e registre as evidências.”


## Ciclo 9.7

9.7: avatar circular com saída quadrada; capa 3:1; posts original/1:1/4:5/16:9. Zoom por toque/teclado/slider e rotação. Cancelamento/falha preserva referência. HEIC exige exportação explícita; sem promessa de suporte. Modal respeita cancelamento durante envio.


9.8: explicar qual convite é aceito e qual conta está em uso; não perder destino ao entrar. E-mail aberto em outro contexto pede confirmação visível, sem consumir por GET.


## Ciclo 9.8

9.8: abrir link não consome convite, entrar não perde destino. Recuperação esclarece que navegador e PWA têm sessões diferentes. Sem declarar recebimento de e-mail sem caixa verificada.


9.9: instalação contextual, beta identificado, instruções honestas para iOS/navegadores internos. Atualizar só por ação consciente; safe areas e toques mínimos. Dispositivos físicos permanecem distintos de emulação.


## Ciclo 9.9

9.9: beta interno identificado, link de instalação dispensável, aviso de rede sem descartar rascunho. Atualização manual explica perda de edição não salva. Sessão revalidada ao foreground; troca de identidade descarta a árvore. Sem SW; nenhuma evidência física presumida.
