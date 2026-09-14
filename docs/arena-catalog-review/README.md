> Revisão atual: [Caieiras e eixo noroeste/oeste — 14/09/2026](../arena-regional-review/README.md). As contagens abaixo preservam o lote inicial.

> Catálogo ampliado em 13/09/2026: [lote estadual, fontes e limites](../arena-state-research/lote-publicado.md). Esta revisão preserva as evidências das 17 unidades iniciais e suas 76 fotos.

# Arenas reais e revisão editorial — 13/09/2026

O catálogo reúne **17 arenas de São Paulo, com 76 fotos revisadas**: nove na Zona Sul e oito na Zona Oeste. Inclui Riplay Alto do Ipiranga, Villa Beach Sports e Posto 011 Klabin. Nome, endereço, modalidades, origem das imagens e data de consulta estão no [manifesto versionado](../../src/data/arena-catalog.json); a [tabela de unidades e fontes](catalog-table.md) permite conferir cada registro.

## Pesquisa e decisões

Foram consultadas páginas oficiais das redes e galerias públicas de parceiros de acesso às arenas, em 13/09/2026. A pesquisa priorizou redes com várias unidades e espaços com infraestrutura documentada. Não é um ranking de tamanho nem um levantamento exaustivo de todas as arenas da cidade: faltam dados comparáveis de área e número de quadras para isso.

