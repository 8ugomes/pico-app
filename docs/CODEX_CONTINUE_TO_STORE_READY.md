# Prompt para continuar o Pico até estar pronto para publicar

Copie o texto abaixo para uma sessão do Codex com acesso ao repositório `8ugomes/pico-app`. Ele orienta uma versão de lançamento delimitada e preserva o trabalho existente. A avaliação que fundamenta a ordem está em `docs/PICO_PRODUCT_ASSESSMENT_2026-09-18.md`; as evidências técnicas estão em `docs/PICO_DEVELOPMENT_REVIEW_2026-09-18.md`.

---

Você é responsável por continuar o desenvolvimento do **Pico / Pico Club**, rede social para quem pratica futevôlei, beach tennis e vôlei de praia. Execute o trabalho no repositório existente até a versão estar tecnicamente preparada e validada para publicação na App Store e no Google Play. Quero código funcionando, integração, acabamento e evidências de qualidade. Ao fim, quero revisar uma entrega concreta e os passos restantes para publicar.

O resultado do produto deve ser: uma pessoa encontra a turma de sua arena, entende quem tem afinidade com ela, estabelece uma conexão, conversa, recebe uma resposta, volta ao Pico e consegue convidar outras pessoas para esse mesmo contexto. A interface deve transmitir qualidade premium e funcionar bem em aparelhos reais. Popularidade é uma hipótese a medir; não prometa viralização nem invente números de usuários.

## 1. Comece pelo estado real e preserve o que já existe

1. Leia `AGENTS.md`, `README.md`, `docs/pico-product-plan.md`, `docs/deslopify.md`, `docs/pico-design-system.md`, `docs/pico-domains.md`, `docs/pwa-roadmap.md`, `docs/PUSH_NOTIFICATIONS.md` e os dois relatórios de 18/09/2026. Use as skills locais conforme o trabalho e consulte a documentação da versão instalada do Next antes de alterar suas APIs. Documentos antigos preservam decisões históricas; não os confunda com o estado corrente.
2. Confira branch, alterações locais, remotes, PRs, CI e a versão efetivamente publicada. O checkpoint desta avaliação foi preparado na branch `codex/pico-messaging-push-foundation`, partindo da main `e3a64926e4b28bbf9483aeabd3f6981b1c824743`. Em 18/09/2026 o domínio principal servia `bda869824b42`; o intervalo até a main continha documentos. Revalide tudo, pois pode ter mudado. Continue os commits atuais; se a branch já foi integrada, trabalhe sobre a main atualizada. Preserve alterações do usuário e não recrie a implementação do zero.
3. Inspecione as migrations `20260918090000_direct_messages.sql` e `20260918110000_web_push.sql`, rotas `/mensagens`, `/api/messages`, `/api/push`, worker, testes e extensão temporária de tipos. Já existe uma fundação de DMs e Web Push com dois interruptores de ativação, no servidor e no banco, desligados por padrão. Não trate essa fundação como recurso publicado ou validado em aparelhos.
4. Respeite Next/React/TypeScript/Supabase, npm e lockfile, contratos de privacidade e a identidade **Aura Manteiga**: Manteiga, Cacau, Papel e Lavanda; Syne e Manrope; ícone Pico Club. Resolva consistência e acabamento com esses componentes. Não inicie outro redesign de marca.
5. O app principal continua no projeto Vercel `pico-app`, domínio `pico-app-sepia.vercel.app`, com o Supabase existente. Uma branch ou cliente móvel no mesmo repositório não exige outro produto. Não crie ambientes ou projetos remotos como requisito automático.

Atualize um plano curto com prioridade, dependência, aceite e evidência antes de codar. Execute fatias completas e revisáveis. Use agentes para frentes independentes quando houver vantagem, com responsabilidade clara por arquivos. Tome decisões pequenas e reversíveis sem me interromper. Se faltar acesso, continue as tarefas independentes e registre exatamente o que falta; não substitua integração real por uma simulação anunciada como pronta.

## 2. Conclua acesso, confiança e mensagens

