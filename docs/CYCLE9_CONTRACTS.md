> Atualização vigente: a publicação usa a main no projeto Vercel pico-app, conforme [ENVIRONMENTS.md](ENVIRONMENTS.md). As antigas regras de ambiente interno desta referência histórica foram substituídas. Na rodada local de jornada, [POST_GAME.md](POST_GAME.md) substitui presença/histórico social por jogos privados e compartilhamento explícito. As duas migrations novas ainda não foram aplicadas remotamente. Demais regras de admissão, audiência e autoridade continuam válidas.

# Ciclo 9 — contratos de revisão interna

Fonte das decisões desta rodada; evidências e progresso ficam em CODEX_AUTONOMOUS_LOOP.md. Amplia as limitações históricas sobre comunidades, preservando segurança e stack.

## Ambientes e admissão

Desenvolvimento: projeto exclusivo ou stack local, apenas dados controlados. Beta: projeto existente bxjhqxdfknspxezgftyz, conta e arquivo preservados; acessos antigos não equivalem a admissão. Produção futura: configuração preparada, não provisionada nem lançada. Rótulo Vercel Production é histórico de hospedagem do beta, não autorização de lançamento. Ciclo 9 usa Preview de branch com configuração restrita, nunca promoção automática.

Manifesto versionado de ambiente liga finalidade a ref, URL e domínio. Comandos recusam combinações cruzadas, seed/teste destrutivo em beta/prod e deploy produtivo. Previews comuns não recebem segredos do beta. CI não usa secrets nem executa contribuições com privilégios. Demo só com finalidade explícita; configuração conectada ausente falha fechada.

Admissão vigente é consultada no banco em cada ação, independente do JWT. Before User Created Hook exige convite individual não expirado ao e-mail exato; erro nega criação. Signup não aprova acesso. Aceite autenticado exige e-mail confirmado, token hash, validade e consumo atômico. GET não consome. Convites beta, de gestão e de comunidade são finalidades distintas. Revogação afeta dados, RPCs e mídia, preservando identidade/recuperação e exclusão próprias.

## Matriz de autoridade

| Papel | Pode | Não pode |
| --- | --- | --- |
| Admin Pico | catálogo, aprovar pedidos/gestores, admissão, papéis globais, operação auditada | ler grupos privados indiscriminadamente; remover último admin |
| Moderador Pico | fila e conteúdo denunciado exato, medidas auditadas | conceder papéis, transferir propriedade, explorar grupos privados |
| Dono arena | identidade/equipe, conceder admin/moderador, transferir sua arena | poderes sobre outra arena ou grupo vinculado |
| Admin arena | editar sua arena e conceder/remover moderador | criar outro admin, remover dono, transferir |
| Moderador arena | remover distribuição e suspender participação da arena | editar identidade ou papéis de gestão |
| Dono comunidade | identidade, participação, admin/moderador, transferência | editar arena por associação |
| Admin comunidade | identidade/participação, conceder moderador | promover admin/dono ou transferir |
| Moderador comunidade | aprovar/recusar/remover/suspender membros e retirar distribuição | editar identidade, conceder papéis ou agir sobre gestores |
| Membro aprovado | próprios dados, seguir arenas, criar grupos limitados, publicar onde participante | editar entidade alheia/autopromover |

Papéis são concessões vigentes, nunca user_metadata ou campos editáveis de perfil. RPCs sensíveis bloqueiam a entidade com FOR UPDATE, validam escopo/papel e registram ação. Propriedade fica na entidade, não em um papel removível. Transferência só pelo proprietário para participante ativo aprovado; operações concorrentes revalidam sob lock. Exclusão pessoal coloca entidades sem dono em custódia/arquivamento controlado, preservando entidade e conteúdo de terceiros. Bootstrap idempotente exige UID confirmado do responsável; nenhuma concessão automática ao primeiro cadastro.

## Arenas e comunidades

Arena é local com slug estável, dados públicos, esportes, imagens e gestão. Renomear não altera slug nem is_demo. Seguir/participar é distinto de gestão e presença. Pedido de criação/reivindicação exige aprovação Pico; vínculo oficial de comunidade exige aprovação da arena. Comunidade oficial é única por arena (índice parcial), criada transacionalmente quando solicitado. Comunidades têm owner, slug, regras, esportes, entrada open/approval/invite e visibilidade beta/private independentes. Público significa apenas público autorizado do beta.

Grupo privado: apenas participantes ativos consultam conteúdo, membros, mídia e contagens. Solicitação pending, remoção e suspensão não concedem acesso. Gestão de arena não herda acesso aos grupos. Diretório pode mostrar ficha mínima do grupo disponível, nunca membros/atividade privada. Bloqueios filtram pessoas bilateralmente e contagens são calculadas sobre dados visíveis.

## Publicação e mídia

Post canônico com corpo/imagem, autor, audiência beta/private, modalidade e arena marcada opcionais. post_destinations contém associações de distribuição, com unique por destino. Marcar arena não publica no mural. Mural de arena exige participação vigente; comunidade exige membro ativo. Post privado tem exatamente um grupo privado e nenhum destino público; combinar audiências incompatíveis é rejeitado atomicamente. Feed/perfil/murais usam o mesmo ID e engajamento; contagem deduplicada. Todas as leituras, comentários, curtidas e mídia derivam da mesma autorização atual.

create_post usa chave de idempotência por autor e transação única, valida todos os destinos; repetição do mesmo conteúdo retorna o mesmo post, chave reutilizada com conteúdo diferente é conflito. Editar/excluir próprios; retirar distribuição por moderador não apaga post de outros murais. Remover grupo/destino nunca torna conteúdo privado público. Migrations expandem posts antigos com audiência beta e backfill do destino da arena existente, sem conteúdo fictício ou remoção. RPC antiga continua compatível durante expansão.

Mídia privada: reserva vinculada a proprietário e recurso, validação real/normalização no servidor, bytes sem metadados. Cliente recorta antes do upload: original até 20 MiB/25 MP, saída até 3 MiB. Avatar circular mostra recorte quadrado efetivo; capas 3:1, post original/1:1/4:5/16:9. Cancelar mantém referência anterior. HEIC/HEIF sem conversor comprovado produz instrução para JPEG/PNG/WebP, sem envio externo. Recursos de arena/grupo pertencem ao recurso: upload exige gestão e entrega exige visibilidade vigente, inclusive após revogação.

## Histórico e privacidade

Decisão vigente em 2026-09-12: presença ao vivo retirada. `/jogos` guarda arena/modalidade/data de jogo já realizado, somente para o dono; não distribui posts nem notificações. Correção versionada e exclusão próprias; data futura rejeitada no servidor/banco. Legado de check-ins é preservado sem acesso de clientes, sem resumo social ou conversão. Descoberta usa participação e interesses visíveis, nunca jogos ou presença. Exclusão de conta remove registros pessoais por FK. Contratos e limites em [POST_GAME.md](POST_GAME.md).

## Validação e continuidade

Testes com admin/moderador global, donos de duas arenas, gestores e moderadores de grupos, membro, não membro, não aprovado, suspenso/bloqueado. Sessões comuns provam RLS; admin só prepara/limpa IDs controlados. Evidência local, remota, navegador emulado e aparelho físico separada. Backup protegido inclui Auth/dados/configuração/bytes Storage; ensaio controlado não copia dados pessoais para preview. SMTP requer recebimento e uso real na caixa autorizada para ser declarado E2E. Nenhum convite externo, publicação pública, compra ou alteração de Samba autorizados.
