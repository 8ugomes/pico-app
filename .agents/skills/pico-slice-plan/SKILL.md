---
name: pico-slice-plan
description: Delimitar mudanças não triviais do Pico em uma entrega verificável, sem criar um segundo plano ou grafo de tarefas.
---

# Fatia de implementação do Pico

Use em refatoração, desempenho, integração ou funcionalidade com mais de um ponto de impacto. Derivada de `request-router` e `writing-plans` do [Agent Harness Kit v0.7.2](https://github.com/Eduardo-Salvador/Agent-Harness-Kit/tree/v0.7.2/.agents/skills); adaptação local, não instalação da CLI.

Leia `AGENTS.md`, `docs/pico-product-plan.md`, `docs/deslopify.md` e os contratos do domínio afetado. O plano corrente é a única autoridade operacional: não crie `harness-state`, grafo, leases, bridges de raiz ou aprovação adicional para decisões técnicas reversíveis.

Antes de codar, registre no plano o resultado observável, área afetada, não objetivos, critérios de aceite e verificação proporcional. Para mudanças comportamentais, inclua exemplo aceito, rejeitado e falha/recuperação. Divida apenas quando uma fatia não puder ser concluída e verificada com segurança. Reavalie a extensão ao encontrar uma permissão, audiência, dado ou decisão de produto não prevista.

Na conclusão, associe cada critério à evidência observada, distinga check local de fluxo real conectado e liste limitações. Preserve lint, typecheck, build, changelog e commit exigidos pelo Pico; não inferir autorização para push, deploy ou publicação.