**Acesso e conta.** A beta atual usa e-mail/senha sem confirmação e sem SMTP por decisão explícita anterior. Corrija textos incoerentes e mantenha esse comportamento até haver uma decisão expressa sobre a política futura. Prepare recuperação de acesso e valide um caminho real de troca de aparelho e senha. Se a solução depender de configurar provedor, identidade de envio, política de confirmação ou serviço pago, apresente a solução concreta e peça apenas a informação/decisão indispensável. A recuperação efetiva é critério para abertura ampla; não exiba confirmação fictícia de e-mail enviado.

**Ciclo de conexão.** A implementação atual de DMs exige acompanhamento mútuo, mas a pessoa acompanhada ainda não recebe um aviso para entender essa intenção. Feche essa lacuna. Comece pelo fluxo mínimo coerente de aviso, explicação e ação de acompanhar de volta, com autorização, preferências e limites. Se houver necessidade de solicitação de conversa, implemente aceitação, recusa e bloqueio em uma caixa separada, definindo explicitamente sua relação com o acompanhamento existente. Não abra envio irrestrito a desconhecidos nem duplique dois sistemas de conexão sem motivo. O emissor precisa entender o próximo passo; o destinatário controla a interação.

**Mensagens.** Conclua e valide a fundação existente: autorização dos participantes, ordenação e paginação estáveis, não lidas, envio idempotente, tentativa incerta sem duplicação, limite de tamanho e frequência, bloqueio, suspensão, exclusão/exportação e reconexão. Preserve o texto em memória após erro; descarte dados da identidade anterior ao trocar de conta. Garanta que muitas mensagens recebidas durante ausência continuem acessíveis pela paginação. Um GET não marca como lida. Estados de enviada, entregue ou lida só podem aparecer com evidência correspondente. Não acrescente presença online ou digitação simulada.

**Moderação.** Acrescente denúncia de mensagem específica, com motivo e evidência mínima limitada ao item/contexto necessário, acesso restrito e auditável para moderação. Complete o caminho do usuário e do operador: bloquear, denunciar, analisar, aplicar medida e acompanhar situação. Verifique consistência de bloqueios em perfis, sugestões, conteúdo, DMs e notificações. Defina responsáveis/canais reais com o operador; não invente equipe nem atendimento disponível.

Aceite: A e B autorizados conversam; C não lê, envia ou marca a conversa deles. Bloqueio/suspensão revogam acesso. Repetir uma tentativa não duplica. Rede lenta ou resposta perdida não perde texto nem declara sucesso sem confirmação. Paginação, leitura concorrente, troca de identidade e exclusão funcionam. Denúncia contextual é utilizável por quem recebeu a mensagem e pelo moderador autorizado.

## 3. Termine notificações úteis e controláveis

Revise a fila, leases, cooldown por aparelho, deduplicação, expiração e retry já existentes. Prove a ordem de locks e disputas relevantes em PostgreSQL com sessões concorrentes; PGlite isolado não comprova esse cenário. Garanta revalidação de acesso antes de entregar e descarte de eventos obsoletos. Provider aceitar o pedido não significa que a pessoa recebeu o aviso.

Integre o executor autenticado de `POST /api/push/dispatch` somente no serviço disponível e autorizado. Configure VAPID e segredos em armazenamento apropriado, nunca em Git, texto público ou variáveis de cliente. Use `docs/PUSH_NOTIFICATIONS.md` como contrato e reconfira o que falta. Ative banco/aplicação somente após os pré-requisitos e testes conectados estarem comprovados.

Peça permissão após gesto explícito e explicação contextual. Distinga permissão do sistema, vínculo da conta no aparelho e instalação PWA. Permita desativar mesmo quando a permissão do navegador já mudou. Trate múltiplos aparelhos, endpoint expirado, ativação atrasada, recusa, logout, cookies expirados e troca de conta, inclusive offline. A revogação deve tentar interromper entregas futuras sem impedir a saída da conta; documente os limites dos avisos já aceitos pelo provedor.

