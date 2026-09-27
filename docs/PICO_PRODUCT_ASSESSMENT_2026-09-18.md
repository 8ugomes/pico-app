# Pico: avaliação de produto e prioridades para chegar às lojas

Avaliação de 18/09/2026, preparada antes do próximo prompt de desenvolvimento completo. O Pico já tem uma base social aproveitável. O avanço decisivo é conectar seus recursos numa experiência contínua: encontrar pessoas relevantes, criar uma relação, conversar, receber uma resposta, voltar e trazer a turma. Publicar nas lojas amplia a distribuição; a consistência desse ciclo determina se as pessoas terão motivo para continuar usando o app.

O [diagnóstico técnico da rodada](PICO_DEVELOPMENT_REVIEW_2026-09-18.md) registra commits, CI, versão publicada, implementação local, operação e preparação técnica das lojas. Este documento trata de valor, experiência, prioridades e critérios de aceite, sem repetir o recibo técnico.

## Base da avaliação e limites

| Estado | O que significa nesta avaliação |
| --- | --- |
| Publicado | Comportamento identificado na versão pública `bda869824b42`, funcionalmente equivalente à main auditada `e3a6492`. A confirmação de versão e saúde está no diagnóstico técnico. |
| Preparado | Código e contratos presentes na rodada local de 18/09, ainda sem ativação ou publicação comprovada. Mensagens diretas e push pertencem a esse estado. |
| Oportunidade | Proposta de melhoria baseada na jornada pretendida. Não significa que usuários reais já demonstraram a necessidade nem que a mudança já foi autorizada individualmente. |

Não foram lidos posts, conversas ou outros conteúdos privados reais dos usuários. A revisão do conteúdo do aplicativo se limita às superfícies públicas, código, documentos e estados de demonstração identificados. Não foi localizada instrumentação de produto que comprove ativação, retenção, base ativa ou aquisição; um sistema externo não acessado pode existir. **Não há analytics nem tração comprovados nesta avaliação**, e nenhum número histórico de teste ou inventário equivale a usuários ativos.

A identidade vigente é Aura Manteiga, com os ativos, cores e fontes já aprovados. Jogos continuam retrospectivos e privados; compartilhar é outra ação, com audiência explícita. Vínculo com uma arena não informa presença ou disponibilidade. Essas decisões orientam todas as oportunidades abaixo.

## Como interpretar a prioridade

- **P0:** necessário para cumprir a promessa da próxima versão ou operar o lançamento com confiança. Um P0 de loja é exigido antes de distribuir o binário, não antes de cada melhoria da PWA.
- **P1:** melhoria de alto impacto para qualidade, retorno e divulgação mais ampla. A ordem dentro do grupo depende dos gargalos medidos na primeira coorte.
- **P2:** hipótese de expansão que deve disputar prioridade com problemas observados, sem virar requisito automático de lançamento.

Os critérios são comportamentos verificáveis e medições propostas. Metas numéricas de conversão, retenção, capacidade e prazo devem partir de uma linha de base real, não de benchmarks inventados para o Pico.

## 18 frentes de evolução

### 1. Valor social e densidade local

**Publicado:** catálogo de arenas, perfis, comunidades, acompanhamento e afinidades por vínculos visíveis. O feed vazio orienta acompanhar pessoas. **Lacuna constatada:** não existe evidência, nesta revisão, de que um recém-chegado encontre uma turma ativa e receba resposta. Um catálogo amplo não comprova densidade social.

**P0 de produto:** escolher uma primeira coorte concentrada em arenas e grupos reais. Conduzir a entrada para modalidade, lugar e pessoas relevantes, com escolhas explícitas. **P1:** sugestões explicáveis por arena, comunidade ou esporte; melhorar os caminhos vazios conforme o que faltar naquele contexto.

**Aceite:** um novo jogador encontra alguém relevante, entende a ligação e inicia uma interação que recebe resposta. Medir o percurso e o tempo até esse resultado. Cadastro, conclusão do tutorial e entrada automática na comunidade oficial não contam como interação recíproca.

