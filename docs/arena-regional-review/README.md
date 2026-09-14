# Arenas de Caieiras e eixo noroeste/oeste — revisão de 14/09/2026

O diretório passa de **60 para 69 arenas em 27 municípios**. As **nove inclusões regionais têm fotos do próprio espaço**, além de endereço, modalidades e fonte pública. A revisão recupera fotos de **22 arenas que já existiam**. O catálogo passa de 76 para **149 fotos em 48 arenas**. Os IDs e slugs antigos permanecem iguais.

O nome “Arena Caienas” foi interpretado como uma referência à região de Caieiras, sem atribuir esse nome a um estabelecimento não confirmado. Sun7 e Kanoa são duas arenas de Caieiras documentadas nesta rodada. A identidade exata mencionada pelo responsável continua a confirmar; não há evidência suficiente para afirmar que seja Sun7. O recorte cobre Caieiras, Vila Aurora/Jaraguá, Pirituba, Parque São Domingos, Freguesia do Ó e a conexão com Franco da Rocha. “Zona oeste” foi entendido como o eixo solicitado, incluindo os bairros da zona noroeste.

## Inclusões e fontes

| Arena | Localização conferida | Modalidades confirmadas | Evidência pública |
|---|---|---|---|
| Arena Sun7 Caieiras | Rua Maria Maderick Manoel, 60, Nova Caieiras, Caieiras | Futevôlei, beach tennis e vôlei de praia | [TotalPass](https://totalpass.com/br/academias/arena-sun7-caieiras/), [Wellhub e galeria](https://wellhub.com/pt-br/search/partners/arena-sun7-caieiras-nova-caieiras/), [perfil da arena](https://www.instagram.com/arenasun7.caieiras/) |
| Kanoa Beach Caieiras | Avenida Paulicéia, 737, Laranjeiras, Caieiras | As três modalidades | [Wellhub e galeria](https://wellhub.com/pt-br/search/partners/kanoa-beach-caieiras-laranjeiras/), [perfil da arena](https://www.instagram.com/kanoa.beach.caieiras/) |
| Arena Jaraguá Beach | Rua Francisco da Cunha Menezes, 249, Jardim Santa Lucrécia, São Paulo | As três modalidades | [TotalPass e galeria](https://totalpass.com/br/academias/arena-jaragua-beach/), [Wellhub](https://wellhub.com/pt-br/search/partners/arena-jaragua-beach-jardim-santa-lucrecia/) |
| Pirituba Beach Sports | Rua Joaquim Oliveira Freitas, 2109, Vila Mangalot, São Paulo | As três modalidades | [TotalPass e galeria](https://totalpass.com/br/academias/pirituba-beach-sports/), [perfil da arena](https://www.instagram.com/piritubabeachsports/) |
| Arena 360 Beach | Rua Sumagre, 219, Jardim Cidade Pirituba, São Paulo | Futevôlei | [Wellhub e galeria](https://wellhub.com/pt-br/search/partners/arena-360-beach-sao-paulo/), [perfil da arena](https://www.instagram.com/arena360beach/) |
| Arena CFR | Estrada do Governo, 1500, Vila Ramos, Franco da Rocha | As três modalidades | [Wellhub e galeria](https://wellhub.com/pt-br/search/partners/arena-cfr-centro/) |
| Porto Maya Beach Sports | Rua Inácio Luís da Costa, 688, Parque São Domingos, São Paulo | As três modalidades | [Wellhub e galeria](https://wellhub.com/pt-br/search/partners/porto-maya-beach-sports/) |
| Portela Beach Club | Avenida Ministro Petrônio Portela, 767, Vila Cavaton, São Paulo | As três modalidades | [Site da arena](https://www.portelasports.com/), [Wellhub](https://wellhub.com/pt-br/search/partners/portela-beach-club/), [TotalPass e galeria](https://totalpass.com/br/academias/portela-beach-club/) |
| Frega Beach | Rua dos Sitiantes, 755, Itaberaba, São Paulo | As três modalidades | [Wellhub e galeria](https://wellhub.com/pt-br/search/partners/frega-beach/), [perfil da arena](https://www.instagram.com/fregabeach/) |

Vila Aurora aparece como referência de acesso à Jaraguá Beach; o bairro do endereço não foi alterado para forçar correspondência. A nota é importada em `public_info`, campo coberto pela busca global existente. Pirituba e Freguesia do Ó também estão nas notas das unidades cujos bairros formais têm outros nomes.

Arena 360 fica com futevôlei porque essa foi a modalidade sustentada pela fonte de unidade. Não foram inferidas outras modalidades de fotografias. Na Portela, a TotalPass usa “Moinho Velho” e o Wellhub usa “Vila Cavaton”; o mesmo número e via sustentam uma única arena, com a diferença registrada em nota. O número 213 aparece em um [agendamento antigo da Arena 360](https://arena-3602.reservio.com/); foi adotado 219, informado no perfil da unidade e na página parceira.

## Método de validação

A pesquisa usou buscadores para descoberta e páginas próprias ou de parceiros para conferir unidades. Resultados com nomes semelhantes foram comparados por município e endereço. Cada foto foi baixada da página pública de origem, inspecionada visualmente em folha de contato e vinculada ao par estável ID/slug. Não houve visita física nem contato com as arenas. Informação publicada pode mudar; a data de consulta não certifica que a operação permanecerá ativa.

A fonte de cada fato, a página de cada foto, URL do arquivo, dimensões, tamanho e SHA-256 estão no [manifesto versionado](../../src/data/arena-catalog.json). A [seleção de fotos](photo-selection.json) registra a ordem aprovada nesta rodada. As imagens ficam em arquivos locais WebP, com orientação corrigida, sem EXIF, no máximo 1280 × 960 e sem ampliação. Links externos das galerias não são necessários durante o carregamento do cartão: isso elimina dependência de URLs temporárias e falhas de hotlink.

Foram descartados logos isolados, produtos, artes de campeonato, imagens de banco e atletas sem contexto suficiente para reconhecer o local. A atribuição aponta para a página pública da arena/parceiro; ela não representa aquisição de direitos exclusivos ou autoria do Pico. Não foram importados contatos pessoais, avaliações, preços, horários ou números de participantes.

## Duplicidades, conflitos e exclusões

- **Beach Club Caieiras:** o [site](https://www.beachclubcaieiras.com.br/) permanece acessível, mas o resultado indexado do [perfil oficial](https://www.instagram.com/beachclubcaieiras/) indicava encerramento das atividades. Não entrou como arena ativa. É um conflito a resolver, não uma confirmação presencial de fechamento.
- **Porto Maya / Nossa K-Sa / FVtype Pirituba:** há referências próximas ao mesmo endereço. O cadastro foi feito apenas para Porto Maya, cuja galeria mostra a fachada e a quadra com esse nome; escolas ou nomes associados não viraram arenas adicionais.
- **Arena Caieiras:** os resultados literais também apontam para futebol em Praia Grande e um evento de hip-hop. Nenhum foi convertido em arena de esportes de areia de Caieiras.
- **Arena Beach Jaraguá de outros estados e Arena 241 de outra região:** não pertencem ao recorte pesquisado.
- **Riplay Raposo:** a [página da unidade](https://riplaysports.com.br/raposo/) reutiliza arquivos identificados como Alto do Ipiranga. As fotos foram rejeitadas. O registro antigo permanece, com a pendência explícita no inventário.
- **Riplay Ma Kai:** uma foto de convivência da página própria também era usada para Jardins/Pinheiros. Foi substituída por três imagens da [galeria específica no Wellhub](https://wellhub.com/pt-br/search/partners/riplay-ma-kai-jardim-cidade-pirituba/), com fachada Ma Kai e endereço correspondente.
- **Beach Bauru:** uma [página de locação homônima](https://placyspace.com.br/s/arena-beach-bauru---quadra-1) aponta para Rua Primo Pegoraro; o registro existente é da Rua Wilson Pedro Speridião. As fotos não foram associadas ao cadastro errado.
- **Frega Beach:** uma reclamação sobre fim de parceria com TotalPass não foi tratada como fechamento da arena. Há página Wellhub e divulgação pública recente da própria operação.

## Preservação e comportamento do produto

O importador usa transação, trava e IDs determinísticos. `ON CONFLICT(id) DO NOTHING` preserva registros existentes, alterações da gestão, capas, modalidades e status. Não executa seed, reset, substituição de tabela, recriação de perfis ou migração de contas. As participações sociais não são preenchidas automaticamente.

A conferência operacional passa a abranger também arenas, participações, comunidades e vínculos comunidade/arena. Os recibos privados anteriores e posteriores guardam IDs e hashes, sem texto ou fotos dos usuários. Comparar somente contagens não seria suficiente: perda de um registro e criação de outro manteriam o total. O comparador detecta linhas ausentes e mudanças de identidade, e contabiliza contribuições novas sem sobrescrevê-las.

Na apresentação, a capa válida da gestão tem prioridade tanto na lista quanto no perfil. Se uma imagem falha, a próxima opção pertence à mesma arena. Fontes repetidas são removidas. A galeria mantém navegação, proporção da imagem e crédito. Falha de todas as imagens oferece nova tentativa no detalhe; cartões não recebem botão dentro de link. Arenas sem foto aprovada não exibem o antigo bloco “Foto indisponível” nem recebem imagem genérica. Permanecem acessíveis e com histórico preservado.

## Limites que permanecem

Todas as nove inclusões regionais e a Ma Kai têm fotos. **Ainda há 21 arenas antigas do levantamento estadual sem foto aprovada.** O estado inteiro não foi declarado completo. Fotos cuja unidade não pôde ser confirmada ou cuja fonte estava indisponível não foram inventadas. Veja a [lista de pendências](photo-pending.md). Resolver essas pendências requer uma fonte acessível da unidade ou imagem enviada pela gestão; não requer apagar ou recriar a arena.

## Validação e publicação

- Lint, typecheck e build de produção: aprovados, sem a rota temporária de QA.
- Suíte local: 142 testes aprovados; importação idempotente, capa da gestão e inventário de participações reconfirmados após ajustar as fixtures de mídia às restrições reais do banco.
- Desenvolvimento conectado: importação preservou 64 linhas anteriores, acrescentou nove e não editou nenhuma. Busca HTTP autenticada com conta controlada confirmou Caieiras (duas inclusões), Vila Aurora (Jaraguá), Pirituba (incluindo Ma Kai) e Freguesia do Ó (duas inclusões). A conta temporária foi removida pelo ID criado pelo ensaio.
- Os 149 arquivos do catálogo responderam HTTP 200 com tipo WebP. Hashes/dimensões/ausência de EXIF conferidos pela suíte.
- Navegador: amostra dos componentes reais em 390px e 1100px, claro/escuro; galeria de Jaraguá recuperou capa inexistente, avançou à segunda foto e respeitou os limites dos controles. A rota temporária foi removida antes do build/commit.
- Publicação pelo wrapper do projeto principal, seguida de importação protegida e conferência de versão, saúde e arquivos. Recibos do principal ficam em `.vercel/arena-research` e `.vercel/content-preservation`; contêm somente os identificadores/hashes necessários e não são enviados ao Git.

Nenhuma sessão real de usuário foi reutilizada no ensaio. A leitura de busca exercitada em desenvolvimento não equivale a testar todas as jornadas e políticas com todas as contas do principal. A mudança não altera RLS, Auth, privacidade ou distribuição dos posts.
