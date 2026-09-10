# Pico — revisão interna do Ciclo 9

**PRONTO PARA REVISÃO INTERNA — NÃO LIBERADO.** Verificado em 9 de setembro de 2026, 23:35 UTC (20:35 de Brasília). Nenhum lançamento externo aprovado.

## Versão realmente publicada

- URL interna: [pico-internal.vercel.app](https://pico-internal.vercel.app).
- Artefato: [Preview imutável](https://pico-internal-ifwtlex0e-hugosamba.vercel.app), Vercel `pico-internal`, deployment `dpl_DkEmaLHQypwfKb4zg8kwSXAvrEwv`, estado `READY`, target Preview (`null` na API Vercel).
- Versão retornada por `/api/version`: `e891dca1e741`; commit de código `e891dca1e7418c6720fede0465eb11e1e9e3bf4a`. Os commits seguintes somente registram esta entrega; não mudam o artefato publicado.
- Branch `cycle-9-internal`, [PR #1 em rascunho](https://github.com/8ugomes/pico-app/pull/1), sem merge. [CI do artefato aprovada](https://github.com/8ugomes/pico-app/actions/runs/34417393958): lint, types, 72 testes e build.
- Domínio histórico [pico-app-sepia.vercel.app](https://pico-app-sepia.vercel.app) permanece `READY`, Cycle 8 `7d6f288`, no projeto `pico-app`. Não recebeu promoção C9.

A primeira tentativa do projeto novo foi classificada pela Vercel como Production por padrão. Foi cancelada durante o build (`dpl_qoCEgFqWzQAJy14ru4TuTdP2R4sy`, `CANCELED`), usando somente configuração demo sem backend. O wrapper foi corrigido para exigir `--target=preview`; a tentativa cancelada nunca foi considerada entrega. O primeiro Preview válido é o artefato acima.

## Infraestrutura verificada

| Ambiente | Supabase e configuração | Estado |
| --- | --- | --- |
| Desenvolvimento exclusivo | `tsebpkfnxjvhntosbkdu`, URLs localhost 3000/3002 | 19 migrations; fixtures controladas limpas; zero contas após QA |
| Beta interno | `bxjhqxdfknspxezgftyz`, app interno e callback histórico | 19 migrations; conta @hugo/admin/aprovada, 3 arenas demo e 1 foto existentes preservadas |
| Produção futura | Não provisionada; manifesto sem ref/URL/chaves | Guardas recusam operação; nenhum lançamento |

`environment_identity` foi consultada em ambos os projetos. Vercel Preview usa a URL/publishable key exatas do beta, diferentes de desenvolvimento. Secret de servidor fica como variável sensitive apenas no Preview; seu funcionamento foi comprovado por upload/normalização/leitura de Storage através do servidor publicado. Bundles servidos não contêm esse segredo. Previews comuns de `pico-app` são demo; não recebem credenciais beta.

As nove migrations C9 pendentes foram aplicadas após backup, sem reaplicar as dez existentes. A lista completa das 19 migrations está em [schema](04_SUPABASE_SCHEMA.md); local/remote conferem nos dois destinos. Não houve reset, cópia de contas entre projetos ou alteração de Samba. A foto original confere em SHA-256 com o backup cifrado anterior à migração.

Auth beta: confirmação de e-mail habilitada, hook oficial Before User Created ligado e convite pendente ao e-mail exato obrigatório. Site URL interno e quatro redirects exatos (callback/confirm interno e histórico), sem localhost. @hugo recebeu admin a partir do UID confirmado pelo responsável. Cadastro e admissão são etapas separadas; conhecer o endereço não abre os dados.

## Evidências executadas

| Camada | Resultado e limites |
| --- | --- |
| Local | 72 testes PostgreSQL/PGlite/contratos, lint, typecheck e build; CI Linux também aprovada |
| Supabase desenvolvimento | 170 verificações: sete identidades/papéis, Auth/sessão, admissão, RLS cruzada, JWT antigo, arenas/grupos, convites concorrentes, idempotência, histórico e Storage |
| Navegador local | 21 checks principais + 8 jornadas complementares em Chromium móvel 320/390/430; grupos, aprovação, arena, post/destino, check-in/histórico, recorte, rede, logout, denúncia/moderação e custódia |
| Vercel + beta reais | 67 checks na URL interna: login/sessão renovada, perfil, posts/curtida, RLS bloqueando alteração alheia, grupo privado antes/depois de aprovação, avatar normalizado/Storage privado; login, recarga e feed pela interface |
| Continuidade | Backup cifrado beta; restauração controlada de desenvolvimento em VM exclusiva: schema arquivado, 7 identidades, 2 logins exercitados e 3 arquivos com hashes/RLS |
| Aparelhos físicos/e-mail | Não comprovados. EXIF de recorte é fixture sintética; token oficial de recovery não prova entrega em caixa |

Os testes encontraram botões sem submit explícito, confirmação de avatar perdida após refresh, dependência de ripgrep no Linux e alvo implícito do primeiro deploy Vercel. Causas corrigidas e retestadas. Falhas de seletor da automação foram ajustadas sem mascarar efeitos no banco. As duas identidades criadas no beta e os sete IDs de desenvolvimento foram limpos. VM de restauração e servidor de QA 3002 foram encerrados; servidor do usuário em 3000 preservado. Cópia temporária decifrada do ensaio foi removida; backups cifrados protegidos permanecem locais.

## Como avaliar

Entre com sua conta @hugo em [login](https://pico-internal.vercel.app/login). Abra [administração](https://pico-internal.vercel.app/admin) para catálogo, pedidos, acesso, papéis e denúncias. Em uma arena, use **Gerenciar arena**; dono/admin/global admin edita campos permitidos, membro comum envia sugestão/pedido. As arenas demo continuam identificadas.

Em [comunidades](https://pico-internal.vercel.app/comunidades), crie grupo e escolha entrada/visibilidade. A gestão permite aprovar membros, conceder papéis subordinados e pedir vínculo de arena. No feed, escolha audiência e destinos adicionais; marcar local não publica no mural. No perfil ou gestão do recurso, trocar foto abre recorte com arraste, zoom, rotação e confirmação/cancelamento. `/checkin` mostra presença, encerramento e histórico privado com arenas recentes.

## Pendências externas e não liberação

1. **SMTP/remetente/caixa de teste**, adiado pelo responsável. O provedor Free/default recusou templates personalizados sem SMTP; PKCE permanece padrão. Configurar serviço autorizado, aceitar templates e comprovar confirmação/recovery em caixa antes de convidados externos.
2. **Android e iPhone físicos**: instalação, câmera/galeria, orientação real, retomada e atualização. Emulação não encerra esses itens.
3. **Operação externa**: definir contato público de privacidade, frequência de moderação, retenção e custódia do backup/chave em destinos separados.
4. **Produção futura**: ainda não provisionada e sem autorização de lançamento.

Inscrições públicas bloqueadas por hook/admissão/RLS; nenhum convite a jogador/dono real enviado. Sem compra, domínio pago, alteração de plano, merge ou promoção pública. O endereço interno expõe somente a entrada do app a visitantes; dados e mídia exigem autorização vigente. A proteção Vercel do artefato foi mantida; credencial temporária de automação foi revogada após QA. [Mecanismo oficial usado no teste](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation).

Relatórios e fixtures de teste ficam protegidos em `.vercel/`, fora do Git/deploy. [Operação e rollback](BETA_OPERATIONS.md), [permissões/comunidades](CYCLE9_CONTRACTS.md), [ambientes](ENVIRONMENTS.md) e [continuidade](CONTINUITY.md).
