# Ambientes do Pico

Por orientação corrigida do responsável, o Pico usa um endereço principal: [pico-app-sepia.vercel.app](https://pico-app-sepia.vercel.app). Não é necessário projeto de revisão interna nem argumento `--internal`. `config/environments.json` registra os destinos permitidos.

| Finalidade | Supabase | Aplicação |
| --- | --- | --- |
| Principal | `bxjhqxdfknspxezgftyz`, nome histórico pico-dev, identidade técnica `beta` | Vercel `pico-app` (`prj_0vpAtATOxFKniX5GSPgi1V72tI5Z`), target Production, branch main |
| Desenvolvimento e testes | `tsebpkfnxjvhntosbkdu`, pico-development, identidade `development` | localhost 3000/3002; testes destrutivos exclusivamente aqui |

O schema versionado contém 21 migrations. A aplicação remota da rodada de jogos é conferida pelo ledger e documentada em [JOURNEY_RELEASE.md](JOURNEY_RELEASE.md); configuração local não prova aplicação remota. A unificação preserva o banco principal, contas, fotos, arenas, comunidades, papéis e admissão. O identificador técnico `beta` permanece para manter a identidade já gravada no banco; ele não exige outro site. Nenhum banco de produção adicional é criado. O projeto Vercel antigo não é mais destino de publicação; seus artefatos anteriores ficam preservados, e o endereço estável antigo encaminha ao principal.

`.env.local` e `.env.hosted-admin` usam somente desenvolvimento. `.env.beta.local` e `.env.beta-admin` continuam sendo os arquivos protegidos da conta/banco principal. Não são versionados ou enviados no deploy. Vercel Production recebe URL/public key do principal, secret apenas no servidor, `NEXT_PUBLIC_PICO_ENV=beta`, `PICO_ENV=beta`, `PICO_PROJECT_REF=bxjhqxdfknspxezgftyz` e `PICO_DEPLOY_BRANCH=main`. Previews comuns usam demo sem backend; não recebem credenciais do principal.

Site URL do Auth: `https://pico-app-sepia.vercel.app`. Redirects exatos callback/confirm do principal e do endereço antigo são preservados; localhost continua exclusivo do desenvolvimento. Confirmação de e-mail, hook de convite, admissão, MFA e RLS não são removidos pela troca de publicação. SMTP continua pendente.

O guard confere finalidade, URL, ref, identidade remota, projeto Vercel, target Production e main. `seed` e `test:hosted` recusam o banco principal. `npm run deploy` exige main limpa e sincronizada com origin/main, link no projeto existente e migrations remotas completas. `npm run deploy -- --stage` prepara um artefato Production sem trocar o domínio; promover após verificar. Publicação por CLI: push no GitHub executa CI, sem integração Git de deploy.

A versão atual está em [/api/version](https://pico-app-sepia.vercel.app/api/version). [Operação e rollback](BETA_OPERATIONS.md), [backup](CONTINUITY.md), [evidência histórica do Ciclo 9](INTERNAL_REVIEW.md).
