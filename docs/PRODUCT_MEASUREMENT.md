# Medição de produto e compartilhamento contextual

Estado em 28/09/2026: **implementado localmente, coleta desligada e não aplicada ao banco hospedado**.

## Fronteira de privacidade

A migration `20260927130000_product_measurement.sql` cria uma área privada sem leitura por `anon` ou `authenticated`. O gate autoritativo do banco, `pico_private.product_measurement_settings.enabled`, governa os triggers transacionais e toda persistência de eventos. Ele só abre quando finalidade, responsável, início e retenção estão vigentes, a rotina de retenção foi verificada, a última purga ocorreu nas 26 horas anteriores e o produtor da aplicação comprovou saúde pelo protocolo esperado nos últimos 15 minutos. Escritores seguram as linhas desses gates com lock compartilhado antes do `INSERT`; desligamento, expiração do lease e purga não podem confirmar enquanto resta um evento anteriormente autorizado esperando para gravar.

`PICO_PRODUCT_MEASUREMENT_ENABLED=true` é um segundo controle, exclusivo do servidor, para eventos que nascem na borda da requisição, como descoberta, retorno, link preparado e convite aberto. Um agendador deve rodar `metrics:heartbeat` a cada cinco minutos, inclusive com o env desligado. O fluxo operacional fornecido chama o endpoint protegido do deployment, que acrescenta a versão compilada que realmente atende usuários; o banco exige que esse argumento coincida com `expected_edge_release`. Isso vincula o executor suportado ao artefato, mas não é attestation criptográfica: a credencial `service_role` continua poderosa e deve ficar restrita. Cada sucesso renova um lease de 15 minutos ou abre/fecha uma lacuna operacional sem enviar identificador de pessoa, requisição, aparelho ou rede. Falha sustentada, release/protocolo divergente e env desligado impedem novas gravações no banco, inclusive as derivadas por trigger, para que o relatório nunca chame uma janela parcialmente observada de completa. Escritas opcionais são agendadas depois da resposta, têm timeout e tentam abrir uma lacuna depois de falha inesperada; ausência de contato é coberta pela expiração do lease.

O estado inicial do banco é `false`, sem retenção ou aprovação; o lease da aplicação e o env também começam desligados. Aplicar o schema, isoladamente, não coleta dados. Se a manutenção diária ou o heartbeat da aplicação parar, o banco fecha novas gravações automaticamente. Não preencher nem ligar os gates até o responsável aprovar finalidade, prazo, acesso, aviso público e declarações das lojas, e até existirem agendadores monitorados para a purga e o heartbeat.

Não há SDK de analytics, cookie de atribuição, pixel, identificador de aparelho nem serviço pago. A tabela não tem JSON livre e não aceita corpo de mensagem/post, busca, senha, token, e-mail, URL, IP, user-agent, localização ou dado do aparelho. A chave de deduplicação é derivada no banco, nunca recebida do cliente. Perfis demo são recusados estruturalmente; contas de teste, suporte ou automação institucional entram em `product_measurement_exclusions` antes do ensaio.

As fontes são deliberadamente pequenas:

- cadastro vem de `profiles.created_at`;
- `profile_completed` é um evento privado e sujeito à mesma retenção dos demais eventos. Um trigger mantém no máximo um marcador na janela retida para uma transição elegível de perfil incompleto para completo enquanto o gate do banco está aberto; o perfil público não recebe coluna de analytics, e perfis já completos, conclusões durante lacunas e identidades excluídas não recebem data histórica inventada. Depois da purga, uma nova transição pode gerar nova observação, sem alterar coortes que já saíram da janela reportável;
- conexão, comentários, conversas, mensagens e aceite vêm das tabelas canônicas;
- `social_activated` nasce no banco quando uma nova conexão torna o acompanhamento mútuo; não guarda o UUID da outra pessoa e não faz backfill de relações anteriores à coleta. A deduplicação vale na janela retida: depois da purga, uma reciprocidade futura pode gerar nova observação, sem alterar coortes que já saíram da janela reportável;
- `discovery_opened` guarda só a categoria e o dia, sem UUID do perfil visitado;
- `return_active` guarda no máximo uma linha por pessoa/dia em `America/Sao_Paulo`;
- `share_prepared` guarda somente o tipo elegível e o dia, depois que a URL canônica foi validada; não significa envio;
- `invitation_opened` guarda o ID de um convite de arena/comunidade válido, vinculado previamente à própria conta destinatária. O token nunca é persistido como evento.

