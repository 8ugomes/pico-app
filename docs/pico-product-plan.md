# Pico — plano de produto

## Ciclo 9 — AUDIT / PLAN (2026-09-09)

Branch `cycle-9-internal`, baseline `7d6f288`. Rodada exclusiva de revisão interna; sem lançamento, convites externos, merge em main ou promoção pública.

Auditoria real: Supabase bxjhqxdfknspxezgftyz contém nove migrations, 15 tabelas com RLS, 1 conta/perfil, 3 arenas demo, 1 arquivo, zero posts/check-ins. Contagens não identificam o responsável: bootstrap depende de UID verificado. Arenas concedem apenas SELECT a anon/authenticated; interface conectada não oferece edição. Classificação: funcionalidade ausente, sem evidência de vulnerabilidade. Posts exigem arena/esporte; arena_members representa participação sem gestão. Histórico fica limitado à presença ativa. Storage privado e bloqueios já funcionam. Configuração atual reutiliza beta em desenvolvimento/previews: deve ser separada antes de experimentos.

48 testes baseline aprovados. Os 168 checks históricos do Ciclo 8 não são evidência do Ciclo 9. Baseline lint/types/build serão registrados no loop.

Sequência e incrementos:
1. 9.0 contratos e matriz em CYCLE9_CONTRACTS.md; expansão preserva schema/dados antigos.
2. 9.1 desenvolvimento exclusivo, beta existente fechado, produção não provisionada; validação de destino em comandos; admissão em RLS/Auth.
3. 9.2 papéis globais/escopados, auditoria, bootstrap por UID, administração e custódia.
4. 9.3 perfil e edição transacional de arena, participação e convites de gestão.
5. 9.4 comunidades, modos de entrada, audiência e participantes.
6. 9.5 post canônico, destinos atômicos, idempotência e autorização transitiva de mídia/engajamento.
7. 9.6 histórico privado paginado, arenas recentes e vínculos autorizados.
8. 9.7 recorte reutilizável com pixels persistidos, zoom/rotação e limites antes do envio.
9. 9.8 admissão administrativa e recuperação; SMTP/caixa dependem de acesso externo.
10. 9.9 instalação/versionamento PWA sem cache privado; evidência física separada.
11. 9.10 moderação, backup protegido, restauração isolada e CI sem segredos.
12. 9.11 regressão por papéis, interface interna, limpeza rastreada, docs, push branch; deploy interno só após verificações essenciais.

As migrations novas serão testadas primeiro em PostgreSQL descartável e desenvolvimento exclusivo. No beta, apenas incrementos compatíveis e verificados; nunca reaplicar as nove migrations históricas. Nenhuma cópia de contas/dados pessoais entre projetos. Incapacidade de SMTP, bootstrap ou dispositivo físico bloqueia apenas sua comprovação dependente.


## Ciclo 8 · AUDIT / PLAN · 9 de setembro de 2026

Baseline confirmado: main 26619e7, Vercel publicada, Supabase bxjhqxdfknspxezgftyz, cinco migrations remotas, Auth e núcleo social reais. Não recriar infraestrutura. Lacunas: mídia, bloqueio/denúncia, recuperação, exclusão de conta, limites de abuso e privacidade.

Execução: migration aditiva para bloqueios bilaterais, denúncias privadas e limites transacionais; buckets privados e uploads normalizados no servidor; integrar avatar, mídia, exclusão de conteúdo próprio e segurança da conta; revisar sessão/mobile/PWA sem cache privado; aplicar apenas migrations novas, gerar tipos e testar duas contas no app publicado; documentar, commitar, publicar e conferir produção.

Uploads e exclusão administrativa exigem SUPABASE_SECRET_KEY exclusivamente no servidor. Leitura de imagem usa sessão e RLS a cada acesso, sem URLs públicas ou assinadas. Arquivos são limitados por tamanho, quantidade e frequência; processamento remove metadados. Bloqueio oculta dados sociais nos dois sentidos, inclusive mídia. Denúncias ficam privadas para autor e operação, sem punição automática por contagem. Exclusão pede senha novamente e remove arquivos antes da identidade.

