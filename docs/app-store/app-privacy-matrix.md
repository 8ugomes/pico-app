# App Privacy · matriz provisória

Status: **inventário técnico, ainda não certificado pelo titular**.

A Apple considera “coleta” a transmissão para fora do aparelho quando o dado fica acessível ao desenvolvedor ou parceiro além do necessário para atender a requisição em tempo real. A resposta deve incluir o app e os parceiros cujo código ou infraestrutura participa da coleta. Dados processados apenas no aparelho não entram. Fonte: [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/).

## Resposta de alto nível

- “Do you or your third-party partners collect data from this app?”: **Yes**.
- Tracking: **No**, desde que a auditoria final confirme ausência de publicidade comportamental, data broker e ligação com dados de outras empresas.
- ATT: não pedir autorização se tracking continuar ausente.
- Dados ligados à pessoa: em geral **Yes**, porque as linhas são ligadas à conta. Não chamar de anônimo o que RLS, Auth ou operação consegue religar ao usuário.

## Tipos a declarar na build candidata

Esta é uma resposta conservadora baseada nos contratos atuais. `Propósito` usa os nomes do App Store Connect.

| Tipo Apple | Evidência no produto | Coletado | Linked | Tracking | Propósito provisório | Ação antes de publicar |
| --- | --- | --- | --- | --- | --- | --- |
| Contact Info · Name | Nome exibido no perfil. | Sim | Sim | Não | App Functionality; Product Personalization | Confirmar se nome continua obrigatório. |
| Contact Info · Email Address | Cadastro, login, convites e operação da conta. | Sim | Sim | Não | App Functionality | Validar política vigente sem confirmação/recuperação. |
| Health & Fitness · Fitness | Modalidade, arena e data de jogo formam histórico esportivo privado. | **Sim, conservador** | Sim | Não | App Functionality; Product Personalization | Confirmar no questionário Apple se o diário esportivo entra como Fitness; não tratar como HealthKit. |
| Location · Coarse Location | Cidade e bairro informados no perfil para descoberta; arenas também são vínculos visíveis. | **Sim, conservador** | Sim | Não | App Functionality; Product Personalization | Confirmar o significado dos campos e que nenhum GPS/IP alimenta essa informação. |
| Contacts · Contacts | Conexões/following compõem um grafo social interno. | **Sim, conservador** | Sim | Não | App Functionality; Product Personalization | Confirmar com a definição Apple de “social graph”; o app não lê a agenda do aparelho. |
| User Content · Photos or Videos | Avatar, capas e mídia de publicações. | Sim | Sim | Não | App Functionality | Declarar mesmo quando a foto vem do picker. |
| User Content · Other User Content | Bio, posts, comentários, menções, denúncias e detalhes livres. | Sim | Sim | Não | App Functionality | Texto livre não exige adivinhar cada dado sensível que alguém possa escrever. |
| Identifiers · User ID | UUID da conta, username e identificadores de autoria. | Sim | Sim | Não | App Functionality | Confirmar que não existe IDFA/device fingerprint. |
| Usage Data · Product Interaction | Curtidas, republicações, conexões, participação, bloqueios, audiência e ações persistidas. | Sim | Sim | Não | App Functionality; Product Personalization | Não incluir simples taps efêmeros se não forem retidos. |
| Usage Data · Product Interaction (medição própria dormente) | A capacidade está no código candidato: eventos privados e retidos de conclusão de perfil e primeira ativação social, sem identidade do par, mais eventos categóricos de descoberta, retorno diário, link preparado e convite aberto foram preparados atrás de gates desligados. Não há campo público de horário de conclusão. | Não enquanto todos os gates permanecerem desligados | Não enquanto não houver coleta | Não | Reavaliar antes de ativar | A migration local não foi aplicada; não existe retenção aprovada nem purga diária monitorada. Ativar exige atualizar esta declaração e o aviso público antes da coleta. |

## Tipos condicionais que bloqueiam a certificação

| Tipo Apple | Estado atual | Critério de decisão |
| --- | --- | --- |
| Search History | Não há intenção de reter consultas. | Declarar se query strings ou termos ficam em logs, banco ou fornecedor além da resposta em tempo real. |
| Device ID | Não há SDK de anúncios nem IDFA identificado. | Declarar se Vercel, Supabase, WebKit/plugin ou outro parceiro retém identificador de dispositivo/instalação. IP pode se enquadrar conforme o uso. |
| Location · Coarse Location | Já proposta por cidade/bairro. | Se IP retido também for usado como localização, documentar esse uso; não contar só o perfil. |
| Diagnostics · Crash Data | Nenhum SDK de crash reporting explícito foi identificado no inventário inicial. | Declarar se a build ou parceiro recebe crash logs por mais que o atendimento em tempo real. |
| Diagnostics · Performance Data | Nenhuma telemetria de performance explícita foi identificada. | Declarar se métricas de launch, hang, energia ou latência ficam acessíveis ao operador. |
| Diagnostics · Other Diagnostic Data | Fornecedores processam dados técnicos de acesso e segurança. | Mapear logs, IP, user agent, request ID e retenção de Vercel/Supabase antes de responder. |
| User Content · Customer Support | A página pública orienta suporte, mas o canal ainda não existe. | Se houver formulário ou conversa persistida pelo app, declarar; avaliar a exceção Apple apenas se todos os critérios de coleta opcional forem cumpridos. |
| User Content · Emails or Text Messages | Mensagens diretas existem apenas como fundação desligada e não são expostas pelo cliente iOS candidato. | Não acrescentar só pela migration dormente. Se a versão distribuída expuser e persistir DMs, declarar `App Functionality`, ligada à identidade, sem tracking. |
| Identifiers · Device ID | Web Push da PWA está desligado e o binário não registra APNs. | Se APNs entrar numa versão futura e o token for ligado à conta, reavaliar como `Device ID`, `App Functionality`, sem tracking. Web Push acessível somente fora do binário não comprova coleta nativa. |

