# Ambientes do Pico

Ciclo 9 é revisão interna, sem lançamento. `config/environments.json` é a identidade esperada pelos comandos.

| Finalidade | Supabase | Dados / acesso |
| --- | --- | --- |
| Desenvolvimento exclusivo | tsebpkfnxjvhntosbkdu, pico-development, Free São Paulo | Novo banco/Auth/Storage; apenas dados controlados. localhost 3000/3002. |
| Beta interno | bxjhqxdfknspxezgftyz, nome histórico pico-dev | Conta/arquivo existentes preservados. Admissão no banco; @hugo confirmado pelo responsável como primeiro admin. |
| Produção futura | Não provisionado | Sem URL, chaves, dados ou lançamento. Guard recusa. |

Vercel `pico-app` mantém o deploy histórico do Ciclo 8; o rótulo Production serve ao beta interno e não significa liberação. Sem integração Git. Previews comuns ficam em demo explícito sem credenciais beta. A nova revisão usa projeto Vercel separado `pico-internal`, somente Preview via CLI. Push não faz deploy.

`.env.local` e `.env.hosted-admin` são exclusivamente desenvolvimento. `.env.beta.local` e `.env.beta-admin` preservam a configuração beta fora do Git, modo 0600. Nunca copiar esses arquivos para preview comum. Cada projeto usa seu próprio Auth, URL, chaves, buckets e redirects; não houve cópia de conta ou arquivo entre projetos. A produção futura não compartilha nenhum segredo.

`npm run env:check` valida configuração local. `node --env-file=.env.local --env-file=.env.hosted-admin scripts/database.mjs migrate` confere finalidade/ref/URL e a identidade devolvida pelo banco antes de aplicar pendências. `seed` e `test:hosted` só aceitam desenvolvimento exclusivo. Para beta, usar os dois arquivos beta e a mesma ferramenta; seed/teste destrutivo serão recusados. Migrations iniciais de provisionamento exigem conferir explicitamente a identidade antes de registrar environment_identity; já realizado no Ciclo 9.1.

Tipos: `npm run db:types`, gerados do desenvolvimento com as mesmas migrations. Schema gerado não é editado manualmente. Nunca executar reset remoto. CI usa demo explícito sem segredos; contribuições não confiáveis não recebem secrets.
