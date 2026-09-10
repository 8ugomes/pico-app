# Pico — operação do ambiente principal

Ciclo 9 na main, com publicação unificada no projeto principal. Configuração e destinos: [ambientes](ENVIRONMENTS.md). Evidência histórica anterior à unificação: [revisão interna](INTERNAL_REVIEW.md). Permissões: [contratos](CYCLE9_CONTRACTS.md).

## Operação pela interface

Entrar com a conta autorizada e abrir `/admin`. O UID de @hugo foi confirmado pelo responsável e recebeu bootstrap idempotente no beta. A área oferece admissão/suspensão, papéis globais, convites individuais, pedidos de arena e catálogo. Atribuir custódia ou transferir responsabilidade exige reautenticação; nenhuma função deriva de nome/e-mail adivinhado ou metadados do perfil.

`/arenas/[slug]/gestao` permite identidade/modalidades/fotos para dono/admin, participantes/mural conforme escopo e convites direcionados. Dono pode transferir a participante ativo; admin só concede moderador. Comunidades usam sua própria gestão e não herdam papéis da arena. Um membro não edita cadastros oficiais; pode enviar pedido de correção/criação/reivindicação.

O moderador Pico acessa denúncias e pode examinar o alvo exato, dispensar, ocultar conteúdo ou suspender acesso com efeito real. Ações ficam auditadas. Sem acesso geral a grupos privados; denúncias não geram punição automática por volume. Definir frequência de triagem e contato público antes de convites externos; não há equipe/SLA implícitos.

## Mídia e exclusão

Três buckets privados: `avatars`, `post-media`, `entity-media`. Servidor verifica identidade e autorização vigente antes de usar Storage administrativo. Imagens passam novamente por normalização sem metadados; resposta sem cache/URL assinada. Remoção em duas fases bloqueia anexação concorrente. Arquivo de recurso continua pertencendo à arena/grupo após saída do uploader.

`DELETE /api/account` aceita somente senha e confirmação `EXCLUIR`. Verifica senha num cliente isolado, marca exclusão, remove arquivos pessoais e então Auth/dados pessoais. Operação interrompida é repetível. Arenas e comunidades preservam recursos e conteúdo de terceiros em custódia. O último admin ativo deve encaminhar a responsabilidade antes da saída; o mecanismo não transforma exclusão pessoal em apagamento da entidade.

Nunca limpar todos os usuários/buckets. A suíte registra IDs/caminhos e remove apenas fixtures controladas do desenvolvimento. Usar Storage API para bytes, nunca apagar linhas `storage.objects` por SQL. Não registrar token, senha, conteúdo de post ou foto em logs.

## Limites e observabilidade

Limites transacionais no banco continuam vigentes: posts 10/10min, comentários 30/10min, likes 120/min, conexões 60/h, bloqueios 30/h, denúncias 5/dia, check-ins 30/h, mudanças de perfil/vínculos 120/h, reservas de mídia 20/h. Comunidades, convites e operações de recurso têm limites adicionais nas migrations. Reserva inválida também conta. Isto não equivale a teste de carga pública.

Falhas de API produzem evento estruturado mínimo: identificador aleatório, categoria/status e versão. Sem serializar request, URL, corpo, SQL ou erro bruto. Eventos de auditoria registram ação/alvo necessários; acesso restrito. CI executa lint, types, testes e build em demo, sem segredos do Supabase.

## Auth, continuidade e rollback

Cadastro público está fechado pelo Before User Created Hook, baseado em convite individual pendente ao e-mail exato. Cadastro não admite automaticamente. No beta a confirmação de e-mail está habilitada; desenvolvimento exclusivo permite confirmação imediata só para identidades controladas. Nenhum convite externo enviado.

PKCE continua padrão. Templates por token foram preparados, mas o provedor Free/default recusou personalização sem SMTP; não ativar `NEXT_PUBLIC_PICO_EMAIL_TEMPLATES=custom` antes de configurar e testar templates/remetente/caixa. SMTP foi adiado pelo responsável, sem compra ou mudança de plano.

Backup cifrado, restauração comprovada e limites: [continuidade](CONTINUITY.md). Definir retenção, custódia separada de chave/cópia e destino externo antes da liberação. A restauração validada usou dados controlados de desenvolvimento; dados pessoais do beta não foram copiados para outro ambiente.

Publicação usa `npm run deploy`, com `scripts/deploy.mjs`, target Production do projeto `pico-app` e branch main limpa/sincronizada. A identidade técnica do Supabase segue `beta`. Não usar o projeto ou wrapper antigos como destino. GitHub executa CI; push não publica automaticamente.

Para verificar antes da troca do domínio:

```bash
npm run deploy -- --stage
# Conferir artefato, versão, login e manifesto; depois promover a URL retornada:
npx vercel@59.14.0 promote <url-do-artefato> --yes
```

O deploy normal inclui a promoção. Quando usar stage, conferir a identidade do projeto retornado antes de promover. Após publicação, testar o endereço principal, Auth/sessão, leitura/escrita com contas controladas, mídia, permissões e limpeza dos próprios IDs. Conferir que o endereço antigo encaminha ao principal. Artefatos protegidos podem ser inspecionados com `vercel curl` na sessão autenticada, sem desativar a proteção Vercel.

Em falha essencial, interromper a promoção ou voltar ao último artefato compatível validado do mesmo projeto. Se a versão histórica for Ciclo 8, não presumir compatibilidade com os contratos atuais: preferir correção/reversão por PR e novo deploy. Banco recebe correção aditiva, nunca reset, downgrade destrutivo ou remoção de RLS. Manter artefatos anteriores e inventário protegido como evidência.
