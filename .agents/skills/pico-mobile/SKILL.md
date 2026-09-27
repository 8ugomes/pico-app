---
name: pico-mobile
description: Preparar, empacotar, implementar e validar o Pico Social para iOS e Android com Capacitor, incluindo toolchains, bridges, builds, simuladores, aparelhos e gates de distribuição. Não usar para mudanças exclusivamente web.
---

# Aplicativo Pico Social

Leia [AGENTS.md](../../../AGENTS.md), [MOBILE_APP.md](../../../docs/MOBILE_APP.md), o [plano corrente](../../../docs/pico-product-plan.md), o [Deslopify](../../../docs/deslopify.md) e o domínio **Aplicativo e distribuição** em [pico-domains.md](../../../docs/pico-domains.md). Trate o produto e o aplicativo como **Pico Social**; nomes anteriores só permanecem em registros históricos ou caminhos de ativos.

Identifique primeiro o gate N0–N5 vigente. Use `npm run native:doctor` e os scripts `native:*` existentes; não duplique sua lógica nem confunda scaffold, sync, compilação, simulador, aparelho físico, assinatura e publicação.

Combine [pico-dev](../pico-dev/SKILL.md) para código e contratos, [pico-test-cycle](../pico-test-cycle/SKILL.md) para comportamento, e [pico-screen-check](../pico-screen-check/SKILL.md) com [pico-deslopify](../pico-deslopify/SKILL.md) para interface. `impeccable` pode apoiar movimento, adaptação e auditoria, mas sua orientação nativa genérica não autoriza trocar Capacitor/React DOM por SwiftUI, Compose ou React Native, nem substituir automaticamente a iconografia aprovada.

Preserve a PWA, Auth, autoria, audiência, RLS e mídia privada. Preview remoto continua interno. Registre evidência real por ambiente e aparelho, sem promover uma etapa incompleta ao gate seguinte. Login de conta, aceite jurídico, confiança em aparelho, assinatura e publicação continuam ações do responsável quando forem necessários.
