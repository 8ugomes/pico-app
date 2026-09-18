# Pico: diagnóstico e sequência de desenvolvimento

Revisão iniciada em 18/09/2026 a partir de `e3a64926e4b28bbf9483aeabd3f6981b1c824743`. Escopo: código, histórico de commits/PRs, CI, operação pública, mensagens, notificações e preparação para lojas. O pedido atual autoriza ampliar o produto para essas capacidades; preserva a infraestrutura e a identidade Aura Manteiga.

## O que está comprovado

| Camada | Evidência desta revisão | Limite |
| --- | --- | --- |
| Repositório | Main `e3a6492`, de 14/09 às 20h58 BRT; 39 PRs integradas, uma draft antiga | Commit não comprova publicação |
| CI anterior | [verify aprovado](https://github.com/8ugomes/pico-app/actions/runs/34911204566), inclusive lint/types/testes/build | Workflow geral usa demo; testes hospedados são outra evidência |
| Produção | `/api/version` respondeu `bda869824b42`, beta; `/api/health` respondeu banco/Auth OK em 18/09 às 22h19 UTC | Saúde não mede todas as jornadas nem disponibilidade histórica |
| Diferença main/produção | Desde `bda8698` só mudaram os três documentos de recibo | Não há funcionalidade ausente nesse intervalo |
| Sessão pública | Navegador anônimo mostra entrada/cadastro; feed exige conta | Nenhuma publicação privada nem conversa de usuários foi lida; não há diagnóstico de tração baseado em dados reais nesta sessão |
| Publicação | `scripts/deploy.mjs`, stage e promoção no projeto existente `pico-app` | Push no GitHub não publica automaticamente |

O endereço principal continua [pico-app-sepia.vercel.app](https://pico-app-sepia.vercel.app). Não criar outro app/projeto como requisito desta evolução. A draft [PR #2](https://github.com/8ugomes/pico-app/pull/2) ficou antiga e conflituosa; o escopo de perfil foi integrado pela PR #4. Não mesclar essa draft sem comparar diferenças.

## Produto já construído

- Conta por senha, perfil com foto/HEIC, onboarding e tutorial opcional.
- Pessoas, conexões unilaterais, arenas pesquisáveis, participação e gestão por papéis.
- Comunidades independentes ou vinculadas, com entrada e audiência distintas.
- Publicação canônica em múltiplos destinos, comentários, curtidas, menções e republicações.
- Fotos e vídeos privados; upload MP4 até 45 MiB e leitura reautorizada por faixa.
- Histórico retrospectivo privado de jogos e compartilhamento explícito separado; presença ao vivo foi aposentada.
- Bloqueio, denúncia, administração, exportação e exclusão da conta.
- Aura Manteiga aplicada, temas claro/escuro, manifesto/ícones Pico Club, instalação e retomada PWA.
- Caixa de notificações de comunidade, atualizada ao abrir/retomar e a cada 30 segundos visíveis.

O histórico tem trabalho funcional real. Desde `7d6f288`, 40 dos 70 commits sem merge tocam app/backend; 19 são só documentação/skills e 11 testes/build/operação/ativos. Nove PRs entre #23 e #40 são recibos de publicação. A melhoria de processo é manter um estado corrente curto e usar testes de comportamento/retorno como evidência, sem tratar quantidade de commits ou documentos como evolução do produto.

## Lacunas que mudam a prioridade

| Prioridade | Lacuna | Resultado esperado |
| --- | --- | --- |
| P0 | Conversa entre pessoas ausente na versão pública | Reconhecer alguém no Pico e continuar uma conversa depois do jogo |
| P0 | Avisos dependem de abrir o aplicativo | Retorno por notificação consentida de mensagem ou atividade relevante |
| P0 antes de distribuição ampla | Recuperação por e-mail indisponível por escolha anterior da beta | Recuperar acesso sem atendimento manual; decisão/configuração e entrega reais verificadas |
| P0 antes de distribuição ampla | Contato de suporte/privacidade, rotina de moderação e backup externo ainda sem confirmação operacional nesta sessão | Responsável e canal reais, restauração demonstrada e resposta a incidentes |
| P1 | Instalação, teclado, câmera, retorno e atualização sem nova validação física | Matriz curta aprovada em iPhone e Android reais |
| P1 | Falta medida de ativação, retenção, recorrência e convites | Saber se a rede funciona em arenas específicas antes de ampliar aquisição |
| P0 para lojas | Nenhum binário/projeto nativo pronto | Cliente de loja testado e assinado, com integrações e requisitos cumpridos |

A [avaliação completa de 18 frentes](PICO_PRODUCT_ASSESSMENT_2026-09-18.md) desenvolve experiência, crescimento e operação. Um gargalo adicional é a intenção de conexão: as DMs preparadas dependem de acompanhamento mútuo, mas o destinatário ainda não recebe aviso de novo acompanhamento. Completar esse caminho precede a divulgação do caso de uso de conhecer a turma da arena.

Não reiniciar a marca. O cuidado premium deve aparecer em tempo de resposta, hierarquia, estados vazios, foco/teclado, erro recuperável, upload e continuidade de sessão, além do visual já aprovado.

## Fatia implementada nesta revisão

Mensagens diretas de texto têm conversa por par, participantes autorizados, acompanhamento mútuo para iniciar/enviar, histórico paginado, indicador de não lidas e reconhecimento explícito de leitura. Bloqueio e suspensão revogam acesso; deixar de acompanhar pausa novos envios. Não há status online, digitação, anexos ou recibo público de leitura. Repetir a mesma tentativa não duplica a mensagem. Rascunhos ficam apenas em memória; troca de identidade descarta o estado anterior.

Push é uma adesão por navegador/dispositivo. O worker não intercepta navegação nem guarda conteúdo privado offline. O processamento usa fila, tentativas limitadas e nova verificação de acesso; o aviso é genérico, sem expor texto de conversa na tela bloqueada. Endpoints e chaves de assinatura ficam no servidor. A instalação PWA, a caixa interna e a autorização do sistema são estados diferentes.

As novas capacidades ficam **desabilitadas por padrão no servidor e no banco**. Isso permite revisar o código sem abrir RPCs diretamente pelo Supabase ou exibir uma função dependente de schema ainda ausente. Para ativar, aplicar as migrations aditivas com inventário de preservação, verificar os fluxos conectados, gerar os tipos remotos e configurar os serviços de entrega. Sem as credenciais do ambiente nesta sessão, não houve alteração de banco remoto, deploy ou envio a usuários.

Os tipos hospedados em `src/types/database.ts` são preservados. A extensão temporária `pending-functions.ts` é gerada pelo catálogo PostgreSQL local via `scripts/generate-pending-functions.mjs`; não é uma alegação de migration remota. Após a aplicação autorizada, rodar `db:types` e reconciliar a extensão.

## Sequência de entrega

1. **Fechar e verificar mensagens/push:** testes SQL negativos/positivos, HTTP autenticado, navegador, envio repetido, nova mensagem durante marcação, bloqueio/suspensão, revogação de notificação, logout e clique no aviso. Critério: duas contas controladas conversam; terceira é impedida; repetição não duplica; aviso recebido em aparelho real abre o destino correto. A denúncia específica de mensagem, com evidência limitada para moderação, deve entrar antes de abrir mensagens em escala; o bloqueio/denúncia de perfil já existente não substitui esse fluxo.
2. **Piloto concentrado:** escolher 2–3 arenas e uma turma real em cada uma, com responsáveis acessíveis. Começar com uma comunidade útil e pessoas que já se reconhecem. Convites por link/QR da arena e compartilhamento explícito podem trazer pessoas ao mesmo contexto. Números são proposta de piloto, não parceiros confirmados.
3. **Medir quatro semanas:** instrumentar eventos mínimos próprios, sem corpo de mensagem ou conteúdo pessoal. Funil: cadastro → perfil concluído → contexto acompanhado → primeira interação. Separar uso de quem apenas instalou. Medir D1/D7/D30 por coorte, ativos por arena, conversas com resposta, tempo até primeira resposta e retorno por aviso. Métrica norte proposta: pessoas que tiveram interação recíproca no Pico na semana.
4. **Melhorar com evidência:** se pouca gente completa perfil, reduzir fricção; se encontra pessoas mas não conversa, melhorar contexto/entrada; se manda e não recebe resposta, revisar densidade e relevância; se volta pouco, revisar valor recorrente e notificações, sem aumentar disparos indiscriminadamente.
5. **Validar cliente de loja no mesmo repositório:** provar login, sessão, teclado, mídia, deep link, notificação e retomada em iOS/Android antes de escolher o empacotamento definitivo. Reutilizar Supabase e contratos existentes. Só então preparar build assinado, ficha, privacidade, testes fechados e submissão.

Viralização é um resultado a verificar. O ciclo pretendido é pessoa encontra turma → interage → recebe resposta → convida alguém da mesma arena. Acompanhar convites por ativo × conversão do convite × ativação do convidado ajuda a localizar o gargalo; downloads isolados não mostram uma comunidade consistente. Definir metas depois de medir uma primeira coorte, sem fabricar benchmarks para o Pico.

## Preparação para App Store e Google Play

O projeto usa Route Handlers, sessão por cookies e chamadas relativas `/api`. Um export estático não carrega esse backend para dentro do aparelho. A configuração `server.url` do Capacitor é destinada a live reload e não é uma arquitetura de produção; criar um contêiner que só aponta para a URL atual não conclui o trabalho. Fazer uma prova com assets locais e contrato seguro de autenticação/API, preservando a base Next/Supabase. Expo é uma alternativa a avaliar se a experiência de WebView demonstrar limitações, sem reescrita antecipada. [Configuração oficial do Capacitor](https://capacitorjs.com/docs/config).

No iOS, Web Push exige web app adicionado à tela inicial em versões compatíveis e solicitação iniciada por interação. Essa é a etapa prática anterior ao binário; não exige prometer push de qualquer aba do Safari. [WebKit: Web Push para iOS/iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).

Para lojas, completar critérios de conteúdo gerado pelo usuário: denúncia, bloqueio, moderação, contato publicado e diretrizes; oferecer exclusão de conta e experiência com utilidade suficiente. Apple avalia funcionalidade mínima e segurança do conteúdo, não garante aprovação de um wrapper. [App Review Guidelines, 1.2, 4.2 e 5.1.1](https://developer.apple.com/app-store/review/guidelines/).

Google Play exige política/termos aceitos antes de criação de conteúdo e mecanismos de moderação; apps com criação de conta precisam oferecer exclusão no app e caminho externo apropriado. Apps classificados como Social também precisam observar os requisitos de segurança infantil e contato responsável. Isso depende de informações reais do operador e não deve ser preenchido com dados inventados. [UGC](https://support.google.com/googleplay/android-developer/answer/9876937?hl=en), [exclusão de conta](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en), [segurança infantil](https://support.google.com/googleplay/android-developer/answer/14747720?hl=en).

Pendências verificáveis: conta de desenvolvedor e identidade legal; bundle/application IDs e domínio; termos/diretrizes e aceite; canal público; responsável por moderação e segurança infantil; política de retenção; inventário de dados para os formulários das lojas; builds assinados; deep links; testes físicos e canais fechados. Nenhuma conta paga, assinatura, domínio ou envio para loja foi contratado/executado nesta revisão.

## Verificação desta entrega

O checkpoint está na branch `codex/pico-messaging-push-foundation`. Lint, typecheck com identidade demo, build demo, 187 testes locais, verificação de 12 RPCs pelo catálogo e audit sem vulnerabilidades passaram. O smoke HTTP confirmou `/mensagens` compilada e as negativas de APIs, origem e executor. A fixture de UI real com transporte fictício compila e responde HTTP; o navegador disponível bloqueia o servidor local, portanto a inspeção visual das novas telas permanece pendente.

Testes locais de SQL em PGlite exercitam policies e RPCs, mas não comprovam JWT/Auth/Storage/Supabase hospedado nem concorrência multissessão. Transporte push simulado não comprova recebimento em APNs/FCM ou aparelho físico. A revisão independente não identificou outro bloqueador prioritário nos trechos revistos após as correções de locks e ciclo de sessão; isso não é uma auditoria irrestrita de segurança. Não houve configuração de credenciais, migration remota, ativação, deploy ou envio a usuários.

O [prompt completo de continuidade](CODEX_CONTINUE_TO_STORE_READY.md) entrega a ordem, os limites e a matriz de aceite até a preparação para publicação solicitada pelo responsável. A publicação final exige a revisão do pacote e autorização correspondente; não foi realizada nesta rodada.
