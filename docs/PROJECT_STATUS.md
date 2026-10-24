# Estado do Pico Social em 23/10/2026

Este documento é a entrada para continuar o trabalho em outro ambiente. Sintetiza código, recibos e decisões recuperadas das conversas; prioridades e execução permanecem no [plano corrente](pico-product-plan.md). Setup e fluxo de contribuição estão em [CONTRIBUTING.md](../CONTRIBUTING.md).

## Produto e decisões vigentes

Pico Social aproxima praticantes de futevôlei, beach tennis e vôlei de praia por pessoas, arenas e comunidades. A identidade é Aura Manteiga: Syne/Manrope, Manteiga/Cacau/Papel/Lavanda, claro editorial e escuro próprio. A capa histórica Pico Club continua sendo o ativo de instalação até revisão explícita. Fontes canônicas: [contexto](pico-company-context.md), [manual e ativos](brand-exploration/aura-manteiga/README.md) e [design system](pico-design-system.md).

Jogos são registros retrospectivos privados. Compartilhar exige ação separada, audiência e destinos explícitos; editar/excluir um jogo não altera uma publicação já criada. Perfil inicial, aviso institucional e tutorial opcional são etapas distintas. Cadastro conectado continua com e-mail e senha, sem confirmação/SMTP por decisão do responsável; recuperação por e-mail não está operacional. Suspensão, revogação, exclusão, bloqueios e audiências continuam protegidos.

Não estão no MVP: IA/voz, reservas, pagamentos, anúncios, B2B, ranking avançado, presença ou mapa em tempo real e localização contínua. A transição móvel preserva a PWA; o trabalho atual prioriza iPhone e mantém Android pausado.

## Implementação, publicação e limites

| Área | Estado e evidência | Próximo gate |
| --- | --- | --- |
| Web/PWA e API | Núcleo social, comunidades, arenas, perfil, mídia privada, jogos, direitos da conta e guia implementados. Última revisão servida confirmada nesta rodada: `7d5a7afd17a6`. | Recuperar disponibilidade conectada e validar jornadas com contas controladas. |
| Infraestrutura principal | Consulta pública pontual de 23/10: `/api/version` HTTP 200; `/api/health` HTTP 503, `database=false`, `auth=false`. A resposta não identifica a causa. | Responsável/operador verificar Supabase e restabelecer saúde; não inferir perda de dados. |
| Banco | Último recibo de 28/09 registra 49 migrations no principal e 131/131 identidades de conteúdo preservadas. Desenvolvimento não foi declarado sincronizado. | Conferir ledger/saúde antes de operar; o recibo anterior não é nova auditoria do banco. |
| Cliente conectado iOS | React/TypeScript local em Capacitor 8, API Bearer, refresh token no Keychain, build e Simulator documentados. | Assinatura, iPhone físico, matriz de privacidade/mídia e distribuição. |
| Espaço privado iPhone | Commit `ded13ea`: perfil, arenas próprias e jogos sem conta/nuvem; arquivo protegido e excluído de backup, exportação explícita, recuperação de erro e apagamento confirmado. | Ensaio físico de bloqueio, persistência, share sheet e acessibilidade. Sair/reabrir conserva o arquivo; desinstalar não tem garantia de conservação. |
| Mensagens e push | Código/schema integrados; último recibo mantém DMs e Web Push desligados. Não há APNs nem conversa no cliente iOS. | Moderação, retenção, configuração e validação controlada antes de qualquer ativação. |
| Intenção social e medição | Compartilhamento contextual publicado; aviso de acompanhamento e coleta própria permanecem sob gates fechados no último recibo. | Duas contas controladas; finalidade/retenção, operadores e jobs monitorados antes da coleta. |
| Lojas | Projeto e pacote editorial preparados; preflight histórico 7/16, nove gates humanos. Sem build assinada, TestFlight ou App Store comprovados. | Identidade publicadora, contatos/políticas, domínio/bundle, conta Apple, assinatura e aparelho. |

O modo privado do iPhone é um produto local persistente, distinto da demo web em memória. Não sincroniza dados automaticamente nem simula terceiros. Vídeo MP4 de até 45 MiB existe na web; criação/publicação de vídeo pelo cliente iOS 1.0 continua desabilitada. [Mobile e matriz física](MOBILE_APP.md), [contratos de domínio](pico-domains.md), [mensuração](PRODUCT_MEASUREMENT.md) e [push](PUSH_NOTIFICATIONS.md) detalham os limites.

## Organização do trabalho restante

As conversas organizaram a evolução em três frentes: produto/desenvolvimento; legal, domínio, operação e publicação; distribuição e comunidade. A execução autorizada da Frente 1 está no plano e no [recibo de setembro](PRODUCT_MEASUREMENT.md#recibo-da-janela-de-28092026). Números de piloto, orçamento, recorte etário e política de retenção discutidos como proposta não se tornam decisões aprovadas nesta consolidação.

1. Restabelecer a disponibilidade conectada e retomar o smoke com duas contas controladas, mantendo as flags fechadas.
2. Instalar e validar a build em iPhone físico com assinatura do responsável; fechar a matriz do [plano móvel](MOBILE_APP.md).
3. Resolver contatos, responsável legal, recuperação, antiabuso e operação de moderação antes de distribuição ampla.
4. Só então avaliar ativações de mensagens, push/métricas e preparação de submissão conforme os gates existentes.

Relatórios e monitoramento não devem ser presumidos ativos: as conversas **Report Pico** e **Revisar segurança e estabilidade** registram pedidos explícitos de interromper o relatório diário e as requisições periódicas. Esta rodada não reativou automações nem comprovou monitor externo. O roteiro de [disponibilidade](AVAILABILITY.md) é uma referência operacional.

## O que esta consolidação preserva

A linha de base remota era `fb85d7c` (PR #46); o único commit da branch de trabalho ainda ausente dos remotes era `ded13ea`, de 18/10. A integração acrescenta esse trabalho, setup portátil, requisitos Node/npm, CI alinhada ao lockfile e uma correção do snapshot de arena no diário local. `zod`, dependência de desenvolvimento transitiva, foi atualizado de 4.6.5 para 4.6.7 para remover o achado alto do audit, sem downgrade do Capacitor. Next.js/ESLint 16.4.2 já fazem parte do commit móvel e são posteriores à proposta antiga do Dependabot #47.

Código, testes, migrations, tipos, fontes, mestres de marca, projetos nativos, scripts e skills locais são versionados. Credenciais, dados de usuários, backups, SDKs, caches, certificados e builds de distribuição continuam fora do Git. Materiais externos de campanha e landing têm um [inventário de recuperação](EXTERNAL_MATERIALS.md), com limites explícitos quando as fontes originais não foram encontradas.

Esta atualização do GitHub não publica Vercel, não aplica migrations, não altera Auth/flags e não distribui aplicativo. Consulte [changelog](CHANGELOG.md) e a seção de consolidação no [plano](pico-product-plan.md) para o fechamento dos checks e PR. Não confundir a revisão da `main` com a revisão servida pelo site.