### 2. Mensagens diretas confiáveis

**Publicado:** sem DMs. **Preparado:** mensagens de texto entre duas pessoas, acompanhamento mútuo, histórico paginado, indicador de não lidas, reconhecimento explícito de leitura, idempotência e bloqueios. O funcionamento com serviços e aparelhos reais ainda precisa de evidência própria.

**P0:** concluir validação, ativação e operação; garantir ordenação, reconexão, paginação, envio com retry sem duplicação e erro recuperável. Preservar rascunho no contexto permitido e descartá-lo ao trocar de identidade. Estados de envio devem comunicar somente o que foi comprovado.

**Aceite:** duas contas autorizadas conversam e retomam o histórico; uma terceira não acessa a conversa. Uma resposta ambígua do servidor não duplica o envio. Bloqueio e suspensão produzem o efeito previsto. “Enviada”, “entregue” e “lida” não são usados como sinônimos.

### 3. Caminho para iniciar uma relação

**Publicado:** acompanhamento unilateral; as notificações existentes não incluem novo seguidor. **Preparado:** a DM exige acompanhamento mútuo. **Risco de produto:** alguém encontra uma pessoa da arena e a acompanha, mas a outra pode não perceber a intenção e nunca acompanhar de volta. Isso interrompe o objetivo de conhecer quem joga no mesmo lugar.

**P0:** definir o ciclo de conexão e mostrar o próximo passo quando não for possível enviar. Tornar a intenção perceptível com controles contra abuso. **P1, hipótese a validar:** solicitação de conversa que possa ser aceita, recusada ou ignorada, separada da caixa principal. Não abrir DMs irrestritas como consequência automática.

**Aceite:** ambas as pessoas entendem a relação atual e podem decidir como prosseguir. A primeira não precisa adivinhar o impedimento; a segunda pode ignorar ou bloquear. Medir tentativas bloqueadas por falta de reciprocidade e conversão para conversa consentida.

### 4. Notificações que trazem retorno útil

**Publicado:** caixa de entradas e menções em comunidades, atualizada ao abrir, retomar e periodicamente com a aba visível. **Preparado:** adesão por aparelho, fila de push, tentativas e avisos genéricos. Recebimento físico não está comprovado.

**P0:** testar app fechado, permissão recusada, sessão expirada, toque, logout, troca de conta e revogação de acesso. **P1:** priorizar mensagem, resposta, comentário e menção; avaliar entradas em comunidades como categoria menos urgente. Oferecer preferências por categoria e silenciar conversa ou grupo. Abrir o destino relevante depois da autorização, mantendo a privacidade do aviso.

**Aceite:** o evento chega à pessoa correta, com estado de assinatura compreensível e sem expor conteúdo privado indevido. Recusa não impede o uso normal. Mensagem já lida e acesso revogado não geram aviso inadequado. Medir aviso aceito pelo provedor, recebido no aparelho, aberto e seguido de ação como etapas distintas.

### 5. Cadastro, identidade e recuperação de acesso

**Publicado:** e-mail e senha sem confirmação por decisão expressa da beta; recuperação por e-mail indisponível. Perfil com foto, nome, usuário e modalidade é exigido antes de explorar. Esses fatos não devem ser confundidos com uma política de lançamento já resolvida.

**P0 antes da divulgação ampla:** oferecer um caminho real e testado de recuperação de acesso e definir a política futura de identidade. Preservar a decisão atual enquanto uma alteração não for explícita. **P1:** facilitar importação da foto, erro e retomada do perfil; avaliar abandono antes de retirar campos obrigatórios que fazem parte do contrato atual.

**Aceite:** uma pessoa consegue cadastrar-se, trocar de aparelho e recuperar o acesso pelo caminho informado. Erro de foto tem uma saída útil. Cadastro iniciado por convite retorna ao contexto esperado. Medir conclusão e erro de cada etapa, sem capturar senha ou dados desnecessários.

### 6. Onboarding orientado ao primeiro valor

