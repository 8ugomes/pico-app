# Continuidade do Pico — Ciclo 9

O ensaio de 9 de setembro de 2026 restaurou um backup de desenvolvimento em uma VM local exclusiva `pico-c9-restore`. O export incluiu schema da aplicação, schema gerenciado de referência, dados de Auth, dados sociais, configuração e bytes do Storage. O schema da aplicação foi de fato importado do dump; não foi apenas recriado por migrations.

Foram recuperadas sete identidades controladas e três arquivos. Dois logins com senha, UIDs originais, admissão aprovada/negada, RLS, referência do avatar e igualdade SHA-256 dos bytes passaram. O Storage permaneceu privado e downloads diretos comuns foram recusados. Nenhuma conta pessoal foi copiada. Auth/Storage gerenciados usam as versões oficiais locais; SMTP, MFA, provedores externos e chaves de criptografia/Vault não foram ensaiados.

## Backup protegido

Com o Docker disponível e o env protegido do destino correto, execute `node --env-file=.env.local --env-file=.env.hosted-admin scripts/backup.mjs`. Para beta use seus dois envs protegidos próprios. A guarda compara URL, finalidade e ref remotos. O script é somente leitura no remoto.

Os arquivos ficam em `.vercel/backups/`, ignorados por Git e Vercel, com permissões privadas. O pacote final usa AES-256-GCM; o payload em claro é removido após cifrar. `backup.key` é produzido separadamente: guardar chave e pacote em destinos diferentes antes de qualquer cópia externa. A guarda local de uma cópia não constitui política aprovada de backup externo. Não copiar segredos em mensagens ou commits.

O backup do banco não contém os bytes das imagens: o script percorre cada bucket, baixa os objetos e registra hash, caminho e tamanho. Falha parcial interrompe o processo, sem declarar backup completo. Não há captura atômica única entre DB/Storage/Auth: fazer backup sem escritas concorrentes ou usar uma janela operacional controlada. O ensaio usou dados parados.

## Restauração isolada

`node scripts/unpack-backup.mjs <backup privado> .vercel/restore-<nome>` autentica e decifra em uma pasta privada nova. `scripts/restore-rehearsal.mjs` aceita exclusivamente dados controlados do desenvolvimento e o container local exato `supabase_db_pico-c9-restore`, com Auth e tabelas da aplicação vazios. Nunca recebe uma URL remota de restauração. Importa o schema arquivado, trigger de criação de perfil, dados e arquivos e verifica login/RLS/mídia.

O procedimento usa Supabase CLI 2.117.0, PostgreSQL 17 e serviços locais oficiais via Docker/Lima. O script não é uma autorização para restaurar dados reais em um preview. Importações de dados reais exigem destino privado planejado, compatibilidade de versões, responsáveis e confirmação das chaves/provedores envolvidos. Tokens de sessões antigas não substituem comprovação de um login novo.

## Rollback e operação

A publicação vigente usa a main sincronizada e o projeto Vercel existente `pico-app`, em pico-app-sepia.vercel.app. O wrapper `scripts/deploy.mjs` valida identidade beta, projeto, branch e ledger completo; `--stage` prepara Production sem trocar o domínio. Push executa CI e não publica automaticamente. O antigo fluxo interno está aposentado. Procedimento atual em [BETA_OPERATIONS.md](BETA_OPERATIONS.md).

O pós-jogo revoga os contratos antigos de presença sem remover seus dados. Por isso, um artefato anterior que ainda depende de check-in não é rollback compatível após essas migrations. Em falha essencial, interromper a promoção e corrigir por PR validado; preservar artefatos e banco. Banco recebe correções aditivas, nunca reset, remoção de RLS ou restauração sobre dados atuais sem plano próprio e autorização específica.

Logs de falha têm apenas categoria, status, versão e identificador aleatório da ocorrência. Não incluem URL, UID, e-mail, senhas, tokens, post ou localização. A auditoria administrativa permanece em schema privado e é exibida apenas a operadores vigentes.

Referências oficiais: [backup/restauração](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), [limites dos backups do banco](https://supabase.com/docs/guides/platform/backups), [restauração local](https://supabase.com/docs/guides/local-development/restoring-downloaded-backup).

Ao fim do ensaio, a VM e o servidor de QA foram encerrados, a extração temporária em claro foi removida e os backups cifrados foram preservados. O backup beta anterior às migrations contém a foto existente, cujo SHA-256 foi novamente conferido no Storage após migração e smoke.
