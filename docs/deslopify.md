## Arenas — critérios antes de codar · 14/09/2026

Busca por nome/bairro/cidade deve considerar o catálogo inteiro, com modalidades e paginação coerentes. Foto reconhecível do lugar na lista e no perfil, preservando foto enviada pela gestão e origem verificável da alternativa de catálogo. Falha de uma imagem deve tentar outra foto verificada do mesmo local; nenhuma foto sintética/genérica pode se passar pela arena real. Evitar blocos grandes de “foto indisponível”; manter leitura, nome, localização e ação úteis. Revisar amostra móvel/desktop e temas existentes, sem alterar contratos de audiência, admissão ou histórico.

### Fechamento e aprendizados das arenas

As nove inclusões e Ma Kai têm fotos da unidade. Mantidos enquadramento completo, crédito e prioridade da capa da gestão; falha tenta outra imagem do mesmo local. Não há botão dentro do link dos cartões nem bloco genérico de foto ausente. Navegação da galeria e recuperação após erro foram exercitadas em amostra local; claro/escuro e 390/1100px conferidos. Carregamento sob demanda preservado; arquivos e metadados também foram validados separadamente.

Não basta a imagem estar em um site oficial: Raposo reutilizava Alto do Ipiranga, e uma imagem na página Ma Kai também era da unidade Jardins. Conferir a unidade na própria fotografia, no caminho de origem e no endereço evitou atribuições erradas. As 21 pendências estaduais ficam documentadas, sem apagar históricos ou usar outra arena como substituta. [Evidências](arena-regional-review/README.md).

## Notificações — critérios antes de codar · 13/09/2026
Lista cronológica com “Nome entrou na comunidade X”, data e estado não lido identificado também por texto. Nome da comunidade leva ao grupo; leitura explícita individual ou em lote, sem marcar automaticamente ao abrir a aba. Sino com nome acessível e contador discreto. Preservar as cinco posições da navegação inferior; acesso móvel pelo cabeçalho, desktop pela lateral. Texto longo quebra, controles de 44px, temas existentes e nenhuma nova ilustração ou fotografia fictícia. Vazio, carregamento, erro recuperável e demo honesto. Amostra visual móvel/desktop e dois temas, com confirmação dos comportamentos novos.

### Fechamento e aprendizado das notificações

Lista com pessoa/comunidade/data e estado textual, contador acessível e confirmação persistida. Revisadas amostras em 390/320/1280px, claro/escuro e texto 200%. Na amostra ampliada, retirar o ícone decorativo do contêiner estreito e reduzir o espaço lateral do botão melhorou a leitura sem ocultar nomes ou ações. Falha limpa dados antigos; retry, vazio, carregamento e páginas conferidos. [Evidências](notifications-review/README.md).

## Notificações na main e revisão geral · 14/09/2026

Integração preserva busca e avatar no cabeçalho atual, leitor compartilhado do perfil, gates e convite de instalação. Suprimida apenas a regra antiga de cabeçalho estreito que pertencia à versão sem busca.

Integrar o sino ao cabeçalho atual sem perder busca e avatar real. A aba lateral respeita as cinco posições móveis. Preservar gates de perfil, tutorial e convite de instalação, textos naturais e contraste Aura Manteiga. Conferir a tela principal com a sessão disponível, destinos e estados, sem fabricar notificações para demonstrar resultado. A revisão da base deve distinguir pessoas recém-cadastradas, perfis completos e membros ativos; não chamar vínculo de presença ou contagem de sucesso sem dados.

### Revisão no principal e aprendizado

Sino, aba e estado vazio conferidos com sessão real; navegação, perfis e comunidade mantêm as identidades existentes. A descoberta mostra a outra pessoa e omite a própria. Ausência de notificações anteriores é correta, pois não há backfill. Fotos de catálogo e uploads são fontes distintas: cruzar a interface e o manifesto com os campos do banco evita diagnosticar ausência de imagens já publicadas. [Revisão da base](notifications-review/release.md).

## Instalação visual sem sobrepor etapas · 13/09/2026

### Critérios antes da implementação

Ensinar por posição, figura e gesto, com o telefone ilustrado como foco. Cada cena destaca um botão real do navegador; texto visível se limita ao título, legenda curta e rótulos necessários. Preservar leitura equivalente para tecnologia assistiva e opção sem movimento. Identificar a sequência como demonstração e usar Assim fica no último quadro, sem simular instalação real.

O convite vem depois do perfil, aviso institucional e guia concluído/dispensado. Não competir com edição, diálogos, guia ativo/pausado ou falha de carregamento. Convite discreto no final do Início, sem modal automático, com Agora não e memória por conta/navegador. O tutorial só começa quando a pessoa escolhe Ver como. Movimento explica menu, compartilhamento e adição à tela inicial; não acrescentar enfeites ou narração de campanha.

### Resultado da revisão

Revisão independente pediu indicador dentro do alvo, preservação de safe-area e entrada superior do menu Chrome em 220ms. Os três ajustes receberam resolved no verdict pass, disposition ship limitado a esse lote. Detector sem achados; 46 verificações de navegador aprovadas. [Registro e limites](install-guide-review/finish-review.md).

### Aprendizados da implementação

A figura pode mostrar o botão do sistema com precisão e manter texto mínimo fora dela. A variação do Safari precisa ser selecionável, pois o mesmo aparelho pode usar barras diferentes. O marcador de toque deve preservar a leitura do ícone nativo. A legenda final descreve o resultado esperado e não confirma instalação. A ajuda fica recolhida; Assistir preserva leitura dos controles em 320px e com texto ampliado. Convite e instalação são estados distintos do perfil e das boas-vindas. [Revisão e fontes](install-guide-review/README.md).

## Ícone Pico Club: critérios · 13/09/2026

Pico ocupa a maior parte da área segura; “Clube” vem abaixo em Manrope leve. Usar o wordmark original sem redigitar, sem monograma, slogan ou efeitos sobre as letras. Campos Manteiga/Lavanda com grão fino criam o fundo; contraste Cacau permanece estável. Ícones PWA e Apple opacos, sem cantos transparentes ou moldura de telefone; versão maskable mantém a assinatura dentro do círculo seguro. No favicon de 16/32px, priorizar o wordmark Pico e omitir a linha secundária que não teria leitura. Checar uma prancha de reduções e a tela de instalação, sem reabrir o design do app.

### Revisão e aprendizado

Capa revisada na prancha e na página de instalação do build conectado, sem erro de console. O wordmark mantém reconhecimento em 60px; Clube funciona como assinatura secundária e foi retirado apenas do favicon, onde não teria leitura. Fundo granular fica atrás das letras, maskable aceita recorte circular e arquivos de instalação permanecem opacos. A redução precisa ser tratada por contexto, sem retornar ao monograma rejeitado. A cópia de instalação ainda pedia confirmação de e-mail; alinhada ao acesso atual por e-mail/senha. A validação de pixels/rotas não comprova atualização de uma instalação já existente no iPhone.

## Escrita natural sem travessões decorativos · 13/09/2026

### Critério permanente do responsável

Não usar travessão, meia-risca ou hífen isolado para ornamentar nomes, títulos, botões, rótulos acessíveis e mensagens do Pico. Escrever uma frase curta, com verbo concreto, ou separar ideias por ponto. Não trocar automaticamente cada traço por outro separador; reescrever a frase. Nomes oficiais de terceiros, texto de usuários, hífens ortográficos, intervalos, URLs e código mantêm o significado original.

Evitar slogans em sequência, frases simétricas de campanha em controles e tutoriais, enumerações poéticas, perguntas retóricas seguidas da própria resposta, superlativos e promessas genéricas. A personalidade vem das palavras, pessoas e situações do esporte. Preservar a assinatura institucional em momentos de marca, informações de privacidade, rótulos e consequências das ações. Uma frase operacional não precisa terminar com um slogan.

### Implementação e aprendizados

A varredura não encontrou travessões ou meias-riscas restantes em textos de `src` e `public`. O nome institucional vinha do banco e era reutilizado no Início, diretório, busca, detalhe, vínculos e destinos de posts; corrigir apenas um componente deixaria a inconsistência. A migration altera a mesma comunidade, sem recriar participantes ou conteúdo. O novo nome também muda a ordem alfabética; verificações de identidade devem usar o ID, sem depender da primeira posição do catálogo.

Amostra visual aprovada em 320/390px e 1280px, claro/escuro, com oito verificações de navegador e sem overflow. O tutorial agora orienta ações, como Encontre suas arenas e Edite seu perfil. Estados vazios dizem o que falta; o campo de publicação usa uma pergunta direta. A revisão coordenada da landing e Instagram foi concluída em e2f8ec6: apoios abstratos substituídos por ações concretas, legendas sem abertura repetitiva e derivados sincronizados. Hífens em e-mail, boas-vindas, operadores e URLs continuam válidos. Documentos históricos e SQL de comparação preservam o texto antigo para registrar a evolução e selecionar somente os valores autorizados. [Revisão](editorial-review/README.md).