**Publicado:** configuração do perfil, aviso institucional, guia opcional e orientação de instalação. São etapas com finalidades e persistências diferentes. **Oportunidade:** verificar se o conjunto entrega valor cedo ou exige muitas ações antes de encontrar a turma.

**P0:** conectar a entrada a uma ação social útil. **P1:** oferecer ajuda contextual, dispensável e retomável; explicar instalação e notificações depois de sua utilidade ficar clara. Não transformar o tutorial em condição de participação nem executar ações sociais pelo usuário.

**Aceite:** a pessoa chega ao contexto relevante sem passeio obrigatório. Recarregar, dispensar o guia e trocar de conta não reproduzem passos indevidos. Medir tempo e abandono até a primeira descoberta e interação; progresso de tutorial permanece uma medida auxiliar.

### 7. Feed e continuidade da conversa

**Publicado:** posts, fotos, vídeos, curtidas, comentários, menções, reposts e audiências. Feed usa páginas de 20 publicações com Anterior/Próxima e atualização manual. **Oportunidade:** melhorar continuidade de leitura, retorno e descoberta sem perder controle de audiência.

**P1:** preservar posição ao voltar de perfil ou post, estabilizar paginação diante de inserções, avisar sobre conteúdo novo e completar o retorno por comentário/resposta. Diferenciar conteúdo das relações escolhidas de sugestões explicáveis. Um algoritmo de recomendação complexo não é pré-requisito.

**Aceite:** voltar preserva o lugar de leitura; novas publicações não causam duplicações ou lacunas indevidas. A pessoa encontra a resposta e continua a conversa. Medir abertura, interação, resposta e retomada, sem chamar impressão ou rolagem de vínculo social.

### 8. Criação, fotos e vídeos

**Publicado:** editor, recorte, suporte HEIC para fotos e MP4 privado de até 45 MiB. A correção recente de CSP mostrou a importância do teste no navegador. Não foi identificado pipeline completo de derivados de vídeo otimizado para consumo móvel.

**P0:** testar arquivos realmente produzidos pelos aparelhos-alvo, publicação e reprodução com diferentes condições de rede. **P1:** miniatura/capa, progresso, cancelamento, tratamento de arquivos incompatíveis e recuperação consistentes; compressão e derivados quando a medição justificar. Melhorar descrição de imagens e alternativas para conteúdo audiovisual.

**Aceite:** o conteúdo chega com orientação e enquadramento esperados. Falha breve de rede mantém um estado compreensível. A audiência escolhida vale para publicação, prévia e mídia. Medir falha por etapa, duração de upload, bytes transferidos e custo de reprodução, sem resolver desempenho apenas aumentando o limite do arquivo.

### 9. Desempenho e sensação de aplicativo

**Publicado:** fontes locais, CSS por rota, estados de rede, controle de versão e retomada. **Lacuna de evidência:** não há uma linha de base completa de desempenho real por aparelho e jornada nesta avaliação. As políticas de mídia privada limitam soluções de cache indiscriminado.

**P0:** medir e corrigir travamentos nos fluxos essenciais em aparelhos reais e rede limitada. **P1:** estabelecer orçamentos de carregamento, memória, mídia, latência e custo a partir da medição, preservando autorização e descarte entre contas.

**Aceite:** abrir, voltar, enviar, rolar e retomar não perdem contexto. Registrar tempos, erros e bytes por cenário e versão. Build aprovado, bundle pequeno e teste em desktop não substituem essa evidência.

### 10. Descoberta por contexto

**Publicado:** busca de nome/@usuário, filtros de arena acompanhada, modalidade e nível; afinidades por vínculos visíveis. A busca principal privilegia correspondência textual e ordem de nomes. **Oportunidade:** facilitar a descoberta de quem o jogador reconhece sem saber o nome.

**P1:** destacar a turma das arenas e comunidades relevantes, com motivos claros para cada sugestão. Recuperar buscas vazias com mudança de filtro e caminhos reais. Manter os registros privados de jogos fora da recomendação e não inferir disponibilidade.

