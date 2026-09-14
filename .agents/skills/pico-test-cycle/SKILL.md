---
name: pico-test-cycle
description: Verificar mudanças de comportamento e refatorações do Pico com teste focado, regressão proporcional e evidência honesta.
---

# Ciclo de teste focado do Pico

Use quando uma mudança afetar comportamento, contratos, acesso, privacidade ou performance mensurável. Adaptação de `test-driven-task` do [Agent Harness Kit v0.7.2](https://github.com/Eduardo-Salvador/Agent-Harness-Kit/tree/v0.7.2/.agents/skills/test-driven-task), subordinada a `pico-dev` e aos checks obrigatórios de `AGENTS.md`.

Para comportamento novo ou bug, escreva ou selecione um teste que expresse o aceite e observe falha pertinente antes do código; passe o mesmo teste após a correção e amplie a regressão pelo risco. Se passar antes ou falhar por ambiente/sintaxe, investigue o diagnóstico em vez de fabricar RED. Para refatoração sem delta funcional, caracterize o contrato atual com uma verificação que passa antes e depois; não invente falha. Para documentação ou medida, use verificação reproduzível apropriada.

Em sessão/audiência/jogos privados/RLS, confirme isolamento e operações negativas com identidades de teste quando o ambiente permitir. Nunca descreva uma simulação ou teste unitário como validação hospedada. Registre comando, resultado e limite da prova no plano ou relatório da rodada; lint, typecheck e build continuam no fechamento.