### Revisão planejada

Conferir código, metadados, acessibilidade e conteúdo oficial persistido. Comunidade oficial do Pico deve ter um único nome no Início, lista, busca, detalhe e boas-vindas. Manter a mesma comunidade e seu histórico. Simplificar o tutorial e mensagens promocionais redundantes; não reiniciar o redesign nem eliminar contornos que ajudam a distinguir posts e comentários. Conferir amostra de leitura, quebra de nomes e teclado nos dois temas. Entregas de arenas/estabilidade integradas antes desta rodada; coordenação registrada com as tarefas responsáveis.

## Catálogo estadual — revisão e aprendizados · 13/09/2026

A cidade deve distinguir unidades de mesmo nome e orientar a busca. Remover a limitação visual Sul/Oeste e a busca apenas na página; uma pesquisa por nome, bairro ou cidade precisa servir ao catálogo inteiro e aos seletores de jogos/publicações/perfil. Manter texto curto, estados de erro/vazio e fotos inteiras. Arena sem foto confirmada usa superfície neutra, nunca imagem de outra unidade. Conferir amostra mobile, desktop e ambos os temas; não simular exaustividade do Google nem parceria das arenas importadas.

A cidade agora acompanha o bairro e distingue unidades; remover o filtro Sul/Oeste evitou apresentar o interior como zona da capital. O campo visível pesquisa o catálogo inteiro. Seleção e busca são estados distintos: procurar outro lugar não apaga uma arena já escolhida. Foto ausente permanece explicitamente indisponível. Revisão em 390px/claro e 1280px/escuro, sem overflow; navegação e registro privado reais confirmados. [Capturas e limites](arena-state-research/validacao.md).

## Monitoramento na nuvem — revisão · 13/09/2026

### Implementação e aprendizados

Nenhuma mudança visual ou mensagem técnica foi acrescentada às telas. A saúde usa estados booleanos e HTTP sem encaminhar erros internos. Timeout e falhas produzem 503 em vez de sucesso aparente; a documentação diferencia solicitação enviada de ativação confirmada. Testes de resposta, falha, recuperação e carga simultânea restrita aprovados; revisão visual não se aplica à rota operacional.

### Critérios registrados antes da implementação

Operação invisível ao jogador: não acrescentar cards, avisos ou texto técnico ao app. Endpoint devolve apenas saúde geral e verificações booleanas, sem e-mail, token, ID de usuário ou mensagens internas. Alertas externos de queda/recuperação ficam com o responsável. Separar rota publicada, solicitação enviada e monitor efetivamente ativo; não apresentar confirmação por e-mail pendente como serviço em execução. O histórico do monitor deve existir no provedor e a retirada do agendamento local depende da ativação comprovada.

## Fluxo claro, conta e senhas — PLAN · 13/09/2026

Feedback de uso pesado: excesso de texto e próxima ação pouco clara. Simplificar a tela de entrada e a abertura do Início mantendo Aura Manteiga. A saída da conta deve estar escrita e visível, sem depender da tela de login. Olho acessível em cada senha, confirmação obrigatória no cadastro e erro junto ao campo; não limpar o formulário quando houver divergência.

Fotos de arenas devem preservar o quadro inteiro também em capas enviadas pela gestão; usar superfície neutra, proporção consistente na lista e imagem íntegra no detalhe. Reduzir chamadas repetidas, não rótulos de privacidade/audiência. Amostra: cadastro 320/390px, Início e Perfil, catálogo e capa vertical, desktop escuro, teclado e texto ampliado. Cobertura estadual futura identificada como preparação, sem métricas ou arenas inventadas.

### Implementação e aprendizados

A saída precisa ser texto acionável no contexto da conta, inclusive antes de terminar o perfil. O olho fica junto a cada campo e nunca envia o formulário; divergência leva foco à confirmação. A abertura da conta usa títulos diretos, e o guia deixou de competir como uma segunda abertura de campanha. A configuração inicial revela opcionais sob demanda e termina no Início, com primeira arena como próxima ação.

Fotos inteiras pedem contenção, margem e proporção de lista previsível; a curva assimétrica recortava cantos mesmo com contain. Capas com contorno simples e galeria natural preservam o quadro. Revisão em 320/390px e 1280px nos dois temas, teclado e texto ampliado; [evidências](flow-review/README.md). Pesquisa estadual preparada não equivale a cobertura concluída ou fotos licenciadas automaticamente.


## Refino social — revisão e aprendizados · 13/09/2026

Publicação autorizada nesta rodada: conferir no artefato servido os estilos de posts/comentários e rotas de entrada, preservando as evidências de interação já exercitadas com contas de desenvolvimento. A mudança no banco deve restaurar a leitura do mesmo original, sem reintroduzir a arena fictícia nem alterar conteúdo. Registrar a revisão final no recibo do release.

Contorno agora separa publicações; comentários ganham camada própria, avatar e acento lateral. Ações ficam no ••• e autoria ganha contraste. Próprio/alheio também se distingue pelo texto Você, sem depender da cor. Revisados 320/390/1280 px, claro/escuro, 200% de texto, foco, edição/cancelamento e falha com retry. A quantidade de linhas no banco não prova que o usuário ainda vê o conteúdo: importação e mudança de RLS precisam exercitar o mesmo post pelo feed, perfil e link direto. [Capturas e testes](social-refinement-review/README.md).

### Critérios registrados antes da implementação

Histórico do jogador não deve desaparecer quando o catálogo é refinado. Uma arena fictícia retirada não volta à vitrine nem é substituída por um local inventado no post. Preservar autoria, texto, data e audiência, deixando de exibir o vínculo indisponível; segurança continua baseada em admissão, bloqueio, moderação e comunidade privada. Conferir persistência e visibilidade separadamente.

O responsável pediu explicitamente mais borda, camadas e cor: aplicar separação funcional em posts e comentários mesmo onde o guia genérico pede reduzir caixas. Fundo do post, área de comentários e balão devem se distinguir. Nome/identidade vêm antes de metadados; avatar e pequeno acento por pessoa sem atribuir status à cor. Menu ••• com alvos de 44px, abertura real, Escape/click fora e retorno de foco. Editar e excluir somente quando permitido, feedback próximo, sem perda do texto em erro. Manter rótulos de audiência e reduzir ações dispersas.

## Busca de pessoas e comunidades — revisão · 13/09/2026

A lupa do cabeçalho e o campo antes dos filtros dão entrada reconhecível à busca. Explore é o escopo inicial de comunidades; a seleção Minhas comunidades não se confunde com o catálogo todo, e o vazio permite ampliar o escopo sem perder o texto. Removidas sugestões paralelas durante busca de pessoas. Amostra em 390 px/claro, 1280 px/escuro e 320 px/200%: título e link agora quebram em linhas quando necessário e o campo tem um único contorno de foco. Resultado privado mantém condição de entrada e oculta descrição. Falha/retry, descarte de resposta atrasada e demo sem gravações conferidos; Supabase real validado separadamente. Integração preservou os refinamentos da tarefa de arenas: busca nas listas vinculadas somente quando útil, vazio em uma linha e textos compactos.

### Critérios registrados antes da execução

Campo com lupa logo abaixo do título, rótulo acessível e exemplo concreto de nome/@usuário. Comunidades abre o catálogo explorável; o escopo Minhas comunidades permanece explícito. Uma busca não deve exibir sugestões alheias como se fossem resultados, reter resultados antigos durante nova consulta ou exigir limpar filtros invisíveis. Mostrar carregamento, vazio recuperável, erro com nova tentativa e paginação após o filtro. Preservar audiência e condições de entrada, usar componentes e tokens Aura existentes. Atalho de busca reconhecível no cabeçalho; ligação simples entre Pessoas e Comunidades.

## Arenas reais — revisão e aprendizados · 13/09/2026

Fotografia, nome e endereço orientam a leitura; descrição e origem ficam em Sobre e gestão. Quadros preservam a foto completa e a galeria mostra uma por vez. Evitar duas caixas de boas-vindas em um lugar vazio: comunidades e mural agora usam uma linha cada. Comunidade oficial tem descrição curta e uma pergunta que acrescenta conversa. Acompanhar foi confirmado em Meus Picos; gestão depende de aprovação, sem sinalização falsa de parceria. Revisão em 320/390/1280 px, tema escuro nativo e claro com fixture local de CSS. [Evidências e limitações](arena-catalog-review/README.md).