**Aceite:** a pessoa explora participantes relevantes sem precisar de um nome exato. A explicação da afinidade corresponde a um vínculo autorizado. Medir busca sem resultado, abertura de perfil e interação posterior; nenhum dado de grupo privado ou data de jogo aparece por inferência na busca.

### 11. Arenas como ponto de encontro

**Publicado:** catálogo pesquisável, fotos, endereço, como chegar, acompanhamento, declaração “já joguei”, solicitação de cadastro e gestão. **Oportunidade:** aproximar catálogo e pessoas, com qualidade editorial contínua.

**P1:** priorizar arenas relevantes ao usuário e caminhos para suas comunidades e vínculos visíveis. Criar rotina para corrigir informação desatualizada. Diferenciar informação pesquisada/verificada de gestão oficialmente assumida por um responsável; não sugerir parceria comercial inexistente.

**Aceite:** o jogador encontra lugar, contexto social e caminho de correção. “Acompanha” e “já joguei” não parecem presença em tempo real. Medir uso por arena e quantidade de pessoas que chegam a uma interação; fotos e quantidade de registros no catálogo são medidas de cobertura, não de comunidade ativa.

### 12. Comunidades com vida e gestão

**Publicado:** criação, papéis, entrada aberta/aprovação/convite, regras, audiência, participantes, mural e comunidade oficial. **Lacuna de evidência:** não foi verificada operação humana regular nem recorrência das conversas.

**P1:** tornar simples a gestão de pedidos, regras e denúncias; avaliar posts fixados, boas-vindas humanas, conversa recente e controles de avisos. Incentivar rituais que já façam sentido à turma, como apresentação de novos membros e fotos depois da rodada. Não criar participação artificial.

**Aceite:** uma pessoa entende por que entrar, encontra conversa recente e sabe quem modera. Um responsável atende pedidos sem depender do desenvolvedor. Medir participantes que contribuem e recebem resposta, tempo de análise e retorno ao grupo, respeitando a privacidade.

### 13. Convites e compartilhamento externo

**Publicado:** reposts internos e convites individuais de gestão. Não foi localizado compartilhamento nativo de perfil/arena/comunidade/post nem atribuição de aquisição; copiar link aparece na instalação. **Oportunidade:** permitir que uma pessoa traga outra diretamente à turma.

**P1:** links compartilháveis, recurso nativo de compartilhar quando disponível, copiar link e QR para contextos apropriados. Preservar o destino depois do cadastro. Definir uma prévia externa que não amplie a audiência de conteúdo privado.

**Aceite:** um convite aberto em navegador externo leva à informação permitida e, após login/cadastro, ao contexto correto. Grupo privado não expõe posts ou membros na prévia. Medir compartilhamento iniciado, link aberto, cadastro e ativação do convidado; não confundir tentativa de compartilhamento com mensagem efetivamente enviada.

### 14. Confiança, abuso e moderação

**Publicado:** bloqueio e denúncia de perfis/posts/comentários, administração e controles da conta. **Preparado:** DMs reaproveitam ações sobre o perfil. **Lacuna:** denunciar uma mensagem específica com evidência adequada ainda precisa ser concluído antes de abrir mensagens em escala.

**P0:** denúncia contextual da mensagem, evidência mínima acessível apenas à operação autorizada, limites contra spam, fila de análise, responsáveis e retorno de status. **P1:** silenciar, controles de recebimento e tratamento de reincidência. Evitar que a solução exponha toda a conversa ao moderador.

**Aceite:** usuário denuncia o item correto; operador examina o necessário e executa a medida; usuário acompanha o estado cabível. Bloqueio repercute em mensagens, conteúdo, sugestões e notificações. Medir ocorrências e resolução sem transformar quantidade de denúncias em condenação automática.

### 15. Privacidade, suporte e informação fiel

**Publicado na versão auditada:** textos ainda descreviam confirmação de e-mail, em desacordo com a beta, e indicavam responsável/canal/prazos pendentes. Correções locais não comprovam atualização do endereço público. Documentos antigos também mantêm decisões já substituídas.