Eventos repetidos usam chave idempotente. A exclusão da conta remove seus eventos por cascade; a remoção do convite remove sua abertura. O download inclui o evento privado de conclusão, somente as categorias/contextos da própria pessoa e seus convites emitidos/recebidos de forma sanitizada (`direction`, escopo, papel e datas), sem token, e-mail ou UUID da contraparte. A versão canônica de `export_account_data` no banco incorpora essas seções mesmo se um chamador antigo ainda usar a função de exportação; isso não torna o fluxo antigo de convites compatível com rollback.

## Convites de escopo

Convites de gestão de arena e participação em comunidade deixam de confiar em e-mail autodeclarado: o emissor escolhe uma conta beta existente pelo `@username`, e o banco vincula o convite ao UUID exato. Emissão, abertura e aceite revalidam bloqueio bilateral, destinatário, expiração, revogação, admissão, suspensão, escopo ativo e autoridade atual do emissor. Um administrador de arena não consegue substituir indiretamente convite de `admin` que só o owner poderia revogar; substituições autorizadas deixam auditoria. Listas retornam no máximo os 100 convites mais recentes e neutralizam a identidade de uma conta bloqueada.

Os RPCs antigos baseados em e-mail perdem execução para usuários autenticados. Links antigos continuam revogáveis, mas precisam ser recriados para a conta correta. Convites de acesso geral à beta são um fluxo diferente e não entram neste funil.

## Definições do relatório

`product_metrics_snapshot(start, end, 'America/Sao_Paulo')` é acessível apenas ao `service_role`. Só aceita dias civis completos depois do início da coleta, ainda dentro da retenção e com cobertura contínua em toda a janela de observação necessária. Qualquer lacuna registrada de banco ou request-edge que intersecte o período ou sua extensão D7 torna o relatório inteiro `status=incomplete`; um lease atualmente vencido também invalida apenas janelas que ele possa ter atravessado. A lacuna nunca é tratada como zero. Fora da cobertura também retorna `status=incomplete`; gates ou manutenção fechados retornam `status=disabled`. O CLI considera esses estados falha, em vez de imprimir zeros silenciosos.

Cada célula insegura é suprimida quando a base é menor que cinco ou quando um numerador positivo ou seu complemento revelaria de uma a quatro pessoas/itens; células independentes que continuam seguras podem permanecer visíveis, e o bloco sinaliza `suppressed=true`. Tempo médio só aparece com pelo menos cinco respostas e com a célula liberada.

- **Pessoas com interação recíproca na semana:** pessoas distintas em um par que trocou mensagens nos dois sentidos ou comentários cruzados entre autores no período. Follow, curtida e instalação isolados não contam. Auto-interação, demo e identidades excluídas não entram.
- **Conclusão do perfil D7:** pessoa com `profile_completed` observado até o fim do sétimo dia civil depois do cadastro, por dia de coorte. Só entram coortes cujo D7 terminou; transições anteriores à coleta ou ocorridas durante uma lacuna deixam a cobertura incompleta, não viram zero.
- **Ativação social D7:** pessoa com `social_activated` observado até o fim do sétimo dia civil depois do cadastro, por dia de coorte. Só entram coortes cujo D7 terminou; assim todas têm a mesma janela. Não usa curtida, instalação ou perfil concluído como substituto e não reconstrói relações antigas.
- **Conversa com resposta:** conversa cuja primeira mensagem ocorreu no período. Resposta é a primeira mensagem posterior do outro participante. O relatório mostra com resposta, sem resposta e, quando seguro, média de tempo até a primeira resposta.
- **D7:** somente coortes cujo sétimo dia já terminou. Retorno conta atividade autenticada no dia civil exato `cadastro + 7` em `America/Sao_Paulo`, não uma janela móvel de 168 horas.
- **Convites:** somente convites seguros de arena/comunidade. Emitido é o denominador; abertura autenticada e aceite válido são etapas distintas. Entre aceites cuja janela já amadureceu, `socialActivatedD7` significa uma primeira conexão mútua observada nos sete dias civis completos depois do aceite. Eventos anteriores ao aceite não contam; a métrica não afirma causalidade nem consegue provar ausência de relação anterior que já tenha saído da retenção.