### Refinamento com fotos e menos repetição

Pedido expresso de fotos públicas de todas as arenas verificadas. Escolher imagens da unidade correta, sem recorte adicional na exibição; galeria sob demanda com crédito discreto. Lista em composição compacta, sem repetir descrições. Separar endereço, acompanhar e gestão. Comunidade oficial terá uma chamada de conversa; retirar boas-vindas e manual repetidos do mural. Preservar rótulos de acesso/privacidade e revisar celular/desktop/claro/escuro.

## Arenas reais · critérios antes de implementar · 13/09/2026

A lista conectada deve mostrar lugares reais, nomes e bairros conferidos, sem fotos ilustrativas apresentadas como reais. No perfil da arena, expor endereço, fonte pública e data da consulta; cadastro no diretório não equivale a participação oficial da empresa. Acompanhar salva o vínculo existente no perfil. Responsáveis podem solicitar gestão e, após análise, criar/vincular comunidade. Não inventar porte comparativo, horários, preços, seguidores ou propriedade. Manter estados vazios honestos e distinguir comunidade oficial de grupo de jogadores.

## Perfil com foto — critérios antes de implementar · 13/09/2026

### Fechamento da estabilidade e entrada

Cadastro dispensa confirmação por decisão expressa; informar recuperação indisponível junto à criação da conta e na página de recuperação. Nenhum envio fictício. Corrigido carregamento sem prazo no Auth e na admissão. Amostra no navegador carregou campos e mensagem de recuperação sem erros. A fixture antiga de Auth ignorava a foto obrigatória publicada: adequar o teste ao fluxo real, sem remover a exigência. Capacidade apresentada por requisições/segundo e cenário medido, sem inventar número máximo de usuários. [Relatório](STABILITY_REVIEW.md).

## Estabilidade da beta · critérios de 13/09/2026

Validar que entrada, carregamento, falhas, retomada e ações sociais funcionam sem travar, preservando isolamento de contas e jogos privados. Apresentar capacidade com cenário, volume e latência medidos; não converter um smoke em promessa de disponibilidade. A automação precisa de destino comprovado e deve ficar silenciosa quando saudável. Explicar a dependência real de e-mail sem inventar confirmação, recuperação ou entrada já disponível.


O avatar do cabeçalho deve mostrar a mesma imagem confirmada no perfil, com dimensão reservada e fallback honesto. Configuração inicial apresenta quatro requisitos: foto, nome, usuário e esporte; reconhecer somente foto salva e não um arquivo ainda em recorte. Foto visível e ação clara, sem esconder a escolha num disclosure durante onboarding. Campos opcionais incentivam expressão pessoal sem inventar benefício de engajamento medido. Etapa inicial antecede feed, aviso institucional e tutorial; Conta e direitos permanecem acessíveis. Rascunho resiste a atualizações; identidade nova descarta dados anteriores. Conferir leitura/toque/foco, ambos os temas e altura curta.

# Pico — Deslopify

### Fechamento e aprendizados

Foto aparece em escala de avatar no cabeçalho/lateral e o formulário destaca identidade, esporte e detalhes pessoais opcionais. Quatro requisitos refletem campos preenchidos e foto confirmada; não são uma métrica de engajamento. O nome genérico não conta como apresentação inicial sem edição. Atualizar a foto não encerra o formulário; remover durante edição preserva o rascunho e os outros destinos pedem nova configuração. Conta permanece acessível.

48 checks reais e oito grupos do tutorial passaram; 320 px escuro, 390 px claro e desktop sem overflow. Separar label e select corrigiu o nome acessível que incluía suas opções. A CSP precisa permitir leitura da imagem local até o fim do recorte: abrir o diálogo não basta para validar upload. [Evidências e limites](profile-setup-review/README.md).


## Landing pública — critérios antes de codar · 13/09/2026

A abertura deve comunicar rede social de esportes de areia, pertencimento e cadastro em poucos segundos. Hierarquia editorial, foto contextual e interface demonstrativa; dar forma concreta a pessoas, lugares e conversa. Manteiga/Cacau/Papel e apoio Lavanda, logo original e Syne/Manrope. Uma ação principal: criar conta.

Todas as prévias e fotografias sintéticas recebem identificação; não inventar base de usuários, depoimentos, presença ao vivo ou promessas de funcionalidades. Jogos são privados e compartilhar é separado. Recursos exploráveis por teclado, conteúdo disponível com movimento reduzido, alvos de toque e responsividade. Verificar o conjunto em lote, preservando o cadastro e as alterações de segurança existentes.

## Preparação do beta e privacidade — PLAN · 13/09/2026

Preservar Aura Manteiga e o cadastro simples pelo link, com confirmação de e-mail. Explicar dados, audiência, republicações, direitos e limites com linguagem concreta. A conta deve permitir baixar dados próprios, corrigir e excluir sem expor dados de terceiros ou exigir uma senha nova de quem usa credenciais anteriores. Não inventar responsável, contato, prazo de retenção vigente ou selo de conformidade.

Revisar conta/privacidade e entrada em mobile, teclado e dois temas após ajustes. Segurança deve ser comprovada por autorização, isolamento e comportamento real; mensagens honestas de falha e retomada, sem transformar requisitos técnicos em etapas extras para o jogador. Distinguir teste concorrente controlado, disponibilidade do servidor, entrega de e-mail e validação em aparelho físico.

### Fechamento da revisão de segurança

Download e exclusão usam os controles existentes e confirmação de senha, com erros explícitos; privacidade explica finalidades, republicações, direitos e limites sem inventar contato ou responsável. Conta em 320 px escuro e 390 px claro sem overflow, download real no navegador. Teste de rede revelou que a chegada tardia das preferências remontava a tela e perdia o formulário: a identidade inicial agora mantém a árvore; troca entre contas conhecidas continua isolada. Teste com resposta atrasada preserva diálogo e senha digitada. Regressão do guia em oito layouts, erro de perfil, localStorage indisponível e conta diferente passou. Aprendizado: estado de assistência opcional não deve reiniciar trabalho em andamento.

## Republicações — critérios antes de codar · 13/09/2026

Adicionar “Republicar” junto de curtir/comentar, com ícone Lucide, estado textual e `aria-pressed`; desfazer pela mesma ação. Explicar a audiência antes do envio, especialmente em grupo privado. Acima do autor original, atribuição curta “Nome republicou” com link ao perfil. Não criar cópia visual encaixada, métrica inventada ou novo compositor. O original mantém sua data e autoria.

Preservar alvos de 44px, quebra das ações/arena em 320px, nomes longos, teclado e temas Aura. Confirmar envio antes de anunciar sucesso; falha deve permitir conferir/repetir sem alternância acidental. Demo declara simulação local. Revisar feed/perfil/mural em amostra mobile clara/escura e texto ampliado; testar funcionalmente privacidade, remoção e efeitos sobre seguidores.

### Fechamento de republicações

Atribuição acima do autor e ação com nome persistente, sem contador ou cópia de card. Modal explica perfil/seguidores e restrição privada antes do envio; cancelar e Escape não escrevem, foco retorna ao controle. Sucesso depende da resposta confirmada, clique duplo envia uma vez e desfazer mantém o original.

Texto a 200% revelou mínimos de conteúdo no cabeçalho, compositor e título. Corrigidos com coluna flexível, quebra do texto e linhas de ações; botões podem ocupar linhas próprias sem partir o verbo em largura comum. Revisão final de estilo com fixtures locais, sem repetir a suíte remota a cada ajuste. Temas, 320/390/1280px, alvos de toque e rolagem conferidos. [Capturas e limites](reposts-review/README.md). Não equivale a ensaio em aparelho físico.

## Redesign integral Aura Manteiga — critérios antes de codar · 13/09/2026

Substituir a fundação escura/verde por Papel/Cacau e escuro quente; aplicar logo em contornos e Syne/Manrope sem transformar operação em campanha. Curvas contidas em aberturas e lugares; pessoas, comunidades, publicações e diário com composição própria. Remover caixas, slogans e sombras repetidos. Entrada editorial manteiga constante; estados e controles usam pares semânticos, inclusive borda elevada.

Perfil inicial deve explicar dados necessários/opcionais e progresso sem etapa decorativa. Guia curto, opcional e contextual, com “Mostrar onde” legível, pausa e retomada; aviso oficial continua confirmado no servidor. Rever alvos ausentes, altura curta, foco e ausência de ações sociais automáticas. QA representativo e correções em lote; registrar cobertura e limites em aura-redesign-review.

### Fechamento e aprendizados desta implementação

