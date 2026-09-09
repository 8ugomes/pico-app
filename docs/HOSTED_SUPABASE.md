# Pico — ambiente hospedado de desenvolvimento

## Ambiente

- Supabase: `pico-dev`, ref `bxjhqxdfknspxezgftyz`, organização existente SAMBA, plano Free, região `sa-east-1` (São Paulo).
- API: `https://bxjhqxdfknspxezgftyz.supabase.co`.
- Vercel: `hugosamba/pico-app`, projeto `prj_0vpAtATOxFKniX5GSPgi1V72tI5Z`, plano Hobby, funções em `gru1`.
- Aplicativo: [pico-app-sepia.vercel.app](https://pico-app-sepia.vercel.app).
- Não havia projeto Pico nas duas plataformas; Samba foi preservado. Deploy por CLI no caminho Vercel previsto. O GitHub App da Vercel não está instalado: push no GitHub e deploy são etapas separadas.

Este é um ambiente de desenvolvimento com arenas fictícias identificadas. A URL pública não equivale a liberação para beta amplo.

## Banco e autorização

O banco estava vazio. Dry-run revisado antes de aplicar as cinco migrations `20260909010000`, `20260909030000`, `20260909040000`, `20260909050000` e `20260909060000`, mais o seed de desenvolvimento. Histórico local/remoto confere; nenhuma migration histórica alterada.

Onze tabelas: profiles, sports, arenas, arena_sports, player_sports, arena_members, posts, post_likes, comments, checkins e connections. Todas têm RLS; 27 policies. Anônimo lê apenas catálogo público. Usuários editam somente dados próprios; timestamps, IDs e flags administrativas não recebem grants de atualização. Check-ins não aceitam nenhuma escrita direta do cliente.

RPCs autenticadas: save_profile, start_checkin, end_checkin, read_feed e discover_players. Identidade vem de auth.uid(). Todas têm search_path vazio; start/end são SECURITY DEFINER, as demais SECURITY INVOKER. handle_new_user é trigger, sem EXECUTE para anônimo/autenticado. Detalhes em [schema](04_SUPABASE_SCHEMA.md); `supabase/audit.sql` consulta o catálogo sem ler dados de jogadores.

O app usa a publishable key e a sessão do jogador. getUser verifica identidade nos Route Handlers; RLS é a segunda barreira. Páginas não carregam dados privados em Server Components. Respostas privadas e callback usam no-store. Não há Storage, service worker ou cache offline privado.

## Auth

E-mail/senha habilitados; OAuth social, telefone e usuários anônimos desabilitados. No `pico-dev`, confirmação de e-mail está desabilitada para permitir cadastro imediato sem serviço SMTP pago. O SMTP padrão só entrega para membros da organização; antes de receber público externo com e-mail verificado, configurar SMTP próprio e reativar confirmação. O template e callback PKCE existentes permanecem compatíveis.

Site URL: `https://pico-app-sepia.vercel.app`. Redirect URLs:

- `http://localhost:3000/auth/callback`
- `http://localhost:3002/auth/callback` (verificação local isolada)
- `https://pico-app-sepia.vercel.app/auth/callback`
- `https://pico-app-*-hugosamba.vercel.app/auth/callback`
- `https://pico-*-hugosamba.vercel.app/auth/callback`

O config.toml principal descreve o stack local com confirmação habilitada. Não executar config push sem revisar config diff: o ambiente hospedado possui URLs e decisão de confirmação próprias.

## Credenciais e desenvolvimento

`.env.local` contém apenas NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. As mesmas variáveis estão na Vercel em Development, Preview e Production. Valores secretos nunca usam NEXT_PUBLIC_*.

CLI autenticada pelos mecanismos das plataformas; vínculo fica em supabase/.temp e .vercel. `.env.hosted-admin`, quando presente, é exclusivamente administrativo para testes/limpeza, permissão 0600 e ignorado pelo Git e Vercel. Nunca importar esse arquivo no app. `.vercelignore` também exclui a fixture e os testes do upload.

Após autenticar e vincular o projeto correto:

```sh
npx supabase@2.117.0 migration list --linked
npx supabase@2.117.0 db push --linked --dry-run --skip-vault
npx supabase@2.117.0 db push --linked --skip-vault
npx supabase@2.117.0 db query --linked --file supabase/audit.sql
npm run db:types
npm run typecheck
```

Criar novas migrations para correções. Não usar reset remoto ou reparar histórico sem comparar o schema. Seed só em desenvolvimento. Executar comandos de banco da CLI sequencialmente: comandos simultâneos podem disputar a senha temporária de cli_login_postgres. SUPABASE_DB_PASSWORD pode ser fornecida pelo ambiente administrativo protegido, nunca em log/argumento digitado.

`npm run db:types` gera o schema public diretamente do projeto linked e só substitui src/types/database.ts após sucesso. O arquivo gerado não recebe ajustes manuais. DTOs em src/types/read.ts derivam dele; apenas explicitam a presença opcional do LEFT JOIN, cuja nulabilidade não é informada pelo gerador de RETURNS TABLE.

## Verificações reproduzíveis

```sh
npm run lint
npm run typecheck
npm test
npm run build
# Exige ambiente administrativo protegido e o Pico iniciado.
npm run test:hosted -- bxjhqxdfknspxezgftyz http://localhost:3000 https://pico-app-sepia.vercel.app
```

O teste hospedado exige ref explícito igual à URL configurada, cria duas contas descartáveis com senhas aleatórias e remove essas contas em finally. As ações sociais usam apenas seus JWTs; a chave administrativa serve para limpeza. Não executar contra produção. A falha de signup por propagação de configuração não é tratada como aprovação.

Evidência de 9 de setembro de 2026: 43 testes locais; 149 checks hospedados nos dois origins; onboarding, perfil, check-in, post, descoberta, conexão, likes/comments, login/logout, sessão restaurada por cookies e refresh de tokens reais. Tentativas diretas de forjar autoria/perfil/check-in/vínculos foram negadas. Quatro start_checkin simultâneos deixaram um único registro ativo, nos dois origins. As duas contas do teste foram excluídas com cascade.

PKCE foi exercitado separadamente com confirmação habilitada: signup real para o endereço autorizado da equipe, confirmação e callback local; segundo fluxo de Auth com callback na Vercel. O teste consumiu os tokens do próprio usuário descartável via administração para automatizar a confirmação; não inspecionou a caixa de e-mail e não comprova entrega/expiração de mensagem. Nenhuma interface nova de recuperação de senha foi criada.

Interface Vercel: cadastro, onboarding, perfil após recarga, check-in, post, like, comentário, encerramento, logout, erro de senha e novo login passaram. Feed móvel em 390px sem overflow. Contas de PKCE e navegador também removidas; oito tabelas de usuários/atividade ficaram sem resíduos de teste e o catálogo foi preservado. Build local final isolado em 3002 passou no smoke autenticado; processo de verificação encerrado, dev em 3000 preservado. Deployment final `dpl_4ig8Cydxtq8LaN4KTtdCX5D3RLeJ` pronto, com smoke público/anônimo aprovado.

Deploy: `npx vercel@59.14.0 deploy --prod` no projeto linked, após checks. Não cria vínculo Git automático. Validar a URL canônica e as variáveis após cada alteração. Rollback do app pela Vercel; preservar dados e preferir migration corretiva para o banco.

Limites de liberação: [checklist beta](BETA_CHECKLIST.md). SMTP público, moderação/recuperação de acesso e testes em aparelhos físicos continuam fora desta integração de infraestrutura.
