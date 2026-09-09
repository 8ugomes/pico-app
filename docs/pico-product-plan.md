# Pico — plano de produto

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