Entrada manteiga constante, operação em Papel/Cacau ou escuro quente, curvas nas capas e identidade em SVG/Syne. Removidos banner duplicado no conectado, slogans auxiliares, caixas e material translúcido repetido. Início reúne vínculos em um conjunto compacto; perfil tem identidade aberta, dados essenciais e detalhes opcionais distintos. Guia mais curto, com rótulos de ajuda/pausa e as mesmas preferências.

A revisão em lote identificou badge usando borda decorativa como fundo e falta de espaço para navegação ampliada: corrigidos com `accent-soft` e altura real do rodapé. Em altura curta, o guia rola com a página. Aprendizado: área reservada ao rodapé deve acompanhar o texto, e borda funcional elevada não pode herdar o par do fundo comum. Revisão independente: os dois ajustes pedidos (rótulos redundantes e hifenização da navegação) foram resolvidos; `ship` nesse escopo. [Evidências](aura-redesign-review/README.md). Amostra e regressões locais não equivalem a teste com jogadores, instalação física ou nova certificação de Supabase.

## Critério vigente

**Aura Manteiga** é a direção aprovada: editorial de moda jovem, expressivo, premium e refinado. Usar o [manual](brand-exploration/aura-manteiga/MANUAL.md) e o [design system](pico-design-system.md); não recuperar escolhas históricas como orientação atual. O alvo do redesign é o aplicativo inteiro, com composição própria por conteúdo e onboarding assistido que preserve autonomia.

## Skills e redesign — critérios antes da atualização · 13/09/2026

Dar às skills uma referência institucional comum, distinguir marca aprovada de código ainda legado e ligar decisões visuais aos domínios reais. O prompt deve exigir leitura de todo o manual e acesso às referências pertinentes de cada skill, sem copiar miniaturas ou transformar o app em apresentação de marca. Reduzir carga visual e repetição de testes durante a criação; manter proteção de autenticação, audiência, jogos privados e preferências de onboarding. Não inventar estrutura societária, resultados de pesquisa ou funcionalidades.

### Fechamento e aprendizados

Treze skills conectadas ao contexto institucional e aos domínios. Oito referências externas receberam adaptação curta antes do corpo original; cinco skills próprias oferecem contexto, planejamento, desenvolvimento, revisão e redesign. Briefs antigos foram sinalizados como históricos, e o design system separa alvo aprovado de implementação legada. Dados de empresa ausentes continuam explícitos, sem biografia ou números inventados.

O prompt integral agora trata assistência como orientação opcional de interface: perfil inicial, aviso institucional e tutorial têm contratos distintos. Simplificar texto e apresentação não autoriza ocultar audiência, converter progresso em atividade social ou reiniciar preferências dispensadas. Cobertura integral de design não exige matriz exaustiva de testes durante cada ajuste; a regra comum é amostra representativa, correção em lote e verificação proporcional do conjunto final. Formato/referências/procedência e lint/typecheck/build passaram; não houve nova implementação visual a inspecionar nesta rodada.

## Aura Manteiga — fechamento do manual · 13/09/2026

Identidade fechada sobre a escolha Aura + Manteiga, com diferenciação clara entre miniaturas de apresentação e escala real de leitura. Mantidas curvas, contornos e fontes da Aura; complementados pares semânticos, estados, ícones e aplicações. A orientação atual substitui as recomendações históricas de Ritual/Pistache, preservadas como registro de exploração.

Revisão corrigiu a densidade da página de temas, exportação de PNG com dimensão fracionária e fallback tipográfico em documento de origem opaca. Aprendizados: isolar a peça na origem local antes de rasterizar, aguardar/verificar Syne/Manrope e conferir dimensões exatas; bordas funcionais em superfície elevada precisam de par próprio, mesmo quando a borda padrão passa no fundo comum. 50 pares aprovados, 32 páginas revisadas, SVGs preservados e máscara PWA verificada. Não confundir validação dos arquivos com teste do app real. [Manual e limites](brand-exploration/aura-manteiga/README.md).

## Aura Manteiga — critérios de consolidação · 13/09/2026

Preservar a linha escolhida: curvas amplas, assinatura Syne e interface Manrope. Fixar Manteiga/Cacau/Papel/Lavanda e retirar ambiguidades entre recomendação histórica e decisão atual. Manual deve mostrar uso real de marca, hierarquia de cor, contraste, logo em redução, áreas de proteção, tipografia, arte, voz, componentes/estados e todas as telas. Ícone maskable exige margem própria. Prompt de produção deve mapear o CSS atual, preservar privacidade/comportamento e evitar copiar dados ilustrativos ou o tamanho reduzido dos mockups. Exportar PDF legível e verificar as páginas renderizadas.

## Aura — variações de cor conferidas · 13/09/2026

A lavanda original agora pode ser comparada com Pistache, Azul névoa, Rosa mineral, Maré e Manteiga. Preservadas as mesmas fotos, formas, fontes, telas e conteúdo. O pastel define a atmosfera; os tons profundos sustentam texto e ações; apoio permanece pontual, sem introduzir um elemento visual apenas para mostrar outra cor.

Aprendizado: uma comparação apenas cromática precisa congelar também a estrutura e os contornos do logo. O estudo usa o mesmo renderizador de Aura, altera somente tokens de cor e recolore os SVGs preservando os caminhos. 384 combinações/30.156 verificações de estilo sem desvios; 156 pares sólidos de texto aprovados e 60 telefones em cinco larguras/modos sem overflow. Navegação e foco passaram. Pranchas de boas-vindas e perfil inspecionadas. Contraste não equivale a auditoria completa WCAG. [Guia e paletas](brand-exploration/AURA-CORES.md).

## Aura — critérios da variação de cores · 13/09/2026

A preferência do usuário é por Aura. Nesta etapa somente cores podem variar: manter Syne/Manrope, contornos vetoriais, fotografias, raios, espaçamentos, navegação e conteúdo. Comparar seis paletas na mesma tela, com seus papéis de fundo, texto, superfície e ação; manter alternativas claras/escuras. A fotografia continua a mesma, sem filtros ou regeneração. Não reabrir identidade, logo ou layout.

## Três identidades — fechamento · 13/09/2026

Ritual (Bodoni Moda/vinho/areia), Pulso (Bricolage/cobalto/lima) e Aura (Syne/figo/lavanda) foram aplicadas ao mesmo conteúdo em 32 telas e estados, com modos claro e escuro. As pranchas geradas por IA são exploração de atmosfera; SVGs, tokens e HTML são as propostas precisas. Fotografias e dados trazem identificação ilustrativa; nenhuma funcionalidade real é inferida dos mockups.

A revisão encontrou e corrigiu contraste em convites e metadados de Aura, troca indevida do destino Comunidades na navegação e vazamento da tipografia editorial do relatório para os telefones. Aprendizado: isolar CSS de apresentação sem aumentar especificidade dos estilos fora dos mockups; medir paridade de família, tamanho, peso, entrelinha e espaçamento. Os 531 elementos textuais comparados agora preservam o sistema da galeria.

82 pares sólidos de texto aprovados; 960 verificações em cinco larguras sem overflow e PDF de 47 páginas renderizado/inspecionado. O detector sinalizou somente fundo creme na galeria, aceito pela revisão como escolha editorial coerente com o contexto. Revisão independente: ship no escopo das correções pontuadas, não aprovação de uma marca ou certificação WCAG. [Entregáveis e limites](brand-exploration/README.md) · [Parecer](brand-exploration/.impeccable/review/finish-review.md).

## Três identidades — critérios antes de desenvolver · 13/09/2026

As opções devem diferir em conceito, desenho de marca, tipografia, paleta, composição e direção de imagem. Apresentar as mesmas telas e conteúdo nas três opções para comparação justa. Construir uma direção editorial com personalidade e preservar legibilidade, ações, estados e informação de audiência no celular. Mostrar cores exatas, papéis tipográficos, logo reduzido e aplicações claras; distinguir imagens de exploração de arquivos mestres.

Relatório deve cobrir identidade, criação de logo, tipografia, direção de arte e recomendação. Não usar mockups como comprovação de funcionalidade ou atividade real. Identificar conteúdo ilustrativo e fotografias sintéticas. Verificar os resultados renderizados e registrar limites de validação.

## Pesquisa de branding — critérios da rodada

Avaliar skills pela capacidade de construir uma identidade reconhecível para o Pico Social, com direção editorial de moda, jovem, expressiva e refinada. Exigir exploração de alternativas, tipografia, linguagem gráfica, fotografia, aplicações e critérios de revisão. Distinguir um briefing, uma prancha conceitual e arquivos finais utilizáveis.

Usar tokens atuais e capturas versionadas apenas como contexto, sem tratá-las como auditoria do produto publicado. Preservar clareza social, leitura mobile, acessibilidade e veracidade de dados. A curadoria deve apontar defaults estéticos que possam homogeneizar a marca ou conflitar com pt-BR, dark mode e os contratos do Pico.