**P0:** alinhar informação pública ao funcionamento, configurar canal e responsabilidade reais e refletir os novos domínios de mensagens/push. Manter política, onboarding, conta e suporte coerentes sobre recuperação, visibilidade, retenção e exclusão. Obrigações de loja e textos jurídicos dependem de verificação própria e dados reais do operador.

**Aceite:** usuário e operador leem a política aplicada pela versão servida. O contato funciona e tem responsável. Exclusão/exportação e limitações são verificadas. Não prometer criptografia ponta a ponta, anonimato, recuperação ou apagamento de cópias externas que o produto não entrega.

### 16. Acabamento premium e acessibilidade

**Publicado:** Aura Manteiga, temas claro/escuro, fontes e ativos aprovados; revisões locais de layout e contraste. **Oportunidade:** completar a consistência das novas superfícies e validar o conjunto durante uso físico. Não há motivo para reiniciar branding nesta etapa.

**P0:** resolver barreiras de teclado, leitor de tela, foco, contraste, texto ampliado e teclado virtual. **P1:** polir hierarquia, densidade, transições, resposta ao toque, vazio, erro, retry e sucesso usando o sistema existente. Fotografia, espaços e controles devem ajudar a tarefa, sem excesso de efeitos.

**Aceite:** as ações essenciais funcionam por toque e tecnologia assistiva; o teclado não cobre envio ou campos importantes. Claro/escuro, movimento reduzido e texto ampliado preservam leitura e ação. A verificação inclui estados de falha e conteúdo realista de tamanhos variados, não apenas capturas vazias.

### 17. Operação e consistência de releases

**Publicado/comprovado:** main protegida, CI e fluxo específico de stage/promoção. Push no GitHub não publica automaticamente. **Limites de evidência:** monitor externo e custódia de backups não têm ativação operacional comprovada nesta sessão; testes locais não demonstram entrega de push ou recuperação física.

**P0:** verificar monitor/alerta, backup e restauração, procedimento de incidente, promoção, observação de erros e limites de custo/capacidade. Manter estado corrente curto, distinguindo código, banco, versão servida e recursos habilitados. Preservar dados existentes em toda evolução.

**Aceite:** o responsável identifica a versão, detecta uma falha, recebe o alerta e consegue executar o procedimento documentado. A restauração é demonstrada com dados controlados. Uma migration aditiva passa pelos inventários e verificações pertinentes. Medir disponibilidade e erro por jornada; saúde de Auth/banco não substitui todas as jornadas.

### 18. Distribuição nas lojas e experiência móvel

**Publicado:** PWA. Não foi identificado binário iOS/Android pronto para distribuição na base auditada. **Preparado:** orientação técnica para avaliar o cliente móvel reutilizando a infraestrutura existente. A modalidade de empacotamento ainda precisa de prova, não de escolha por familiaridade.

**P0 para a loja:** preparar cliente de release, identidade de aplicação, assinatura, integração de autenticação/API, links, notificações, câmera/mídia, retomada e atualização. Provar a experiência em iOS e Android antes de fechar a solução. Preparar ativos, ficha, suporte, privacidade e controles compatíveis com o app entregue. Requisitos atuais devem ser conferidos nas fontes oficiais indicadas no diagnóstico técnico.

**Aceite:** existe build de release instalado em aparelho real e aprovado na matriz de jornadas. Abertura por link, login, câmera, upload, notificação, exclusão e atualização funcionam. “Pronto para submeter”, “submetido”, “aprovado” e “publicado” são estados separados; uma embalagem da URL não comprova todos eles.

## Primeira coorte: provar o ciclo antes de ampliar aquisição

Selecionar um conjunto pequeno de arenas e comunidades reais, com pessoas que já se reconhecem e responsáveis acessíveis. A escolha deve considerar a capacidade de acompanhar o uso e obter retorno, não apenas o tamanho do catálogo. Não há parceiros confirmados por este documento. Abordagens e convites a pessoas dependem de autorização específica; preparar materiais e links não autoriza enviá-los.

Cada contexto deve ter informação correta, propósito claro, pelo menos uma razão real para voltar e um responsável que participe. A comunidade oficial do Pico pode orientar, mas não deve substituir as conversas da turma. As primeiras publicações devem vir de pessoas ou autores institucionais identificados; não simular adesão, relatos ou métricas.

