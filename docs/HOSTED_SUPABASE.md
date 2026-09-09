# Pico — ambiente hospedado de desenvolvimento

## Ambiente

- Supabase: `pico-dev`, ref `bxjhqxdfknspxezgftyz`, organização existente SAMBA, plano Free, região `sa-east-1` (São Paulo).
- API: `https://bxjhqxdfknspxezgftyz.supabase.co`.
- Vercel: `hugosamba/pico-app`, projeto `prj_0vpAtATOxFKniX5GSPgi1V72tI5Z`, plano Hobby, funções em `gru1`.
- Aplicativo: [pico-app-sepia.vercel.app](https://pico-app-sepia.vercel.app).
- Não havia projeto Pico nas duas plataformas; Samba foi preservado. Deploy por CLI no caminho Vercel previsto. O GitHub App da Vercel não está instalado: push no GitHub e deploy são etapas separadas.

Este é um ambiente de desenvolvimento com arenas fictícias identificadas. A URL pública não equivale a liberação para beta amplo.

## Banco e autorização

A integração anterior aplicou cinco migrations e o seed de desenvolvimento. O Ciclo 8 aplicou somente 20260909190000_beta_safety, 20260909191000_private_media, 20260909192000_beta_contracts e 20260909193000_media_delivery. O histórico remoto contém as nove migrations. [Lista completa e contratos](04_SUPABASE_SCHEMA.md).

Quinze tabelas públicas têm RLS. Contadores privados limitam escrita por conta e serializam chamadas concorrentes. Perfil/check-in/feed/conexões continuam usando sessão do jogador; bloqueios, denúncias e mídia estão integrados. O servidor verifica getUser antes de ações privadas. Não há SSR privado nem service worker.

Buckets avatars/post-media são privados. Operações diretas de clientes no Storage são negadas. A entrega de fotos passa por uma RPC com RLS para checar a visibilidade atual e por uma rota sem cache, antes da leitura administrativa. A chave administrativa também é usada para processar uploads e excluir a conta já reautenticada. [Procedimentos e limites](BETA_OPERATIONS.md).

## Validação do Ciclo 8

- 48 testes automatizados locais, lint, typecheck e build aprovados.
- 168 checks contra a Vercel e Supabase reais: duas contas novas, núcleo social, autoria negada, arquivos, bloqueio imediato, denúncias, moderação administrativa, limite concorrente de reservas, recuperação com token real, nova senha e exclusão completa das contas.
- A mesma integração foi exercitada antes pelo app local contra Supabase remoto (159 checks antes da adição de moderação/recuperação ao teste). Não confundir isso com a fixture de Auth simulado.
- Recuperação usa token gerado administrativamente no teste. Não houve comprovação de entrega externa de e-mail ou de expiração de mensagem. SMTP próprio permanece pendente.
- Navegador publicado: login, onboarding, upload de avatar, recarga com sessão e foto, publicação com imagem; imagens realmente carregadas em 390 px. Revisão complementar mobile/sessão registrada no checklist.
- Os testes rastreiam e limpam somente as contas que criam. Contas de jogadores existentes são preservadas.

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

`.env.local` contém NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY e SUPABASE_SECRET_KEY, com permissão 0600 e fora do Git. As três variáveis estão na Vercel em Development, Preview e Production. A chave administrativa nunca usa NEXT_PUBLIC_*, não aparece no cliente e só é acessada em módulos server-only. Envs públicas foram comparadas com o mesmo projeto remoto. Production e Preview guardam a chave administrativa como sensitive: a CLI não revela o valor no env pull. O uso da chave de Production foi comprovado pelos uploads e exclusões reais; Development permitiu comparação direta sem exibir o valor.

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

`npm run db:types` gera o schema public diretamente do projeto linked e só substitui src/types/database.ts após sucesso. O arquivo gerado não recebe ajustes manuais. DTOs em src/types/read.ts derivam dele; explicitam a presença opcional do LEFT JOIN e URLs locais de imagens autorizadas; não substituem o schema gerado.

## Verificações reproduzíveis

```sh
npm run lint
npm run typecheck
npm test
npm run build
# Exige ambiente administrativo protegido e o Pico iniciado.
npm run test:hosted -- bxjhqxdfknspxezgftyz http://localhost:3000 https://pico-app-sepia.vercel.app
```

O teste hospedado exige ref explícito igual à URL configurada, cria duas contas descartáveis com senhas aleatórias e remove essas contas em finally. As ações sociais usam seus JWTs. A chave administrativa serve para preparação/limpeza e testes controlados de recuperação e moderação. Executar apenas no projeto de desenvolvimento explicitamente autorizado. A falha de signup por propagação de configuração não é tratada como aprovação.

## Histórico da integração anterior ao Ciclo 8

As evidências e limitações deste bloco descrevem o commit 26619e7, não o estado atual do Ciclo 8.

Evidência de 9 de setembro de 2026: 43 testes locais; 149 checks hospedados nos dois origins; onboarding, perfil, check-in, post, descoberta, conexão, likes/comments, login/logout, sessão restaurada por cookies e refresh de tokens reais. Tentativas diretas de forjar autoria/perfil/check-in/vínculos foram negadas. Quatro start_checkin simultâneos deixaram um único registro ativo, nos dois origins. As duas contas do teste foram excluídas com cascade.

PKCE foi exercitado separadamente com confirmação habilitada: signup real para o endereço autorizado da equipe, confirmação e callback local; segundo fluxo de Auth com callback na Vercel. O teste consumiu os tokens do próprio usuário descartável via administração para automatizar a confirmação; não inspecionou a caixa de e-mail e não comprova entrega/expiração de mensagem. Nenhuma interface nova de recuperação de senha foi criada.

Interface Vercel: cadastro, onboarding, perfil após recarga, check-in, post, like, comentário, encerramento, logout, erro de senha e novo login passaram. Feed móvel em 390px sem overflow. Contas de PKCE e navegador também removidas; oito tabelas de usuários/atividade ficaram sem resíduos de teste e o catálogo foi preservado. Build local final isolado em 3002 passou no smoke autenticado; processo de verificação encerrado, dev em 3000 preservado. Deployment final `dpl_4ig8Cydxtq8LaN4KTtdCX5D3RLeJ` pronto, com smoke público/anônimo aprovado.

Deploy: `npx vercel@59.14.0 deploy --prod` no projeto linked, após checks. Não cria vínculo Git automático. Validar a URL canônica e as variáveis após cada alteração. Rollback do app pela Vercel; preservar dados e preferir migration corretiva para o banco.

Estado atual de liberação: [checklist beta](BETA_CHECKLIST.md). Bloqueio, denúncia, exclusão e interface de recuperação foram entregues no Ciclo 8; SMTP externo e preparação operacional continuam pendentes.
