# Pico — checklist beta

**Estado: BLOCKED para convites externos.** O Ciclo 8 está implementado e validado no ambiente hospedado, mas falta fechar e-mail e responsabilidades operacionais. [Evidências](HOSTED_SUPABASE.md) · [Operação](BETA_OPERATIONS.md).

## Verificações locais

- [x] Lint, typecheck, build e 48 testes automatizados aprovados.
- [x] Nove migrations em PostgreSQL/PGlite descartável, seed idempotente, quinze tabelas públicas com RLS.
- [x] Autoria, visibilidade, bloqueio bilateral, privacidade das denúncias, limites de escrita, reservas de mídia e exclusão pendente exercitados por identidades distintas.
- [x] Demo separado de Auth real; erros não acionam fallback fictício.

## Infraestrutura e fluxos hospedados

- [x] Mesmo Supabase bxjhqxdfknspxezgftyz, nove migrations efetivamente aplicadas, tipos gerados do remoto.
- [x] Vercel pública em https://pico-app-sepia.vercel.app; envs públicas de Development/Preview/Production coincidem com o Supabase e com o bundle servido. Nenhuma chave administrativa encontrada no HTML/JS publicado.
- [x] 168 checks hospedados aprovados com dois usuários reais: cadastro, login, refresh, cookies, perfil, check-in, feed, comentários, likes e conexões.
- [x] Avatar e foto de publicação via Storage real; arquivo convertido sem metadados e vínculo de proprietário conferido no banco.
- [x] Rejeição de upload direto, assinatura, remoção alheia, referência a arquivo alheio e acesso anônimo.
- [x] Bloqueio bilateral oculta perfil, conteúdo e imagem imediatamente; desbloquear não recria conexões.
- [x] Denúncias privadas, autoria protegida, rejeição de moderação pelo cliente e revisão administrativa refletida para o autor.
- [x] Rate limit no PostgREST e reservas de avatar concorrentes; contas têm contadores independentes.
- [x] Exclusão exige senha atual, recusa ID injetado, remove fotos/dados/identidade próprios e preserva a outra conta. JWT antigo não lê dados após exclusão.
- [x] Token real de recuperação, troca de senha e login com a nova senha; geração administrativa do token, sem comprovar entrega de e-mail.
- [x] Resposta descartada após envio: a gravação permaneceu exatamente uma vez, conferida por nova leitura; não houve retry automático.
- [x] Testes descartáveis limpos pelo ID; contas existentes preservadas.

## Interface e sessão

- [x] Navegador publicado: login, onboarding, avatar, recarga, publicação com foto e imagens carregadas em 390 px.
- [x] Privacidade/conta sem overflow em 320 px; diálogo de exclusão com foco inicial, Escape e inputs a 16 px.
- [x] Logout remove dados da outra aba; login com outra conta mostra o novo perfil sem foto/rascunhos da anterior.
- [x] Manifesto, ícones e rotas de privacidade/recuperação respondem 200 em HTTPS.
- [x] Não há service worker, cache offline de conteúdo privado ou URL pública/assinada de fotos.
- [ ] Instalação, atualização, retomada, teclado, zoom e leitor de tela em iOS/Safari e Android/Chrome físicos. Viewport simulado não comprova esses cenários.

## Gates restantes e ação necessária

- [ ] **SMTP externo:** o responsável deve configurar um provedor existente no Supabase, validar entrega/recuperação/expiração em e-mail externo e então reativar confirmação. Cadastro imediato continua sendo uma decisão do ambiente dev. Nenhum serviço pago foi contratado.
- [ ] **Privacidade e operação:** informar o canal público de contato, definir quem acompanha a fila de denúncias e frequência de resposta. A página de privacidade e o runbook estão implementados, com essa pendência explícita.
- [ ] **Continuidade:** definir retenção e exportação protegida de banco/arquivos e ensaiar restauração isolada. Plano Free e teste de migrations não comprovam backup recuperável.
- [ ] **Arenas reais:** cadastrar locais autorizados antes de apresentar o beta como rede de arenas reais; as três arenas seed continuam marcadas como fictícias.
- [ ] Teste de carga e abuso coordenado com múltiplas contas. Os limites básicos foram testados; não se declarou resistência a tráfego público amplo.

Não liberar com escrita anônima, RLS desativada, autoria forjada, segredo no cliente ou sucesso falso. Não apagar tabelas nem reabrir acesso direto às fotos para contornar falhas. Corrigir por migration nova e validar a URL pública novamente.
