> Referência histórica. O Ciclo 9 amplia o escopo para comunidades próprias e gestão de arenas. Para comportamento/configuração atuais, consulte README, CYCLE9_CONTRACTS e ENVIRONMENTS; preserve as regras de segurança deste documento.

# Plano de ação — Pico MVP

Atualizado em 9 de setembro de 2026.

Este documento preserva a fundação e a sequência de implementação real.
O estado corrente e a rodada social com mocks estão em [pico-product-plan.md](pico-product-plan.md).
As rotas canônicas da rodada 2 são /feed, /arenas/[slug], /checkin, /descobrir e /perfil; substituem as sugestões de nomes abaixo.

## Norte do produto

**Pico. O ponto de encontro da areia. Me acha no Pico.**

Uma rede social mobile-first para futevôlei, beach tennis e vôlei de praia. Conecta pessoas, arenas, jogos e comunidades. A arena é o contexto social do encontro.

O MVP precisa responder:

1. Quem joga onde eu jogo?
2. Quem está disponível para jogar?
3. O que está acontecendo nas arenas que eu frequento?

## Entrega 0 — Fundação e primeira home

Implementado nesta entrega:

- Setup do Next.js 16, React 19, TypeScript e Tailwind 4 preservado.
- Cache npm local para contornar o erro EACCES no cache global.
- Dependências corretas instaladas e lockfile versionado.
- Home de apresentação com identidade Pico, botões de cadastro/entrada e exemplos sociais.
- Componentes iniciais: Brand, SportChip, Avatar, Button, Input e GlassPanel.
- Rotas /login e /signup com integração preparada para Supabase Auth.
- Callback PKCE /auth/callback, tratamento de falhas e estado de sessão no cliente.
- Ausência de configuração tratada explicitamente, sem sucesso fictício.
- Manifesto, ícones e metadados da base PWA.
- Arquivos de contexto, desenvolvimento e revisão visual.

Limites: Supabase não foi provisionado; nenhum segredo, usuário, tabela ou bucket foi criado. Autenticação real depende de configurar e verificar o projeto. Os cards da home são ilustrativos. Não há feed, perfil, comunidade ou check-in persistido. Não há service worker ou funcionamento offline.

Critérios de aceite da fundação:

- npm install e npm run dev executam sem o erro de cache.
- A rota / responde HTTP 200 e substitui o starter.
- /login e /signup têm conteúdo próprio e explicam a indisponibilidade sem configuração.
- Build, lint e checagem de tipos passam.
- Os cinco arquivos solicitados existem.
- Alterações ficam em commit local; push somente se existir remote configurado.

## Entrega 1 — Identidade e perfil

Objetivo: uma pessoa se cadastrar, confirmar seu e-mail e ter um perfil reconhecível.

- Criar projeto Supabase e configurar URLs de retorno, e-mail e variáveis.
- Exercitar cadastro, confirmação PKCE no mesmo navegador, credenciais inválidas, e-mail não confirmado, entrada, renovação e saída.
- Adicionar renovação de sessão via proxy antes de páginas privadas renderizadas no servidor.
- Proteger rotas no servidor com getClaims ou getUser; nunca confiar no objeto de sessão do navegador para autorização.
- Criar migrations, tipos gerados e políticas RLS.
- Onboarding curto: nome, username, esporte, nível por esporte e arenas.
- Disponibilidade declarada e editável; não inferir presença da localização.
- Avatar no Storage com limite de tamanho, MIME permitido e acesso por proprietário.
- Perfil próprio e perfil público com Instagram opcional. E-mail fica privado.
- Recuperação de senha e reenvio de confirmação antes de abrir o piloto.

Aceite: usuário A não edita o perfil de B; visitante não acessa dados privados; atualização persiste após recarregar; avatar respeita políticas; onboarding pode ser retomado.

## Entrega 2 — Arenas e pertencimento

Objetivo: encontrar a arena e reconhecer quem joga ali.

- Listagem /arenas e detalhe /arenas/[id].
- Nome, localização aproximada, esportes e descrição curta.
- Ação de seguir/participar e listagem de membros.
- Descoberta inicial por texto/cidade/esporte, sem mapa em tempo real.
- Cadastro inicial de arenas por seed revisado, sem inventar afiliação ou atividade.
- Diferenciar dados demonstrativos e dados do piloto.

Aceite: seguir/deixar de seguir é idempotente, persiste e não duplica vínculos. Detalhes inexistentes exibem 404 útil. A visibilidade dos membros respeita suas configurações.

## Entrega 3 — Presença e disponibilidade

Objetivo: ver quem está na areia ou disponível para jogar.

