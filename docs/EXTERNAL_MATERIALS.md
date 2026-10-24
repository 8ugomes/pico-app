# Materiais externos e recuperação textual

Inventário de 23/10/2026 para continuidade do Pico em outro ambiente. O repositório agora conserva um [arquivo textual de marketing](marketing/archive/README.md) recuperado de pacotes próprios de entrega. As fontes completas da landing e todos os materiais visuais externos não estão no checkout; a sincronização do aplicativo não deve ser confundida com recuperação integral desses trabalhos.

## Material recuperado

| Origem histórica | Recuperado no Git | Permanece externo ou ausente |
| --- | --- | --- |
| Carrosséis de apresentação | Copy, textos alternativos, prompts e resumo editorial | PNG/SVG, fontes binárias, galeria, ZIP e renderizador |
| Areia em movimento | Brief, copy, alternativos, prompts e fonte de composição arquivado como texto | Fotos, grão, derivados, vídeos, galeria e pacote completo; fonte não executável sem adaptação |
| ToNoPico, segunda direção | Brief, copy, alternativos, prompts, manifesto e verificação histórica | Fotos, artes, vídeo, galeria, ZIP e renderizador |
| ToNoPico, nova coleção CCOS | Brief, copy, alternativos, pedidos de geração, manifesto e verificação histórica | Fotos, artes, vídeos, skill, documento de integração, renderizador e commit citado |
| Landing e analytics | [Síntese sanitizada do guia](marketing/archive/landing-analytics.md) | Componentes, build estático, recibo técnico e configuração atual do provedor |

As quatro cópias locais externas identificadas continham, respectivamente, 50, 92, 70 e 78 arquivos. Isso comprova existência local na data do inventário; não significa disponibilidade para quem clona o GitHub. Os binários, ZIPs e galerias não foram importados nesta rodada. Não há dados pessoais, backups, credenciais ou transcrições completas intencionalmente incorporados ao arquivo textual.

## Fontes ausentes e alcance da busca

Os commits `a95091c` (nova coleção ToNoPico) e `e2f8ec6` (revisão editorial da landing) são citados por conversas/documentos, mas não foram localizados no banco de objetos local, nas refs/reflogs examinadas ou pela consulta de commit no GitHub. A branch histórica `codex/beta-security` também não estava entre as refs acessíveis. Isso limita a recuperação; não demonstra que os objetos nunca existiram em outro clone ou backup.

Os seguintes caminhos históricos não estavam no checkout:

- `src/components/pico/landing`, `scripts/build-landing.mjs`, `scripts/landing-static`, `docs/LANDING_HOSTING.md`, `docs/LANDING_ANALYTICS.md`, `docs/landing-review` e `public/images/landing`;
- os diretórios gerados `.next-landing-static` e `.vercel/pico-club-worktree`;
- `scripts/render-instagram.mjs`, `scripts/render-instagram-areia.mjs`, `scripts/render-instagram-tonopico.mjs` e `scripts/render-instagram-tonopico-ratos.mjs`;
- `.agents/skills/pico-creative-production`, `docs/CCOS_RATOS_INTEGRATION.md` e `docs/brand-exploration/aura-manteiga/AREIA-EM-MOVIMENTO.md`.

Uma cópia de composição de Areia em movimento sobreviveu no pacote de entrega e foi preservada em [composicao.mjs.txt](marketing/archive/areia-em-movimento/composicao.mjs.txt). O código depende da posição antiga no projeto, de uma API interna de fontkit e de imagens ausentes; não foi executado ou integrado ao build. É referência para recuperação posterior, não uma promessa de reprodução atual.

## Decisões e evidências das conversas

- **Integrar skills do CCOS Ratos** registra entrega local da nova coleção e o commit `a95091c`, sem postagem ou impulsionamento. Os documentos recuperados atribuem a metodologia a um template público; não contêm as skills comerciais completas.
- **Criar landing page premium**, chat arquivado, registra landing separada em [pico-social.pages.dev](https://pico-social.pages.dev/) e ativação histórica de analytics em setembro. Cliques/Umami continuavam pendentes; a última solicitação de atualizar o logo para Pico Club não teve conclusão comprovada no trecho consultado. Nenhum estado de painel foi revalidado nesta recuperação.
- **Plano de ação do aplicativo** organizou produto/desenvolvimento, legal/domínio/operação/publicação e distribuição/comunidade. O recorte numérico de piloto apresentado ali era proposta, sem aceite explícito localizado; não é política aprovada nem evidência de participantes.

As conversas foram usadas para localizar e interpretar entregas, sem importar mensagens integrais, instruções de outras tarefas, dados pessoais ou acessos privados. Os arquivos históricos não prevalecem sobre [AGENTS](../AGENTS.md), o [plano corrente](pico-product-plan.md), a [identidade canônica](pico-design-system.md) e a [política de autenticação](OFFICIAL_COMMUNITY_AUTH.md).

## Reutilização e próximos passos

A recuperação corrigiu promessas antigas de confirmação de e-mail, retirou links privados e referências pessoais, e substituiu READMEs com links quebrados por inventários explícitos. Briefs, copy, prompts e verificações continuam datados; suas afirmações históricas não comprovam saúde atual, direitos sobre novas imagens, tráfego real ou desempenho de divulgação.

Para retomar a landing ou renderizar campanhas, recuperar as fontes faltantes de um clone/backup legítimo ou reconstruí-las em uma tarefa específica, conferir dependências e ativos, e validar o resultado antes de publicar. Não é necessário copiar esses materiais externos para desenvolver o aplicativo.

Nenhuma campanha, landing ou alteração de analytics foi publicada nesta rodada. Nenhuma conta, provedor, serviço pago, envio recorrente ou nova coleta foi ativada.
