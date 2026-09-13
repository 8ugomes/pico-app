# Publicação — tutorial, comunidade oficial e autenticação

Autorização de 13/09/2026: comitar todo o conjunto e sincronizar o código local, GitHub/main e produção. Inclui os commits locais `6b1e3da` (tutorial) e `7860519` (comunidade/autenticação), além do ajuste do diretório da captura de configuração no backup.

## Preparação concluída

- 87 testes locais, lint, typecheck e build conectado passaram novamente. Validação funcional anterior: 303 verificações com serviços hospedados, 11 de navegador e cinco medidas responsivas/200%. [Auditoria](OFFICIAL_COMMUNITY_AUTH.md).
- Backup principal cifrado em 13/09/2026 02:34 UTC, com banco, configuração, ledger e três arquivos. Recibo privado: `.vercel/backups/beta-2026-09-13T02-34-26-861Z/receipt.json`. Hash SHA-256: `e2805e59098b4353c3632811e935d3e362bfaaa53a2cf810b9a0a4f0d2c847ef`. A cópia/chave permanecem locais; não constituem custódia externa.
- Aplicada no principal somente `20260913090000_pico_official_open_signup.sql`, sem seed ou exclusão. Ambos os ambientes têm 22 migrations. Preservação conferida por hashes/contagens das 33 tabelas anteriores (excluindo somente os novos registros institucionais esperados), identidade da conta existente e hashes dos três arquivos.
- Política principal de novas senhas aplicada: mínimo 12 e reautenticação para sessões antigas. Diff posterior sem alterações pendentes. Confirmação de e-mail permanece ligada; credenciais e senhas existentes não foram substituídas.
- A comunidade oficial e as três mensagens editoriais já existem no principal. A participação das contas completas é incluída ao usar a nova versão; saída/revogação/suspensão continuam respeitadas.

## Publicação desta revisão

Destino exclusivo: main de `8ugomes/pico-app`, projeto Vercel `pico-app`, domínio `https://pico-app-sepia.vercel.app`, Supabase `bxjhqxdfknspxezgftyz`. O PR deve concluir verify e regressão de navegador antes do merge, sem bypass/force-push. A transferência autenticada pelo conector GitHub confere cada blob binário e a árvore final contra o Git local.

Publicar a main limpa/sincronizada com `npm run deploy -- --stage`, validar artefato READY/Production/projeto/versão/headers/manifesto e então promover. O recibo e smoke finais ficam em `.vercel/official-release-*`, fora do Git, para que registrar o resultado não crie outra revisão local ainda não publicada. A revisão efetivamente servida é verificável em [/api/version](https://pico-app-sepia.vercel.app/api/version) e deve coincidir com HEAD e origin/main ao encerrar a entrega. Este documento registra a preparação; não antecipa aprovação de CI nem smoke do artefato.

Se houver falha essencial, não promover; preservar banco/arquivos e corrigir por migration/PR. Não restaurar banco sobre dados atuais nem reativar presença ao vivo. Um rollback de frontend não desfaz inscrições/admissões já criadas.

## Pendência externa

Publicar foi autorizado sem esperar SMTP. Isso não comprova entrega de confirmação/recuperação. O responsável ainda não tem domínio nem remetente SMTP; o envio padrão continua restrito/limitado. **Não distribuir o link de cadastro ao público antes de configurar e testar os e-mails.** [Próximos passos](EMAIL_SETUP.md). Validação em iPhone/Android físicos continua separada.