- /check-in: escolher arena, esporte e confirmar presença voluntária.
- Registrar início, expiração e encerramento.
- Um check-in ativo por jogador; encerrar o anterior ao trocar de arena.
- Determinar validade no servidor, sem depender apenas do relógio do cliente.
- Permitir sair imediatamente; não mostrar presença depois de expirada.
- Mostrar contexto de arena e esporte, sem rastreamento contínuo ou coordenada exata.

Aceite: check-in expirado desaparece; um jogador não altera a presença de outro; múltiplos cliques não duplicam registro; recarregar mantém o estado verdadeiro.

## Entrega 4 — Feed e comunidade

Objetivo: acompanhar o que acontece onde o usuário joga.

- /home: feed das arenas acompanhadas.
- Post curto de texto e uma imagem opcional.
- Posts associados a uma arena; curtida simples e comentário curto.
- Comunidade inicial é o mural da arena. Chat privado fica fora desta entrega.
- Paginação, estados vazios, tentativas de novo envio e exclusão pelo autor.
- Limites de upload, políticas de Storage e mecanismo mínimo de denúncia/bloqueio antes do piloto.

Aceite: permissões verificadas no banco; feed paginado sem duplicação; falha de envio não vira post fantasma; exclusão respeita autoria.

## Entrega 5 — Descoberta e piloto PWA

Objetivo: descobrir uma próxima dupla e usar o Pico pelo celular.

- /explore: filtrar por esporte, arena, nível e disponibilidade.
- Cards de jogadores com informação suficiente para reconhecer e conectar.
- Perfis públicos só exibem campos permitidos.
- BottomNav apenas quando as rotas de produto existirem.
- Rever instalação em Android/iOS, ícones, safe areas, acessibilidade, conexão lenta e atualização.
- Definir service worker com fallback offline. Nunca cachear sessão, callback ou dados privados indiscriminadamente.
- Deploy Vercel com HTTPS, variáveis por ambiente e Supabase com URLs corretas.
- Piloto pequeno em arenas conhecidas; coletar feedback com consentimento.

Aceite: fluxo cadastro → perfil → arena → check-in → descoberta funciona de ponta a ponta em celular. Os estados offline e de indisponibilidade são claros.

## Modelo de dados proposto

Esta tabela é um desenho de trabalho, não uma migration aplicada.

| Entidade | Campos principais | Relação/regra |
| --- | --- | --- |
| profiles | id, username, display_name, bio, avatar_path, instagram, city, availability | id referencia auth.users; username único sem diferença de caixa; sem e-mail público |
| sports | id, slug, name | três modalidades iniciais |
| player_sports | player_id, sport_id, level | um vínculo por jogador/esporte; nível validado |
| arenas | id, slug, name, city, neighborhood, description | localização suficiente para identificar a arena |
| arena_sports | arena_id, sport_id | par único |
| arena_members | arena_id, player_id, joined_at | par único; gestão pelo próprio jogador |
| check_ins | id, player_id, arena_id, sport_id, started_at, expires_at, ended_at | uma presença ativa; expiração no servidor |
| posts | id, author_id, arena_id, body, image_path, created_at | autor pode alterar/excluir; limites de texto |
| post_likes | post_id, player_id | par único |
| comments | id, post_id, author_id, body, created_at | autoria verificada |

Antes de escrever tabelas: definir política de visibilidade, duração do check-in, vocabulário de níveis e regras de moderação. Escolher defaults simples, registrar a decisão e avançar dentro do escopo.

## Regras técnicas

- Migrations em supabase/migrations, versionadas, pequenas e inspecionáveis.
- RLS em toda tabela exposta; testar como anônimo e como dois usuários distintos.
- Índices nas FKs e nos filtros efetivamente usados; feed com ordenação estável.
- Nunca colocar service_role ou secret key no cliente.
- Storage com políticas e limites; nenhum upload irrestrito.
- Server Components por padrão; cliente só onde houver estado/interação.
- Nenhum localStorage simulando banco de produto.
- Estados otimistas precisam de reversão em erro.
- Medir carregamento e queries antes de adicionar cache, animações ou dependências.
- Privacidade e consentimento antes de presença pública ou importação de contatos.

## Fora do MVP

IA, voz, reservas, pagamentos, dashboard B2B, anúncios, ranking avançado, mapa em tempo real e app nativo. Também não antecipar chat completo, torneios, planos comerciais ou integrações de agenda.

## Como avaliar o piloto

Acompanhar, de forma agregada: conclusão de perfil, primeira arena seguida, primeiro check-in e retorno semanal. Ouvir se as pessoas reconheceram alguém, encontraram uma dupla ou descobriram atividade na arena. Definir metas numéricas depois da linha de base; não inventar métricas.