Sem base madura, a resposta informa ausência ou célula suprimida. Não substituir isso por zero, projeção ou métrica demonstrativa.

Consulta preparada, depois de migration, política, rotina de retenção e gates aprovados. Carregue URL e credencial administrativa a partir do armazenamento protegido do executor; não coloque o segredo na linha de comando ou no histórico do shell:

```bash
PICO_PRODUCT_MEASUREMENT_ENABLED=true \
npm run metrics:product -- 2026-09-21 2026-09-27
```

Sem datas, o comando consulta os sete últimos dias completos, nunca o dia em curso. Não enviar segredo pelo chat nem salvar saída com identificadores no repositório. O comando imprime somente JSON agregado.

## Retenção operacional

O heartbeat da aplicação é separado da ocorrência de eventos. O agendador externo chama, a cada cinco minutos, o endpoint `/api/internal/product-measurement-heartbeat` do domínio publicado por meio de `metrics:heartbeat`; ele nunca acessa Supabase diretamente. O endpoint autentica `PICO_PRODUCT_MEASUREMENT_HEARTBEAT_SECRET`, usa a versão compilada do próprio deployment e reporta o env real. Com o env `true`, renova o lease; com o env `false`, abre uma única lacuna até a recuperação. Duas execuções perdidas cabem no lease de 15 minutos. Release/protocolo incorreto ou ausência prolongada faz o gate falhar fechado:

```bash
npm run metrics:heartbeat
```

O comando requer `PICO_PUBLIC_ORIGIN` e um segredo aleatório de pelo menos 32 caracteres, sem receber a credencial do banco. O agendador precisa alertar qualquer saída diferente de zero. Antes do primeiro `enabled=true`, `expected_edge_release` deve ser a mesma versão servida e um heartbeat precisa estar saudável; se `collection_started_at` tiver ficado no passado, o banco registra o intervalo anterior à primeira ativação como lacuna. Esta entrega só preparou endpoint e comando: não criou segredo/cron remoto nem renovou lease hospedado.

`purge_product_events()` remove eventos anteriores ao prazo aprovado e atualiza o heartbeat da manutenção. O executor preparado exige `PICO_PRODUCT_MEASUREMENT_PURGE_ENABLED=true`, credencial administrativa protegida e identidade de ambiente compatível:

```bash
npm run metrics:purge
```

Antes de ativar coleta, este comando precisa estar em um agendador diário monitorado, com alerta por falha/atraso e dono operacional definido. `purge_verified_at` e `purge_verified_by` só devem ser preenchidos após essa prova. Esta entrega não criou agendamento remoto, não executou purga hospedada e não aprovou uma retenção.

## Compartilhamento

O endpoint autenticado `/api/shares` revalida a audiência atual e devolve somente uma URL no `PICO_PUBLIC_ORIGIN`:

- próprio perfil concluído e não-demo;
- arena pública, ativa e não-demo;
- comunidade ativa de audiência beta com entrada aberta ou por aprovação;
- publicação beta legível, não moderada, sem autor demo e sem qualquer destino de arena demo.

Perfis alheios, mensagens, jogos privados, comunidades/posts privados, convites individuais e conteúdo demo não viram links genéricos. Copiar, Web Share e QR usam a mesma URL; o QR é gerado no aparelho, sem serviço externo. O link não segue pessoa, não entra em comunidade e não aceita convite. Login/cadastro preservam somente destinos internos permitidos. Não há token de campanha ou atribuição nesta fatia.

O compartilhamento privado já existente no cliente móvel é outro contrato: ele cria um post privado sujeito a RLS, não uma URL pública genérica e não entra em `share_prepared`. `PICO_PUBLIC_ORIGIN` precisa ser a origem HTTPS canônica, sem credencial, caminho, query ou fragmento. `http://localhost` é aceito apenas fora de produção. Domínio, Universal Links e associações de loja continuam como decisão da Frente 2.

