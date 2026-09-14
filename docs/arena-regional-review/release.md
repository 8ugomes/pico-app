# Publicação e preservação — 14/09/2026

[PR #25](https://github.com/8ugomes/pico-app/pull/25) integrado à main. Artefato **46795683d0e5** publicado e confirmado em [pico-app-sepia.vercel.app](https://pico-app-sepia.vercel.app/arenas).

Os dois workflows do código aprovado passaram: [Pico checks](https://github.com/8ugomes/pico-app/actions/runs/34854687182) e [regressão de perfil no navegador](https://github.com/8ugomes/pico-app/actions/runs/34854687150). Lint, typecheck, build, auditoria de dependências e 142 testes locais aprovados. A rota temporária de QA não foi publicada.

## Evidência no principal

| Verificação | Resultado |
|---|---|
| Catálogo conectado | 69 arenas reais; nove inclusões, sem recadastrar unidades antigas |
| Inventário anterior | 89 linhas acompanhadas |
| Inventário posterior | 98 linhas: apenas nove arenas acrescentadas |
| Registros ausentes, identidade alterada ou conteúdo editado | Zero |
| Mídias existentes | Sete arquivos lidos antes/depois, com bytes idênticos por SHA-256 |
| Fotos públicas do catálogo | 149 arquivos HTTP 200; todos os hashes iguais ao manifesto versionado |
| Miniaturas das novas arenas | Nove capas processadas pelo otimizador em produção, HTTP 200 |
| Versão e saúde | Versão 46795683d0e5, banco e Auth saudáveis |
| API social anônima | Acesso recusado com HTTP 401 |

O inventário cobre perfis, publicações, comentários, jogos privados, contexto de jogo, referências de mídia, arenas, participações, comunidades e seus vínculos. A comparação foi feita por identidade/hash, não apenas por total. Os quatro perfis existentes e todo o conteúdo acompanhado permaneceram intactos. Não houve conta de teste criada no principal, seed, reset, atualização de RLS ou troca de Supabase.

A primeira tentativa de stage foi recusada pela Vercel com “Not authorized”. A sessão e o projeto foram conferidos por leitura; uma nova tentativa foi aceita. O stage preservou as 89 linhas, a importação adicionou as nove arenas e a promoção foi concluída. A versão antiga permaneceu no domínio principal até a promoção.

Recibos privados: `.vercel/arena-research` e `.vercel/content-preservation` dos checkouts operacionais. Não incluem conteúdo textual/fotografias dos usuários no Git. As conferências públicas e hashes das mídias existentes foram feitas após a promoção.

## Limites preservados

As nove inclusões e a Ma Kai têm fotos verificadas. [21 unidades antigas do levantamento estadual](photo-pending.md) ainda não têm imagem aprovada e permanecem acessíveis, sem fotografia genérica e sem perda de histórico. A identidade exata citada como “Arena Caienas” não foi confirmada; Sun7 e Kanoa são as duas inclusões documentadas em Caieiras. [Pesquisa e fontes](README.md).
