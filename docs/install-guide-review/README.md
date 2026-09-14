# Instalação visual do Pico Club

O guia em `/instalar` demonstra os controles do navegador com figuras e uma legenda por etapa. iPhone tem caminhos para Safari compacto (Mais > Compartilhar) e barra com Compartilhar direto. Android mostra menu, instalação e confirmação. A capa é o ativo Pico Club já aprovado, sem novo raster ou alteração na identidade da PWA.

O convite fica ao final do Início e depende de perfil completo, boas-vindas confirmadas e tutorial inicial concluído ou dispensado. Um tutorial pausado continua pendente. A tela final do passeio precisa ser fechada. O convite aguarda 15 segundos de pausa, é suspenso por formulário em foco, edição, janela aberta, aba oculta, offline ou modo instalado. Aparece uma vez por conta/navegador; Agora não e Ver como encerram a oferta. Sair da rota desmonta o convite. A página continua disponível por navegação voluntária.

A animação só começa na página escolhida pelo usuário. Pausa/avançar/voltar são controles reais; os controles desenhados são uma demonstração. Reprodução para na última figura e espera a pessoa pedir Rever. Movimento reduzido começa estático. Aba ou área fora de vista suspende o relógio. Leitores de tela recebem uma descrição equivalente de cada etapa.

O prompt nativo, quando o navegador disponibiliza, exige clique. Aceitar o prompt não é tratado como instalação concluída. Somente `appinstalled` ou modo standalone confirmam esse estado. A cena final diz Assim fica na sua tela. Navegadores internos recebem um caminho curto para copiar o endereço e abrir no Safari/Chrome, com alternativa se a área de transferência falhar.

## Fontes e limites

Fluxos conferidos em 13/09/2026 na [orientação da Apple para iOS 26](https://support.apple.com/pt-br/guide/iphone/iphea86e5236/26/ios/26) e na [orientação do Chrome para Android](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=pt-BR). A ajuda recolhida explica variações de nome e a opção Editar Ações do Safari. As figuras simplificam os menus para destacar o controle relevante.

As capturas e os testes de navegador usam o Next real com APIs interceptadas e uma conta fictícia identificada. Não criam usuários nem escrevem no Supabase. Emulação não comprova a instalação e o relançamento em um aparelho físico. Instalar não acrescenta suporte offline, service worker, push ou cache privado. Auth, RLS, tabelas e dados existentes não foram alterados.

## Verificação

- `tests/install-guide.test.mjs`: plataforma, navegador interno, variantes e todas as condições de entrada.
- `tests/browser-install-guide.mjs`: percurso visual, controles/teclado, movimento reduzido, pausa, resultado ilustrativo, prompt nativo e ordem do convite com falhas/recusa/contas distintas.
- Capturas mobile 390px e 320px, desktop 1280px e temas claro/escuro; texto ampliado a 200% sem overflow. Rótulo de reprodução encurtado para Assistir e controles acomodados em três colunas.
- Lint, typecheck e build conectado finais aprovados. Suíte com 136 testes passou; navegador com 46 verificações e nenhum erro de execução. Inclui aba oculta, player fora de tela e falha controlada de área de transferência.
- Resultados completos em [results.json](results.json). Detector Impeccable sem achados. [Revisão independente](finish-review.md): três ajustes materiais resolvidos no verdict pass, disposition ship nesse escopo.

A publicação segue PR/CI/main no projeto pico-app, usando `scripts/deploy.mjs --stage` e preservação de conteúdo antes/depois. O recibo operacional privado registra o commit efetivamente promovido e as respostas de versão/saúde.
