# Publicação e revisão da base · 14/09/2026

Notificações publicadas no [Pico principal](https://pico-app-sepia.vercel.app/notificacoes). [PR #23](https://github.com/8ugomes/pico-app/pull/23) integrado com a [CI aprovada](https://github.com/8ugomes/pico-app/actions/runs/34801258676). Artefato servido: `a4aa9628fbcb`, deployment `dpl_5KgTaxNKWqfc2wmMJYaVqvZ1nHzs`. Conferência principal por `/api/version` e `/api/health` em 14/09/2026 às 00h09 de São Paulo. Este relatório documenta a revisão posterior; não altera o código desse artefato.

## Publicação

Integração sobre a main preservou busca, avatar real, perfil inicial, tutorial e instalação Pico Club. Lint, typecheck, build, 140 testes locais e 85 verificações hospedadas de notificações/limpeza passaram. As duas migrations aditivas foram aplicadas no principal após o dry-run listar somente esses arquivos. O script oficial gerou o artefato com domínio ainda separado; versão, saúde e rejeição anônima da API foram conferidas antes da promoção.

Inventários privados antes/depois da migration e do deployment preservaram os mesmos 15 registros acompanhados de perfis, publicações, comentários, jogos, contexto e mídia: zero perdas, alterações de identidade ou edições. Contas e conteúdo real não foram usados como fixtures.

## Base observada

Leitura em transação `READ ONLY`, às 00h12 de 14/09/2026, cruzada com a interface autenticada. Dados agregados deste momento, sem estimativa de crescimento ou presença ao vivo.

| Item | Resultado |
| --- | --- |
| Pessoas reais | 2; uma cadastrada nas últimas 24 horas |
| Perfis completos | 2, ambos com foto e modalidade principal |
| Admissão e comunidade oficial | 2 admitidos e 2 participantes ativos |
| Modalidade dos perfis | Futevôlei para ambas as pessoas |
| Comunidades | 1 ativa; nenhum pedido pendente |
| Conteúdo | 2 publicações, 2 comentários, 2 curtidas e 1 republicação |
| Jogos privados | 2 registros, consultados apenas como contagem |
| Vínculos entre pessoas | 2 relações direcionais; não representam duas amizades distintas |
| Arenas públicas ativas | 60 identidades coincidem com o catálogo |
| Fotos do catálogo | 76 fotos em 17 arenas; 43 arenas sem foto |
| Pessoas que acompanham arenas | 1 |
| Notificações | 0; trigger ativo e RLS habilitada |

Não foram encontradas contas sem perfil, perfis sem admissão, usernames duplicados, perfis concluídos sem foto/modalidade, referências prontas de avatar sem objeto no Storage ou participantes oficiais sem registro de boas-vindas. Nenhuma denúncia pendente, suspensão/revogação ou exclusão solicitada no instante consultado. Isso descreve os controles conferidos, não substitui uma auditoria completa de segurança.

As fotos editoriais estão no catálogo versionado. Consultar apenas os campos de upload do banco subconta as imagens; os 60 IDs/slugs ativos foram cruzados com o catálogo para chegar ao resultado correto acima.

## Revisão da experiência

Na sessão real disponível, Início, Pessoas, perfil público, comunidade oficial e Notificações carregaram com conteúdo e vínculos coerentes. As duas pessoas aparecem como participantes da comunidade. A descoberta exclui corretamente o próprio perfil. O novo sino e a aba lateral estão presentes; a caixa está vazia porque não houve entrada após a ativação. Não foi produzido histórico retroativo para pessoas já inscritas.

O histórico de uma publicação ainda referencia uma arena Demo retirada. A identificação Demo continua explícita e o conteúdo permanece preservado, conforme o contrato existente para arenas arquivadas. Uma das pessoas ainda não acompanha arenas: oportunidade de orientar descoberta, sem criar vínculos por ela.

## Pontos para a próxima rodada

- Completar as fotos autorizadas das 43 arenas ainda sem imagem.
- Acompanhar a primeira nova entrada real para observar o aviso com conteúdo no principal. Geração, leitura e isolamento já foram exercitados com identidades controladas no desenvolvimento; não se afirma envio real em produção sem esse evento.
- A base atual é pequena; avaliar o caminho entre cadastro, escolha de arena e interação com mais pessoas, sem tratar essas duas contas como amostra representativa.

Avisos são internos ao aplicativo. Não incluem push do sistema nem e-mail. Não houve novo teste em aparelho físico. Inventário individual e recibos operacionais ficam na área local ignorada `.vercel`, sem nomes, credenciais ou conteúdo de jogadores no Git.
