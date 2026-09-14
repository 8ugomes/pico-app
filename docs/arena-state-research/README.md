# Expansão de arenas — estado de São Paulo

Execução autorizada em 13/09/2026 para todo o estado. O primeiro lote revisado acrescenta **43 arenas**, totalizando **60 unidades em 25 municípios**. Pesquisa pública parcial em 37 municípios; a fila preserva os **645 municípios** e 3.225 links de consulta. Esses links não representam resultados Google coletados, e a cobertura estadual ainda está incompleta.

[Lote, fontes e pendências](lote-publicado.md) · [Validação e operação](validacao.md) · [Municípios e fila](municipios.csv) · [Proveniência e consultas](provenance.json) · [Ficha de candidatos](candidatos.csv) · [Catálogo vigente](../arena-catalog-review/README.md).

## Como executar o levantamento

1. Percorrer a fila por região: completar capital (Norte, Leste, Centro e lacunas Sul/Oeste), Grande São Paulo, litoral, Vale do Paraíba e interior. Todo município permanece na fila, inclusive sem resultado. Em cidades maiores, repetir por bairro para reduzir omissões.
2. Abrir as consultas de beach tennis, futevôlei, vôlei de praia, esportes de areia e beach sports. Identificar cada unidade e consultar Google Maps, site oficial, redes próprias e páginas de parceiros como fontes secundárias. Conferir funcionamento atual e modalidade; quadras de tênis, futebol e negócios sem espaço de areia não entram por aproximação de nome.
3. Preencher candidatos com nome/unidade, município IBGE, endereço, modalidade documentada, links, data de conferência e divergências. Comparar com o manifesto atual por identidade, endereço e unidade; duas entradas do mesmo espaço não viram arenas diferentes. Redes com endereços diferentes mantêm registros separados. Guardar Place ID quando obtido de forma permitida.
4. Separar candidatos confirmados, pendentes, duplicados e encerrados. Não inferir telefone, horário, esporte, proprietário, tamanho ou disponibilidade. Preferir descrição própria de uma frase; detalhes ficam na ficha do lugar. Registrar origem de cada fato que será publicado.
5. Revisar foto da unidade correta, autoria/permissão, resolução e proporção. Prioridade: imagens confirmadas pela gestão ou material com licença/autorização documentada. Google não é uma licença para copiar fotos de terceiros. Imagens verticais/quadradas/panorâmicas são preservadas sem corte adicional; logo isolado não serve de foto da quadra. Foto indisponível usa estado neutro.
6. Criar lotes revisados no contrato de `src/data/arena-catalog.json`; prévia do importador, validação no desenvolvimento e inventário de conteúdo antes/depois no principal. Não atribuir gestão, criar seguidores/grupos, reassociar publicações nem executar seed. Preservar IDs e edições das 17 arenas existentes.

## Google: alcance e integração

A documentação do [Text Search](https://developers.google.com/maps/documentation/places/web-service/text-search) informa limite de 60 resultados por consulta e resultados que podem variar. Portanto não há evidência de que uma busca única entregue “todas as arenas registradas no Google”. A conclusão do levantamento deve informar municípios consultados, data, consultas, unidades confirmadas e lacunas; cobertura da fila não equivale a cobertura absoluta de todos os negócios.

Para automatizar, usar um projeto Google Cloud com Places API habilitada, chave somente no servidor e limites de consumo explícitos. Esta preparação não cria projeto, ativa cobrança ou executa consultas pagas. [Políticas do Places](https://developers.google.com/maps/documentation/places/web-service/policies) restringem armazenamento/reutilização, com exceção para Place IDs; a implementação deve separar referências Google dos fatos conferidos independentemente. [Place Photos](https://developers.google.com/maps/documentation/places/web-service/place-photos) exige atribuição quando retornada e referências de foto não devem ser tratadas como URLs permanentes. Não descarregar em massa o conteúdo do Google para o catálogo estático.

## Suporte no produto

Busca por nome, bairro, endereço e cidade no servidor, antes de paginar. Modalidade combina com a busca. A cidade substitui o rótulo fixo Sul/Oeste nos resultados. Seletores de jogos, local de publicação, filtro de pessoas e vínculo de comunidade usam o mesmo catálogo pesquisável e preservam a seleção durante pesquisa/paginação. Fontes e datas ficam na ficha; diretório não significa parceria ou gestão verificada.

As 76 fotos existentes foram preservadas. Novas imagens continuam pendentes de revisão: o app mostra “Foto indisponível” e não usa imagem de outra unidade.

## Origem da fila

Municípios obtidos na [API de localidades do IBGE](https://servicodados.ibge.gov.br/api/docs/localidades), endpoint da UF 35 registrado em `provenance.json`. `scripts/prepare-arena-research.mjs` gera uma fila nova e recusa sobrescrever pesquisa existente. Colunas de andamento distinguem a pesquisa pública executada da varredura Google ainda não realizada. A ficha de candidatos e o manifesto registram o lote validado; divergências de endereço/unidade permanecem pendentes no relatório.
