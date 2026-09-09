# Pico — checklist beta

Estado: núcleo social implementado; validação em Supabase hospedado e publicação não concluídas.

## Validado localmente

- [x] Migrations em ordem, seeds idempotentes, onze tabelas com RLS e grants limitados.
- [x] Trigger cria perfil sem copiar e-mail; edição e esporte principal em transação.
- [x] Identidades distintas: tentativas de edição/autoria forjada negadas.
- [x] Check-in substitui anterior, expira em até duas horas e encerra apenas presença própria.
- [x] Posts, likes e comentários usam identidade autenticada; paginação e contagens no banco.
- [x] Conexões próprias, reversíveis e sem auto-conexão; filtros de descoberta antes da paginação.
- [x] API nega origem externa, conteúdo excessivo e campos inesperados; respostas privadas sem cache.
- [x] Jornada no navegador com transporte local simulado: cadastro, perfil, arena, check-in, post, curtida, comentário, descoberta, conexão, desconexão, saída do check-in e logout.
- [x] Demo continua disponível sem configuração; falha de serviço não vira demo.

- [x] Revisão visual em 390 px e 1280 px; cinco destinos sem overflow horizontal em 320 px.
- [x] Conflito de username e falha de envio preservam campos; retry recupera leitura sem trocar para demo.

## Antes de convidar pessoas para o projeto hospedado

- [ ] Aplicar migrations em Supabase de desenvolvimento, conferir grants/RLS e gerar tipos.
- [ ] Testar com duas contas reais: cadastro, entrega/expiração de e-mail, callback PKCE, login, renovação de sessão, logout e troca entre abas.
- [ ] Repetir a jornada contra Auth/PostgREST reais, incluindo desconexão de rede e erro após envio.
- [ ] Disparar start/end concorrentes em múltiplas conexões PostgreSQL e confirmar um check-in ativo por jogador.
- [ ] Cadastrar arenas reais autorizadas; não apresentar seed/ilustração como local real.
- [ ] Configurar HTTPS, URLs permitidas de Auth e variáveis do ambiente alvo; revisar backups e logs sem tokens.
- [ ] Definir moderação, bloqueio/denúncia, política de privacidade, exclusão de conta e recuperação de acesso para o tamanho do beta.
- [ ] Validar iOS/Safari e Android/Chrome em aparelhos: teclado, safe area, zoom, foco, leitor de tela, retomada, instalação e atualização do manifesto.
- [ ] Testar limites operacionais/rate limiting antes de tráfego público; contagem de testes local não comprova resistência a abuso.

## Regras de liberação

Nunca liberar com escrita anônima, RLS desativada, possibilidade de agir por outra pessoa, segredo no cliente ou aviso de sucesso em falha de gravação. Se surgir regressão, interromper convites e reverter o aplicativo para a última versão validada; não apagar tabelas de produção para contornar o problema.

Prompt de continuidade: “Conecte o Supabase de desenvolvimento já configurado, execute os itens pendentes deste checklist com duas contas e registre evidências. Preserve os Cycles 0.5–7 e não amplie o escopo social.”
