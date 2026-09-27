# Gates humanos para TestFlight, App Review e publicação

Status: **abertos**. Esta lista contém somente decisões, credenciais, contratos ou responsabilidades que não podem ser inferidos do código.

## Para assinar e criar o registro

| ID | Decisão/dado necessário | Entrega objetiva | Bloqueia |
| --- | --- | --- | --- |
| H1 | Entidade publicadora | Escolher pessoa física ou organização; fornecer nome legal. Se organização, D-U-N-S, site associado, endereço, telefone e autoridade de assinatura verificados. | Apple Developer Program, seller name, contratos. |
| H2 | Conta Apple | Membership ativa, Account Holder identificado, 2FA disponível e acesso da equipe com papéis mínimos. | Certificados, App Store Connect, upload. |
| H3 | Identidade final da loja | Aprovar nome público, bundle ID imutável, SKU, ícone final e copyright. | Registro, signing e primeiro upload. |
| H4 | Domínio público | Escolher domínio HTTPS controlado e quem mantém DNS/arquivos de associação. O roteamento interno de URLs já existe, mas entitlement e AASA não; se Universal Links não entrarem na 1.0, decidir a retirada explícita desse entitlement. | URLs legais/suporte e Universal Links. |

## Para TestFlight externo e App Review

| ID | Decisão/dado necessário | Entrega objetiva | Bloqueia |
| --- | --- | --- | --- |
| H5 | Controlador e contatos | Nome legal do controlador, contato de privacidade, contato de suporte e contato de App Review com telefone DDI; todos monitorados. | Privacy/Support URL, UGC 1.2/1.5, review. |
| H6 | Política de autenticação | A decisão vigente é cadastro sem confirmação de e-mail e sem SMTP; isso não impede novos cadastros. Confirmar que recuperação continuará indisponível ou autorizar/configurar uma política pública diferente. Escolher e ativar proteção do cadastro direto no Supabase Auth: recomendação atual Cloudflare Turnstile; alternativa é admissão controlada. Aprovar fornecedor/privacidade, custodiar o secret fora do Git e definir resposta a abuso. CORS, origem móvel e limites por conta não bastam. | Termos, privacidade, suporte, beta externo e conta de review. |
| H7 | Menores e idade | Definir idade mínima, tratamento de menores e eventual override acima do cálculo Apple. | Termos, onboarding e questionário etário. |
| H8 | Privacidade/fornecedores | Aprovar finalidade/retenção, contratos e transferências; informar retenção/logs de Vercel/Supabase e certificar a matriz App Privacy. | Privacy label e política pública. |
| H9 | Moderação | Nomear responsáveis, cobertura, tempo de resposta e escalonamento; aprovar filtro preventivo, diretrizes, recurso e canal de emergência. | UGC 1.2 e beta externo. |
| H10 | Direitos | Aprovar Termos/licença de UGC e provar direitos de marca, ícone, fotos de arenas, nomes/logos, dataset e screenshots. | Content Rights, ficha e revisão. |
| H11 | Export compliance | Uma pessoa autorizada/jurídico confirma se a criptografia é isenta, territórios e obrigação anual; assina a resposta do App Store Connect. | Compliance do build/TestFlight Review. |
| H12 | Escopo comercial e territorial | Confirmar app gratuito, sem IAP, países/regiões, DSA trader status, disponibilidade em Mac/Apple silicon e Vision Pro. Se trader na UE, fornecer/verificar endereço, telefone, e-mail e payment account exigidos. | Availability e compliance. |
| H13 | Conta de revisão e beta | Autorizar criação de duas contas fictícias persistentes, fornecer credenciais por canal privado e nomear testers/Feedback Email. | TestFlight externo e App Review. |

## Para envio e lançamento público

| ID | Decisão/dado necessário | Entrega objetiva | Bloqueia |
| --- | --- | --- | --- |
| H14 | Aprovação da ficha | Titular aprova metadata, classificação, App Privacy, screenshots, review notes e conteúdo controlado da build exata. | Submit for Review. |
| H15 | Autorização de envio | Responsável autoriza explicitamente enviar a versão/build identificada à App Review. | Ação externa de submissão. |
| H16 | Autorização de lançamento | Após aprovação, responsável autoriza separadamente data/horário/territórios do release manual e confirma suporte/moderação/rollback. | Publicação na App Store. |

## Formato mínimo para responder aos gates

Não enviar senha, código 2FA, certificado, private key ou token pelo chat/repositório. Para destravar, o responsável pode fornecer somente:

- IDs/nome/domínio e decisões não secretas por escrito;
- confirmação de que membership, contratos e 2FA foram concluídos diretamente na Apple;
- contatos públicos que ele aceita publicar;
- autorização explícita com versão/build para H15/H16;
- credenciais de review diretamente no App Store Connect ou em canal secreto autorizado, nunca no Git.

## Situação mais curta do bloqueio

Hoje, os bloqueios determinantes são H1–H13. Em particular, o repositório não informa entidade legal, conta Apple, bundle ID final, domínio próprio, contato público, política de menores, liberação final de direitos ou escala de moderação. O cadastro aberto e automaticamente admitido também precisa de Turnstile no Supabase Auth ou de admissão controlada antes do beta externo; App Attest pode ser uma camada posterior, mas não substitui a proteção humana e não cobre a PWA. O filtro preventivo de texto já existe, e fotos importadas sem direitos foram retiradas da resposta iOS; ainda faltam aprovação da política de mídia, ensaio operacional e contatos reais. Não há caminho honesto para TestFlight externo/App Review antes desses fechamentos.

Referências: [Apple Developer enrollment](https://developer.apple.com/help/account/membership/enrolling-in-the-app), [App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information), [DSA trader requirements](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements), [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [Supabase CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha), [Turnstile em aplicativos móveis](https://developers.cloudflare.com/turnstile/get-started/mobile-implementation/) e [Agreements and Guidelines](https://developer.apple.com/support/terms).