Não contratar SMTP nem serviço pago. A entrega externa de recuperação/validação de e-mail e testes em aparelhos físicos continuam gates explícitos se não puderem ser comprovados. Implementar e validar todo o restante antes do fechamento.

## Ciclo 8 · VERIFY / DOCUMENT

Entregues avatar e posts com fotos privadas, bloqueio bilateral, denúncia/triagem, exclusão própria de conteúdo e conta, recuperação de acesso, limites transacionais e descarte de telas após troca de identidade. Aplicadas quatro migrations novas; nove no remoto. Nenhum projeto, seed ou migration anterior foi recriado. Tipos gerados do Supabase, 48 testes locais e validação hospedada com duas contas. Casos remotos revelaram ambiguidade de relacionamento no feed e entrega de foto após bloqueio; ambos foram corrigidos e retestados.

A liberação externa continua BLOCKED por SMTP, contato/responsabilidade operacional e validações de continuidade/dispositivos. O checklist separa código entregue, serviço realmente testado e o que ainda exige o responsável. Não confundir URL pública com beta liberado.

## Integração hospedada · AUDIT / PLAN · 9 de setembro de 2026

Objetivo autorizado: conectar o núcleo existente ao Supabase de desenvolvimento e ao projeto Vercel existente, sem ampliar o produto. Baseline: lint, typecheck, 43 testes e build aprovados; main inicialmente limpa em 47be8ae. Não há `.env.local`, vínculo de projeto ou credenciais de CLI disponíveis neste checkout. Autenticação das plataformas iniciada pelas páginas oficiais.

Sequência: identificar os projetos existentes; vincular a CLI; comparar schema/histórico e executar dry-run; aplicar apenas migrations ausentes; auditar grants/RLS/RPCs; configurar Auth e envs; gerar tipos do banco hospedado; validar duas identidades e limpar os dados descartáveis; verificar o deployment existente; atualizar evidências e publicar um commit sem force-push. Não declarar integração concluída com base nos testes locais.

Antes de alterar o banco, executar uma auditoria somente de leitura. O teste hospedado deve validar tanto os Route Handlers reais quanto tentativas diretas de contornar autoria pelo PostgREST. Credenciais administrativas ficam restritas ao processo de preparação/limpeza, fora do app e do Git.

## Integração hospedada · resultado

Pico conectado ao projeto bxjhqxdfknspxezgftyz e publicado em https://pico-app-sepia.vercel.app. Dry-run, cinco migrations, seed, auditoria RLS/grants/RPCs e geração de tipos concluídos. Duas contas passaram por 149 checks hospedados em localhost/Vercel; callback PKCE, renovação de sessão e concorrência real validados. Lint/typecheck/43 testes/build local e remoto aprovados. Cadastro imediato é restrito à decisão do ambiente dev; SMTP público e requisitos do beta permanecem no checklist. Ver HOSTED_SUPABASE.md.

As seções de Cycles 0.5–7 abaixo são históricas, anteriores à validação hospedada.

## Cycle 3 — Real auth and profile · plano corrente

Entregar onboarding e edição do próprio perfil. Reutilizar login/cadastro/logout existentes, preservar demo sem configuração. Persistência atômica de perfil + esporte principal; autorização no servidor e banco; erros recuperáveis sem limpar o formulário. Depois: check-in real.

## Cycle 2 · plano antes da implementação

Conectar somente leituras de arenas, detalhe e perfil próprio. Endpoint com identidade getUser e sem cache, queries tipadas, UI distinta para loading/erro/vazio/sessão e dados conectados. Demo continua completo sem env; erro de configuração/serviço não aciona fallback. Shell conectado sem Rafa/atividade inventada. Preservar as ações do demo; writes reais entram nos ciclos 3–6. Atualizar metadados/slugs para não limitar arenas reais aos mocks.

## Ciclo autônomo · plano corrente

