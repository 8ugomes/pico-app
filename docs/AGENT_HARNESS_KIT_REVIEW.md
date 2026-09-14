# Agent Harness Kit v0.7.2: análise e adoção seletiva no Pico

Análise iniciada em 14/09/2026 e integrada sobre a main após a publicação de menções. Fonte: [release v0.7.2](https://github.com/Eduardo-Salvador/Agent-Harness-Kit/releases/tag/v0.7.2), commit fixado `e9a003074bdb136cd93a59eafdaf84b266d8f3da`, [licença MIT](third-party/AGENT_HARNESS_KIT_LICENSE.md). A tag anotada não tem assinatura criptográfica: commit e hashes dão reprodutibilidade, não autenticam a identidade do publicador.

## Avaliação do upstream

O Kit é principalmente um sistema de operação de agentes, não um pacote de otimização Next.js. Suas 11 skills dependem de playbooks, contratos e CLI próprios. No Pico, o instalador `core --dry-run` propôs 244 arquivos e substituição das pontes `AGENTS.md`/`CLAUDE.md`; a instalação integral duplicaria o plano e as regras já mantidas no projeto. Nenhuma instalação upstream foi aplicada, nem scripts do Kit foram adicionados ao app.

O instalador possui staging e rollback, mas sua execução real faria cópias e alterações de raiz. Os testes e o validador upstream rodaram apenas em clone temporário: a primeira execução achou uma dependência ambiental de `python` ausente no PATH do macOS; com Python 3.12 no PATH, 130/130 testes passaram. `tools/validate.py` aprovou 174 Markdown e 218 arquivos exigidos. Isso valida o upstream naquele ambiente, não o comportamento do Pico.

| Skills nativas | Decisão no Pico | Razão |
| --- | --- | --- |
| `request-router`, `writing-plans` | Adaptadas em [pico-slice-plan](../.agents/skills/pico-slice-plan/SKILL.md) | Uma entrega verificável no plano corrente, sem segundo grafo/CLI. |
| `test-driven-task` | Adaptada em [pico-test-cycle](../.agents/skills/pico-test-cycle/SKILL.md) | Teste de comportamento novo quando pertinente e caracterização antes/depois na refatoração. |
| `frontend-screen` | Adaptada em [pico-screen-check](../.agents/skills/pico-screen-check/SKILL.md) | CSS/rotas reais, temas e larguras, subordinados à Aura Manteiga. |
| `feature-discovery`, `first-run-discovery` | Não instaladas | Produto e direção já têm contexto, plano e autoridade próprios. |
| `graph-execution`, `parallel-dispatch`, `codex-agent-dispatch` | Não instaladas | Exigem runtime/leases e duplicariam coordenação. |
| `governed-review`, `project-learning` | Não instaladas | Dependem de revisor independente ou destino de notas que esta entrega não cria. |

Hashes SHA-256 das entradas consultadas: `request-router` `67c7fe5474ac5c6b86c48c320731c523855a8ee7fd12e6ab5051bf4814b35a04`; `writing-plans` `d6ff5bb1b1a603c5dd01eeac7f3ea2c64f84478756d451beddf1bdbdeecd29fc`; `test-driven-task` `a593527cf15609d9723bd43ebe03e69bd6c315ded984176fe1c96ebbe31f7fbf`; `frontend-screen` `8c584e3d0bccec749d865b407e3f4d54bef448adf0aefe0bdd627019b164b878`. As três adaptações locais foram validadas com o `quick_validate.py` da skill-creator; são instruções sem executáveis, serviços, dependências ou permissões novas.

## Mudança no aplicativo e medição

Na main, `/` redireciona para `/feed`; a landing de outra branch **não** integra esta publicação. O CSS de feed, páginas sociais, jornada, onboarding e notificações saiu do `globals.css` para o layout `(social)` por `social-bundle.css`. Tokens, Tailwind, formulários e guia de instalação ficaram globais. O app não ganhou nova rota, migração, permissão, dependência ou chamada Supabase. Corrigido também um seletor preexistente que esticava o avatar de demonstração do editor no feed de 38×38 para 128×38 px.

Medição no build demo da main atual com `next build`/`next start`: soma dos CSS referenciados pelo HTML de cada entrada direta, bytes não comprimidos. Para reproduzir: `PICO_ENV=demo NEXT_PUBLIC_PICO_ENV=demo npm run build`, iniciar `PICO_ENV=demo NEXT_PUBLIC_PICO_ENV=demo npm run start -- -p 3217` e executar `npm run measure:css`. Não mede rede comprimida, JS, LCP ou Web Vitals.

| Rota | Antes | Depois | Diferença |
| --- | ---: | ---: | ---: |
| `/login`, `/signup`, `/instalar` | 162.467 B | 108.936 B | −53.531 B (−32,9%) |
| `/feed`, `/notificacoes`, `/perfil` | 170.944 B | 171.212 B | +268 B (+0,2%) |

O CSS público compilado não contém `.social-app`, e o feed contém; o guia mantém `.install-guide`. O Next.js 16.3.4 documenta que estilos globais importados em layout podem permanecer após navegação cliente. Portanto o ganho é de **primeira carga direta** em rota pública, não uma garantia após entrar e sair do feed. O aumento social decorre da separação e do seletor corrigido; nenhuma economia é alegada nessas rotas.

## Verificação e limites

Na integração local: `npm ci` e `npm audit --audit-level=high` sem vulnerabilidades reportadas; lint, typecheck em demo, build em demo e 148/148 testes locais aprovados. Build conectado de produção, CI, stage e smoke externo são gates de publicação separados. A verificação visual do build demo cobriu login e guia de instalação em 390 px, feed em 390/1280 px no tema escuro disponível; sem overflow horizontal, e avatar corrigido para 38×38 px. Não houve inspeção visual do tema claro nessa sessão, apenas preservação das regras compiladas. A versão demo identifica pessoas fictícias e ações locais; não foi usada para afirmar login, SMTP, Storage ou fluxo real conectado.

Uma revisão anterior na branch da landing mediu também a rota `/` estática, mas aquele resultado não se aplica à main publicada e não é usado como prova desta release. A economia reportada acima foi medida novamente na main real, depois da integração das menções e do guia de instalação. O próximo passo de desempenho, se necessário, é medir CSS transferido comprimido e Web Vitals em rede/dispositivo representativos.

## Recibo de publicação · 14/09/2026

PR [#31](https://github.com/8ugomes/pico-app/pull/31) integrado após CI `Pico checks` aprovada. A main `71b754993ace954047608d61297b91c73d7f8788` foi publicada pelo script oficial em stage protegido e promovida ao projeto `pico-app`, domínio `pico-app-sepia.vercel.app`, artefato `dpl_HtoueWYJXehi4HMJAMTCSgQwwvY4`. Não houve migration. O inventário privado do script comparou 104 registros antes/depois, com 0 ausentes, 0 identidades alteradas e 0 edições; os recibos privados permanecem fora do Git.

Antes da promoção, o artefato retornou versão `71b754993ace`, saúde 200 com banco/Auth verdadeiros, login e instalação 200, e notificações anônimas 401. O domínio público ainda servia `cd1feddad0f9` naquele momento. Após a promoção, o domínio passou a `71b754993ace`; saúde 200, login/instalação 200 e notificações anônimas 401 novamente. CSS público servido: 51.659 B não comprimidos em login/cadastro/instalação, sem `.social-app`; feed: 113.935 B com `.social-app`. Esses números de produção não são comparados com um baseline conectado anterior; a comparação antes/depois da tabela acima é do build demo equivalente.

Inspeção visual publicada do login (sessão já existente, sem tentativa de novo login) e do guia de instalação em 390 px confirmou layout e conteúdo. Não foi exercitada escrita social, sessão nova ou Storage em produção. O heartbeat existente `verificar-disponibilidade-do-pico` permanece ativo a cada dez minutos; `/api/health` e o smoke de release são verificações pontuais, não garantia de ausência de falhas futuras.
