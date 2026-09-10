# Ciclo 10 — perfil premium e fotos HEIC

## Escopo e auditoria

O responsável autorizou integrar o Ciclo 9 na main, corrigir o editor duplicado, organizar o perfil e implementar HEIC. O PR #1 foi integrado em fee5b0ce27dcb26eb3374c1bc889474011f00e1a. Não houve autorização de inscrição pública, convites externos ou contratação nesta rodada.

O ConnectedProfile anterior reutilizava key={profile.id} em ProfileEditor e AvatarEditor, irmãos no mesmo fragmento. A nova implementação elimina esse conflito e separa as árvores de visualização e edição. StrictMode não foi removido. O relato original não foi reproduzido manualmente na hospedagem; a regressão do código corrigido foi exercitada nos navegadores abaixo.

## Implementação e decisões de apresentação

Perfil com cabeçalho, identidade, avatar, modalidades e disponibilidade; abas acessíveis para Publicações, Meus Picos e Atividade. A gestão aparece conforme permissões existentes. Estilo grafite, contraste, espaços, bordas discretas e nenhuma superfície principal amarela/bege. Não há métricas ou usuários fictícios na versão conectada.

Editor único por identidade com seções de foto, Sobre você, Seu jogo e localização. Formulários não são aninhados. Campos controlados mantêm o rascunho durante atualização de leitura e falha de gravação; cancelar alterações pede confirmação. Troca de conta descarta a árvore anterior. Foto tem confirmação própria explícita, separada do formulário de dados. O rótulo da bio foi separado do conteúdo editável após a regressão de acessibilidade.

HEIC/HEIF: validação do contêiner e dimensões antes da decodificação; decoder nativo quando disponível e heic-to 1.5.2 CSP por import dinâmico como fallback. Conversão no dispositivo, sem serviço externo. Recorte e normalização permanecem no caminho existente de upload privado. Original até 20 MiB/25 MP; saída até 3 MiB. Variantes não decodificáveis falham com mensagem e preservam a foto anterior. Limitações de timeout/worker e avisos de licença em [THIRD_PARTY_HEIC.md](THIRD_PARTY_HEIC.md). A antiga exigência de exportar todo HEIC no Ciclo 9 foi substituída por este caminho.

No composer do feed, check-in ativo pode sugerir o mural da arena quando a participação permite. A pessoa precisa selecionar a sugestão e confirmar a publicação; não há distribuição escondida ou ampliação automática de audiência.

## Verificação executada

Código e teste verificados no commit 785c6ea787a8bda5e563c54f2ddbf0ba0f337da1. Alterações posteriores desta entrega atualizam somente documentação.

- [CI geral aprovada](https://github.com/8ugomes/pico-app/actions/runs/34427144775): lint, typecheck, suíte de testes e build.
- [Regressão de navegador aprovada](https://github.com/8ugomes/pico-app/actions/runs/34427144797): componentes React reais em StrictMode, Chromium e WebKit, com Auth/API de dados/contas sintéticos e servidor HTTP de mídia em loopback.
- Em cada navegador: 20 ciclos de abrir/fechar sem multiplicar editor ou formulário; rascunho preservado ao atualizar e ao falhar a gravação; diálogo de descarte; uma gravação ao salvar; abas por teclado; troca de conta limpando rascunho.
- Viewports 320, 390, 430 e 768 sem overflow horizontal no perfil e no formulário.
- Arquivo HEVC realmente codificado por libheif, gerado para o teste (não JPEG renomeado): abriu, foi recortado/girado e enviado nos dois navegadores. O servidor de teste recebeu WebP nos dois casos; resultado 437 x 437, sem EXIF. Arquivo inválido foi recusado antes do upload.
- Os três testes de preflight HEIF também foram executados isoladamente no runtime de revisão.

Artefato da regressão: profile-browser-results, ID 10133120691, com screenshots e results.json. Testes não acessam contas reais, não provam Supabase hospedado e não equivalem a iPhone/Android físicos.

Falhas da automação corrigidas sem esconder falhas de produto: chave faltante na fixture de Auth; rótulo da bio com conteúdo embutido; captura de Blob pelo protocolo de inspeção do WebKit retornando null. O último caso passou a receber e verificar bytes por HTTP real de loopback, com os mesmos limites/formato do fluxo de fotos, em vez de confiar no corpo exposto pelo inspetor.

## Integração, publicação e limites

As alterações concorrentes da main em 8e1e6b8 (unificação de publicação) foram preservadas por merge, incluindo package.json, scripts/deploy.mjs e configuração de ambientes. O destino vigente continua sendo o principal, conforme [ENVIRONMENTS.md](ENVIRONMENTS.md); não recriar o antigo projeto interno nem desfazer a unificação.

Esta rodada não executou deploy Vercel e não criou migrations. Integração Git não é evidência de publicação. No ambiente já autenticado, usar o fluxo existente de npm run deploy, com main limpa/sincronizada e verificação da versão servida, preservando admissão e RLS.

SMTP/remetente/recebimento real de e-mails, testes em aparelhos físicos e responsáveis/custódia operacionais continuam pendentes. Nenhum usuário real foi convidado, nenhum dado foi apagado e nenhum serviço foi contratado.