Execução detalhada em CODEX_AUTONOMOUS_LOOP.md. Primeiro Cycle 0.5: base carvão/grafite, champagne pontual e verde-água consistente nas ações; nenhum recurso novo. Depois Cycle 1: migrations, constraints, RLS, trigger de perfil e seeds identificados, verificados em banco local antes de integrar as telas. Ciclos 2–7 cobrem leituras, Auth/perfil, check-in, feed, descoberta e consolidação, um avanço completo por commit.

Os relatos da rodada 2 abaixo são históricos. Ausência de serviço Supabase configurado não impede criar e testar SQL localmente, mas impede declarar validação do serviço hospedado.

## Rodada 2 · 9 de setembro de 2026

Status: implementação e verificações concluídas. Plano registrado antes da UI e atualizado ao fechar a rodada.

## Estado auditado

- Next.js 16.3.4, React 19, TypeScript e Tailwind 4 funcionando; servidor local responde 200.
- main limpa e sincronizada com origin/main (9216df6).
- Home institucional, formulários de autenticação, callback PKCE, manifesto e ícones.
- Nenhuma tela social, estado compartilhado, navegação de produto ou modelo de domínio.
- Supabase opcional: a ausência de variáveis bloqueia somente autenticação.
- Problema visual: hierarquia de landing, foto grande, avatares em iniciais e pouca utilidade social.

## Objetivo desta rodada

Uma demonstração social utilizável em 390px, com pessoas, arenas e check-in como protagonistas.

## Escopo aprovado

1. Entrada / abre /feed.
2. Feed com posts, filtro, curtidas, comentários e publicação de texto em arena.
3. Arenas com busca, filtro por esporte, acompanhamento e detalhe por slug.
4. Check-in voluntário de demonstração, um ativo por pessoa, com duração e encerramento.
5. Descoberta por nome/esporte/disponibilidade e conexões locais.
6. Perfil próprio editável, esportes, arenas e atividade; perfil de pessoas da demonstração.
7. Navegação inferior fixa em todas as telas sociais; alternativa lateral em desktop.
8. Dados fictícios organizados em src/data/mock.ts e tipos compartilhados.
9. Supabase documentado e preparado sem leitura/escrita real de dados sociais.
10. PWA com manifesto alinhado ao feed; instalação/offline evoluem sem cache de dados privados.

## Decisões técnicas antes de codar

- Manter a stack, autenticação existente e cache npm local.
- Agrupar as telas sociais no App Router sob um layout com estado de demonstração compartilhado.
- Estado de interação em memória durante a navegação; recarregar reinicia a demonstração. Não simular persistência em banco.
- O rótulo de demonstração fica visível; contas de Auth não se confundem com o jogador fictício.
- Separar tipos de domínio, dados seed, regras puras e apresentação. Preparar contrato de acesso para substituir mocks gradualmente.
- Check-in do demo usa relógio do cliente e expiração explícita. Produção deverá validar no servidor.
- As rotas canônicas desta rodada são /feed, /arenas, /arenas/[slug], /checkin, /descobrir e /perfil.
- Sem reservas, pagamentos, IA, voz, ranking, chat ou B2B.

## Decisões visuais antes de codar

- Composição desenhada primeiro em 390px, com gutters de 20px e controles de pelo menos 44px.
- Fundo #070707, camadas grafite, destaque areia e verde restrito à presença.
- Tipografia de 16px para leitura, títulos compactos, metadata legível.
- Fotos de pessoas e contexto de arena, sem hero institucional sobre a atividade.
- Cards diferentes por conteúdo; blur concentrado na navegação e sobre fotos.
- Bottom navigation com cinco destinos e check-in central destacado, sem encobrir conteúdo.

## Próxima rodada

- Aplicar migrations/RLS em projeto Supabase, validar duas contas distintas e Storage.
- Onboarding real, recuperação de senha, reenvio de confirmação e renovação de sessão SSR.
- Substituir o estado mock por queries/mutations reais por jornada.
- Piloto em dispositivos físicos, moderação mínima e deploy Vercel.

