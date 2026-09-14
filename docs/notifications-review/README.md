# Verificação de notificações · 13/09/2026

[Contrato e limites](../NOTIFICATIONS.md).

- `hosted.json`: 100 verificações incluindo limpeza, usando Next local compilado e Supabase exclusivo de desenvolvimento; nenhuma credencial ou identidade real de jogador no relatório.
- `browser.json`: quatro layouts e console sem erros no fluxo com contas reais de teste, depois removidas. `light-390-1.png` e `light-1280-1.png` registram a composição com essas contas.
- `states.json`: estados e paginação com respostas HTTP explicitamente simuladas no navegador, sem banco; também confirma o refino de leitura com contêiner estreito e fonte ampliada. Capturas `final-dark-320-1.png` e `final-light-320-2.png` usam nomes rotulados como exemplo.

A captura de página inteira mantém a navegação fixa na posição da janela; a interface continua rolável. As capturas em 200% não representam largura física ou validação em aparelho. Lint/typecheck/build e 101 testes locais aprovados. A revisão final mudou apenas a disposição do ícone decorativo e o espaço do controle; não repetiu a suíte remota após esse ajuste visual. A policy recebeu depois um predicado explícito de destinatário para uso do índice, com os quatro testes SQL repetidos e aprovados antes de aplicar a migration aditiva em desenvolvimento.

Roteiros: `tests/notifications.test.mjs`, `tests/hosted-notifications.mjs` e `tests/browser-notifications.mjs`. Os dois últimos usam `PLAYWRIGHT_MODULE` apontando ao runtime instalado e `PLAYWRIGHT_CHANNEL=chrome` por padrão. A execução hospedada exige envs de desenvolvimento e servidor correspondente em localhost:3002; recusa ledger de fixtures pendentes. Fixtures não completam perfil via RPC nem escolhem esporte, portanto não ingressam na comunidade institucional.