### Aprendizados da pesquisa

Skills de briefing, produção de pranchas e execução da identidade têm entregas diferentes. Brandkit é apoio à comparação visual; arquivos vetoriais, fontes e cores finais exigem construção e verificação próprias. A `brand-guidelines` da Anthropic aplica a identidade da Anthropic e não atende à criação da marca Pico. Impeccable 4.3.1 inclui engine/launcher e pode envolver hooks; não tratar sua distribuição atual como apenas Markdown.

A direção editorial precisa funcionar com pessoas e ações reais no celular. Regras externas que eliminam sinais de interação ou impõem uma única categoria tipográfica não devem prevalecer sobre o briefing. A próxima rodada de identidade deve reconciliar grafite/areia dos guias históricos com o verde-água do sistema corrente. Comparar três propostas nas mesmas aplicações e distinguir conceito de entrega final. [Evidências e seleção](PICO_BRANDING_SKILLS_RESEARCH.md).

### Revisão final — tutorial guiado

A dica usa o destaque areia e uma ação primária de avanço. “Mostrar onde” recolhe o painel, rola e foca o controle para liberar espaço de exploração no celular. Targets em disclosures fechados precisam verificar o ancestral `details`: Chromium pode manter dimensões de controles invisíveis. A instrução muda ao abrir arena ou comunidade e a busca de Pessoas no demo descreve apenas os filtros que existem nele.

Texto a 200% exigiu quebra da linha de ações e rolagem própria da dica, mantendo avançar/recolher/pausar acessíveis. O painel desaparece sob diálogos nativos; edição de perfil suspende os controles de navegação. Capturas e oito medições passaram, além dos percursos conectado com fixture e demo. Não há resultado de pesquisa com jogadores nem teste em aparelho físico. [Revisão](onboarding-review/README.md).

## Tutorial guiado · 2026-09-12 · critérios antes de codar

Abrir com “O ponto de encontro da areia” e explicar o valor para quem joga, sem empilhar slogans. Guiar pelas telas existentes, com dicas curtas e alvo visível; acompanhar arena é vínculo, não prova de jogo nem presença. Descobrir pessoas por arena respeita filtros e visibilidade atuais. Explicar entrada pendente em comunidades, audiência antes de publicar e diferença entre guardar jogo e compartilhar.

Convite opcional, seis passos, uma ação principal de avanço, voltar, recolher e “Agora não”. Manter navegação e conteúdo utilizáveis; evitar máscara que bloqueie a tela e evitar disputa de foco com editores/diálogos. Tutorial não depende de resultados nem de envio; funciona com catálogo vazio e falha de rede. Reabrir no perfil, manter progresso local por conta e distinguir demo. Conferir 320/390/430/768/1280 px, altura curta, texto 200%, teclado e ausência de envio involuntário.

### Conferência do domínio principal

Versão nova exibiu Pico, a navegação de cinco destinos e conteúdo real após recarga da sessão. Foto/perfil preservados, compositor com audiência/destinos explícitos e “Meus jogos” privado, sem sinais de presença. Início, jogos e arenas sem overflow em 390 px; um registro anterior permanece somente no histórico privado. Não houve criação de dados reais durante a inspeção.

### Verificação integrada hospedada

Contratos reais de jogos e posts confirmados no desenvolvimento; o formato de retorno do save é `{id}`, e a exclusão alheia é idempotente sem efeito. O gate verifica o estado preservado, não deduz sucesso de exclusão pelo HTTP 200. Nenhuma UI precisou mudar após a revisão local. A inspeção do artefato publicado complementa as capturas locais, sem apresentá-las como prova de infraestrutura.

## Publicação integrada — 2026-09-12 · critérios

Publicar o refinamento completo já revisado, preservando navegação, estados e distinção entre registro privado e publicação explícita. Confirmar no artefato hospedado a versão, login, rotas, ausência de fallback demonstrativo e apresentação mobile. Validar direitos no Supabase real de desenvolvimento com dados controlados; smoke do principal sem alterar conteúdo de pessoas reais. Evidência local continua identificada como local, e a entrega remota só será declarada após promoção e resposta do domínio principal.

## Rodada 2026-09-12 — critérios antes de codar

Remover sinais de presença, contadores e urgência territorial. Registro depois do jogo: arena, modalidade e data em composição simples; visível somente ao dono, sem publicação automática. `Meus jogos` é acesso contextual de perfil/arena, sem herdar o botão central de mais. Navegação deve nomear destinos reais. Descoberta conecta interesses e vínculos, sem deduzir disponibilidade de jogos ou posts. Rever feed, arenas, pessoas, comunidades, onboarding, privacidade, instalação e demo; capturas anteriores são históricas. Validar 320/390/430 px e estados vazio, erro e sucesso; distinguir fixture local de Supabase hospedado e de aparelho físico.

### Fechamento visual do pós-jogo

Retirados contadores, bolinhas, atividade de chegada e linguagem de presença. “Meus jogos” usa linhas com arena/modalidade/data e privacidade explícita; a ação vem do perfil ou da arena. Erros preservam os campos e a confirmação aparece após retorno da gravação. A barra abre Arenas e mantém o rótulo curto Turmas, com Perfil ativo no histórico. O formulário de 320 px permite rolar até salvar sem cobrir a ação.

Capturas atuais e limites em [post-game/README.md](visual-review/post-game/README.md). O conteúdo antes do fold varia conforme os avisos de instalação/versão; não é evidência de teclado físico. O redesign amplo e compartilhamento estruturado pertencem à tarefa integradora.

> Estado final do Ciclo 9: PRONTO PARA REVISÃO INTERNA — NÃO LIBERADO. Preview `e891dca1e741`, 19 migrations em dev/beta e smoke 67/67. [URL, versão e evidências atuais](INTERNAL_REVIEW.md). Os registros abaixo preservam a sequência de auditoria, plano e execução.


## Ciclo 9 — critérios antes da implementação

Preservar grafite, superfícies escuras, texto legível, acento verde-água e navegação enxuta. Comunidades aparecem como grupos de pessoas, arenas como locais; gestão contextual não vira aba principal de todos. Composer explicita audiência, marcação de local e distribuição. Entrada pendente não parece participação aprovada. Recorte confirma exatamente os pixels enviados; cancelar preserva a foto anterior. Sem métricas fictícias, sucesso parcial oculto, jargão de infraestrutura na jornada ou promessa de lançamento. Revisar 320/390/430 px, foco, teclado, zoom acessível, safe areas e reduced motion. Testes emulados não serão chamados de aparelhos reais.

# Pico — Deslopify

## Ciclo 8 · critérios antes da implementação

Preservar grafite, verde-água, navegação e layout social. Foto opcional no compositor e avatar editável no perfil; não inventar retratos. Ações de segurança ficam em detalhes do conteúdo/perfil e em Privacidade e conta. Explicar o efeito do bloqueio, manter desbloqueio acessível e confirmar exclusão definitiva com senha. Progresso e falha de upload devem manter o texto; falha de gravação não mostra sucesso. Nenhum dado pessoal em cache offline. Revisar 320/390 px, alvos de toque, labels, foco, estados vazios e troca de sessão na versão publicada.

## Ciclo 8 · aprendizado e verificação

Foto opcional ficou no compositor e avatar no perfil. Segurança aparece em opções do conteúdo/perfil e em Privacidade e conta; diálogo explica o efeito antes da exclusão. Preservado o layout, sem redesign. Upload e publicação mostraram progresso e confirmação real no navegador; avatar e foto carregaram após recarga. Perfil/feed em 390 px e conta em 320 px sem overflow. Diálogo nativo manteve foco, Escape e inputs de 16 px. Logout entre abas e troca de identidade descartaram os dados anteriores.

O refresh por foco preserva formulários; mudanças de identidade são tratadas por invalidação e navegação completa. Recuperação externa e aparelhos físicos continuam explicitamente pendentes. A página de privacidade comunica controles existentes sem inventar um responsável ou prazo de resposta.

## Integração hospedada · critérios antes da execução

Preservar a interface e o escopo dos Cycles 0.5–7. Com configuração real, todas as telas devem mostrar apenas leituras confirmadas, estados vazios ou erros recuperáveis. Nenhuma falha de Auth/PostgREST pode revelar o demo. Arenas fictícias persistidas continuam identificadas como demonstração; usuários descartáveis de validação devem ser removidos ao terminar. Confirmar sessão, recarga, callback e troca de conta sem expor tokens, dados anteriores ou mensagens internas do banco.

## Integração hospedada · aprendizado

