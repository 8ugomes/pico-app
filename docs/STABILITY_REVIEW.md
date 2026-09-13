# Estabilidade da beta — 13/09/2026

## Resultado e escopo

Revisão baseada na main publicada `48b5e520b080`, em cópia isolada, preservando os commits locais da landing. O app usa **Vercel + Supabase**. A busca nos arquivos, configurações e em todas as refs do histórico Git não encontrou URL, manifesto ou variável de Render. Isso não prova inexistência de um serviço fora do repositório; não há destino Render conhecido para configurar.

A configuração principal já aceita cadastro com e-mail e senha sem confirmação, conforme decisão expressa do responsável. Nenhum SMTP foi configurado. A única propriedade remota alterada foi `auth.email.enable_confirmations`, de true para false; leitura posterior de `/auth/v1/settings` confirmou `mailer_autoconfirm=true`, e-mail habilitado e cadastro habilitado. Uma conta existente e 24 migrations foram preservadas; nenhuma conta principal foi criada/removida pelo teste.

Código de entrada preparado: retirar promessa de confirmação, explicar indisponibilidade de recuperação e impedir pedido de envio sem provedor. Falhas de rede no cliente Supabase e na consulta de admissão agora têm limite de 15 segundos por requisição. Os fluxos de erro permitem tentar novamente. A publicação efetiva precisa ser conferida pelo SHA de `/api/version`; o recibo local fica em `.vercel/stability-release.json` após concluir o release.

## Segurança: senhas, e-mails e acesso

| Verificação | Evidência atual |
| --- | --- |
| Senhas | Ficam no Supabase Auth, em `auth.users.encrypted_password`, como hash bcrypt. Auditoria agregada: zero valores fora do formato bcrypt; nenhum hash individual lido ou divulgado. Mínimo de 12 caracteres, limite de 72 bytes na interface e troca segura preservados. |
| E-mails | Ficam no Auth; convites direcionados também podem guardar e-mail em schema privado. Não há coluna de e-mail/senha/token nas 26 tabelas públicas. O titular recebe o próprio e-mail na exportação reautenticada. Perfis sociais não expõem endereços de terceiros. |
| RLS e funções | 26/26 tabelas públicas com RLS. Zero funções SECURITY DEFINER da aplicação sem search_path vazio. Testes com identidades distintas, acesso direto à Data API e papéis distintos. |
| Auth e Storage | `anon` e `authenticated` sem leitura de `auth.users`; nenhum bucket público. Leitura de fotos passa por autorização atual antes do download administrativo; upload valida formato, tamanho, pixels e proprietário. |
| Transporte/sessão | HTTPS; TLS do PostgreSQL exigido. Cookies Secure/SameSite no principal, acessíveis ao SDK do navegador. Nonce/CSP, proteção contra framing, resposta privada sem cache e origem nas mutações. |
| Segredos/dependências | 836 caminhos versionados, 49 bundles públicos e 1.610 blobs históricos examinados por valores protegidos conhecidos/padrões: nenhum achado. `npm audit`: zero vulnerabilidades reportadas. Não equivale a prova universal de inexistência de falhas. |
| Autoria/dados privados | Jogos continuam privados; publicação/republicação respeita audiência e bloqueios. Exportação/exclusão exige nova verificação de senha; testes de acesso indevido e exclusão de 101 fotos passaram. |

**Política sem confirmação:** o endereço é autodeclarado. O Supabase marca novos usuários como autoconfirmados; esse timestamp não comprova posse da caixa postal. Não usar o e-mail como prova independente de identidade. O login continua exigindo senha; suspensões/revogações/exclusões e RLS permanecem. O link pode ser encaminhado e o cadastro não é uma allowlist. Recuperação automática e alterações que dependam de entrega de e-mail ficam indisponíveis nesta beta. Não entregar acesso a alguém apenas por alegar ser dono de um endereço.

## Capacidade medida

Next em build de produção no Mac local, Supabase exclusivo de desenvolvimento, 16 identidades controladas, 16 publicações pequenas e leitura alternada de feed/perfil/jogos. Três etapas de 30 segundos, com ritmo de chegada definido, limite de 32 requisições em andamento e interrupção em falha. Conta criada pelo signup normal obteve sessão imediata. Todas as contas e publicações do ensaio foram removidas depois.

| Ritmo solicitado | Requisições concluídas | Erros/descartes | p95 | Maior concorrência observada |
| --- | ---: | --- | ---: | ---: |
| 5 req/s | 150 | 0 / 0 | 266 ms | 2 |
| 15 req/s | 450 | 0 / 0 | 689 ms | 13 |
| 30 req/s | 900 | 0 / 0 | 164 ms | 6 |

**1.500 requisições concluídas, zero erros, zero descarte e nenhuma troca de identidade nas respostas de perfil.** No último estágio: 29,96 respostas/s. A latência pode diminuir com aquecimento de caches ou variar pela rede; estes estágios curtos não estabelecem uma curva de saturação. [Dados por rota](stability-review/capacity.json).

