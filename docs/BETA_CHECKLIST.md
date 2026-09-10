# Pico — checklist operacional

A publicação no projeto principal foi autorizada pelo responsável. Destinos e comandos em [ENVIRONMENTS.md](ENVIRONMENTS.md); [INTERNAL_REVIEW.md](INTERNAL_REVIEW.md) é o registro anterior à unificação. Autenticação e admissão continuam vigentes.

| Controle | Evidência atual |
| --- | --- |
| Isolamento e admissão | Projetos dev/beta distintos, guardas cruzadas, hook de convite, RLS e RPCs negam não aprovados |
| Papéis reais | Global/arena/comunidade, revogação com JWT antigo, autoridade cruzada negada |
| Comunidades e posts | Entrada/privacidade independentes, convites atômicos, post canônico e audiência sem ampliação |
| Fotos | Recorte no navegador, bytes normalizados, três buckets privados e leitura vigente |
| Histórico | Privado por padrão, presença expira sem apagar histórico, resumo opcional sem datas |
| Operação | Moderação com efeito, custódia, auditoria mínima, exclusão com reautenticação |
| Qualidade | 72 testes locais, 170 verificações remotas dev, 29 verificações de navegador e 67 no Preview/beta passaram |
| Continuidade | Backup cifrado criado; restauração de Auth/schema/dados/3 arquivos controlados validada em VM isolada |
| CI/deploy | Main com CI; deploy principal Production por CLI. Versão efetiva em /api/version; Preview e891dca1e741 é histórico |
| SMTP externo | Pendente por decisão do responsável; não houve teste de entrega em caixa |
| Aparelhos físicos | Pendente; emulação não comprova instalação/câmera/retomada física |
| Responsável/contato público | Conta admin confirmada; canal público e rotina humana ainda não definidos |
| Backup fora do computador | Definir custódia/retenção/separação da chave antes da liberação |

A unificação do endereço não abre inscrições nem envia convites. SMTP, aparelhos e operação externa permanecem pendências de validação, sem impedir a publicação principal autorizada e o acesso da conta existente.