A interface existente funcionou com dados reais sem redesign. Perfil permanece após recarga; check-in recebe prazo do banco; publicação, like e comentário só confirmam após persistência. Feed vazio e ausência de outros jogadores orientam sem inventar atividade. Em 390px, feed conectado sem overflow; arenas seed seguem rotuladas Demo e contas não recebem foto fictícia. Os detalhes de CLI, RLS e plano SMTP ficaram na documentação técnica.

As seções de Cycles 0.5–7 abaixo preservam o histórico anterior à validação hospedada.

## Cycle 3 — Real auth and profile · antes de implementar

Uma ação principal: completar ou salvar perfil. Labels visíveis, formulário em coluna no celular, erro junto ao envio, nenhum retrato fictício em conta real. Confirmação somente após resposta do banco.

## Cycle 2 · critérios antes da implementação

Comunicar origem com texto curto, sem transformar a tela em painel técnico. “Consultando…” antes de sucesso; “Dados conectados” depois; arena is_demo continua “Arena de demonstração”. Sem contagens inventadas, retrato de pessoa fictícia ou botão de ação local em tela de dados reais. Loading com estrutura reservada e reduced motion; erro com retry; vazio com orientação útil; perfil sem sessão leva ao login. Preservar carvão/verde-água e cinco destinos móveis.

## Cycle 0.5 · direção antes da implementação

Preto #07080A e carvão #111317 predominam. Champagne #C8A96A fica na assinatura e em pequenos detalhes. Verde-água #4DE1C1 identifica ação e presença; curtidas usam esse mesmo caminho. Eliminar amarelo de botões, grandes fundos, navegação e estados selecionados. Cards neutros, texto #F7F3EA, metadata #9B9B95, contraste, respiro e transições discretas. Sem novas funções. Preservar leitura de 16px, toque de 44px, foco visível, safe areas e reduced motion. Fotos contextualizam a areia sem colorir toda a interface.

## Rodada 2 · critérios registrados antes da UI

A auditoria encontrou uma landing bem acabada, porém distante de um aplicativo social: o slogan ocupa mais espaço que pessoas e não há ação social utilizável.

## Direção obrigatória

- Abrir no feed e deixar uma pessoa começar a usar o produto sem atravessar um hero.
- Mostrar quem joga, onde joga e como encontrar a turma.
- Fazer check-in ser um comportamento central com estado, expiração e saída.
- Evitar cara de dashboard, SaaS, template e landing institucional.
- Base mobile 390px; desktop amplia a experiência existente.
- Paleta contida, sem emojis decorativos, excesso de bordas ou gradientes.
- Pessoas, contexto e conteúdo diferenciam os cards.
- Texto brasileiro: “Bora jogar?”, “Na areia”, “Sua turma”, “Conectar”.
- Dados fictícios identificados em todas as telas sociais.
- Nenhum botão sem efeito, filtro decorativo, contagem que não acompanha a ação ou link quebrado.
- Feed, busca, check-in e perfil têm estados vazios e feedback.
- Inputs com 16px, labels e mensagens; foco visível; reduced motion.
- Bottom navigation com área de toque confortável, active state e safe area.
- Nenhum conteúdo útil fica debaixo da barra inferior.
- Não usar fotos inventadas como prova de uma arena real; são ilustrações dos dados de demonstração.

## Critérios de revisão após implementar

1. Em cada tela é possível identificar uma ação útil sem ler um parágrafo.
2. Busca e filtros realmente mudam o resultado.
3. Curtir, conectar e seguir são reversíveis; o estado acompanha a navegação.
4. Um check-in iniciado aparece no feed/perfil e pode ser encerrado.
5. Perfil próprio e outro jogador têm ações diferentes.
6. Publicação e comentário exigem conteúdo válido e retornam feedback.
7. Nenhuma parte do demo tenta usar Supabase sem configuração.
8. Fotos, fontes, ícones, espaçamentos e estados pertencem ao mesmo sistema.
9. Texto continua legível em telas estreitas; overflow horizontal apenas em listas intencionais.
10. Modal tem foco, Escape, fechamento e rolagem acessíveis.

## Aprendizados da rodada

- O feed como entrada torna pessoas, presença e contexto acessíveis imediatamente; a landing anterior deixou de ser o caminho principal.
- Retratos em vez de iniciais diferenciam os jogadores sem adicionar rótulos ou informação desnecessária.
- Cards de post, arena, jogador e check-in têm composições próprias; o sistema mantém a mesma paleta e ritmo.
- O check-in é uma ação com estado compartilhado, substituição, prazo e saída. Sua presença repercute em feed, arena e perfil.
- Acompanhamento e conexão precisam alterar labels e listas de modo consistente; contagens ilustrativas estão separadas das ações locais.
- Texto técnico ficou na documentação. O produto só comunica o limite relevante: pessoas fictícias e ações nesta sessão.
- Fonte mínima de metadata revisada para 12px, corpo/inputs 16px, chips com rolagem intencional e safe area na barra inferior.
- Dialog nativo cuida de foco/Escape; o clique no backdrop foi delimitado para não fechar ao tocar o padding interno.
- O contexto de arena pré-seleciona o formulário de check-in; modalidade muda junto com a arena.
- Os testes de regras e HTTP passaram. Eles não comprovam acabamento visual em 390px, foco real, zoom ou instalação; esses cenários ainda requerem inspeção de navegador/dispositivo.

Revisão final em código: sem reserva, pagamento, ranking, botão social vazio ou tentativa de usar banco não configurado. O estado de demo é explícito. Evitar ampliar a quantidade de ações até validar essa jornada com jogadores reais.

## Cycle 0.5 · aprendizado e fechamento

Separar ação e contexto reduziu a dominância de areia: champagne na marca, verde-água no gesto social e branco na seleção de conteúdo. Fundos de check-in e cards laterais agora são carvão. Inspeção em navegador 390×844 cobriu seis jornadas sem overflow horizontal; capturas de feed/check-in revisadas. Foco, safe areas, alvos de 44px e reduced motion preservados. Lint/typecheck/build aprovados.

## Cycle 1 · critérios antes da implementação

Sem alterações visuais. A existência de migrations não autoriza remover o aviso de demonstração. Seeds têm is_demo e descrição fictícia; nenhum número de atividade inventado entra no banco. Separar catálogo real (esportes) de arenas ilustrativas. Não usar fotos de demonstração como avatar padrão de contas reais; perfis futuros devem assumir ausência de retrato.

## Cycle 1 · aprendizado e fechamento

Separar is_demo da persistência é necessário: uma arena fictícia pode estar salva no banco e ainda requer rótulo. O trigger usa avatar ausente e disponibilidade falsa para contas novas, sem atribuir retrato ou presença inventados. A fundação não altera os avisos do frontend. SQL/RLS local validado não equivale a produto social persistente; a integração começa no Cycle 2.

## Cycle 2 · aprendizados e fechamento

Origem e autenticidade são informações diferentes: “Dados conectados” confirma uma leitura bem-sucedida; “Arena de demonstração” continua visível quando is_demo é verdadeiro. Sem consultas bem-sucedidas, só loading/erro/sessão. O header conectado usa ícone neutro e a lateral omite atividade inventada. Não mostrar números de comunidade ou pessoas sem origem real. Fotos de demo ficam restritas às arenas fictícias. Campos longos podem vir do banco: nomes/descrições/username receberam quebra de linha. Navegador 390×844 confirmou catálogo, busca, detalhe e perfil sem overflow; estados vazio/erro/retry/sessão foram exercitados. O acabamento foi verificado com fixture local; não implica prontidão do backend hospedado.


## Cycle 3 · resultado

Cycle 3 concluído: onboarding e edição atômica por save_profile, identidade verificada, autenticação retorna ao perfil, dados descartados após troca de sessão. 32 testes passaram; lint/typecheck/build passaram. Corrigidos parâmetro TS incompatível com strip-only e tipos gerados duplicados em .next. Auth/e-mail/refresh hospedados seguem pendentes. Próximo: Cycle 4, start_checkin/end_checkin e presença com prazo.


## Cycle 4 · AUDIT / PLAN

Check-ins atuais são demo e a tabela nega toda escrita direta. Implementar RPCs start_checkin(arena_id,sport_id) e end_checkin() com auth.uid(), lock por perfil, arena pública/modalidade válidas e prazo de duas horas. Integrar formulário e presença com atualização periódica; preservar demo. Aceite: substituição atômica, saída própria, prazo do servidor, rejeição de autoria client e arena inválida. UI mostra prazo, consentimento e saída visível; nenhum tracking. Verificar SQL, lint, typecheck e build.


## Cycle 4 · resultado

