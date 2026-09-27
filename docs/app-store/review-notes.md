# App Review · notas e conta de demonstração

Status: **template; não contém credenciais e ainda não descreve uma build enviada**.

A Apple exige acesso completo, backend ativo, metadata final e uma conta de demonstração que não expire quando o app requer login. Credenciais devem ser inseridas apenas nos campos privados `Sign-in required` do App Store Connect. Nunca guardar senha, refresh token ou resposta de 2FA neste repositório.

## Preparação da conta de revisão

- [ ] Criar `[[REVIEW_ACCOUNT_PRIMARY]]`, dedicada à Apple, com perfil completo e admissão ativa.
- [ ] Criar `[[REVIEW_ACCOUNT_BACKUP]]` para o caso de a revisão testar exclusão da conta primária.
- [ ] O login das contas de revisão não exige confirmação por caixa postal, 2FA, captcha, convite, dispositivo confiável ou allowlist de IP; a proteção antiabuso do cadastro público não usa bypass baseado no e-mail do reviewer.
- [ ] Garantir que as duas contas permaneçam ativas durante toda a revisão e eventual recurso.
- [ ] Usar nomes, avatares, posts, comunidades e arenas fictícios ou licenciados, nunca pessoas reais sem autorização.
- [ ] Dar à conta conteúdo suficiente para testar feed, comentário, curtida, republicação, denúncia, bloqueio/desbloqueio, comunidade, reprodução de vídeo já autorizado e jogo privado.
- [ ] Manter ao menos um conteúdo controlado de outra conta para denúncia e bloqueio.
- [ ] Não conceder papel administrativo à conta de revisão, salvo se uma função de gestão fizer parte da build pública e precisar ser revisada.
- [ ] Testar login em instalação limpa, sem sessão ou cookie web anterior.
- [ ] Testar que exclusão da conta pode ser iniciada dentro do app e registrar o caminho exato abaixo.

## Campos privados no App Store Connect

| Campo | Preenchimento |
| --- | --- |
| Contact name | `[[NOME_REAL_DO_CONTATO_DE_REVIEW]]` |
| Contact email | `[[EMAIL_MONITORADO_DURANTE_A_REVIEW]]` |
| Contact phone | `[[TELEFONE_COM_DDI]]` |
| Username | inserir a conta primária diretamente no App Store Connect |
| Password | inserir a senha diretamente no App Store Connect |
| Attachment | `[[ANEXAR_SOMENTE_SE_UMA_JORNADA_NAO_OBVIA_EXIGIR]]` |

Se for necessário fornecer a conta backup, inserir seus dados somente em `Notes`, não neste arquivo.

## Draft de Notes for Review · inglês

Substituir todos os campos e validar os rótulos contra a build candidata. O campo aceita até 4.000 bytes.

> Pico Social is a social network for people who practice footvolley, beach tennis, and beach volleyball. An account is required because profiles, audiences, private communities, moderation controls, and a private game journal are the app’s core functionality.
>
> REVIEW ACCESS
> A persistent review account is provided in the Sign-In Required fields. It has an active, completed profile and controlled sample content. It does not require email confirmation, two-factor authentication, a one-time code, or an invitation. A backup review account is provided below in case account deletion is tested: [[ADD_BACKUP_CREDENTIALS_ONLY_IN_APP_STORE_CONNECT]].
>
> CORE PATH
> 1. Sign in.
> 2. “Início” opens the social feed.
> 3. “Pessoas” shows player discovery and follow controls.
> 4. “Comunidades” shows open, approval-based, and private community states.
> 5. “Arenas” shows the arena directory and details.
> 6. “Perfil” contains profile editing, “Meus jogos”, account controls, and help.
>
> USER-GENERATED CONTENT AND SAFETY
> A post can be liked, commented on, shared, or reposted when its audience permits. Open the menu on a person, post, or comment to report it. Blocking a person removes mutual visibility and can be reversed under [[EXACT_ACCOUNT_LABEL]]. Reports are private and can be reviewed by the service’s moderation team. Community standards are available at [[FINAL_GUIDELINES_URL]].
>
> PRIVATE GAME JOURNAL
> Under Perfil > Meus jogos, a player can save and edit an arena, sport, and past date. The journal is private. “Compartilhar jogo” is a separate publishing action with an explicit audience; editing or deleting the private record does not edit an already shared post.
>
> PRIVATE VIDEO
> Existing authorized video opens on demand in the iPhone player through authenticated byte-range requests and does not autoplay. Creating or publishing a new video is not available in this version.
>
> ACCOUNT DELETION
> The in-app path is [[EXACT_VERIFIED_PATH]]. The user confirms the action with the current password. The flow can also be reached when social access is suspended. Please use the backup review account if you need to continue after deletion.
>
> PLATFORM AND PERMISSIONS
> The submitted binary contains its local client assets and connects to our HTTPS API; it does not load the product through a remote `server.url`. The refresh credential is stored in iOS Keychain and the access token is kept in memory. Account-scoped drafts and optional tour progress are stored locally without credentials. Camera or photo access is requested only after the user chooses to add media. The app does not request continuous location, Contacts, microphone, tracking, or push notification access in this version.
>
> DISABLED FUTURE CAPABILITIES
> Direct messages and remote notifications are not enabled in this build. Both server-side and database feature switches remain off. The iOS client does not register with APNs, does not include the Push Notifications capability, and does not request notification permission. These flows are not part of this version's review path.
>
> BUSINESS MODEL
> This version is free and includes no in-app purchases, subscriptions, advertising, paid boosts, reservations, or external purchase calls to action.
>
> SUPPORT
> Support: [[FINAL_SUPPORT_URL]]
> Privacy Policy: [[FINAL_PRIVACY_URL]]
> Review contact availability: [[TIME_ZONE_AND_HOURS]]

Remover qualquer afirmação técnica, permissão ou fluxo que o archive final não prove.

## Verificação antes de colar

- [ ] O backend candidato fica disponível durante toda a revisão.
- [ ] Todas as URLs são públicas, finais e sem placeholder.
- [ ] As credenciais funcionam em aparelho limpo e não expiram.
- [ ] O reviewer consegue ver conteúdo sem depender de atividade de pessoas reais.
- [ ] Denúncia, bloqueio e exclusão funcionam no cliente iOS, não apenas na PWA.
- [ ] Comentários, republicação/desfazer, desbloqueio e edição/compartilhamento do jogo funcionam no cliente iOS.
- [ ] A nota de vídeo corresponde à build: somente reprodução autorizada; remover o parágrafo se o player não fechar o gate físico da candidata.
- [ ] O caminho de exclusão não termina em “mande um e-mail”.
- [ ] Não há feature flag, função oculta ou endpoint de debug sem explicação específica.
- [ ] Mensagens e notificações remotas continuam desligadas no servidor e no banco; o target não tem capability de Push Notifications nem registro APNs.
- [ ] A nota diz exatamente o que há no binário e nenhuma função futura.
- [ ] O contato de review monitora telefone/e-mail e pode responder em inglês durante a janela.

Referências: App Review Guidelines [Before You Submit, 2.1 e 2.3.1](https://developer.apple.com/app-store/review/guidelines/) e [App Review information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information#app-review-information).