## Pendências e riscos

- Sem credenciais Supabase: não é possível declarar testes de integração reais.
- Pessoas, arenas, presença e atividades são fictícias de São Paulo.
- Interações do demo não são enviadas a outros usuários nem sobrevivem à recarga.
- Offline completo e instalação em dispositivos reais exigem validação específica.
- Push via terminal ainda depende de autenticação local; a conexão GitHub autorizada pode publicar o conteúdo.

## Fechamento da rodada

Implementado: entrada direta no feed; seis telas obrigatórias; detalhes de três arenas e seis perfis; navegação mobile/desktop; filtros, busca sem distinção de acento, curtidas, comentários, publicação, conexões, acompanhamento de arenas, edição de nome/bio/disponibilidade e check-in com expiração e encerramento.

Fonte única em mock.ts: seis pessoas, três arenas paulistanas fictícias, três posts iniciais, comentários, check-ins, esportes e atividades. Fotos locais originais e retratos reconhecíveis substituem as iniciais nos componentes sociais.

Decisões confirmadas: memória compartilhada pelo layout; sem localStorage, gravação remota ou dependência de Supabase; mesma conta fictícia durante a navegação; reset ao sair do layout ou recarregar. Perfil de Auth permanece separado.

Preparação Supabase: contrato de domínio, contrato manual V1 do banco, queries de leitura explícitas e documento detalhado de RLS/índices/RPCs/Storage. Nenhuma migration aplicada.

Verificação: lint, typecheck e build aprovados; 10 testes de regras aprovados; 15 URLs sociais verificadas via HTTP de produção, além de 404, redirecionamento inicial, callback, Auth sem env e assets/manifesto. Nenhuma inspeção em navegador ou aparelho físico realizada; não declarar instalação/offline ou Auth real validados.

PWA: manifesto agora abre /feed; ícones/safe areas/reduced motion preservados. Service worker permanece para a próxima rodada para evitar prometer cache de dados privados ou persistência inexistente.

Próximos três passos: (1) Auth/perfil/arenas com RLS real; (2) check-in e interações persistentes; (3) validação em aparelhos, offline, moderação e piloto Vercel.

### Cycle 0.5 concluído

Sistema visual aplicado e verificado em navegador móvel simulado e build. Nenhuma funcionalidade alterada; demo continua em memória. Próximo avanço: fundação SQL com testes reais de políticas em Postgres local.

### Cycle 1 · plano antes da implementação

Criar dez tabelas com RLS, grants mínimos, FK composta arena/modalidade, autoria protegida e trigger de perfil. Seed só de catálogo e arenas fictícias; não criar contas fictícias no Auth hospedado. Testar SQL localmente com anônimo e duas identidades. Não integrar telas neste ciclo nem liberar escrita direta em check-ins; RPCs e conexões permanecem nos ciclos próprios.

### Cycle 1 concluído localmente

Dez tabelas com RLS, grants mínimos, integridade, trigger/backfill e seeds versionados. Tipos correspondem ao SQL entregue; objetos futuros foram removidos do contrato executável. Lint/typecheck/build e 20 testes passaram. SQL aplicado em Postgres/PGlite descartável; sem alteração em Supabase hospedado. Auth/e-mail/PostgREST ainda dependem de configuração e testes reais. Próximo ciclo: leituras de arenas/perfil com origem explícita, sem alterar silenciosamente demo em erro de serviço.

### Cycle 2 · fechamento

Leituras de arenas/perfil conectadas por endpoint sem cache, identidade Auth verificada no servidor, DTOs públicos e estados completos. Demo permanece sem env; falhas não usam mock. Shell conectado separa conta real das pessoas fictícias. 29 testes, lint/typecheck/build e verificações de UI/HTTP passaram em ambiente local/controlado. Sem Supabase hospedado disponibilizado; essa integração ainda requer validação. Próximo: Cycle 3 onboarding/edição e sessão.


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