Cycle 4 implementado: start_checkin/end_checkin com auth.uid(), locks por jogador, arena pública e modalidade válidas; expiração em 2h; substituição e saída própria. /checkin usa presença real, atualização periódica e demo explícito. 36 testes passaram; lint/typecheck/build passaram. Tipos duplicados gerados pelo ambiente voltaram a aparecer: tsconfig exclui somente cópias com espaço no nome dentro de .next. Testes PGlite cobrem transações/duas identidades, mas não concorrência de múltiplas conexões de Postgres hospedado. Próximo: Cycle 5, feed social.


## Cycle 5 · AUDIT / PLAN

Feed atual é demo; schema já protege autoria e visibilidade de posts/likes/comentários. Integrar feed paginado, publicação contextualizada por arena/esporte, curtir/descurtir e comentários paginados. Leituras com contagens no banco sem carregar listas ilimitadas. Aceite: autoria derivada da sessão, sem otimismos falsos, texto preservado em erro, vazio convida ao primeiro post, RLS continua protegendo ações de outras contas. Testar SQL/validação e lint/typecheck/build.


## Cycle 5 · resultado

Cycle 5 concluído: feed e mural da arena com posts persistidos, curtidas reversíveis, comentários e paginação de 20 itens. Escritas derivam autoria de auth.uid(), validação no servidor e RLS; contagens pelo banco. Atualização após mutation preserva formulário/comentário aberto; troca de conta descarta dados anteriores. 40 testes, lint, typecheck e build passaram. Upload de fotos não implementado; Auth/PostgREST hospedados pendentes. Próximo: Cycle 6, conexões e descoberta.


## Cycle 6 · AUDIT / PLAN

Descoberta e perfis alheios ainda são demo. Criar conexões unilaterais privadas do seguidor, sem auto-conexão; descoberta paginada de perfis completos por esporte/nível, arena (vínculo ou presença ativa) e check-in ativo nas últimas duas horas. Integrar perfil por username e links do feed/presença, sem e-mail. Sem grupos/comunidades novas. Aceite: RLS de autoria, identidade verificada, filtros aplicados no banco antes da paginação, ausência de falso jogador em ambiente conectado. Testes SQL/SDK, lint/typecheck/build.


## Cycle 6 · resultado

Cycle 6 concluído: connections com RLS privada do seguidor, sem auto-conexão; descoberta paginada por arena/esporte/nível/presença ativa; perfis por username e links reais no feed/check-in. Apenas perfis com onboarding e esporte entram na descoberta; nenhuma comunidade nova. 43 testes, lint, typecheck e build passaram. Próximo: Cycle 7, jornada completa no navegador, revisão mobile/erros e checklist beta. Integração hospedada ainda pendente.


## Cycle 7 · AUDIT / PLAN

Núcleo social conectado está implementado em todos os destinos, com 43 testes; ainda falta exercer a jornada integrada no navegador e revisar estados/responsividade. Expandir fixture local de transporte para Auth simulado e SQL real das migrations, testar cadastro→onboarding→arena→check-in→post→curtida/comentário→descoberta→conexão→logout. Revisar 390px/desktop, expiração, loading sem apagar rascunho, autenticação inválida e erros sem fallback oculto. Atualizar README/schema/plano/checklist beta com evidência e limite explícito: não equivale a validar Supabase hospedado, e-mail, JWT real, concorrência multi-conexão ou instalação em aparelho.


## Cycle 7 · VERIFY / DOCUMENT / NEXT

Cycle 7 concluído: jornada integrada no navegador (SQL/PGlite real, Auth/REST simulado) de cadastro até logout, incluindo onboarding, arena, check-in, post, curtir/descurtir, comentário, descoberta e conectar/desconectar. Conflito de username não grava parcialmente; falha de publicação mantém rascunho; retry não troca para demo. Formulário de arena pré-seleciona o contexto, perfil editável não repete a identidade, avisos de curtida/comentário ficam discretos, rascunho é separado por conta e presenças expiradas saem da descoberta.

Verificação visual: 390×844 e desktop 1280; cinco destinos em 320px sem overflow horizontal, um h1 por tela e inputs observados a 16px. 43 testes automatizados e 39 verificações HTTP integradas; lint/typecheck/build aprovados. A fixture serializa o Postgres descartável e não implementa segurança de Auth real. Isso não comprova e-mail, JWT, refresh hospedado, concorrência multi-conexão nem aparelhos físicos.

Ainda demo: todas as jornadas quando falta configuração; seeds continuam fictícios mesmo no banco conectado. Limites conectados: sem upload, acompanhamento de arenas na UI, edição/exclusão de posts/comentários na UI, recuperação de senha, bloqueios/moderação ou service worker. README e BETA_CHECKLIST.md documentam o que falta antes do beta hospedado.

Próximo avanço: validar o ambiente Supabase de desenvolvimento com duas contas reais e executar os itens pendentes do checklist beta. Prompt: “Execute a validação hospedada do BETA_CHECKLIST.md com o projeto de desenvolvimento configurado, mantenha o escopo dos Cycles 0.5–7 e registre as evidências.”


## Ciclo 9.7

9.7: avatar circular com saída quadrada; capa 3:1; posts original/1:1/4:5/16:9. Zoom por toque/teclado/slider e rotação. Cancelamento/falha preserva referência. HEIC exige exportação explícita; sem promessa de suporte. Modal respeita cancelamento durante envio.


9.8: explicar qual convite é aceito e qual conta está em uso; não perder destino ao entrar. E-mail aberto em outro contexto pede confirmação visível, sem consumir por GET.


## Ciclo 9.8

9.8: abrir link não consome convite, entrar não perde destino. Recuperação esclarece que navegador e PWA têm sessões diferentes. Sem declarar recebimento de e-mail sem caixa verificada.


9.9: instalação contextual, beta identificado, instruções honestas para iOS/navegadores internos. Atualizar só por ação consciente; safe areas e toques mínimos. Dispositivos físicos permanecem distintos de emulação.


## Ciclo 9.9

9.9: beta interno identificado, link de instalação dispensável, aviso de rede sem descartar rascunho. Atualização manual explica perda de edição não salva. Sessão revalidada ao foreground; troca de identidade descarta a árvore. Sem SW; nenhuma evidência física presumida.


9.10: separar examinar denúncia, ocultar conteúdo e suspender acesso. A interface descreve efeitos e pede confirmação. Administração de grupos mostra cadastro mínimo e custódia, sem abrir conteúdos privados.


## Ciclo 9.10

9.10 aprendizado: testar pela interface foi necessário para detectar o tipo dos botões. Novo contrato automatizado exige submit explícito. Perfil preserva confirmação de foto e edição em falha de refresh. 320/390/430 px sem overflow nas telas verificadas; fotos e diálogos com ações acessíveis. Sem afirmação de aparelho físico.

## Ciclo 9.11 — PLAN

Verificar nomes acessíveis de campos, feedback após salvar, ações de moderação e custódia e descarte de sessão. Documentação deve distinguir prova remota, emulação e pendências reais; nenhum texto de liberação externa.

9.11 VERIFY: gestão autorizada, negação clara ao membro, histórico recente, denúncia com efeito e custódia foram exercitados na interface. Usar nomes acessíveis de controles nos testes evita depender do texto interno das opções. Nenhuma alteração visual adicional necessária após a regressão; README e guias deixam explícitos demo, beta privado e limites da emulação.

9.11 entrega: login, perfil recarregado e feed foram exercitados no Preview real em 390px. Identificação de acesso por aprovação e nenhuma promessa de disponibilidade offline. Registros físicos/SMTP separados dos resultados remotos.

## Proteção do GitHub — PLAN

Explicar separadamente: execução da CI, exigência de CI para merge e bloqueio de alteração destrutiva da branch. Mostrar regras e estado efetivo, incluindo eventual reautenticação ou limitação de plano do GitHub, sem declarar proteção antes de validar a aplicação remota.

VERIFY parcial: a falha histórica foi atribuída à dependência de ripgrep no teste, já corrigida. A diferença entre branches preserva a revisão interna. A configuração de proteção permanece explicitamente pendente de autenticação; preencher o formulário não comprova enforcement. Nenhuma mudança visual ou funcional no app.

CONCLUÍDO: confirmação de identidade feita pelo responsável; salvamento e enforcement remoto comprovados. README e diagnóstico substituem a pendência pelo estado ativo, com IDs e links dos rulesets. Nenhum teste destrutivo foi usado para provar proteção; papéis e exceções não foram concedidos a terceiros.

## Unificação no ambiente principal — PLAN

Usar um endereço principal e o nome Pico nas telas e na instalação. Retirar a linguagem de revisão interna e comandos específicos dessa separação; conservar mensagens precisas sobre login e aprovação. Distinguir a unificação de publicação da autorização de dados: preservar conta, privacidade e papéis. O estado corrente dos documentos deve substituir a restrição anterior conforme a correção expressa do responsável.