Priorize mensagem, resposta/comentário, menção e intenção de conexão. Reduza o ruído de eventos de comunidade. Acrescente preferências por categoria e silenciamento quando necessário para controlar os avisos. Mantenha payload genérico por padrão, sem texto privado ou identidade na tela bloqueada. O worker não deve guardar sessão ou conteúdo privado offline. Não substitua o fluxo de leitura autenticado por dados entregues no push.

Aceite em iPhone e Android reais: permissão concedida/negada, app fechado, aviso recebido, toque levando ao destino correto, sessão vencida retornando ao destino após login, item já lido, bloqueio, logout e troca de conta. Use somente contas/aparelhos de teste autorizados. Web Push no iOS depende da instalação na tela inicial em versão compatível; o cliente de loja deverá ter sua própria integração apropriada com APNs/FCM.

## 4. Complete a experiência premium e o primeiro valor

Percorra cadastro → perfil → contexto de arena/comunidade → pessoa relevante → interação → resposta. Remova atrito demonstrado, repetição de instruções e becos sem saída. Preserve tutorial opcional, retomável e isolado por conta; não registre acompanhamento, publicação, convite ou outra ação social sem a ação correspondente. Avalie a exigência de foto no primeiro acesso a partir do comportamento e do objetivo do perfil; não mude a regra silenciosamente.

Revise todas as jornadas essenciais em 320/390 px e desktop, temas claro/escuro, texto a 200%, teclado, VoiceOver/TalkBack, foco, áreas de toque e movimento reduzido. Resolva teclado cobrindo o compositor, safe areas, botão voltar, retomada do app, diálogos, posição da rolagem e estados de carregamento/vazio/erro/retry/sucesso. Faça inspeção visual real e registre uma amostra representativa. Teste HTTP ou build não substitui essa inspeção.

No feed, preserve a posição ao voltar de perfil/post, evite duplicação e salto durante paginação e apresente atualizações sem interromper a leitura. Complete a descoberta de respostas/comentários. Em pessoas/arenas/comunidades, dê destaque a vínculos relevantes e explique sugestões por fatos visíveis. Trate busca vazia, arena sem turma e comunidade sem atividade com próximos passos úteis. Catálogo pesquisado não significa parceria oficial nem pessoas presentes agora.

Valide fotos HEIC, orientação, recorte e formatos de vídeo produzidos pelos aparelhos-alvo. O limite publicado atual de vídeo é 45 MiB; não o aumente sem verificar cotas, custo e pipeline. Preserve upload recuperável, progresso e cancelamento. Meça antes de introduzir compressão, derivados, miniaturas e processamento assíncrono; adote o necessário para estabilidade, dados móveis e tempo de resposta. Não enfraqueça autorização para cachear mídia privada publicamente. Adicione texto alternativo/legendas onde aplicável.

Meça carregamento, interação, rolagem, retomada, bytes de mídia e latência de envio. Use Core Web Vitals como referência para a parte web, separando laboratório de campo e definindo orçamentos a partir de aparelhos-alvo. Não anuncie desempenho nativo ou resultado de usuário real a partir de uma pontuação simulada. Preserve autorização dos dados em falhas/offline; não prometa envio offline se só existe retry manual.

## 5. Construa crescimento que respeite o contexto

Implemente compartilhamento por link com Web Share quando disponível e alternativa copiar link para perfil, arena, comunidade e publicação elegível. Inclua convites/QR contextuais onde ajudam a trazer a turma, retorno ao destino após cadastro e tratamento de conteúdo removido/sem permissão. Prévia externa de grupo privado não pode revelar posts, membros ou outros dados restritos. Distinga URL pública do conteúdo que exige autenticação. Use apenas domínio e vínculos verificados.

Prepare instrumentação mínima de ativação, primeira interação, conversa com resposta, retorno por aviso e convite convertido. Não registre corpos de mensagens, conteúdo de posts, credenciais ou localização privada em analytics. Defina identidade, retenção, exclusão, acesso e custo dos eventos. Distinga dados reais de testes e automações institucionais. Entregue consultas ou painel que respondam às perguntas do produto, sem criar um dashboard decorativo.

