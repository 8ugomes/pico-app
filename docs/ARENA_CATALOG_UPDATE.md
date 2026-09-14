# Catálogo de arenas · Zona Oeste de São Paulo

Pesquisa e checagem de duplicatas em 14/09/2026. As três inclusões são dados de localização e modalidade, não afiliação comercial, gestão verificada, presença de jogador ou endosso da arena ao Pico. A migration `20260914133000_west_sp_arenas.sql` não atribui foto, proprietário, participante, jogo ou publicação.

| Situação | Arena | Evidência de localização e modalidades |
| --- | --- | --- |
| Nova | R7 Academia · Jaraguá · Av. Jerimandubá, 803 | [Endereço no site da R7](https://www.r7academia.com.br/contato); páginas próprias de [futevôlei](https://www.r7academia.com.br/modalidades/futevolei) e [vôlei de praia](https://www.r7academia.com.br/modalidades/volei-de-praia). Beach tennis não foi incluído sem confirmação. |
| Nova | Arena Xfield · Vila Clarice · Av. José Alves de Mira, 37 | [Ficha de parceiro na Wellhub](https://wellhub.com/pt-br/search/partners/arena-xfield-vila-clarice/): futevôlei, beach tennis e vôlei de praia. |
| Nova | Jaraguá Clube Campestre · Pirituba · Av. Dr. Felipe Pinel, 2008 | [Cadastro da Prefeitura de São Paulo](https://drive.prefeitura.sp.gov.br/cidade/secretarias/upload/arquivos/secretarias/desenvolvimentourbano/plano_diretor_estrategico/proposta_revisao/ocupacao_solo/quadros/24_parteiii_quadro_07b_clubes_campo_abr07.pdf) confirma nome/endereço; [ranking da modalidade em 2026](https://letzplay.me/jaraguaranking/rankings/50818/about) confirma beach tennis. Não confundir com Arena Jaraguá Beach. |
| Já no principal | Arena Jaraguá Beach · Jardim Santa Lucrécia · Rua Francisco da Cunha Menezes, 249 | A linha `arena-jaragua-beach` já estava ativa e pública no catálogo conectado, com as três modalidades. [TotalPass](https://totalpass.com/br/academias/arena-jaragua-beach/) confirma nome/endereço/modalidades. Não reinserir. |
| Pendente | Nossa Ksa Beach Sports · Parque São Domingos | [Fornecedor da fachada](https://val-letreirosepinturas.com.br/category/fachadas-de-comercios/) confirma o nome e bairro de uma quadra esportiva, mas não o endereço nem uma modalidade elegível; não inserir um lugar sem suporte para “Já joguei”. |
| Pendente | Estação Sal Beach | Nenhuma correspondência confiável para este nome e local foi encontrada. A Estação Praia Mar, já cadastrada em Osasco, não foi presumida como a mesma arena. Solicitar endereço ou perfil oficial antes de adicionar. |

O catálogo conectado já continha outras arenas da região, incluindo Arena 360 Beach, Pirituba Beach Sports, Portela Beach Club, Porto Maya Beach Sports e Riplay Ma Kai. Não foram duplicadas. A lista local em `supabase/seed.sql` contém somente lugares fictícios de demonstração e não espelha o catálogo principal.

Os dados novos são inseridos por slug estável com checagem adicional de nome/cidade e `on conflict do nothing`. A reaplicação não cria duplicatas nem altera fichas existentes; os vínculos esporte–arena só são acrescentados às três fichas verificadas. Antes da aplicação remota, conferir novamente a lista do principal para detectar cadastros surgidos após esta pesquisa. Fotos e logotipos de terceiros não foram copiados.

Uma divergência de endereço já existente ficou fora desta migration: Arena 360 Beach aparece no principal com Rua Sumagre, 219, enquanto a [página de agendamento da arena](https://arena-3602.reservio.com/) informa 213. Confirmar diretamente com a arena antes de corrigir a ficha.
