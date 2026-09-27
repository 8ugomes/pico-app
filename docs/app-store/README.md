# Pacote App Store e TestFlight

Status em 18/09/2026: **rascunho versionado e alinhado ao cliente iOS local; não enviado ao App Store Connect**.

Este diretório prepara os textos, decisões e evidências da primeira distribuição iOS do Pico Social. Ele não comprova assinatura, TestFlight, revisão, aprovação nem publicação. Campos entre `[[COLCHETES DUPLOS]]` exigem uma decisão ou dado humano; nenhum deles deve ser enviado como placeholder.

O cliente atual implementa os percursos sociais, direitos da conta, rascunhos/tentativas idempotentes por conta, deep-link routing e player privado por Range para vídeo já autorizado. Um archive Release sem assinatura compilou com o manifesto de privacidade agregado, mas é apenas prova local e não pode ser distribuído. A infraestrutura TUS de MP4 existe, mas novo upload/publicação permanece desligado na `1.0` até sanitização/transcoding e validação física. Isso não fecha os gates externos: Universal Links aguardam domínio/bundle final; mídia e acessibilidade aguardam iPhone físico; cadastro aberto aguarda antiabuso; identidade, recuperação, contatos, jurídico, direitos, moderação e credenciais Apple aguardam o responsável. MOV/HEVC não são aceitos.

## Artefatos

| Arquivo | Uso |
| --- | --- |
| [metadata-pt-BR.md](metadata-pt-BR.md) | Rascunho da ficha pública em pt-BR, categorias, URLs e limites dos campos. |
| [app-privacy-matrix.md](app-privacy-matrix.md) | Respostas provisórias de App Privacy e alinhamento com `PrivacyInfo.xcprivacy`. |
| [review-notes.md](review-notes.md) | Texto e preparação da conta para App Review, sem credenciais no Git. |
| [testflight-what-to-test.md](testflight-what-to-test.md) | Descrição beta, “What to Test” e roteiro de coleta de evidência. |
| [screenshots.md](screenshots.md) | Formatos atuais e lista de tomadas para a primeira versão iPhone. |
| [age-rating.md](age-rating.md) | Folha de decisão do questionário etário atual. |
| [export-compliance.md](export-compliance.md) | Memo técnico para a declaração humana de criptografia. |
| [ugc-content-rights.md](ugc-content-rights.md) | Gate de moderação, conteúdo gerado por usuários e direitos de mídia. |
| [submission-checklist.md](submission-checklist.md) | Checklist de TestFlight, revisão e liberação manual. |
| [human-gates.md](human-gates.md) | Lista curta e precisa do que somente o responsável pode concluir. |

## Como usar

1. Fechar primeiro os [gates humanos](human-gates.md) que mudam identidade, política, operação ou ficha.
2. Atualizar a matriz de privacidade com o binário Release e os contratos reais de Vercel, Supabase e demais SDKs.
3. Ativar e ensaiar Turnstile diretamente no Supabase Auth ou trocar o cadastro público por admissão controlada. A decisão vigente continua sem confirmação de e-mail e sem SMTP; recuperação precisa de uma decisão separada.
4. Exercitar o roteiro em iPhone físico. A primeira versão foi deliberadamente limitada a iPhone; reabrir a matriz completa antes de incluir iPad.
5. Capturar a ficha visual somente com a mesma build candidata, conta fictícia controlada e conteúdo licenciado.
6. Inserir a conta de revisão somente no campo privado do App Store Connect.
7. Fazer TestFlight interno, depois externo, e só então enviar a versão para App Review.
8. Selecionar **liberação manual**. Aprovação não autoriza publicação pública.

## Fontes Apple atuais

Consultadas em 18/09/2026. As regras são vivas e devem ser relidas na data do envio.

- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), especialmente 1.2, 1.5, 2.1, 2.3, 4.2, 4.8, 5.1 e 5.2.
- [Campos da ficha por plataforma](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information).
- [Informações do app](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information).
- [Detalhes de privacidade na App Store](https://developer.apple.com/app-store/app-privacy-details/).
- [Gerenciar App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy).
- [Especificações de screenshots](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications).
- [Classificação etária](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions).
- [TestFlight](https://developer.apple.com/testflight/) e [informações de teste](https://developer.apple.com/help/app-store-connect/test-a-beta-version/provide-test-information).
- [Export compliance](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance).
- [Declaração de criptografia no Info.plist](https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations).
- [Exclusão de conta no app](https://developer.apple.com/support/offering-account-deletion-in-your-app).
- [Requisitos DSA para a União Europeia](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements).