## Rollout e reversão

1. Fazer backup/inventário, aprovar e configurar `PICO_PUBLIC_ORIGIN` no destino e preparar migration e artefato novo com todos os gates desligados. A origem é pré-condição para emitir convites beta, de arena e de comunidade, além dos links de compartilhamento. A migration revoga deliberadamente os RPCs antigos de convite por e-mail; não existe ordem de rollout sem uma breve indisponibilidade dessas quatro ações.
2. Em janela coordenada, aplicar a migration e promover imediatamente o artefato novo; durante o intervalo, pausar emissão/aceite de convites de arena/comunidade e comunicar a indisponibilidade. Não afirmar compatibilidade N−1 desse fluxo.
3. Validar a origem canônica já configurada, compartilhamento, convites por `@username`, exportação e exclusão com contas controladas.
4. Aprovar finalidade/retenção/acesso, atualizar aviso público e formulários Apple/Google.
5. Excluir identidades de teste; instalar e observar a purga diária e o heartbeat de cinco minutos apontando para o deployment; registrar segredo, versão esperada, alerta e dono operacional.
6. Com o release esperado e lease saudável, ligar o gate do banco e o env do servidor em ambiente controlado. A ativação é recusada sem essa prova.
7. Para interromper, desligar o env e manter o heartbeat rodando para materializar a lacuna; desligar também o gate do banco. Preservar/purgar linhas conforme a política aprovada. Depois da migration, rollback para o cliente anterior é incompatível com convites e deve ser tratado por forward-fix ou restauração coordenada do contrato, nunca pela reabertura dos RPCs inseguros.

Para trocar a versão coletora, não altere `expected_edge_release` enquanto o gate estiver aberto. Primeiro faça o endpoint atual reportar env desligado, desligue `product_measurement_settings.enabled`, atualize a versão esperada, promova o novo artefato ainda com o env desligado, valide seu heartbeat e só então ligue env e gate novamente. O intervalo permanece registrado; tentar trocar a versão com coleta ativa é recusado pelo banco.

## Recibo da janela de 28/09/2026

O [PR #45](https://github.com/8ugomes/pico-app/pull/45) foi integrado pela revisão `7d5a7afd17a65040e7b7639590aea35870028da4`. Antes da migration, `PICO_PUBLIC_ORIGIN` foi configurada como `https://pico-app-sepia.vercel.app` e um backup cifrado do banco, configuração e 14 objetos de Storage teve hash e autenticação AES-GCM conferidos; a exportação parcial de uma primeira tentativa foi removida sem deixar payload em claro.

As migrations `20260926120000_social_intent_safety.sql` e `20260927130000_product_measurement.sql` foram aplicadas no projeto `bxjhqxdfknspxezgftyz`. Os inventários de migration, stage e pós-promoção preservaram 131/131 identidades, sem ausência, troca de identidade ou edição. O ledger terminou com 49 migrations e os quatro RPCs antigos de convite por e-mail permaneceram sem `EXECUTE` para `authenticated`; os substitutos vinculados a `@username` ficaram disponíveis.

O deployment Production `dpl_BKVhni4SUsWTXV3gy5NTYoYd63Zs` foi validado em stage e promovido ao domínio principal. `/api/version` retornou `7d5a7afd17a6`, `/api/health` confirmou banco/Auth e o endereço anterior continuou encaminhando ao principal. `product_measurement_settings.enabled`, o gate request-edge, intenção social, DMs e push permaneceram `false`; retenção, release esperada e lease continuaram nulos. Nenhum heartbeat, purga, cron ou coleta foi ativado.

A verificação local do artefato publicado cobriu compartilhamento em 320/390/1280 px, temas claro/escuro, movimento reduzido e texto a 200%, além da rota vizinha de notificações, sem overflow ou erro de console. A validação autenticada de compartilhamento, convites, exportação e exclusão ainda requer duas contas controladas; não criar contas ou conteúdo no principal apenas para completar o recibo.
