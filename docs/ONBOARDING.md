> Atualização de publicação: sincronização com produção autorizada em 13/09/2026; migration e política de senha já aplicadas no principal. [Preparação, destino e verificação da revisão servida](ONBOARDING_RELEASE.md). SMTP continua pendente. As referências abaixo a “somente desenvolvimento”/“não publicado” registram a etapa anterior.

# Conheça o Pico — tutorial guiado

## Próxima direção — redesign Aura Manteiga

O responsável solicitou refinar o onboarding assistido como parte do redesign integral. A [skill principal](../.agents/skills/pico-redesign/SKILL.md), o [prompt](brand-exploration/aura-manteiga/PROMPT-PRODUCAO.md) e o [mapa de domínios](pico-domains.md) orientam essa execução futura. A apresentação, o texto e a sequência podem ser simplificados, preservando guia opcional, pausa/retomada, isolamento por conta, preferências anteriores e ausência de ações sociais automáticas. Perfil inicial e confirmação de comunidade continuam separados do tutorial. A documentação abaixo descreve a implementação existente, não o redesign já executado.

## Problema e resultado esperado

O responsável quer que quem chega entenda a identidade do Pico e encontre um caminho entre lugares, pessoas e comunidades. O refinamento anterior organizou as telas; este incremento explica como usá-las no próprio app. É uma hipótese de onboarding, ainda sem pesquisa com jogadores.

Objetivos: reconhecer a proposta social, conseguir localizar pessoas ligadas a uma arena e distinguir registro privado de publicação. O convite no Início apresenta futevôlei, beach tennis e vôlei de praia. O passeio começa apenas por escolha da pessoa; o formulário inicial de perfil continua independente.

## Percurso

| Etapa | Ação que o guia aponta | O que ensina |
| --- | --- | --- |
| Arenas | Buscar e abrir uma arena; acompanhar no detalhe | Vínculo com um lugar conhecido, sem presença ao vivo |
| Pessoas | Abrir filtros e selecionar uma arena acompanhada | Afinidade por esporte, nível e vínculos visíveis; acompanhar não envia convite |
| Comunidades | Explorar e conhecer as condições do grupo | Propósito, regras, entrada aberta/aprovação/convite e limite do pedido pendente |
| Início | Abrir o compositor | Relações e publicações; audiência e destinos antes de enviar |
| Meus jogos | Abrir Registrar jogo | Arena/modalidade/data, registro retrospectivo privado e compartilhamento separado |
| Perfil | Editar e localizar os vínculos/controles pessoais | Identidade, Meus Picos, Meus jogos, privacidade e retomada do tutorial |

Os números indicam a posição no passeio, não a conclusão de ações sociais. Navegar por uma aba acompanha a etapa correspondente; detalhes de arena e comunidade adaptam a instrução. “Mostrar onde” recolhe a dica, destaca, rola e foca o controle real. Não clica em botões de gravação. A pessoa pode explorar, voltar, avançar, recolher ou pausar sem seguir ninguém, entrar em um grupo ou enviar conteúdo. A tela permanece utilizável; não há máscara bloqueando o aplicativo.

## Requisitos e aceite

P0:
- Convite somente no Início e dentro do acesso aprovado (ou demo explícito). Não abrir em login, admissão pendente ou erro de perfil.
- Pausar/dispensar não abre novamente a cada navegação. Perfil oferece começar/rever e retomar/recomeçar quando pausado.
- Recarregar guarda a etapa, mas exige retomada voluntária; não redireciona automaticamente.
- Preferência local isolada por conta confirmada, origem e demo. Trocar de identidade não herda a etapa de outra conta.
- Catálogo vazio, controle ausente ou falha de carregamento não trava a continuação. Não inventar pessoas, arenas ou sucesso de uma ação.
- Dicas somem durante diálogos nativos e esperam o término da edição de perfil. Sem captura global de Escape ou teclado dos formulários.
- Texto ampliado, navegação por teclado e 320–1280 px mantêm saídas acessíveis; movimento reduzido respeitado.
- Tutorial só lê APIs existentes: nenhum acompanhamento, pedido, registro ou post automático; não altera admissão, RLS ou `onboarding_completed`.

P1: observar a jornada com jogadores e ajustar o texto à compreensão real. P2: considerar sincronizar a preferência entre dispositivos somente se houver necessidade; não adicionar banco/telemetria neste incremento.

## Persistência e limites

`pico.tour.v1:<identidade>` contém apenas versão, estado e índice da etapa no armazenamento deste navegador. Não guarda perfil, lista de arenas, posts, fotos ou texto digitado. A identidade conectada vem da leitura autorizada do próprio perfil; a preferência não autoriza acesso. Sem armazenamento disponível, funciona em memória. Ao recarregar, um guia ativo vira retomada opcional. Alterações de outra aba nunca iniciam navegação. Limpar os dados do navegador ou mudar de dispositivo pode apresentar o convite novamente.

A demonstração usa identidade separada e adapta Pessoas à busca realmente disponível nela. As ações de demo continuam locais e identificadas. A implementação não adiciona onboarding obrigatório, áudio, notificações, convites externos, gamificação, service worker nem conteúdo offline.

## Como avaliar com pessoas

Hipóteses para um teste futuro com cinco praticantes: pelo menos quatro devem encontrar o filtro por arena sem ajuda e explicar quem vê um jogo salvo versus compartilhado. Observar se conseguem pausar e retomar e se confundem acompanhamento com presença. Não há métricas coletadas nem resultado de teste com jogadores nesta rodada.

## Entrega e verificação

Implementação local concluída. Lint, typecheck, builds conectado/demo e 84 testes locais aprovados. Percurso Chromium no app compilado com APIs isoladas passou sem gravações sociais; demo percorreu as seis etapas. Oito medições cobrem 320–1280 px, altura reduzida e texto 200%. [Capturas, checks e reprodução](onboarding-review/README.md). Não houve publicação, exercício de Supabase hospedado, teste físico ou pesquisa com jogadores nesta rodada.

## Comunidade inicial

O formulário agora informa a entrada automática na comunidade oficial. A gravação inclui modalidade e participação na mesma transação. Um aviso separado do tutorial confirma a inclusão, permite conhecer o grupo e é reconhecido por conta no servidor. O tutorial continua opcional e não executa gravações sociais. [Contrato e validação](OFFICIAL_COMMUNITY_AUTH.md).