Métrica norte proposta: pessoas que tiveram uma interação recíproca relevante no Pico na semana. Defina rigorosamente o evento. Observe ativação, D1/D7/D30 por coorte, pessoas/interlocutores ativos por arena, conversas respondidas, tempo até resposta, falha de envio/upload e conversão dos convites. Se não houver amostra, diga que ainda não existe base para concluir.

Prepare um piloto concentrado em poucas arenas, com pessoas que já se reconhecem, responsáveis e rituais úteis de comunidade. A escolha das arenas e o contato com participantes dependem de dados e autorização reais. Não envie mensagens, convites ou campanhas para pessoas sem autorização específica. Não crie engajamento falso nem obrigue usuários a compartilhar para usar o app. Instrumente e prepare o roteiro; o período de observação real continua sendo um marco externo.

## 6. Prepare clientes de loja sobre a base existente

Faça uma prova técnica curta e documente a escolha da arquitetura móvel antes de ampliá-la. O Next atual usa backend, Route Handlers, cookies e `/api` relativas; export estático não incorpora esse servidor ao aparelho. Avalie Capacitor com assets locais e fronteira segura de API/autenticação. A opção `server.url` é para live reload, não deve ser usada como solução de produção. Se a prova demonstrar que a experiência exige React Native/Expo, justifique com as limitações medidas, reutilize contratos e backend e preserve a aplicação web. Não crie uma reescrita paralela por preferência pessoal.

Implemente os pontos exigidos pela arquitetura escolhida: sessão e armazenamento seguro, origens/CORS/CSRF conforme o cliente, renovação/revogação, deep links/universal links/app links, retorno pós-login, botão voltar, teclado e safe areas, câmera/galeria, uploads, retomada, permissões, compartilhamento e push nativo. Não habilite navegação arbitrária no contêiner nem transporte service role para o aparelho. Revalide acesso e privacidade entre web e cliente móvel.

Gere builds de release reproduzíveis para iOS e Android, com identificadores reais, versionamento, assinatura e documentação de custódia das chaves. Use as contas de desenvolvedor e serviços já autorizados; não compre serviços ou invente certificados. Se faltarem macOS/Xcode, certificados, conta ou acesso a aparelho, deixe código e build Android que puder validar prontos e registre o bloqueio exato de iOS. Não declare um binário assinado se ele não foi gerado.

Confira documentação oficial atual de Apple e Google no momento da preparação. Verifique SDK/target API exigidos, teste fechado aplicável à conta, requisitos de UGC, denúncia/bloqueio, exclusão de conta dentro do app e caminho externo exigido, classificação etária e segurança infantil para apps sociais. Prepare termos/diretrizes, aceite, política de privacidade factual, contato de suporte, inventário de dados, formulários de privacidade/Data Safety, nome/subtítulo/descrição, ícones e capturas dos fluxos reais. Dados legais, público etário e responsável de segurança dependem de informações reais do operador.

Prepare um modo de acesso legítimo para revisão das lojas com conteúdo de teste identificado, sem segredos no repositório. Teste instalação limpa, atualização sobre versão anterior, login/recuperação, links, mídia, envio/push, moderação, exportação/exclusão e perda de rede. Use TestFlight e teste interno/fechado do Play quando houver contas e autorização adequadas. Um contêiner instalável não garante aprovação; concluído, submetido, aprovado e publicado são estados diferentes.

## 7. Operação, revisão e critério de término

Proteja contas, publicações, comentários, fotos, vídeos, comunidades e jogos existentes. Migrations devem ser versionadas, aditivas quando possível e revisadas. Nunca resete ou aplique seed sobre dados reais para preparar a release. Use `scripts/content-preservation.mjs` para inventários privados antes/depois e confira visibilidade além de contagem. Backups e conteúdo de usuários não entram no Git. Verifique restauração controlada e rollback coerente entre versão, banco e flags.

