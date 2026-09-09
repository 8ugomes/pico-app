# Pico — revisão interna do Ciclo 9

**Em validação final; não liberado.** Branch `cycle-9-internal`, [PR de revisão em rascunho](https://github.com/8ugomes/pico-app/pull/1). A versão publicada será registrada após o smoke da URL efetiva. O domínio histórico continua no Cycle 8.

## Evidências concluídas

- 72 testes locais, lint, typecheck e build passaram na regressão final.
- 170 verificações em Supabase de desenvolvimento real: sete identidades com papéis distintos, Auth/sessão, admissão, RLS, arena A/B, grupos privados, convites concorrentes, idempotência, destinos, histórico, Storage e recuperação por token oficial.
- 21 verificações de interface em Chromium móvel 320/390/430: criar grupo privado, solicitar/aprovar membro, publicar, perfil/feed, recorte grande com EXIF sintético, upload interrompido, rede offline/rascunho e logout entre abas.
- Oito jornadas complementares passaram: editar arena, negar edição comum, check-in/histórico, mural, denúncia/moderação, exclusão/custódia, reatribuição e sessão inválida.
- Backup cifrado beta preservado. Ensaio restaurou o schema arquivado, Auth, dados e três arquivos controlados de desenvolvimento numa VM local separada; login/RLS e bytes conferidos.

Nenhuma prova de entrega em caixa de e-mail, aparelho físico ou restauração dos dados pessoais do beta. Relatórios de teste/fixtures ficam protegidos em `.vercel/` e não são publicados.

## Acesso e uso

Usar a conta @hugo existente, confirmada pelo responsável. `/admin` contém gestão global. Em uma arena, entrar em **Gerenciar arena** quando o papel permitir; participantes comuns enviam pedido de correção/gestão. Em `/comunidades`, criar grupo e escolher entrada/visibilidade; gestão permite aprovar participantes e configurar vínculo. No feed, selecionar audiência e os destinos adicionais; marcar um local não publica no mural. **Trocar foto** abre editor para arrastar, aproximar, girar, cancelar ou confirmar o recorte.

## Pendências externas

SMTP/remetente e caixa de teste a definir; templates próprios aguardam provedor compatível. Validar aparelhos Android/iPhone físicos. Definir contato público, frequência de moderação e retenção/custódia externa do backup. Produção futura não provisionada, nenhum lançamento ou convite externo autorizado.
