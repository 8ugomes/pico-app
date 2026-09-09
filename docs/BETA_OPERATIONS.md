# Pico — operação do beta

Este guia descreve os controles implementados no Ciclo 8. Não substitui a definição de responsáveis, contato público e rotina de resposta antes de convidar jogadores externos.

## Acesso e fotos

Supabase `bxjhqxdfknspxezgftyz`, Vercel `pico-app-sepia.vercel.app`. Não usar outro projeto sem revalidar envs, migrations e testes. Não habilitar bucket público.

`avatars` e `post-media` são privados. Clientes não recebem permissões de upload, download, exclusão ou assinatura diretamente no Storage. O servidor valida a identidade; a RPC `can_read_media` usa SECURITY INVOKER e RLS para conferir a visibilidade atual antes de entregar uma imagem. Só depois usa o cliente administrativo para obter os bytes. `/api/media` responde `private, no-store`, sem URL de Storage exposta.

Uploads: JPG/PNG/WebP, 3 MiB, até 25 megapixels, sem animação. Sharp decodifica, orienta, reduz a 512 px (avatar) ou 1600 px (post) e converte para WebP sem metadados. Apenas o servidor marca a reserva como pronta. O banco impede anexar arquivo alheio, incompleto ou inexistente; uma imagem de post tem um único vínculo. Arquivos sem uso podem ser removidos em `/conta`.

Limites por conta no banco, inclusive em chamadas diretas: 10 gravações de posts/10 min; 30 comentários/10 min; 120 likes/min; 60 conexões/h; 30 bloqueios/h; 5 denúncias/dia; 30 gravações de check-in/h; 120 alterações de perfil/esporte/vínculo/h; 20 reservas de mídia/h. Janelas fixas; transações concorrentes serializam o contador. Cada reserva conta, mesmo se o arquivo for inválido. Máximo de 3 avatares e 40 fotos de posts por conta, incluindo reservas incompletas. Isso é proteção básica, não teste de carga ou defesa contra contas coordenadas.

## Denúncias e moderação

O autor acompanha suas 20 denúncias mais recentes em `/conta`. Outra pessoa não pode lê-las, mudar autoria ou decidir o status. Motivos: spam, assédio, conteúdo indevido e outro. Não há punição automática por volume.

A triagem inicial usa o SQL Editor do projeto, com acesso administrativo do operador. Nunca disponibilizar essa chave ou uma rota de moderação irrestrita no navegador. Consultar a fila:

```sql
select id, player_id, post_id, comment_id, reason, details, created_at
from public.reports where status = 'pending'
order by created_at limit 20;
```

Investigar somente o conteúdo ligado à denúncia. Para concluir sem remoção, atualizar o ID exato após análise:

```sql
update public.reports
set status = 'dismissed', reviewed_at = now()
where id = '<ID revisado>' and status = 'pending';
```

Se houver medida externa à remoção do conteúdo, registrar `action_taken` e `reviewed_at`. Para remover um post/comentário confirmado como abusivo, o operador deve conferir o ID, guardar apenas a anotação operacional necessária e excluir o conteúdo correspondente. Remover arquivos pelo Storage API/painel, nunca apagando linhas de `storage.objects` por SQL. As denúncias vinculadas são removidas por cascade quando o conteúdo ou a conta é removido; o app não promete um arquivo permanente de denúncias.

Definir quem acompanha a fila e com qual frequência antes dos convites. O código fornece controle e fila; não fornece uma equipe humana ou prazo de resposta.

## Exclusão de conta e falhas

`DELETE /api/account` aceita somente senha e a confirmação `EXCLUIR`. A identidade e o e-mail vêm de `getUser`, e a senha é verificada em um cliente isolado. Um marcador persistente bloqueia novos acessos sociais/escritas, arquivos são removidos via Storage e só depois a identidade é excluída. FKs removem dados sociais, reservas e contadores. O usuário pode repetir a operação se ela tiver sido interrompida.

Fila administrativa de operações incompletas:

```sql
select player_id, requested_at from public.account_deletions order by requested_at;
select player_id, bucket, path, created_at from public.media_assets
where not ready and created_at < now() - interval '1 hour';
```

Não excluir todas as contas ou esvaziar buckets para limpar um teste. Os scripts rastreiam os IDs descartáveis criados e limpam apenas essas identidades e seus diretórios. Não registrar senha, token, código de recuperação ou conteúdo pessoal nos logs de diagnóstico.

## Auth e liberação externa

O ambiente mantém cadastro imediato. O SMTP padrão do Supabase entrega apenas para membros da organização e limita envio. A interface de recuperação está implementada, mas a entrega para jogadores externos depende de SMTP configurado e testado pelo responsável. Não habilitar confirmação antes de validar envio, callback, expiração e recuperação em um endereço externo. Não contratar serviço ou trocar de plano automaticamente.

Referências: [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [recuperação](https://supabase.com/docs/guides/auth/passwords), [buckets privados](https://supabase.com/docs/guides/storage/buckets/fundamentals), [CDN](https://supabase.com/docs/guides/storage/cdn/fundamentals).

## Continuidade, backup e rollback

Supabase Free e Vercel Hobby foram preservados. Não há compra de backup, monitoramento ou SMTP. Antes de convites externos, definir exportação protegida do banco e dos arquivos, retenção e um ensaio de restauração em ambiente isolado. Migrations/seeds testados em PGlite comprovam reprodução do schema, não restauração de Auth e Storage de produção.

Em regressão de segurança, pausar convites e reverter o deploy para a última versão compatível e validada. Não reabrir download direto do Storage nem remover RLS para contornar uma falha. As migrations são aditivas e permanecem no remoto; corrigir por migration nova. A versão anterior ao Ciclo 8 não oferece controles de privacidade suficientes para operar o beta.

Não existe service worker nem cache offline de dados privados. O manifesto permite instalação pelos navegadores compatíveis. Instalação, retomada e atualização em iOS/Safari e Android/Chrome físicos ainda exigem aparelhos; viewport simulado não comprova esses comportamentos.
