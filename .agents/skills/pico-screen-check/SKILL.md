---
name: pico-screen-check
description: Validar mudanças materiais de tela ou CSS do Pico em rotas reais, larguras representativas e temas claro/escuro.
---

# Conferência de tela e CSS do Pico

Use em tela nova, refino visual material ou divisão de estilos por rota. Adaptada de `frontend-screen` do [Agent Harness Kit v0.7.2](https://github.com/Eduardo-Salvador/Agent-Harness-Kit/tree/v0.7.2/.agents/skills/frontend-screen). Trabalhe com `pico-deslopify`, o design system e os componentes existentes; nenhuma ferramenta de geração de imagem ou aprovação estética é requisito para uma mudança determinística.

Inspecione primeiro o app e o CSS compilado. Preserve Aura Manteiga, uma ação principal, semântica, foco, texto ampliado, ambos os temas, redução de movimento e rótulos de demo/privacidade/audiência. Confirme uma amostra representativa em mobile estreito e desktop no aplicativo compilado, incluindo a rota afetada e uma rota vizinha. Ao separar CSS, confira que a rota recebe os estilos necessários e que uma rota não relacionada deixa de carregar os estilos movidos. Amplie a amostra se houver falha ou alcance maior.

Relate medidas como bytes transferidos e não como melhora de Core Web Vitals sem medição de campo. Não substitua fotos, marca ou fluxos apenas para otimizar um número. Não publicar sem pedido explícito.