VERIFY implementação: manifesto principal usa Pico; instalação, privacidade e acesso explicam aprovação sem rotular o app como revisão interna. O host antigo encaminha ao principal preservando caminho e query. README e guias correntes refletem a orientação corrigida; o relatório de QA antigo passa a ser identificado como histórico. Nenhum papel, regra de acesso ou dado de usuário foi alterado.


## Refino visual completo — PLAN (2026-09-09)

Refinar a main existente, começando por Criar comunidade: fonte nativa única, escala relativa, geometria e espaçamentos consistentes, superfícies carvão estáveis e vidro escuro nas elevações, verde-água reservado a ações/seleção/foco. Consolidar campos, botões, diálogos e seleções acessíveis e aplicar a acesso, feed, perfil, comunidades, descoberta, arenas, conta e gestão. Preservar todos os campos, audiência, integrações e permissões; nenhuma mudança de infraestrutura, dependências ou SQL. Registrar antes/depois com conteúdo e viewport comparáveis, validar 320/390/430/tablet/desktop e fluxos em fixtures locais, executar lint/types/testes/build. Prints originais do Yankee e do formulário não vieram com o texto; a captura da aplicação atual será a referência de diagnóstico. Trabalhar em main e respeitar sua proteção por PR usando o fluxo existente, sem criar branch ou force-push.

## Refino visual completo — VERIFY e aprendizados

O conteúdo do feed aparece antes do formulário extenso: um acionador discreto abre os mesmos campos e preserva o rascunho. Comunidades agrupam informações, acesso e modalidades; os chips mantêm checkboxes e marca de seleção. Vidro fica em elevações, cartões de leitura permanecem estáveis. O contorno do diálogo é neutro; o foco verde-água permanece acessível. O cinza secundário foi clareado após medir o pior caso de vidro sobre branco.

Inspeção real encontrou e corrigiu foco escapando com Shift+Tab e Escape de recorte fechando também a publicação. O retorno ao arquivo e o rascunho foram exercitados no navegador. Perfil/HEIC recebidos da main foram preservados e harmonizados. Capturas de viewport substituem a captura longa com costura defeituosa da ferramenta; não houve edição de imagens. 50 verificações de largura e checagem de altura reduzida passaram. Testes são emulados e usam APIs simuladas; não representam aparelho físico, autenticação ou persistência remota. Prints originais das referências não estavam disponíveis.

## Jornada integrada e jogos passados — PLAN (2026-09-12)

A decisão atual retira presença ao vivo por segurança e substitui as orientações históricas de check-in central. Implementar o conjunto completo localmente: início contextual previsível, navegação por pessoas/comunidades/arenas/perfil, vínculos e próximas ações, composições distintas por entidade e registros retrospectivos privados com compartilhamento opcional separado. Nomes de trabalho: Joguei aqui / Meus jogos; validar com jogadores.

Comparar três organizações e duas direções visuais em JOURNEY_REFINEMENT.md. Mapear e retirar UI, filtros, timers, comandos e exposição SQL de presença; preservar dados legados em leitura estritamente própria. Criar migration aditiva para jogos com data civil passada, autoria, RLS, versionamento e idempotência; nenhum dado real será migrado nesta rodada. Reutilizar publicação canônica com audiência explícita, distinguindo data do jogo da publicação. Capturar baseline atual e resultado; testar banco descartável com duas identidades, APIs/contratos, demo e UI emulada em 320/390/430/tablet/desktop. Executar lint/typecheck/build e testes; atualizar documentos e fazer commit local. Sem push, merge, deploy, credenciais ou mutation remota.

## Jornada integrada e jogos passados — VERIFY

Conjunto integrado localmente à main: início contextual previsível; navegação fixa; pessoas em linhas abertas, grupos por propósito, arenas por lugar e jogos em cronologia; registros privados com compartilhamento separado e canônico. Legado fechado socialmente e consultável só pelo próprio autor, sem conversão. Escolhas de audiência, datas da experiência/publicação, pedidos pendentes e erros têm consequências distintas e explícitas.

81 testes, lint, typecheck e builds conectado/demo passaram. UI local: criação/edição de comunidade, perfil, vínculo unilateral, jogo com falha/retry/correção/exclusão, compartilhamento idempotente, acesso privado pendente, erros/vazios e jornada demo. 25 medições em cinco larguras, nove auxiliares, seis com texto a 200% e diálogo em altura reduzida. [Evidências](journey-review/README.md). Nenhum resultado remoto, físico ou de pesquisa foi presumido. Duas migrations ainda precisam de aplicação remota autorizada; sem push/deploy nesta rodada.

Aprendizados: reduzir controles antes de reduzir texto ajuda a mostrar pessoas no primeiro trecho da tela. Uma arena pede imagem/contexto, uma comunidade pede propósito/condições; o mesmo card não serve a todas. A repetição após resposta perdida é parte da jornada e exige identidade estável, além de mensagem clara. Texto ampliado expôs rótulos colados; a navegação recebeu espaço próprio e hifenização, preservando destinos e foco. Dados de fixture e falhas da ferramenta de captura não são evidência de infraestrutura nem métricas de usabilidade.
# Comunidade oficial e acesso imediato — PLAN (2026-09-13)

Uma confirmação breve após concluir o perfil: “Você entrou na comunidade oficial do Pico”. Ação principal para conhecer a comunidade, alternativa de dispensar; não bloquear o tutorial nem repetir a cada acesso. Explicar antes de salvar que todas as modalidades compartilham esse espaço e que a pessoa pode sair. Publicações de boas-vindas com autoria institucional clara, sem inventar participantes, mensagens pessoais, curtidas ou atividade. Preservar controles de audiência e pessoas bloqueadas. Revisar login/cadastro sem linguagem de convite obrigatório ou aprovação; testar 320/390/430 px e erros reais de autenticação em ambiente isolado.


## Comunidade oficial e acesso imediato — VERIFY

O aviso representa participação real, explica por que aconteceu e oferece conhecer a comunidade ou dispensar. Inicialmente ele ficava acima da dobra após o formulário longo; a inspeção corrigiu a rolagem/foco para anunciar a inclusão no ponto certo. A identidade institucional e três mensagens editoriais evitam um mural sem contexto, sem simular atividade ou autoria pessoal. A opção de sair permanece disponível inclusive para operadores. Microcopy de acesso por aprovação foi retirada da navegação, cadastro, instalação e audiência geral; aprovação de comunidades privadas continua explícita.

11 verificações Chromium com backend real e cinco medidas (320/390/430/768 e 200%) aprovadas. Sem overflow e sem erros de execução. Nome/participante nas capturas são de uma identidade controlada removida depois. Não há evidência de entrega de e-mail, dispositivo físico ou pesquisa com jogadores. [Capturas](official-review/README.md). Aprendizado: uma confirmação correta no servidor também precisa aparecer no campo de visão depois de concluir uma tarefa longa.

## Publicação do tutorial e comunidade — PLAN

Conferir em produção identidade oficial, textos de cadastro sem aprovação, aviso confirmado e tutorial no contexto real. Não simular conta/pessoas ou enviar mensagens externas. Verificar 390 px, links, headers, versão e preservação de sessão/dados quando houver sessão autorizada disponível. Distinguir publicação concluída de entrega SMTP e validação física, que continuam pendentes.

### VERIFY da preparação de publicação

Nenhuma nova mudança visual nesta etapa. Mantidos tutorial opcional, confirmação real de entrada e textos de audiência. Verificações locais passaram; confirmação de interface no domínio final integra o smoke de promoção. Não usar a existência da build como evidência de entrega de e-mail ou teste físico. Recibo final em .vercel e versão servida permitem conferir a entrega sem deixar documentação comitada depois do deploy.
## Menções nas comunidades — revisão · 14/09/2026

O compositor mantém publicação como ação principal e expõe menções somente após escolher uma comunidade. `@todos` é escolha explícita, sem seleção silenciosa de destinatários; a busca identifica nome e @usuário, e a prévia informa quem receberá aviso interno. A publicação mostra as marcações no final do texto. No inbox, entrada, marcação individual e `@todos` têm frases distintas e link ao post, preservando data e estado de leitura. Não há atividade fabricada na demonstração.

Revisão no navegador conectado com identidades controladas: compositor em 390 px claro, 320 px escuro e desktop 1280 px, sem rolagem horizontal; escolha individual e prévia visíveis, notificação abre a publicação. O diálogo conserva rolagem e alvos de 44 px. Aprendizado: incluir a prévia de audiência perto da marcação evita confundir quem pode ver o post com quem será avisado. Conteúdo da lista e do compositor permanece em fluxo vertical no celular; nenhuma nova tela ou etapa obrigatória foi criada.
