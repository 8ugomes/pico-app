# Ciclo 10 — perfil, edição e HEIC

## Autorização e baseline

O responsável autorizou a integração do Ciclo 9 e a correção/restilização do perfil, suporte HEIC e continuidade das pendências. PR #1 integrado em main no commit fee5b0ce27dcb26eb3374c1bc889474011f00e1a. Isso não autoriza inscrições públicas, convites externos ou lançamento produtivo.

A nova rodada trabalha em cycle-10-profile. Não altera bancos, segredos ou isolamento de ambientes. CI anterior: 72 testes, lint, types e build; esses resultados não validam as mudanças novas.

## AUDIT / causa a verificar

ConnectedProfile montava ProfileEditor e AvatarEditor como irmãos com a mesma key (profile.id). A abertura condicional do editor torna essa identidade ambígua na reconciliação. A foto também ficava depois do feed/histórico, longe do formulário. Corrigir estruturalmente: uma única área de edição, com foto dentro dela, e estado de sessão isolado por jogador. Não mascarar a duplicação com CSS nem gerar keys aleatórias.

## PLAN / Deslopify

Visual: cartão de identidade grafite, avatar, nome/username, bio, localização e esportes; uma ação principal Editar perfil. Publicações, Picos e atividade própria organizados em seletores. Administração/privacidade ficam como acessos secundários. Sem contadores fictícios, amarelo ou mudança de marca.

Editor: fluxo único organizado por Foto, Sobre você, Seu jogo e Localização. Labels claros, campo de bio com limite, salvar/cancelar visíveis, rascunho preservado em erro e recarga de avatar, confirmação de descarte. Foto informa que sua confirmação é independente do salvamento dos outros dados.

HEIC: conversão local sob demanda antes do recorte, com libheif atualizado por pacote fixado; não enviar original a terceiros. Validar tamanho/estrutura/pixels, negar sequência animada e dados inválidos, liberar recursos e manter normalização/autorização do servidor. Não substituir falta de conversão por mensagem de sucesso.

## Verificação prevista

Lint, types, suíte existente, build e regressões de abertura/cancelamento/salvamento repetidos e troca de identidade. Verificar importação HEIC real, orientação, limites e não envio antes da confirmação. Separar fixture/emulação de aparelho físico. Qualquer teste não executado permanece pendente.

## Continuidade fora desta mudança de interface

Preservar admissão e convites, produção futura não provisionada e beta interno separado. SMTP externo depende de provedor/remetente/caixa autorizados; não inventar credenciais. Contato de privacidade, operação humana e testes iOS/Android físicos não são resolvidos por um commit. Publicação interna exige acesso à Vercel e validação do artefato; integração de código não comprova deploy.

## Estado

Em implementação. Resultados finais serão registrados após a verificação, sem reaproveitar números do Ciclo 9 como evidência nova.
