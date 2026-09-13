# Segurança e preparação do beta — 13/09/2026

## Decisão e prontidão

O responsável confirmou entrada pelo link e cadastro, sem convite individual nem aprovação manual. O e-mail precisa ser confirmado. A distribuição restrita do link limita a divulgação, mas não impede que ele seja encaminhado. Contas existentes, suspensões, revogações e audiências permanecem preservadas.

A rodada reforça o aplicativo e sua infraestrutura. **Ainda não liberar novos participantes:** o responsável informou que não tem domínio nem provedor de e-mail; responsável público, canal de privacidade e custódia externa dos backups também não foram definidos. Publicar as correções não encerra essas pendências.

## O que foi examinado e corrigido

| Área | Evidência ou mudança |
| --- | --- |
| Repositório público | Auditoria de 1.504 blobs históricos por valores protegidos conhecidos e padrões de credenciais; nenhum achado. Auditoria dos arquivos atuais e bundles também executada. Não é prova de inexistência de qualquer segredo desconhecido ou de cópias externas. |
| Proteção do GitHub | Secret scanning, push protection, alertas e atualizações de segurança do Dependabot ativados e confirmados pela API. Zero alertas abertos na consulta. A CI passa a recusar vulnerabilidades altas/críticas pelo npm audit. |
| Senhas | Principal: nenhuma coluna pública de credenciais; Auth não é legível por anon/authenticated; auditoria agregada confirma hashes bcrypt. Não foram lidas nem impressas senhas ou hashes individuais. Mínimo de 12 caracteres, confirmação de e-mail e troca segura já configurados no provedor. |
| Autorização | 26 tabelas públicas com RLS; nenhuma função SECURITY DEFINER da aplicação sem search_path vazio; buckets de fotos privados. APIs verificam getUser, origem e corpo; RPCs verificam autoridade e audiência atuais. |
| Navegador | CSP com nonce diferente por documento, scripts de origem confiável, destinos de conexão restritos e bloqueio de scripts inline não autorizados. HTML é dinâmico e sem cache para não reutilizar nonce. Estilos inline e WebAssembly permanecem permitidos para recorte/HEIC, sem liberar eval JavaScript na produção. Sensores não usados pelo produto ficam desabilitados por Permissions-Policy. |
| Continuidade da tela | Corrigida uma corrida: carregar preferências do tutorial não recria formulários em uso. Mudanças entre contas conhecidas continuam descartando a árvore antiga; preferências só aparecem para a chave carregada. |
| Transporte do banco | Auditoria encontrou exigência de TLS desativada. TLS obrigatório ativado e confirmado no desenvolvimento e no principal. O aplicativo já acessa Auth/Data API/Storage por HTTPS. Conferir recibo de infraestrutura para o estado aplicado. |
| Download dos dados | Em Conta e Acesso, inclusive sem admissão social: nova senha verificada em cliente isolado; id vem exclusivamente de getUser. RPC disponível só ao servidor. Arquivo com perfil, dados autorais, participações, interações e jogos; nenhuma credencial ou conteúdo de outro autor. Fotos são referências, sem bytes. Limite de três exportações/hora; arquivos acima de 5.000 registros por seção ou 8 MiB são recusados explicitamente para atendimento assistido, nunca truncados em silêncio. |
| Exclusão | Formulário aceita senha legada válida. Limpeza remove páginas de Storage desde o início, com limite por tentativa e retomada; não deixa fotos além da primeira página. Remove convites recebidos por aquele e-mail e anonimiza referências diretas do titular na auditoria. O último administrador precisa transferir a responsabilidade antes de iniciar, preservando uma operação responsável pelo serviço. |
| Dados existentes | Migration aditiva, sem transformação/apagamento de contas reais. Backup cifrado antes da aplicação principal, inventário e artefato anterior para rollback. |

