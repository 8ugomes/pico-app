# Export compliance · memo técnico

Status: **hipótese técnica para decisão do responsável; não é parecer jurídico nem declaração enviada**.

## Uso identificado

O desenho atual usa:

- HTTPS para API/Auth/Storage;
- iOS Keychain/Security para o refresh token;
- `URLSession`/AVFoundation para reprodução privada por Range e TUS/HTTPS para upload resumível;
- tokens de sessão padrão do provedor;
- APIs criptográficas do sistema/WebKit usadas pelas bibliotecas de transporte e autenticação.

Não foi identificado no escopo documentado algoritmo criptográfico proprietário, VPN, mensageria com criptografia própria, carteira, pagamento, armazenamento criptográfico independente ou função cujo propósito principal seja segurança/criptografia. Isso precisa ser revalidado no archive e nas dependências realmente linkadas.

## Hipótese para o questionário

A Apple explica que HTTPS via APIs do sistema costuma ser isento de upload de documentação, embora ainda seja uso de criptografia. Se a auditoria confirmar **somente criptografia padrão fornecida pelo sistema/SDK e nenhuma criptografia não isenta**, a hipótese é:

- documentação de export compliance: não exigida pelo App Store Connect;
- `ITSAppUsesNonExemptEncryption`: `NO`;
- tracking separado: não se confunde com export compliance;
- eventual relatório anual de autoclassificação nos EUA: avaliar com responsável jurídico, pois a Apple alerta que ainda pode ser aplicável a formas isentas.

Não escrever `NO` por conveniência. O valor certifica também as bibliotecas de terceiros linkadas.

## Perguntas que o responsável deve fechar

- [ ] O archive usa apenas HTTPS/TLS e criptografia disponível pelo sistema operacional ou bibliotecas padrão?
- [ ] Algum SDK incorporado implementa criptografia própria, E2EE, túnel, VPN, proteção de arquivos ou protocolo não padrão?
- [ ] Alguma build futura adicionou chat cifrado, pagamentos, wallet, assinatura digital ou segurança como função central?
- [ ] Os países/regiões escolhidos criam exigência documental adicional, inclusive França?
- [ ] A entidade publicadora aprovou a classificação de exportação e a eventual obrigação anual nos EUA?

## Passos no App Store Connect

1. Com a lista final de binários/SDKs, responder o questionário em App Information > App Encryption Documentation ou no build com `Missing Compliance`.
2. Se o fluxo concluir que não há documentação exigida, registrar a decisão privada e somente então definir `ITSAppUsesNonExemptEncryption = NO` no target.
3. Se houver criptografia não isenta, enviar a documentação pedida e aguardar a análise da Apple antes de TestFlight App Review/App Review.
4. Se a Apple fornecer um código, usar `ITSEncryptionExportComplianceCode` conforme a instrução recebida; não inventar valor.
5. Repetir a avaliação quando mudar networking, auth, storage seguro ou SDK nativo.

## Evidência a anexar ao gate interno

- hash/versão da build auditada;
- lista de frameworks e SDKs do archive;
- descrição curta do uso de HTTPS e Keychain;
- respostas exatas dadas no App Store Connect;
- nome/data de quem assumiu a declaração;
- documento/código Apple, se houver, guardado fora do Git quando contiver informação sensível.

Referências: [Overview of export compliance](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance), [Determine and upload app encryption documentation](https://developer.apple.com/help/app-store-connect/manage-app-information/determine-and-upload-app-encryption-documentation) e [Complying with Encryption Export Regulations](https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations).