O ensaio de produto acompanha a jornada: convite contextual, entrada, perfil, descoberta de alguém relevante, primeira interação, resposta, retorno e convite a outra pessoa. Observar desistências, dúvidas, buscas vazias e mensagens sem resposta. Entrevistas e observação ajudam a explicar os eventos; não inferir satisfação a partir de cliques.

| Sinal observado | Decisão a investigar |
| --- | --- |
| Abandono antes de concluir o perfil | Erro técnico, excesso de campos, exigência de foto, falta de clareza de valor ou contexto de convite perdido |
| Perfil concluído, mas nenhuma pessoa relevante encontrada | Densidade insuficiente, arena errada, filtros, ordem da descoberta ou falta de contexto |
| Pessoa encontrada, mas conversa não começa | Permissão mútua incompreensível, intenção invisível, receio de abordar ou ausência de motivo |
| Mensagem enviada sem resposta | Destinatário inativo, aviso ausente, baixa relevância ou problema de entrega; não aumentar disparos sem diagnóstico |
| Interação acontece, mas não há retorno | Falta de valor recorrente, nova fricção, notificação inadequada ou conversa que continua fora do app |
| Compartilhamento gera entrada, mas não ativação | Prévia promete algo diferente, cadastro perde o contexto ou turma não responde |

Ampliar aquisição quando os gargalos essenciais estiverem compreendidos e houver evidência repetida de uso útil nas coortes acompanhadas. Não existe prazo ou taxa de sucesso garantidos para esse resultado.

## Instrumentação proposta, sem números fabricados

Não foi observado um funil instrumentado suficiente para calcular os indicadores abaixo. Eles são um plano de mensuração, não resultados do Pico.

| Pergunta | Eventos e indicadores propostos | Cuidado de interpretação |
| --- | --- | --- |
| A pessoa chega ao primeiro valor? | Cadastro iniciado/concluído, perfil utilizável, contexto acompanhado, pessoa encontrada, primeira interação; tempo entre etapas | Tutorial e instalação não são ativação social |
| Existe densidade local? | Pessoas ativas e interlocutores/autores distintos por arena ou comunidade autorizada | Catálogo e cadastros acumulados não são rede ativa; evitar exposição de grupos pequenos |
| Conversas funcionam? | Conversas com resposta, tempo até resposta, erro/retry, retomada e bloqueios de envio por regra | Envio aceito pelo servidor não comprova leitura ou resposta |
| Há retorno? | D1/D7/D30 por coorte, frequência de interação e retorno após resposta/menção | Definir janela, denominador e atividade relevante antes do cálculo; esperar a coorte amadurecer |
| Convites trazem turma? | Compartilhamento iniciado, link aberto, cadastro atribuído, entrada no contexto e interação | Atribuição tem limites entre apps/aparelhos; não contar compartilhamento iniciado como envio confirmado |
| A operação sustenta a experiência? | Erros de entrada/upload/envio, latência, falhas de entrega, denúncias e resolução | Observabilidade técnica e analytics de produto respondem perguntas diferentes |

**Métrica norte proposta:** número de pessoas que tiveram uma interação recíproca no Pico na semana, ligada às relações ou comunidades relevantes para elas. Antes de implementar, definir o que conta: por exemplo, uma conversa com envio nos dois sentidos ou uma troca de comentários com resposta. Curtida isolada, publicação sem resposta, ação institucional automática e conclusão do tutorial não demonstram reciprocidade.

Contar cada pessoa uma vez por janela para essa métrica e acompanhar os componentes separadamente. Excluir fixtures, contas de teste e eventos duplicados. Não coletar texto de mensagem, conteúdo de post, e-mail, foto ou localização precisa apenas para analytics. Descrever os eventos, sua finalidade, retenção e acesso; a instrumentação deve entrar no inventário de dados e na informação pública pertinente.

