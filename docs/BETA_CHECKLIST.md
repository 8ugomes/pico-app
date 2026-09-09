# Pico — checklist beta

Estado: núcleo social integrado ao Supabase pico-dev e publicado na Vercel. Desenvolvimento funcional; liberação ampla ainda depende dos itens abaixo. Evidências em [HOSTED_SUPABASE.md](HOSTED_SUPABASE.md).

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

- [x] Aplicar migrations em Supabase de desenvolvimento, conferir grants/RLS e gerar tipos.
- [x] Duas contas reais: cadastro, login, renovação de sessão, logout, cookies e jornada social pelos origins local e Vercel; 149 checks e limpeza das contas.
- [x] Callback PKCE local e Vercel com tokens reais da identidade descartável. Confirmação automatizada administrativamente; sem inspeção da caixa de e-mail.
- [x] Interface publicada: cadastro, onboarding, recarga, check-in, post, curtida/comentário, encerramento, logout, erro de senha e novo login; conta limpa ao terminar.
- [x] Quatro start_checkin concorrentes via PostgREST deixam um check-in ativo; end_checkin de B não encerra A.
- [ ] Configurar SMTP próprio, reativar confirmação e validar entrega/expiração de e-mail antes de público externo com e-mail verificado. pico-dev usa cadastro imediato.
- [ ] Exercitar perda de rede após envio e troca de conta entre abas no serviço hospedado; os cenários de falha controlada foram validados localmente.
- [ ] Cadastrar arenas reais autorizadas; não apresentar seed/ilustração como local real.
- [x] HTTPS na Vercel, URLs permitidas de Auth, variáveis públicas em Development/Preview/Production e proteção dos arquivos administrativos.
- [ ] Definir backup/restauração e retenção de logs adequados ao beta; plano Free não equivale a estratégia de recuperação validada.
- [ ] Definir moderação, bloqueio/denúncia, política de privacidade, exclusão de conta e recuperação de acesso para o tamanho do beta.
- [ ] Validar iOS/Safari e Android/Chrome em aparelhos: teclado, safe area, zoom, foco, leitor de tela, retomada, instalação e atualização do manifesto.
- [ ] Testar limites operacionais/rate limiting antes de tráfego público; contagem de testes local não comprova resistência a abuso.

## Regras de liberação

Nunca liberar com escrita anônima, RLS desativada, possibilidade de agir por outra pessoa, segredo no cliente ou aviso de sucesso em falha de gravação. Se surgir regressão, interromper convites e reverter o aplicativo para a última versão validada; não apagar tabelas de produção para contornar o problema.

Prompt de continuidade: “Leia HOSTED_SUPABASE.md e este checklist. Priorize os itens de preparação para beta ainda pendentes, preservando o ambiente de desenvolvimento e o núcleo social já validado.”