- A [Riplay](https://riplaysports.com.br/unidades/) confirma o nome e a unidade Alto do Ipiranga; “Replay/Auto de Piranga” foi tratado como referência a essa unidade. O catálogo também distingue BT Ipiranga, Jardins e Pompeia. BT Ipiranga tem somente beach tennis cadastrado, conforme a fonte consultada.
- A [Posto 011](https://posto011.com.br/unidade/klabin/) confirma Klabin na Rua Santa Cruz, 1350. As demais unidades foram conferidas nas páginas próprias da rede. Galerias de parceiros ainda usam nomes anteriores em alguns URLs; somente foram associadas quando nome/endereço e unidade coincidiam.
- A [Villa no Wellhub](https://wellhub.com/pt-br/search/partners/villa-beach-sports/) e na [TotalPass](https://totalpass.com/br/academias/villa-beach-sports/) informa Rua Pero Correia, 57. A [ClassPass](https://classpass.com/studios/villa-beach-sports-vila-mariana-so-paulo) informa Travessa Luiz Puglisi, 56. O usuário confirmou a arena da Vila Mariana, sem escolher uma entrada. Foi mantido o primeiro endereço e uma nota explícita da entrada alternativa, sem criar duas arenas.
- A [Arena Ace](https://arenaace.com.br/) documenta três quadras de areia na Rua Baumann, 191; a unidade Beach Indoor, na Aliança Liberal, 952, tem cadastro separado e somente beach tennis confirmado.
- A [Nossa Arena](https://nossaarenasp.com.br/) documenta quatro quadras de areia e programação dedicada a mulheres e meninas. O endereço preserva a orientação pública de acesso pela Avenida Nicolas Boer, 100 e entrada da rua sem saída, 200.
- A [Riplay Pompeia no Wellhub](https://wellhub.com/pt-br/search/partners/riplay-pompeia-parque-industrial-tomas-edson/) descreve seis quadras. Quantidades documentadas ajudam a selecionar espaços relevantes, sem inferir que sejam os maiores da cidade.

Posto 011 Moema (números 555/529) e Cidade Jardim (Maracaibo/Lineu de Paula Machado) ficaram fora por divergência de endereço. Praia Brava/Panamby e Narena/Praia Hall ficaram fora por nome ou mudança de operação ainda não resolvidos. Unidades fora do recorte geográfico também não foram importadas. Novas arenas podem entrar depois de confirmação, sem substituir fatos incertos por estimativas.

Não foram importados perfis pessoais, avaliações, telefones privados, preços, horários ou contagens sociais. Descrições são curtas e próprias. Diretório público não significa parceria comercial, posse verificada ou participação da arena no Pico.

## Fotos e apresentação

O coletor leu galerias públicas identificadas por unidade, com hosts permitidos, prazo de resposta, limite de tamanho e intervalo entre requisições. As 105 imagens coletadas foram inspecionadas em folhas de contato; ficaram 76 fotos dos espaços. Logos isolados, produtos, comida e imagens sem utilidade para reconhecer a unidade foram descartados. Brooklin e Jurubatuba usam fotos das páginas oficiais, pois as galerias dos parceiros só ofereciam logos.

As fotos estão em WebP, com orientação corrigida, metadados removidos e tamanho máximo de 1280 × 960, sem corte adicional nem ampliação. O conjunto tem aproximadamente 8,72 MiB. A lista carrega capas sob demanda; a galeria carrega somente a imagem selecionada. Proporção original e `object-fit: contain` preservam o quadro completo na lista e no detalhe. Fotos verticais podem manter margens presentes no original.

[Seleção e ordem](photo-selection.json), dimensões, SHA-256 e URL original de cada arquivo permitem auditar a coleta. A interface credita a página pública de origem; não atribui autoria nem licença das fotos ao Pico. Uma capa enviada e confirmada pela equipe responsável tem prioridade sobre a galeria importada.

## Experiência e segurança

- Lista com nome, bairro, modalidades e filtros por região; busca também por endereço. O filtro atua na página carregada, sinalizada na interface; as 17 entradas cabem na primeira página de 24.
- Perfil com fotos, endereço, rota e ação de acompanhar; informações de origem, descrição e gestão ficam em uma seção expansível. A divergência da Villa aparece uma única vez.
- Acompanhar salva em **Meus Picos**, com o vínculo público já existente no produto. Não cria um favorito privado separado e não publica jogos.
- Solicitar gestão não concede acesso. A aprovação de um operador é necessária; só então o responsável pode criar a comunidade oficial ou aprovar o vínculo de uma comunidade. A operação de criação oficial é idempotente.
- Importação não cria usuários, proprietários, seguidores, posts nem comunidades fictícias. As três arenas demonstrativas conhecidas são arquivadas e deixam de aparecer no ambiente conectado, preservando IDs e relações históricas.
- Duas publicações institucionais repetitivas foram retiradas. Permanece uma pergunta curta: “Qual arena vale conhecer?”. A descrição oficial foi encurtada. Posts de usuários, audiência, comentários e regras de participação permanecem preservados. Murais vazios de arenas/comunidades usam uma linha, em vez de novos blocos explicativos.

## Validação

- 102 testes locais passaram, incluindo integridade dos 76 arquivos, importação transacional/idempotente, preservação de edições do responsável, isolamento anônimo, histórico de jogos e comunidade oficial única.
- [72 verificações no Supabase de desenvolvimento](hosted.json) passaram: API e cookies reais, 17 capas servidas, vínculo persistido sem duplicação, solicitação sem posse, reprovação de aprovação pelo próprio solicitante, aprovação por operador e comunidade oficial somente depois disso.
- Lint, typecheck e build de produção passaram. Revisão do diff inclui fontes, nomes/endereço, acesso, migração, galerias e textos.

### Revisão no navegador

| Amostra | Resultado observado |
|---|---|
| [Klabin, 320 px escuro](klabin-320-dark.png) | Foto carregada, sem overflow horizontal; último item da galeria desativa avançar (3/3). |
| [Villa, 390 px escuro](villa-390-dark.png) | Foto inteira, endereço/rota legíveis; próximo/anterior operantes e foco por teclado chega a Como chegar. |
| [Riplay, 390 px claro](riplay-390-light.png) | Foto inteira, nome quebra sem corte, endereço correto e comunidade oficial da fixture vinculada. |
| [Catálogo, 1280 px claro](directory-1280-light.png) | Duas colunas; oito resultados Oeste e nove Sul; busca “Gama Lobo” encontra Riplay e “Villa” encontra somente Villa. |
| Comunidade oficial, 320/390 px | Descrição curta, um único editorial e mural vazio em uma linha; sem overflow horizontal. |
| Acompanhar e recarregar | Villa reaparece em Meus Picos e permanece acompanhada após navegar/recarregar. |

O tema escuro foi exercitado no servidor de produção local ligado ao Supabase de desenvolvimento. Para o claro, uma fixture HTTP local serviu o mesmo build desativando apenas a media query escura do CSS, sem mudar o tema do computador. Primeiro houve erro de boas-vindas causado pelo proxy da fixture não encaminhar POST; o encaminhamento foi corrigido e a captura final está sem erro. Isso não foi falha do app. Não se trata de teste em aparelho físico nem de auditoria de todos os navegadores. As 76 fotos foram revisadas em contato; o navegador cobriu galerias representativas, não 76 cliques individuais.

O ensaio hospedado usa duas contas descartáveis exclusivamente em desenvolvimento. A limpeza concluiu em 13/09/2026: removeu as duas contas, foto e comunidade de teste, restaurou o estado sem responsável da arena usada e preservou o catálogo real. Não se criam fixtures no banco principal.

## Operação e recuperação

O catálogo é independente de `supabase/seed.sql`, que continua restrito a demonstração/testes. Para revisar ou importar, carregar os arquivos de ambiente correspondentes e executar:

```sh
node --env-file=.env.local --env-file=.env.hosted-admin scripts/database.mjs audit
node --env-file=.env.local --env-file=.env.hosted-admin scripts/import-arena-catalog.mjs --dry-run
node --env-file=.env.local --env-file=.env.hosted-admin scripts/import-arena-catalog.mjs --apply
```

No principal, substituir pelos arquivos `.env.beta.local` e `.env.beta-admin`. A guarda valida identidade remota e projeto vinculado; a transação usa limites de tempo e trava de importação. Reexecutar não sobrescreve nomes, fotos, status, responsável ou modalidades de arenas já existentes. Um slug ocupado por outra identidade aborta a transação. Para atualizar fatos depois da importação, revisar a alteração explicitamente e preservar edições do responsável.

Antes da alteração principal, foi criado backup cifrado e validado por descriptografia/parse das tabelas afetadas: três arenas, sete relações de modalidades, vínculos existentes, três itens editoriais e a comunidade oficial. O dump completo não concluiu nesta rodada; este backup é direcionado ao escopo da mudança, não uma cópia completa do banco. Chave e conteúdo ficam apenas na área ignorada de operação, nunca no Git.

Rollback do código usa o deployment anterior. Para desfazer dados, restaurar somente as linhas afetadas a partir do backup, sem apagar jogos ou contas; arquivar as novas arenas se necessário. Não executar seed nem restaurar tabelas inteiras sobre dados novos de usuários. Recibos privados ficam em `.vercel/arena-research/`.
