> Atualização de publicação: sincronização com produção autorizada em 13/09/2026; migration e política de senha já aplicadas no principal. [Preparação, destino e verificação da revisão servida](ONBOARDING_RELEASE.md). SMTP continua pendente. As referências abaixo a “somente desenvolvimento”/“não publicado” registram a etapa anterior.

# Comunidade oficial, cadastro aberto e revisão de autenticação

Rodada de 13/09/2026. A escolha explícita do responsável é cadastro e acesso imediato, sem convite nem aprovação manual. Confirmar o e-mail continua obrigatório no principal. Comunidades privadas, convites de gestão, suspensão, bloqueio e exclusão conservam seus limites.

## Entrega

A migration `20260913090000_pico_official_open_signup.sql` cria **Pico — comunidade oficial**, em `/comunidades/pico-oficial`. É um recurso institucional, sem conta fictícia de autor ou proprietário pessoal. Administradores/moderadores da plataforma gerenciam esse grupo; isso não concede gestão de outras comunidades privadas. Identidade, entrada aberta, audiência Pico e independência de arena ficam protegidas. Há três publicações editoriais persistidas, identificadas como Pico, sem curtidas, comentários ou participantes inventados. O mural social abaixo continua usando os posts canônicos e sua audiência.

`save_profile` grava perfil, modalidade principal e participação na mesma transação. `ensure_pico_membership` também atende contas já existentes ao entrar, desde que tenham concluído o perfil com modalidade. O bloqueio do perfil e as chaves únicas evitam duplicidade. Qualquer participação anterior, inclusive removida/suspensa, é respeitada; a pessoa que sai não volta automaticamente. O aviso só representa uma inclusão confirmada e seu reconhecimento fica no servidor por conta, sem e-mail ou push. Uma alteração de esporte não muda a comunidade.

A admissão interna é criada automaticamente para novos perfis. A migration preenche somente admissões ausentes; nunca converte suspensão/revogação em aprovação. `active_account` exige confirmação real em `auth.users`, além de conta ativa. O hook antigo passa a aceitar cadastros. Convite antigo não pode restaurar uma conta suspensa/revogada. O campo técnico `beta` de audiência permanece para preservar os dados; a interface diz “Pessoas do Pico”. Com a abertura autorizada, novos usuários confirmados passam a integrar essa audiência.

## Auditoria e correções

| Área | Constatação e resultado |
| --- | --- |
| Senhas | Supabase Auth mantém hashes bcrypt com salt; o aplicativo não grava senhas nas tabelas sociais. Inspeção agregada do principal: 1 conta, hash bcrypt, zero colunas públicas de credenciais. Sem leitura ou exposição de hashes individuais. |
| Regra de senha | Principal e desenvolvimento aceitavam 6 caracteres no servidor; a UI pedia 8. Nova regra: mínimo de 12 na UI e no provedor, limite de 72 bytes para novas senhas. Contas anteriores continuam podendo entrar com a senha existente. `scripts/configure-auth-security.mjs` prepara/aplica somente a política revisada. |
| Troca de senha | Reautenticação habilitada no desenvolvimento para sessões antigas. Recuperação verificada troca a senha e encerra sessões. UI agora distingue senha alterada de falha ao encerrar sessões, permite repetir o encerramento e mostra confirmação no login. |
| Exclusão | A confirmação de senha aceita credenciais legadas menores que 8; Auth faz a verificação real. Antes, uma senha curta válida no provedor podia impedir a exclusão pela aplicação. |
| E-mail | Não existe na tabela social de perfis. Endereço, hash e identidades ficam no schema Auth. Convites guardam destinatário em schema privado. E-mail próprio pode aparecer na tela da conta; não é segredo criptográfico nem dado público do perfil. |
| Identidade/autorização | APIs conferem `getUser` no servidor; RLS e RPCs conferem admissão e autoridade atual. Metadados do cadastro não concedem papéis. Contas suspensas são negadas mesmo com cookies antigos. |
| Sessões | SSR usa cookies para tokens, não para a senha. Cookies agora declaram SameSite=Lax e Secure no principal. São acessíveis ao SDK no navegador, portanto não HttpOnly. Logout revoga renovação; JWTs já emitidos podem valer até expirar (configuração observada: 3600 s). Suspensão/exclusão têm checagem adicional no banco. |
| Confirmação/recuperação | Fluxo padrão é PKCE no mesmo navegador. Fluxo opcional por token hash usa POST com interação explícita e remove fragmento da URL. Reuso, token inválido e origem externa são recusados. Foi adicionado reenvio de confirmação. |
| Configuração operacional | Corrigido o diretório de execução do comando de Auth da CLI: o diff usa a configuração isolada, sem cair no config local da raiz. Prévia principal conferida, sem aplicar. |
| Transporte/cache | APIs privadas `no-store`, origem exata em gravações, limites de corpo, URLs de retorno restritas. Acrescentados bloqueio de enquadramento e política de base/objetos. Não há cache offline social. |
| Logs/segredos | Logs da aplicação registram evento, id, versão/status, sem corpo, senha ou e-mail. Auditoria de valores secretos em arquivos versionados e bundles executada antes do commit. |

