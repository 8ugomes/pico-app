# Entrega da jornada e do pós-jogo — setembro de 2026

O responsável autorizou publicar o conjunto completo de jornada/design e pós-jogo, composto por `c66e83e` e `779be54`, após a revisão local. A publicação mantém o projeto Vercel `pico-app` e o Supabase principal existente; não cria ambientes, contas pessoais, convites externos ou conteúdo a partir do legado.

## Destinos e preparação verificados

- Principal: [Pico](https://pico-app-sepia.vercel.app), projeto Vercel `prj_0vpAtATOxFKniX5GSPgi1V72tI5Z`, Supabase `bxjhqxdfknspxezgftyz`, identidade técnica `beta`.
- Desenvolvimento exclusivo: `tsebpkfnxjvhntosbkdu`, aplicação de teste em `http://localhost:3002`. Nenhuma credencial principal é usada no gate destrutivo.
- A Vercel Production foi consultada pela CLI: URL/public key/ref/finalidade/branch coincidem com o principal. A secret key está configurada como sensível e não é exportável; o funcionamento é verificado pelo fluxo de mídia, sem registrar seu valor.
- Ruleset da main ativo: PR obrigatório, `verify` de GitHub Actions, base atualizada, discussões resolvidas, zero aprovações obrigatórias, nenhum bypass. Não há force-push nem integração Git/Vercel automática.
- Antes das mudanças, ambos os ledgers tinham as mesmas 19 migrations. Somente `20260912090000_played_games.sql` e `20260912091000_game_sharing.sql` são acrescentadas, nessa ordem, sem seed/reset/conversão do legado.
- Backups cifrados dos dois destinos concluídos em 13/09/2026 UTC (12/09 em São Paulo). Principal: uma conta, três arquivos; inventário protegido de 29 tabelas e hashes dos arquivos para comparar preservação. Pacotes/chaves não são versionados; continuidade e limites em [CONTINUITY.md](CONTINUITY.md).

## Gate da entrega

Desenvolvimento já está com 21 migrations e tipos regenerados do schema hospedado. O alias de tipos da aplicação reexporta `database.ts`; a extensão temporária do catálogo local foi removida. Lint, typecheck, 81 testes locais, build conectado e auditoria de segredos passaram.

O gate `npm run test:hosted` exercita Auth real, cookies HTTP, renovação, Data API, RLS e Storage com sete identidades rastreadas. Jogos e compartilhamentos são enviados por conexões concorrentes e precisam retornar a mesma identidade. Edição alheia deve falhar; exclusão alheia é uma operação idempotente sem efeito e precisa preservar data/versão do dono. O post privado deve ficar invisível a outra conta e manter o snapshot após corrigir/excluir o jogo. Dados controlados são removidos ao finalizar, inclusive em erro. Resultado: **210 verificações remotas passaram**. A primeira execução adicional corrigiu duas expectativas do roteiro (save retorna `{id}`; exclusão alheia não tem efeito), sem alterar código ou migrations. Logs e lista privada de IDs ficam em `.vercel/`; nunca versionar credenciais das fixtures. O deploy exige que as 21 migrations estejam confirmadas também no principal.

## Publicação e limites

Main deve estar limpa e sincronizada após PR/CI. `npm run deploy -- --stage` prepara Production no projeto existente sem trocar o domínio; só promover o artefato READY após conferir versão e smoke. A revisão servida está em [/api/version](https://pico-app-sepia.vercel.app/api/version).

Após as migrations, o frontend antigo de presença não é rollback compatível. Falha essencial interrompe a promoção até correção validada; preservar banco e artefatos, sem reativar grants antigos. Smoke do principal usa leituras e a sessão existente, sem editar dados reais.

Entrega externa de e-mail/SMTP e validação de instalação, teclado, câmera e retomada em iPhone/Android físicos continuam pendentes. Testes emulados e recuperação por token controlado não comprovam esses itens. A URL pública mantém admissão por aprovação; publicar código não abre convites nem acesso social anônimo.
