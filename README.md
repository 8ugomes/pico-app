# Pico

**O ponto de encontro da areia. Me acha no Pico.**

Rede social mobile-first para futevôlei, beach tennis e vôlei de praia. Cycles 0.5–7 implementam o núcleo social conectado ao Supabase e preservam uma demonstração utilizável sem configuração.

## Rodar

Node.js 24 e npm 11:

```bash
npm install
npm run dev
```

Abra [Pico local](http://localhost:3000). A entrada abre /feed. O cache npm local em .npmrc evita problemas de permissão do cache global; não use sudo npm install.

## Jornadas

| Tela | Com Supabase configurado |
| --- | --- |
| /signup, /login | Cadastro por e-mail/senha, confirmação PKCE, login e logout |
| /perfil | Onboarding e edição de nome, username, bio, cidade/bairro, esporte principal, nível e disponibilidade |
| /arenas | Catálogo público com busca, filtros e paginação |
| /arenas/[slug] | Arena, modalidades, início de check-in e mural de posts |
| /checkin | Presença voluntária por até duas horas, substituição, saída e outros jogadores presentes |
| /feed | Posts de texto, curtidas/descurtidas, comentários e paginação |
| /descobrir | Jogadores por esporte, nível, arena e check-in ativo; conectar/desconectar |
| /perfil/[username] | Perfil compartilhado entre contas autenticadas, sem e-mail ou edição alheia |

Conexão é unilateral: você acompanha outro jogador. Só perfis com onboarding completo e esporte aparecem na descoberta. Filtro por arena considera vínculo em arena_members ou presença ativa; acompanhamento de arenas ainda não tem interface conectada. O mural da arena é a base social existente; grupos, convites recíprocos e comunidades futuras não estão implementados.

## Demonstração

Sem ambas as variáveis de Supabase, todas as telas sociais usam jogadores, arenas e atividades fictícios, com aviso explícito. Rafa Costa é a identidade do demo. Curtidas, comentários, conexões, arenas acompanhadas, posts, perfil e check-in vivem em memória durante a navegação; recarregar ou sair dessas telas reinicia o estado. Nada é enviado ao banco.

Configuração parcial/inválida ou serviço indisponível produz erro; nunca troca silenciosamente para mock. Em ambiente conectado, seeds fictícios continuam identificados como demonstração. Fotos de arenas do seed são ilustrações; contas reais não recebem retratos fictícios.

## Configurar Supabase de desenvolvimento

1. Copie .env.example para .env.local e preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY com valores públicos do projeto.
2. Aplique **todas** as migrations versionadas em ordem. Use o fluxo de migrations do Supabase; em projeto existente, não reaplique manualmente migrations já registradas. seed.sql é opcional e exclusivamente para desenvolvimento: três esportes e três arenas fictícias, sem usuários.
3. Habilite e-mail/senha e confirmação de e-mail. Configure Site URL como http://localhost:3000 e permita http://localhost:3000/auth/callback nas Redirect URLs. Ajuste os dois endereços no ambiente de publicação.
4. Preserve o template PKCE com `{{ .ConfirmationURL }}`; abra a confirmação no mesmo navegador do cadastro. A confirmação e o login levam a /perfil.
5. Reinicie npm run dev. Em hospedagem, configure as variáveis e gere um novo build.

Nunca use service_role, secret key, senha ou token em Git/NEXT_PUBLIC_*. O aplicativo usa somente publishable key e sessão do usuário. As onze tabelas expostas têm RLS e grants limitados. Criação de perfil usa trigger; save_profile e check-ins são transacionais; autorias derivam de auth.uid(). O servidor verifica getUser antes de leituras privadas e mutations. API de escrita valida origem, JSON de até 8 KiB, campos e limites; erros não retornam SQL ou tokens.

Leituras privadas ficam em Route Handlers que podem renovar cookies; as páginas entregam componentes clientes e não consultam dados privados no Server Component. Implementar proxy de renovação antes de adicionar SSR privado. APIs usam private/no-store; o foco atual é segurança da sessão, não cache de dados privados.

[Schema, grants e RPCs](docs/04_SUPABASE_SCHEMA.md). Os tipos são manuais e alinhados às migrations; substitua por tipos gerados após aplicar o schema no projeto alvo.

## Qualidade e evidência

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Testes automatizados executam migrations/seeds/RLS em PostgreSQL/PGlite descartável, regras demo, validação de entradas e SDK. Testes de duas identidades incluem tentativas de autoria forjada, edição alheia, rollback, auto-conexão, arena privada, combinação inválida, paginação e expiração. São evidência local, **não validação de Supabase hospedado**.

A jornada cadastro → perfil → arena → check-in → feed → descoberta foi exercitada no navegador com SQL real local e transporte Auth/REST simulado. Não foram validados JWT real, entrega de e-mail, refresh de tokens hospedados, concorrência de múltiplas conexões PostgreSQL nem instalação em aparelho físico. Veja o [checklist beta](docs/BETA_CHECKLIST.md).

## Reproduzir a integração local isolada

Em três terminais, sem criar ou modificar .env.local:

```bash
# 1. Banco descartável e transporte de teste em loopback
node tests/helpers/read-api-fixture.mjs
```

```bash
# 2. Build conectado à fixture; não interfere no dev em 3000
PICO_BUILD_DIR=.next-social-check NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_fixture_only npm run build
PICO_BUILD_DIR=.next-social-check NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_fixture_only npm run start -- --port 3002
```

```bash
# 3. Verificações HTTP do aplicativo e cookies criados pelo SDK
node tests/connected-http-smoke.mjs
```

Abra [fixture do Pico](http://localhost:3002/signup). Use somente endereço @example.invalid e senha de teste `PicoTeste123!`. Essa senha não é credencial real; vale exclusivamente para o transporte local. alice-ui@example.invalid e bruno-ui@example.invalid são contas descartáveis disponíveis. Reiniciar a fixture apaga seus dados. Nunca publique a fixture ou use suas chaves em ambiente real.

Para estados de erro/vazio/lentidão: POST http://127.0.0.1:54331/fixture-mode?value=error, empty, slow ou success. Volte a success após o teste. Essa API existe somente na fixture e não entra no aplicativo. O Next pode acrescentar caminhos .next-social-check ao tsconfig durante esse build; remova esses includes temporários antes de commitar.

## Limites do MVP

Sem upload de fotos/Storage, recuperação de senha na interface, moderação/bloqueios, reservas, pagamentos, B2B, chat, IA, mapa ao vivo ou ranking avançado. Posts e comentários não têm edição/exclusão na interface conectada; o banco já protege essas operações por autoria. Planejar moderação e recuperação de acesso antes de abrir um beta público amplo.

Manifesto, ícones e navegação estão preparados para PWA. Não existe service worker nem promessa de uso offline. [Roadmap PWA](docs/pwa-roadmap.md).

## Desenvolvimento

Leia [AGENTS.md](AGENTS.md), [plano](docs/pico-product-plan.md), [Deslopify](docs/deslopify.md) e [registro dos ciclos](docs/CODEX_AUTONOMOUS_LOOP.md). Cada ciclo registra auditoria/plano antes do código, verificações, aprendizado e commit. Documentos numerados antigos preservam decisões históricas; o estado atual está neste README e no topo do schema/plano.
