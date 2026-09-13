> Atualização de publicação: sincronização com produção autorizada em 13/09/2026; migration e política de senha já aplicadas no principal. [Preparação, destino e verificação da revisão servida](ONBOARDING_RELEASE.md). SMTP continua pendente. As referências abaixo a “somente desenvolvimento”/“não publicado” registram a etapa anterior.

> Atualização de 13/09/2026: o responsável escolheu cadastro e acesso imediato após confirmação do e-mail. Implementação/migration/política de senha validadas no desenvolvimento; principal auditado sem alterações. O estado histórico de convite abaixo ainda descreve a publicação existente. [Estado por ambiente e testes](OFFICIAL_COMMUNITY_AUTH.md). Domínio e SMTP inexistentes, conforme informado pelo responsável; [configuração pendente](EMAIL_SETUP.md).

# Supabase e hospedagem — estado operacional

A fonte atual dos destinos é [ENVIRONMENTS.md](ENVIRONMENTS.md), validada contra `config/environments.json` e a RPC remota `environment_identity`. A fonte da versão publicada e testes é [INTERNAL_REVIEW.md](INTERNAL_REVIEW.md). Nomes de arquivos locais, isoladamente, não comprovam conexão.

Desenvolvimento exclusivo: `tsebpkfnxjvhntosbkdu`. Beta interno, com conta existente preservada: `bxjhqxdfknspxezgftyz`. Produção futura não provisionada. Os projetos têm Auth, chaves, DB e Storage separados; redirects não cruzam os ambientes. `.env.local`/`.env.hosted-admin` são desenvolvimento; `.env.beta.local`/`.env.beta-admin` são beta, todos fora do Git e protegidos.

## Migrações e tipos

```bash
node --env-file=.env.local --env-file=.env.hosted-admin scripts/database.mjs dry-run
node --env-file=.env.local --env-file=.env.hosted-admin scripts/database.mjs migrate
npm run db:types
```

Para beta usar os dois arquivos beta na mesma ferramenta. Ela confere identidade antes da operação e mantém diretório de link separado; aplicar somente pendências. Não usar reset ou seed no beta. [Migrations e contratos](04_SUPABASE_SCHEMA.md).

## Auth

Hook oficial Before User Created nega cadastro sem convite individual vigente ao e-mail exato. O aceite exige conta autenticada e e-mail confirmado; consulta/GET não consome segredo. Admissão e papéis ficam no banco e são revalidados mesmo com token antigo. @hugo foi confirmado pelo responsável e recebeu bootstrap somente no beta.

`node --env-file=.env.beta.local --env-file=.env.beta-admin scripts/configure-auth.mjs apply` usa exclusivamente as origens registradas. Beta exige confirmação de e-mail. Desenvolvimento tem confirmação imediata e apenas identidades controladas. Configuração cruzada aborta.

Recuperação padrão mantém PKCE e `ConfirmationURL`. O fluxo oficial por `token_hash` em POST está preparado, mas a flag custom fica desligada enquanto o provedor não aceitar os templates. Não houve entrega externa comprovada nem envio de convite real. SMTP/remetente/caixa de teste aguardam definição do responsável.

## Hospedagem

Vercel `pico-app` mantém o artefato histórico Cycle 8; comum Preview fica demo sem chaves beta. Revisão C9 usa `pico-internal`, alvo Preview, backend beta e branch `cycle-9-internal`; Production desse projeto não recebe backend. Sem integração Git/Vercel.

Após checks locais/CI, auditoria de segredos, backup e migrations completas:

```bash
PICO_DEPLOY_TARGET=preview node --env-file=.env.beta.local --env-file=.env.beta-admin scripts/deploy-internal.mjs
```

A ferramenta exige branch limpa e projeto interno exato, registra o SHA no build e recusa promoção produtiva. Verificar versão, autenticação e dados na URL resultante antes de declarar entrega. Não confiar só no log de build. [Operação/rollback](BETA_OPERATIONS.md).