Conclua monitoramento, erros úteis sem dados pessoais, saúde de banco/Auth, fila de push, alertas, responsável por incidentes e limites de custo. Não aumente plano, retenção ou infraestrutura paga sem decisão específica. Reutilize o processo oficial de deploy e respeite a proteção da main: PR, CI e revisão do diff. Não crie dezenas de documentos de recibo como substituto de funcionalidade; mantenha uma fonte corrente curta.

Por fatia, execute testes que exercitem o comportamento e risco alterados. No fechamento, cumpra lint, typecheck, testes pertinentes, build e CI exigidos. No checkpoint de 18/09, a suíte local e o build demo são evidências próprias; é preciso acrescentar o que depende de serviços, navegador e aparelhos. Reconcile `pending-functions.ts` com tipos realmente gerados do banco após aplicar as migrations. Não edite tipos hospedados para aparentar que a migração já aconteceu.

Mantenha uma matriz por jornada com quatro estados: **implementado**, **validado localmente**, **validado com serviços/aparelhos reais**, **publicado**. Registre ambiente, commit, evidência, limitação e pendência. Falta de credencial ou período de teste não equivale a aprovação. Se um requisito estiver bloqueado, conclua o restante e entregue a menor ação concreta que permita continuar.

A versão está **pronta para publicação** quando:

- Cadastro, recuperação definida e comprovada, perfil, descoberta, conexão, mensagens, notificações, feed/mídia, bloqueio/denúncia e direitos da conta passam nas jornadas de aceite com serviços reais.
- Builds de release instaláveis e assinados para as plataformas disponíveis foram testados em aparelhos; a plataforma pendente permanece explicitamente bloqueada.
- Acessibilidade e desempenho dos fluxos essenciais têm evidências e não existem defeitos críticos conhecidos sem resolução.
- Migrations, preservação, backup/restore, monitoramento e plano de correção estão operacionais e verificáveis.
- Fichas das lojas, capturas, políticas, contato, formulários e acesso de revisão correspondem ao app entregue, sem dados inventados.
- Cada pendência externa está identificada; o estado não é chamado de pronto enquanto uma condição obrigatória continua ausente.

Desenvolva até esses critérios com persistência. Deixe publicação pública e submissão final das lojas como última ação, após minha revisão do pacote concreto, a menos que eu já tenha autorizado expressamente essa ação na sessão. Não repita pedidos de permissão já respondidos. Na falta de autorização para enviar convites, contratar serviços ou publicar, prepare o material e continue as demais tarefas.

No final entregue: o que mudou para o jogador, commits/PRs, matriz de testes com limites, builds e assets disponíveis, estado exato dos serviços e migrations, pendências externas, roteiro preciso de submissão/publicação e próximos experimentos de produto. Não encerre apenas com um plano, telas demonstrativas ou a frase de que está pronto para continuar.

Mantenha em backlog, fora desta versão sem evidência ou decisão adicional: IA, voz, pagamentos, reservas, B2B, anúncios, rankings avançados, conversas em grupo/anexos complexos e localização contínua. Jogos continuam um diário retrospectivo privado; compartilhar é uma ação separada com audiência explícita. Nunca transforme o histórico em presença ao vivo.

## Referências a conferir durante a execução

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).
- [Apple Upcoming Requirements](https://developer.apple.com/news/upcoming-requirements/).
- [Google Play: UGC](https://support.google.com/googleplay/android-developer/answer/9876937?hl=en).
- [Google Play: exclusão de conta](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en).
- [Google Play: segurança infantil em apps sociais](https://support.google.com/googleplay/android-developer/answer/14747720?hl=en).
- [Google Play: teste de contas pessoais novas](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).
- [Google Play: target API](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en).
- [WebKit: Web Push em iOS/iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).
- [Capacitor: configuração](https://capacitorjs.com/docs/config).
- [Core Web Vitals](https://web.dev/articles/vitals).

---

Fim do prompt. Documentos e caminhos refletem o checkpoint de 18/09/2026; a primeira obrigação do Codex é reconciliá-los com o repositório e a implantação atuais.
