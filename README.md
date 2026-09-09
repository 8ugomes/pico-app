# Pico

**O ponto de encontro da areia. Me acha no Pico.**

Rede social mobile-first para futevôlei, beach tennis e vôlei de praia. O Ciclo 8 acrescenta fotos, bloqueios, denúncias, recuperação e exclusão de conta ao núcleo social conectado ao Supabase. A demonstração continua disponível sem configuração.

Ambiente de desenvolvimento publicado: [Pico](https://pico-app-sepia.vercel.app). Supabase `pico-dev` em São Paulo, nove migrations aplicadas e tipos gerados. O núcleo do Ciclo 8 foi validado com duas contas no app publicado; SMTP externo e requisitos operacionais ainda impedem declarar BETA READY. [Ambiente, Auth, deploy e comandos de manutenção](docs/HOSTED_SUPABASE.md).

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
| /signup, /login | Cadastro por e-mail/senha, login e logout; callback PKCE quando confirmação estiver habilitada |
| /perfil | Onboarding, edição de perfil/esporte/disponibilidade e avatar persistido |
| /arenas | Catálogo público com busca, filtros e paginação |
| /arenas/[slug] | Arena, modalidades, início de check-in e mural de posts |
| /checkin | Presença voluntária por até duas horas, substituição, saída e outros jogadores presentes |
| /feed | Posts com texto e foto, curtidas, comentários, exclusão própria e denúncia |
| /descobrir | Jogadores por esporte, nível, arena e check-in ativo; conectar/desconectar |
| /perfil/[username] | Perfil entre contas autenticadas, conexão, bloqueio e denúncia; sem e-mail ou edição alheia |
| /conta, /privacidade | Bloqueios, denúncias próprias, fotos sem uso, informações de privacidade e exclusão com senha |
| /recuperar, /redefinir-senha | Pedido de recuperação e troca de senha; entrega externa depende de SMTP |

Conexão é unilateral: você acompanha outro jogador. Só perfis com onboarding completo e esporte aparecem na descoberta. Filtro por arena considera vínculo em arena_members ou presença ativa; acompanhamento de arenas ainda não tem interface conectada. O mural da arena é a base social existente; grupos, convites recíprocos e comunidades futuras não estão implementados.

## Demonstração

Sem ambas as variáveis de Supabase, todas as telas sociais usam jogadores, arenas e atividades fictícios, com aviso explícito. Rafa Costa é a identidade do demo. Curtidas, comentários, conexões, arenas acompanhadas, posts, perfil e check-in vivem em memória durante a navegação; recarregar ou sair dessas telas reinicia o estado. Nada é enviado ao banco.

Configuração parcial/inválida ou serviço indisponível produz erro; nunca troca silenciosamente para mock. Em ambiente conectado, seeds fictícios continuam identificados como demonstração. Fotos de arenas do seed são ilustrações; contas reais não recebem retratos fictícios.

## Configurar Supabase de desenvolvimento

1. Copie .env.example para .env.local e preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY com valores públicos do projeto.
2. Aplique **todas** as migrations versionadas em ordem. Use o fluxo de migrations do Supabase; em projeto existente, não reaplique manualmente migrations já registradas. seed.sql é opcional e exclusivamente para desenvolvimento: três esportes e três arenas fictícias, sem usuários.
3. Habilite e-mail/senha e configure as URLs permitidas. O pico-dev já permite localhost e Vercel e usa cadastro imediato. Para confirmação de e-mail a usuários externos, configure SMTP próprio antes de habilitá-la; o SMTP padrão aceita apenas membros da organização.
4. Preserve o template PKCE com `{{ .ConfirmationURL }}`; abra a confirmação no mesmo navegador do cadastro. A confirmação e o login levam a /perfil.
5. Configure `SUPABASE_SECRET_KEY` exclusivamente no servidor para uploads validados, entrega privada de mídia e exclusão de conta. Não use prefixo NEXT_PUBLIC_. Reinicie o dev ou gere um novo deploy. A chave não é usada nas consultas sociais comuns.

Nunca use service_role, secret key, senha ou token em Git/NEXT_PUBLIC_*. As consultas sociais usam publishable key e sessão do usuário. Mídia e exclusão usam uma chave administrativa isolada **depois** de validar identidade e autorização. As quinze tabelas públicas têm RLS e grants limitados; contadores de abuso ficam no schema privado. Criação de perfil usa trigger; save_profile e check-ins são transacionais; autorias derivam de auth.uid(). O servidor verifica getUser antes de leituras privadas e mutations. API de escrita valida origem, JSON de até 8 KiB, campos e limites; erros não retornam SQL ou tokens.

Leituras privadas ficam em Route Handlers que podem renovar cookies; as páginas entregam componentes clientes e não consultam dados privados no Server Component. Implementar proxy de renovação antes de adicionar SSR privado. APIs usam private/no-store; o foco atual é segurança da sessão, não cache de dados privados.

[Schema, grants e RPCs](docs/04_SUPABASE_SCHEMA.md). src/types/database.ts é gerado diretamente do banco hospedado por `npm run db:types`; não editar manualmente.

## Qualidade e evidência

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Os 48 testes padrão executam migrations/seeds/RLS em PostgreSQL/PGlite descartável, regras demo, validação de entradas e SDK. Testes de duas identidades incluem tentativas de autoria forjada, edição alheia, rollback, auto-conexão, arena privada, combinação inválida, paginação e expiração. Essa suíte é independente do serviço remoto.

A suíte opt-in `tests/hosted-smoke.mjs` cria duas contas descartáveis e valida Auth/PostgREST/Storage reais no app publicado. Inclui leitura/escrita, sessão, mídia, bloqueios, denúncias, moderação administrativa, limites concorrentes e exclusão das contas. O teste de recuperação usa um token real gerado administrativamente; não comprova entrega de e-mail. [Evidência atual e limites](docs/BETA_CHECKLIST.md).

```bash
# Requer .env.local e .env.hosted-admin protegidos; nunca comitar segredos.
npm run test:hosted -- bxjhqxdfknspxezgftyz https://pico-app-sepia.vercel.app
```

A suíte normal é independente da infraestrutura remota. A fixture legada em `tests/helpers/read-api-fixture.mjs` simula Auth/REST e serve para diagnóstico local do núcleo social; não substitui Storage hospedado nem comprova segurança de Auth. Testes e fixtures não são publicados na Vercel.

## Fotos, bloqueio e operação

Buckets `avatars` e `post-media` privados. O app aceita JPG, PNG e WebP de até 3 MiB e 25 megapixels, converte sem metadados e valida a propriedade no banco. Clientes não recebem acesso direto ou URLs assinadas do Storage. Cada imagem passa por identidade verificada e `can_read_media` com RLS antes da entrega sem cache. Bloqueios ocultam perfil, presença, conteúdo e fotos nos dois sentidos e desfazem conexões.

Escritas têm limites por conta no banco, mesmo fora da interface. Denúncias são privadas e revisadas pelo operador; não há punição automática por quantidade. Exclusão de conta pede senha novamente, interrompe acesso social, remove arquivos e depois a identidade e dados vinculados. [Limites, moderação, falhas, limpeza e continuidade](docs/BETA_OPERATIONS.md).

## Limites atuais

A liberação externa continua **BLOCKED** até configurar e testar SMTP, definir contato/responsável de privacidade e concluir a preparação operacional descrita no checklist. Arenas do seed são fictícias. Instalação/atualização em aparelhos físicos e restauração de backup não foram comprovadas.

Manifesto, ícones, safe areas e navegação estão preparados para PWA. Não há service worker nem uso offline de conteúdo privado. Logout/troca de conta descartam a tela anterior; restauração pelo histórico força nova leitura. [Roadmap PWA](docs/pwa-roadmap.md).

Fora do MVP: reservas, pagamentos, B2B, chat, IA, mapa ao vivo e ranking. Acompanhamento de arenas e edição de posts/comentários não têm interface conectada; a exclusão própria está disponível.

## Desenvolvimento

Leia [AGENTS.md](AGENTS.md), [plano](docs/pico-product-plan.md), [Deslopify](docs/deslopify.md) e [registro dos ciclos](docs/CODEX_AUTONOMOUS_LOOP.md). Cada ciclo registra auditoria/plano antes do código, verificações, aprendizado e commit. Documentos numerados antigos preservam decisões históricas; o estado atual está neste README e no topo do schema/plano.