Isto comprova o cenário ensaiado a 30 req/s; **não mede o máximo**, não equivale a 30 usuários simultâneos e não garante capacidade da Vercel. Uma navegação faz várias requisições e fotos têm custo diferente. Não foi feito teste de saturação, longa duração, geografia móvel ou milhares de registros. O principal recebeu smoke de leitura, sem carga destrutiva. A quantidade de convidados esperados não foi informada.

O ensaio adicional de segurança fez 96 leituras com oito clientes concorrentes, p95 de 187 ms, e oito republicações simultâneas idempotentes. [Evidência](stability-review/security.json).

## Infraestrutura real

- Vercel: projeto `pico-app`, plano Hobby ativo, Fluid Compute, região `gru1` (São Paulo), Node 24. A instância de função pode mudar entre requisições; um ping não garante que cada execução futura esteja aquecida.
- Supabase principal e desenvolvimento: `ACTIVE_HEALTHY`, região São Paulo. Principal com banco de aproximadamente 13,5 MiB, `max_connections=60`, 16 conexões no snapshot, zero espera por lock e zero deadlocks acumulados no snapshot. Cache de índices 99% e tabelas 100%. **60 conexões não significa 60 usuários**: o app usa Data API/pooling. O plano de cobrança/compute contratado no Supabase não foi comprovado pela consulta disponível.
- Smoke publicado: 12 páginas sem 5xx (a raiz redireciona para o feed); sete APIs privadas recusaram chamadas sem sessão com 401. Todas as páginas tinham CSP e no-store. [Resultados](stability-review/public-smoke.json).

Limites dependem do plano, região, tamanho da base e mistura de operações. Consultar [Vercel Functions](https://vercel.com/docs/functions/limitations) e [Supabase Performance](https://supabase.com/docs/guides/platform/performance); não confundir quotas comerciais com throughput medido. Fotos privadas passam pela aplicação e não foram incluídas na carga de leitura; tráfego de imagens e invocações precisam ser acompanhados nos painéis durante a beta.

## Monitor a cada 10 minutos

Automação Codex **Verificar disponibilidade do Pico**, ativa, consulta três endpoints reais através de `scripts/check-availability.mjs`: versão do app, identidade do banco e configurações públicas de Auth. Cada leitura tem timeout de 12 segundos. Não faz login, cria usuários ou divulga credenciais. Repete uma vez diante de falha; avisa se persistir e quando recuperar, mantendo silêncio enquanto saudável.

O agendamento executa nesta máquina pelo Codex: depende do aplicativo e do computador disponíveis. É um monitor de disponibilidade; não é SLA nem substitui monitor externo 24/7. [Documentação de tarefas agendadas](https://developers.openai.com/codex/app/automations).

O [Render gratuito](https://render.com/docs/free) suspende web services após 15 minutos sem tráfego recebido, com reinício de cerca de um minuto. Um GET real a cada 10 minutos fica abaixo desse intervalo; `/robots.txt` não acorda um serviço dormindo. Há 750 horas gratuitas compartilhadas por workspace/mês, reinícios possíveis e suspensão ao esgotar quotas. Nenhum ping pode garantir disponibilidade permanente nessas condições. Como o repositório não usa Render, nenhum URL Render foi inventado e nenhuma configuração da plataforma foi alterada.

## Verificação e operação

- 99 testes locais aprovados na base da produção; lint, typecheck e build aprovados.
- 211 verificações hospedadas de Auth/Data API/Storage/HTTP, 403 de segurança e 101 de autenticação/comunidade oficial aprovadas no desenvolvimento, com limpeza dos dados controlados.
- Revisão em navegador de cadastro/recuperação sem promessa de envio, controles carregados e sem erros JavaScript observados. Teste histórico de Auth precisava incluir a foto obrigatória do perfil introduzida na main; fixture corrigida para usar o upload real, sem enfraquecer o contrato.
- Nenhuma migration/RLS/papel alterado; auditoria posterior preservou a conta, operador, schemas e buckets do principal.
- Aparelhos físicos, perda prolongada de rede, carga de imagens e o teto de capacidade continuam sem validação nesta rodada. Backups fora desta máquina e MFA administrativo não foram revalidados.

Para repetir: iniciar `npm run build && npm run start -- --port 3002` com desenvolvimento e executar `node --env-file=.env.local --env-file=.env.hosted-admin tests/hosted-capacity.mjs`. O guard recusa o principal. Os resultados e IDs de limpeza ficam em `.vercel/stability/`, ignorado pelo Git.

Rollback de código: deployment anterior `dpl_zvXAQzF9rQmYiPq1bzEun2peR2Gd` / revisão `48b5e520b080`, mesmo projeto Vercel. A política Auth é independente do código: reativar confirmação requer revisar entrega de e-mail; não apagar contas autoconfirmadas nem modificar hashes. Investigar falhas de isolamento imediatamente; falhas persistentes/5xx e p95 acima de 5 segundos exigem interromper divulgação e diagnosticar, sem reset de banco.