Definir metas e limites depois de medir uma base confiável. Crescimento de downloads, commits ou notificações enviadas não substitui melhora de ativação, reciprocidade e retorno.

## Hipóteses P2 e escopo preservado

| Hipótese P2 | Evidência que justificaria priorizar |
| --- | --- |
| Fotos, anexos e reações em DMs | Conversas ativas exigem mídia para continuar e os controles de abuso/armazenamento estão prontos |
| Conversas em grupo | Turmas usam o Pico regularmente e o mural/comentários não resolvem sua necessidade de conversa |
| Busca dentro de conversas e itens salvos | Histórico útil cresce e as pessoas demonstram dificuldade de recuperar informação |
| Álbuns, coleções e personalização adicional do perfil | Uso real mostra demanda de expressão e organização além do feed existente |
| Ferramentas adicionais de moderação | Volume e tipos de incidentes superam a operação atual, com necessidades bem identificadas |
| Recursos adicionais de acessibilidade de mídia | Formatos e necessidades observados justificam produção e manutenção do recurso |

P2 não é uma lista que precisa estar inteira pronta antes do lançamento. Cada hipótese deve ter problema, público, custo e aceite próprios.

Reservas, pagamentos, monetização B2B, anúncios, IA, voz, ranking avançado, presença ao vivo, localização contínua e mapa de pessoas não entram automaticamente. Agenda de disponibilidade ou eventos futuros também exige decisão própria; não pode ser derivada dos jogos privados. O pedido de lojas não autoriza reabrir a identidade visual nem separar ambientes sem necessidade concreta.

## Ordem de execução e definição de pronto

1. **Confiança e acesso:** informação factual, recuperação de conta, suporte, segurança das conversas, moderação e operação básica.
2. **Ciclo social completo:** descoberta contextual, intenção de conexão, conversa/resposta, notificação e retorno; validar e ativar os recursos preparados.
3. **Primeira coorte e mensuração:** instrumentar, acompanhar pessoas e corrigir o gargalo de valor observado.
4. **Continuidade e acabamento:** feed, mídia, desempenho, acessibilidade, navegação e retomada em aparelhos reais.
5. **Distribuição:** concluir a prova móvel, builds, testes e materiais de loja. Preparação técnica pode ocorrer em paralelo; o aceite da experiência continua necessário.
6. **Crescimento:** melhorar convites e ampliar contextos conforme a evidência, preservando a qualidade da operação.

O próximo prompt de desenvolvimento deve usar uma matriz de aceite por jornada e manter quatro estados: **implementado**, **validado localmente**, **validado com serviços/aparelhos reais** e **publicado**. Configuração ausente deve ser registrada como bloqueio da etapa dependente, sem interromper tarefas independentes já autorizadas. Testes apropriados verificam comportamento e privacidade; não se deve criar ciclos de documentação ou testes cosméticos como substitutos de entrega.

“Pronto” significa cumprir o aceite do escopo acordado, ter os serviços necessários operando e conseguir demonstrar a experiência prometida. Viralização permanece um resultado a observar. O objetivo controlável é construir um app confiável que entregue relações e conversas úteis a uma turma real.

## Referências do projeto

- [Diagnóstico técnico e evidências de 18/09](PICO_DEVELOPMENT_REVIEW_2026-09-18.md).
- [Contexto de produto e identidade](pico-company-context.md), [mapa de domínios](pico-domains.md) e [design system](pico-design-system.md).
- [Jornada e pós-jogo](JOURNEY_REFINEMENT.md), [jogos privados](POST_GAME.md), [busca](SEARCH.md) e [onboarding](ONBOARDING.md).
- [Notificações publicadas](NOTIFICATIONS.md), [menções](COMMUNITY_MENTIONS.md) e [push preparado](PUSH_NOTIFICATIONS.md).
- [PWA](pwa-roadmap.md), [governança](GITHUB_GOVERNANCE.md) e [disponibilidade](AVAILABILITY.md).

Alguns documentos de referência preservam decisões históricas. Para escopo, prevalecem o pedido atual e o estado verificado; não restaurar uma regra antiga só porque ela ainda aparece num registro anterior.
