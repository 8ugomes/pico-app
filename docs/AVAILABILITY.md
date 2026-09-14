# Disponibilidade do Pico

## Checagem publicada

`GET https://pico-app-sepia.vercel.app/api/health` responde 200 apenas quando a identidade do banco corresponde ao ambiente registrado e o serviço de Auth responde com autenticação por e-mail habilitada. Resposta mínima: `status`, `checkedAt` e booleanos `checks.database`/`checks.auth`. A própria resposta comprova que a função da aplicação executou. Não comprova cadastro/login de ponta a ponta, Storage, entrega de e-mail, RLS completa, capacidade de carga nem ausência de falhas na interface.

Configuração ausente, demo, identidade divergente, resposta inválida, erro HTTP ou timeout resultam em 503. Duas leituras paralelas limitadas a seis segundos: RPC de identidade somente de leitura com chave pública e configuração pública de Auth. Sem sessão, login, usuário de teste, secret/service role, consultas a conteúdo ou gravações. Não expõe credenciais, URLs internas nem erros recebidos. Não lê parâmetros, cookies ou cabeçalhos do visitante para escolher destino/credenciais.

HTTP `Cache-Control: no-store`; requisições simultâneas compartilham o trabalho e um resultado de até 30 segundos por processo. Instâncias diferentes mantêm caches independentes; isso reduz repetição, mas não é um limite global de requisições. O monitor de cinco minutos observa dados novos em cada rodada normal. Respostas não são armazenadas pela PWA.

## Monitor externo gratuito

Usar o UptimeRobot **Free**, monitor HTTP(s), intervalo de cinco minutos e URL acima. Alertas de queda e recuperação são enviados pelo provedor ao e-mail escolhido pelo responsável; não exigem SMTP no Pico. Plano gratuito, sem cartão, trial pago ou upgrade. As chamadas contam nas franquias existentes da Vercel/Supabase; o monitor não contrata nem amplia esses planos e não executa IA/Codex.

Volume nominal: 288 chamadas à aplicação por dia, com até 576 leituras Supabase originadas por essas chamadas, mais eventuais confirmações de falha do provedor. Isso não representa todas as requisições da aplicação nem garantia de isenção de cobrança fora dos limites existentes.

Fluxo documentado do provedor: desafio de proof-of-work associado ao e-mail e URL, solicitação para `/agentic/agent-monitor`, link por e-mail e confirmação **Activate** pelo responsável. HTTP 200 na solicitação é resposta antienumeração e **não comprova** envio, criação ou ativação. O monitor só existe após confirmação bem-sucedida; verificar no painel a URL, intervalo, contato e primeiro resultado. Não registrar e-mail nem link/token de ativação no Git.

Enquanto a ativação não for comprovada, o heartbeat local `verificar-disponibilidade-do-pico` permanece ativo para evitar lacuna. Após confirmar a checagem externa, pausar esse heartbeat pelo gerenciamento de automações do Codex. O monitor externo segue independente do computador e do aplicativo Codex abertos. Não usar este chat como retransmissor dos alertas.

Estado nesta revisão: rota implementada; ativação externa pendente do e-mail e da confirmação do responsável. Evidência final de publicação/ativação fica no recibo operacional privado e na comunicação da entrega. Não interpretar o presente roteiro como comprovação de monitor já ativo.

## Verificação e retorno

Testes locais cobrem sucesso, configuração ausente, identidade divergente, Auth indisponível, corpos inválidos, sanitização, timeout, coalescência, expiração, falha e recuperação. Conferir 200 no artefato Production e domínio principal, `checkedAt`, método GET/HEAD e rejeição de métodos de gravação. O build demo deve retornar 503 nesse endpoint, sem acessar Supabase.

Publicar por PR/CI/main e `scripts/deploy.mjs --stage`, que compara IDs e hashes de conteúdo antes/depois. Não há migration ou mudança de Auth. Antes de promover, conferir o `/api/version` e o `/api/health` do artefato. Se houver regressão da nova rota com dependências saudáveis, manter o artefato anterior publicado e corrigir antes de ativar o monitor. Se a dependência real falhar, não transformar a resposta em sucesso para silenciar alerta; verificar o serviço correspondente.

## Referências

- [Plano gratuito do UptimeRobot](https://help.uptimerobot.com/en/articles/11604710-who-should-use-uptimerobot-s-free-plan): até 50 monitores e checagens de cinco minutos, inclusive uso comercial; consultado em 13/09/2026.
- [Ativação por agentes e contrato HTTP](https://uptimerobot.com/quick-monitor-setup/).
- [Operação e destinos](ENVIRONMENTS.md), [auditoria anterior](STABILITY_REVIEW.md).
