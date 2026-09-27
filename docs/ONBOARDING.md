# Perfil personalizado antes de explorar · 13/09/2026

Foto confirmada, nome, usuário e esporte principal compõem a configuração inicial. O formulário pede os quatro antes de liberar Feed, Pessoas, Arenas e Comunidades, inclusive por link direto e após recarga. Nome provisório “Novo jogador” começa vazio para ser personalizado. Bio, cidade e bairro continuam opcionais; o texto explica que aparecem no perfil. Os níveis existentes permanecem selecionáveis.

Escolher e recortar uma imagem não conclui a etapa: “Usar esta foto” confirma o avatar no servidor. O topo e a lateral usam a mesma URL privada do perfil. Ao salvar/remover a foto, a leitura compartilhada atualiza os consumidores e avisa as outras abas para reler; nenhum dado pessoal é guardado ou enviado pelo canal de invalidação. Falha da imagem mostra um ícone identificado como indisponível. O formulário mantém os campos durante atualização de foto e erro de gravação.

A API de salvar perfil recusa a ausência de avatar. A navegação só avança depois de ler o perfil salvo. Este é um requisito de jornada, não uma nova permissão do banco: admissão, RLS e autorização do Storage continuam independentes, sem migration. Conta, Acesso e Privacidade permanecem disponíveis; o próprio perfil já salvo permite edição/remoção de foto sem descartar o rascunho. Se a foto for removida, os demais destinos sociais voltam à configuração. Perfis que já atendem aos requisitos entram normalmente, sem refazer etapas.

O aviso da comunidade oficial e o tutorial opcional aparecem depois da configuração. Nenhum acompanhamento, jogo ou publicação é criado pelo gate. Engajamento maior é uma hipótese de produto, sem resultado medido nesta entrega.

> Atualização de publicação: sincronização com produção autorizada em 13/09/2026; migration e política de senha já aplicadas no principal. [Preparação, destino e verificação da revisão servida](ONBOARDING_RELEASE.md). SMTP continua pendente. As referências abaixo a “somente desenvolvimento”/“não publicado” registram a etapa anterior.

# Conheça o Pico — tutorial guiado

## Atualização para o aplicativo · 18/09/2026

O guia vigente ensina o essencial em três passos: **Arenas**, **Pessoas** e **Meus jogos**. Comunidades continuam encontráveis ao lado de Pessoas; Início e Perfil permanecem na navegação e não exigem uma visita didática. O percurso anterior de seis etapas foi substituído para reduzir leitura e tempo até a exploração.

O payload local agora usa `version: 2`. O mesmo namespace `pico.tour.v1:account:<id>` ou `pico.tour.v1:demo` é mantido apenas para localizar e migrar preferências existentes sem misturar contas. Um payload v1 válido é convertido para a etapa equivalente; estados concluído, dispensado e pausado são preservados. Não há migration de banco nem novo estado remoto.

Entrada anônima, tutorial e shell são estados separados. Antes de entrar, a pessoa vê somente marca, proposta curta, esportes, cadastro e login. Depois do acesso, o convite continua opcional, pode ser dispensado, pausado, retomado ou reiniciado no Perfil e nunca executa uma ação social.

## Redesign Aura Manteiga

Aura Manteiga aplicada ao convite, guia, formulário inicial e aviso institucional. O perfil inicial mostra quantos dos três dados essenciais estão preenchidos (nome, usuário e esporte), links às seções e dados opcionais separados. Isso indica preenchimento, sem afirmar salvamento. Textos do guia foram encurtados; “Mostrar onde” e “Pausar” têm rótulos visíveis. Em altura curta o painel entra no fluxo da página; a navegação reserva sua altura medida quando o texto cresce.

Pausa/dispensa, retomada voluntária, isolamento entre contas/origem/demo e suspensão durante edição/diálogo permanecem. Perfil inicial e aviso oficial confirmado no servidor continuam separados do tutorial. O histórico do redesign de seis etapas permanece em [oito grupos de regressão e oito layouts](aura-redesign-review/onboarding/checks.json); a versão atual migra essas preferências e reduz o percurso sem APIs sociais.

## Problema e resultado esperado

O responsável quer que quem chega entenda a identidade do Pico e encontre um caminho entre lugares, pessoas e comunidades. O refinamento anterior organizou as telas; este incremento explica como usá-las no próprio app. É uma hipótese de onboarding, ainda sem pesquisa com jogadores.

Objetivos: reconhecer a proposta social, conseguir localizar pessoas ligadas a uma arena e distinguir registro privado de publicação. O convite no Início apresenta futevôlei, beach tennis e vôlei de praia. O passeio começa apenas por escolha da pessoa; o formulário inicial de perfil continua independente.

## Percurso

| Etapa | Ação que o guia aponta | O que ensina |
| --- | --- | --- |
| Arenas | Buscar e abrir uma arena; acompanhar no detalhe | Vínculo com um lugar conhecido, sem presença ao vivo |
| Pessoas | Abrir filtros e selecionar uma arena acompanhada | Afinidade por esporte, nível e vínculos visíveis; acompanhar não envia convite |
| Meus jogos | Abrir Registrar jogo | Arena/modalidade/data, registro retrospectivo privado e compartilhamento separado |

Os números indicam a posição no passeio, não a conclusão de ações sociais. Detalhes de arena mantêm a primeira etapa; Pessoas e detalhes de perfis/comunidades mantêm a segunda; Jogos mantém a terceira. Início, Perfil e publicações não mudam o passo. “Mostrar onde” recolhe a dica, destaca, rola e foca o controle real. Não clica em botões de gravação. A pessoa pode explorar, voltar, avançar, recolher ou pausar sem seguir ninguém, entrar em um grupo ou enviar conteúdo. A tela permanece utilizável; não há máscara bloqueando o aplicativo.

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

Implementação local concluída. Lint, typecheck, build demo e 172 testes locais aprovados. Percursos Chromium com APIs isoladas e em demo passaram pelos três passos sem gravações sociais. Oito medições cobrem 320–1280 px, altura reduzida e texto 200%; a entrada sem sessão também foi conferida nos temas claro e escuro sem navegação social. Não houve publicação, exercício de Supabase hospedado, teste físico ou pesquisa com jogadores nesta rodada.

## Comunidade inicial

O formulário agora informa a entrada automática na comunidade oficial. A gravação inclui modalidade e participação na mesma transação. Um aviso separado do tutorial confirma a inclusão, permite conhecer o grupo e é reconhecido por conta no servidor. O tutorial continua opcional e não executa gravações sociais. [Contrato e validação](OFFICIAL_COMMUNITY_AUTH.md).
