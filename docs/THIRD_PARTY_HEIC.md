# Decoder de fotos HEIC/HEIF

Dependência: heic-to 1.5.2 (LGPL-3.0-or-later, conforme LICENSE do pacote). Usamos a distribuição CSP sem modificar o código da biblioteca. A licença distribuída fica em public/licenses/heic-to-LICENSE.txt. Código e instruções de build correspondentes: https://github.com/hoppergee/heic-to e o pacote npm heic-to@1.5.2 (inclui src e esbuild.mjs). Componentes de decodificação subjacentes: libheif/libde265; preservar os avisos do pacote.

O import dinâmico acontece apenas após detectar conteúdo HEIF válido e falha do decoder nativo. Não carregamos o decoder na visita comum ao feed, não enviamos fotos a serviço de conversão e não persistimos metadados originais. Limites: 20 MiB de arquivo original, propriedades ispe até 25 MP/16.000 px por lado; nova conferência após decodificação. Saída normalizada segue pelo mesmo recorte e API de Storage privado já existente.

A interface tem timeout/cancelamento e descarta bitmaps tardios. O worker interno da dependência não expõe API de término: não iniciar outro decoder simultâneo enquanto o anterior ainda estiver calculando. Suporte se limita às variantes que o decoder consegue abrir; mensagem de erro preserva a foto anterior. HEIF é contêiner, não promessa de suporte a todo codec/arquivo animado. Fixture com extensão renomeada não serve como evidência de conversão.

Para alterar/substituir a dependência, atualizar a versão em package.json com npm, regenerar package-lock.json e executar npm ci, testes, build e testes de fotos reais. Não retirar a licença nem os avisos ao redistribuir o chunk. Nenhuma mudança de configuração de segurança global é necessária nesta implementação.