O hash bcrypt é uma representação unidirecional usada para verificar a senha. O repositório contém código e configurações públicas, não o banco Auth. Quem obtiver acesso administrativo ao provedor ou uma chave secreta pode comprometer dados; a proteção dessas contas operacionais continua essencial. [Supabase: senhas](https://supabase.com/docs/guides/auth/password-security) e [chaves](https://supabase.com/docs/guides/getting-started/api-keys).

Cookies de sessão são Secure/SameSite no principal e acessíveis ao SDK no navegador; não são HttpOnly. CSP reforça a defesa contra injeção, mas não substitui escapar conteúdo, RLS ou proteção da conta. Logout revoga renovação; tokens já emitidos expiram segundo o provedor. Suspensão/exclusão usam também o estado atual no banco. Não há cache offline privado ou fila de escritas.

## Estabilidade e limites

Arquitetura atual: Vercel hospeda o Next; Supabase gerencia Auth, Postgres e Storage. Não depende do computador do responsável estar ligado. APIs têm timeout de backend, paginação limitada e quotas transacionais para escrita; republicações e compartilhamento de jogos têm idempotência. Nenhuma conexão PostgreSQL por visitante é criada no navegador: a aplicação usa a Data API.

O ensaio desta rodada usa oito contas distintas, oito requisições simultâneas e 96 leituras de feed, perfil e jogos. Verifica identidade em respostas concorrentes e oito tentativas simultâneas da mesma republicação. Roda contra o Next compilado local e o Supabase de desenvolvimento, com dados pequenos. As medições ficam em `security-review/result.json`; não representam benchmark da Vercel, teste de longa duração, disponibilidade garantida ou base grande. O principal recebe somente smoke de leitura e conferência de configuração.

Antes da divulgação, conferir plano contratado e risco de pausa por inatividade. Projetos Free podem ser pausados após baixa atividade, segundo o [checklist do Supabase](https://supabase.com/docs/guides/deployment/going-into-prod). Nenhum upgrade foi contratado nesta rodada. Configurar autenticação multifator das contas administrativas e guardar recuperação fora deste computador; estado de MFA do operador não foi comprovado pela API disponível. Não limitar IPs do banco a um endereço móvel presumido: planejar endereços administrativos estáveis, sem bloquear manutenção e backup.

## Dados pessoais e direitos

Inventário mínimo de tratamento:

| Conjunto | Finalidade e acesso | Retirada/controle |
| --- | --- | --- |
| E-mail e autenticação | Acesso e recuperação; Auth e operação autorizada | Exclusão da identidade; jamais exportar hashes/tokens ao titular |
| Perfil e esportes | Identificação e descoberta entre contas ativas | Edição, download e exclusão |
| Publicações, fotos e interações | Compartilhamento solicitado na audiência escolhida | Remover conteúdo; desfazer republicação/conexão; bloquear |
| Comunidades e arenas | Participação e gestão com papéis próprios | Saída, pedidos e transferência/custódia de recursos |
| Jogos e legado | Registro privado retrospectivo | Editar/excluir; compartilhar exige ação separada |
| Denúncias e auditoria | Segurança, moderação e prestação de contas | Acesso restrito, minimização e atendimento do titular |
| Sessão e logs técnicos | Funcionamento e diagnóstico | Sem publicidade; logs da aplicação sem corpo, URL, senha ou e-mail |

O aviso em `/privacidade` explica finalidades, audiências, republicações, fornecedores, direitos e limites. O banco está em São Paulo; isso não garante que todo processamento técnico dos fornecedores ocorra no Brasil. O controlador deve validar contratos, transferências internacionais e retenções dos fornecedores.

A LGPD exige transparência e atendimento dos direitos, além de medidas técnicas. A definição das bases legais por finalidade e das retenções precisa ser aprovada pelo controlador; não declarar conformidade somente por ter RLS ou um aviso. Cadastro/serviço e segurança devem ter suas bases documentadas; eventual consentimento precisa ser específico e revogável quando aplicável. Não acrescentar consentimento genérico obrigatório como substituto dessa avaliação. Definir o público etário e requisitos para menores antes de recebê-los. [LGPD, arts. 6–9, 14, 18–19 e 46](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).

Pendências concretas do responsável: informar controlador e canal público real (`NEXT_PUBLIC_PRIVACY_CONTROLLER` e `NEXT_PUBLIC_PRIVACY_CONTACT`), aprovar bases e retenção, revisar contratos dos fornecedores e definir quem atende solicitações. O benefício regulatório de pequeno porte não é presumido; mesmo quando houver dispensa de encarregado, continua necessário um canal para o titular. [Orientações da ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-frequentes).

Procedimento de atendimento: receber o pedido no canal definido; registrar data/tipo e responsável em local privado; verificar identidade com o mínimo necessário, sem pedir senha; atender pelo aplicativo ou preparar cópia complementar, inclusive imagens quando solicitadas; documentar resposta, fundamento de eventual retenção e encerramento. O download automático complementa esse atendimento. Não prometer que ele contém logs gerenciados pelos fornecedores ou que apaga cópias de terceiros.

## Operação e resposta a falhas

1. Antes de abrir: concluir SMTP e testar entrega em duas caixas controladas, confirmação/reenvio/recuperação e abertura no celular. O envio padrão do Supabase é restrito e não serve ao cadastro geral. [Configuração](EMAIL_SETUP.md), [restrições oficiais](https://supabase.com/docs/guides/auth/auth-smtp).
2. Guardar backup cifrado e chave em locais separados e definir cópia externa, retenção e responsável. A cópia local desta rodada e o ensaio de restauração anterior não equivalem a backup automático operante. [Continuidade](CONTINUITY.md).
3. Durante o beta, verificar erros 5xx, latência p95, quotas e disponibilidade nos painéis Vercel/Supabase. Investigar qualquer quebra de isolamento imediatamente; investigar erros sustentados acima de 1% ou p95 acima de 5 s, comparando janela e volume. São gatilhos operacionais propostos, não um SLA medido.
4. Falha após release: interromper divulgação; não apagar dados. Se for código, voltar ao artefato compatível anterior `06f172880a6e`, no mesmo projeto, e confirmar `/api/version`. Manter a migration aditiva e TLS; corrigir por PR, sem reset/downgrade do banco. Em suspeita de exposição, conter o acesso afetado e revogar a credencial comprometida, preservando evidência mínima privada.
5. Incidente com dados pessoais: registrar quando foi conhecido, alcance, dados envolvidos, contenção e responsável. Avaliar risco/dano relevante e dever de comunicação. A regra geral da ANPD prevê três dias úteis; verificar o regime aplicável e não esperar a investigação inteira para avaliar comunicação. Nunca publicar senhas, dados das vítimas ou evidências brutas em issues. [ANPD: comunicação de incidente](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis).

Esta é uma revisão técnica com medidas implementadas e pendências identificadas, não uma certificação jurídica nem uma promessa de risco zero. A primeira conferência de identidade logo após a migration recebeu uma resposta transitória indisponível e a guarda recusou a operação. A nova consulta confirmou o projeto correto; a comparação posterior preservou as 37 tabelas, uma identidade e três arquivos existentes. Recibo da publicação e estado das configurações em `.vercel/security-release.json`; CI e revisão no PR associado.
