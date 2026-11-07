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

No preflight do principal, apenas Arena Jaraguá Beach correspondia aos nomes pesquisados. Após a migration, consulta read-only confirmou as três novas fichas e a existente, sem duplicata.

Uma divergência de endereço já existente ficou fora desta migration: Arena 360 Beach aparece no principal com Rua Sumagre, 219, enquanto a [página de agendamento da arena](https://arena-3602.reservio.com/) informa 213. Confirmar diretamente com a arena antes de corrigir a ficha.

## Atualização de 06/11/2026 · dez arenas

Migration `20261106101000_arena_catalog_expansion.sql`, idempotente (slug estável, checagem de nome e cidade, `on conflict do nothing`). Dados de localização e modalidade, sem afiliação, gestão verificada, foto ou presença. Fontes principais: fichas de parceiro na Wellhub e TotalPass, lidas em 06/11/2026. **Nove entradas têm fonte única; conferir no Maps ou no perfil da arena quando possível.**

| Arena | Cidade · bairro | Modalidades | Fonte |
| --- | --- | --- | --- |
| Beach Arena Real Parque | São Paulo · Morumbi | futevôlei, beach tennis, vôlei de praia | [Fever](https://feverup.com/fr/sao-paulo/venue/beach-arena-sao-paulo) |
| Perna de Pau Beach | São Paulo · Brooklin | três | [Wellhub](https://wellhub.com/pt-br/search/partners/perna-de-pau-beach/) |
| Playa SP Beach Sports | São Paulo · Santo Amaro | futevôlei, vôlei de praia | [TotalPass](https://totalpass.com/br/academias/playa-sp-beach-sports/) e [Wellhub](https://wellhub.com/pt-br/search/partners/playa-sp-beach-sports-santo-amaro/) |
| Prainha Beach Club | São Paulo · Lapa de Baixo | três ("Vôlei" da ficha lido como vôlei de praia) | [Wellhub](https://wellhub.com/pt-br/search/partners/prainha-beach-club/) |
| Venice Beach Club Anália Franco | São Paulo · Vila Gomes Cardim | três | [Wellhub](https://wellhub.com/pt-br/search/partners/venice-beach-club-analia-franco/) |
| Arena Vila Maria Beach | São Paulo · Jardim Japão | três | [Wellhub](https://wellhub.com/pt-br/search/partners/arena-vila-maria-beach-jardim-japao/) |
| HG Beach Guarulhos | Guarulhos · Vila Moreira | três | [Wellhub](https://wellhub.com/pt-br/search/partners/hg-beach-guarulhos/) |
| Litoral Beach Arena | Santo André · Jardim | três | [Wellhub](https://wellhub.com/pt-br/search/partners/litoral-beach-arena-jardim/) |
| Arena Sul Sports | São José dos Campos · Jardim Sul | três | [Wellhub](https://wellhub.com/pt-br/search/partners/arena-sul-sports/) |
| Arena Vinci Esportes na Areia | Campinas · Jardim Ipaussurama | futevôlei, beach tennis | [Wellhub](https://wellhub.com/pt-br/search/partners/arena-vinci-esportes-na-areia-jardim-ipaussurama/) |

Descartadas por dúvida de duplicata, status ou modalidade: Rolley Beach (vizinha do Posto 011 Jurubatuba), Orla Beach Sports, Anália Beach, Play Tennis Santana, Fun Beach Santana, Arena BTG, Arena Naturale, Arena Beach Club (Campinas), Vila Verde Arena Beach Club e Arena Casaverdense (status não confirmado). Reservas verificadas para uma próxima rodada: Arena 08 (Guarulhos), Arena Sports Campinas e Ita Beach (Itatiba).