A descrição de bcrypt e o limite entre tokens e senha seguem a [documentação de segurança do Supabase](https://supabase.com/docs/guides/auth/password-security). O modelo de cookies/PKCE e a necessidade de evitar cache de sessões seguem o [guia SSR](https://supabase.com/docs/guides/auth/server-side/advanced-guide). Revogação de refresh tokens e validade dos tokens de acesso são propriedades distintas das [sessões](https://supabase.com/docs/guides/auth/sessions).

## Evidência e limites

- 87 testes locais passaram, incluindo transação/rollback, confirmação, matrícula única, saída, papéis, RLS e senha Unicode/bytes.
- 211 verificações hospedadas do conjunto anterior passaram em desenvolvimento, com Auth, SQL, Data API, Storage e HTTP reais; fixtures removidas.
- 92 verificações adicionais passaram: cadastro sem convite, senha curta rejeitada pelo servidor, metadados sem privilégio, entrada/aviso concorrentes, isolamento do reconhecimento, CSRF, leitura de credenciais negada, login incorreto sem distinguir e-mail, recuperação, senha antiga negada, nova senha válida, refresh de outro dispositivo revogado, reuso de token negado, conta não confirmada negada e confirmação liberando acesso.
- UI Chromium com cadastro/login reais, conclusão de perfil, aviso visível, comunidade, participantes, saída persistente, logout, erro de senha e retorno à conta; larguras 320/390/430/768 e texto a 200%. [Evidências](official-review/README.md).
- Lint, typecheck e builds conectado/demo aprovados. Código do tutorial anterior permanece nesta branch.

Migrations e política de senha foram aplicadas **somente no Supabase de desenvolvimento** (`tsebpkfnxjvhntosbkdu`). No principal (`bxjhqxdfknspxezgftyz`) a auditoria foi de leitura: confirmou bcrypt, ausência de colunas públicas de credenciais e RLS em todas as tabelas públicas. Nenhuma conta real foi alterada. Não há push, merge ou deploy desta rodada. O principal permanece na versão `047cb6d5091b`, ainda com convite/aprovação e política de senha anterior até a publicação coordenada.

Não houve envio de mensagens externas. Links foram gerados administrativamente para identidades de teste; isso comprova validação/consumo, não entrega em caixa, filtros antispam, abertura entre aplicativos ou o ciclo PKCE a partir de um e-mail recebido. Também não comprova iPhone/Android físicos. A conta de teste, mesmo quando aparece em captura, foi removida depois.

## Abertura

O responsável informou não ter provedor SMTP nem domínio próprio. A configuração principal mantém confirmação ligada, SMTP próprio desativado e limite padrão de 2 e-mails/hora. O serviço de envio padrão é restrito aos endereços autorizados da organização, segundo o [Supabase](https://supabase.com/docs/guides/auth/auth-smtp). Portanto **não está pronto para distribuir o link de cadastro ao público**.

Seguir [configuração de e-mail](EMAIL_SETUP.md). A autorização posterior permite publicar antes do SMTP, mantendo a pendência de entrega para divulgação pública. A sequência coordenada é: backup principal → migration aditiva → política de senha → código desta branch via fluxo de main → deploy com `scripts/deploy.mjs` → smoke principal com conta de teste autorizada. Não desligar confirmação como atalho. Conteúdo/membros existentes permanecem preservados. Rollback de código não desfaz participação ou admissões novas; se houver incidente, conter cadastro no provedor, preservar dados e corrigir por migration, sem apagar contas.