## Tipos que o produto não deve declarar sem mudança real

Precise Location, Phone Number, Physical Address, Payment Info, Credit Info, Other Financial Info, Sensitive Info solicitado pelo produto, device Contacts/address book, Audio Data, Browsing History, Purchase History, Advertising Data, dados de tracking, Environment Scanning, Hands e Head não fazem parte do escopo documentado. Uma nova dependência, permissão ou recurso reabre esta conclusão.

## Propósitos e tracking

- `App Functionality`: autenticação, segurança, autoria, audiência, armazenamento, moderação, suporte e recursos sociais.
- `Product Personalization`: descoberta e conteúdo organizados por esportes, arenas, comunidades e vínculos. Remover esse propósito de um tipo se a build não o usar para personalizar.
- Não selecionar `Analytics`, `Developer’s Advertising or Marketing`, `Third-Party Advertising` ou `Other Purposes` sem uma prática real e documentada.
- `Tracking = No` somente se nenhum dado do Pico for ligado a dados de outras empresas para anúncios/medição ou compartilhado com data broker.

## PrivacyInfo.xcprivacy

O manifesto do target e as respostas de App Store Connect devem descrever a mesma build. Não deixar `NSPrivacyCollectedDataTypes` vazio só porque não existe SDK de anúncios: o cliente envia dados que o serviço retém.

Mapeamento provisório para o manifesto, sujeito à auditoria do archive:

- `NSPrivacyCollectedDataTypeName`
- `NSPrivacyCollectedDataTypeEmailAddress`
- `NSPrivacyCollectedDataTypeFitness`
- `NSPrivacyCollectedDataTypeCoarseLocation`
- `NSPrivacyCollectedDataTypeContacts`
- `NSPrivacyCollectedDataTypePhotosorVideos`
- `NSPrivacyCollectedDataTypeOtherUserContent`
- `NSPrivacyCollectedDataTypeUserID`
- `NSPrivacyCollectedDataTypeProductInteraction`
- `NSPrivacyCollectedDataTypeOtherDiagnosticData`

Para todos, `NSPrivacyCollectedDataTypeTracking = false`; `Linked = true`; propósitos apenas `App Functionality` e, onde indicado, `Product Personalization`. O app declara `NSPrivacyAccessedAPICategoryUserDefaults`/`CA92.1` e agrega o uso do SDK de câmera em `NSPrivacyAccessedAPICategoryFileTimestamp` com `C617.1` e `3B52.1`, pois o pacote do SDK não entrega esse manifesto no `.app`. `UserDefaults`/Capacitor Preferences guarda marcador de instalação, tombstone de limpeza, rascunhos, tentativas idempotentes e progresso do guia, isolados pelo ID da conta quando aplicável. Essa camada não contém senha, access token nem refresh token; o refresh token permanece exclusivamente no Keychain. Os valores locais não são “coleta” enquanto não saem do aparelho, mas seu uso precisa continuar descrito honestamente no Privacy Report. O archive Release sem assinatura foi inspecionado e contém as três razões; repetir a auditoria no archive assinado. Usar exatamente os valores documentados pela Apple: [Describing data use in privacy manifests](https://developer.apple.com/documentation/BundleResources/describing-data-use-in-privacy-manifests), [required reason APIs](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api) e [TN3184](https://developer.apple.com/documentation/technotes/tn3184-adding-data-collection-details-to-your-privacy-manifest).

A infraestrutura TUS, desabilitada para criação/publicação de vídeo na `1.0`, mantém localmente apenas metadata operacional de retomada por tempo limitado e não deve persistir Bearer, senha ou refresh token. O player de vídeo já autorizado usa sessão efêmera, sem cache/cookies, e recebe o Bearer em memória. Conferir o gate, o código empacotado e o player no archive/aparelho antes de certificar a ficha.

Mensagens diretas e notificações remotas permanecem desligadas na primeira candidata. Não adicionar `Emails or Text Messages`, token APNs ou push ao manifesto e à ficha apenas por existir código dormente no repositório. Se esses recursos forem ativados numa versão futura, atualizar primeiro a política pública, a moderação, a matriz e o archive; Web Push da PWA não equivale a APNs no iOS.

## Gate de certificação

- [ ] Inventariar todos os SDKs efetivamente incorporados no archive, não só `package.json`.
- [ ] Conferir privacy manifests e signatures dos SDKs.
- [ ] Documentar retenção e finalidade de logs em Vercel e Supabase, inclusive IP, URL/query, user agent e request IDs.
- [ ] Conferir que câmera/picker não envia arquivo até a pessoa confirmar.
- [ ] Conferir que metadados originais de foto/vídeo são descartados como prometido.
- [ ] Conferir Preferences/UserDefaults e armazenamento web do bundle: rascunhos/guia/retomada sem credenciais, isolamento por conta e limpeza na saída.
- [ ] Conferir que player Range não escreve Bearer/refresh token nem vídeo privado integral em cache persistente; confirmar também que TUS/publicação nova permanecem inacessíveis na `1.0`.
- [ ] Comparar respostas com política pública e fluxo de exclusão/exportação.
- [ ] Publicar App Privacy somente por Account Holder, Admin ou App Manager após validação humana.
- [ ] Revalidar a matriz sempre que entrar analytics, crash reporting, ads, push, localização, novos SDKs ou nova finalidade.
