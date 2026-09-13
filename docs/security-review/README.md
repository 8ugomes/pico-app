# Revisão de segurança — 13/09/2026

[Contrato, auditoria e pendências de abertura](../BETA_SECURITY.md).

- `result.json`: 412 verificações de Auth/Data API/API/Storage e navegador no desenvolvimento exclusivo; oito contas controladas removidas ao final. O ensaio final teve oito sessões, 96 requisições, p95 217 ms e zero erros; não representa benchmark Vercel nem base grande.
- `account-390-light.png` e `account-320-dark.png`: conta real de teste, removida após a execução. Sem dados de participantes reais.
- `heic-csp.json` e `heic-csp.png`: HEIC/HEVC original gerado pelo teste, conversão e recorte sob a CSP da aplicação compilada. APIs simuladas em loopback, sem upload ou ação social remota.
- A suíte existente de onboarding também passou em oito layouts, com troca de identidade, localStorage negado e erro de perfil. O teste hospedado atrasou a leitura do tutorial e confirmou que o formulário aberto e seu conteúdo permanecem intactos.

Não houve envio de e-mail, validação em celular físico ou exposição de senha/hash/token. As primeiras execuções localizaram a corrida do tutorial e ajustes de seletores de teste; fixtures foram limpas, inclusive o recurso de um processo interrompido. Os arquivos aqui representam a execução final aprovada.
