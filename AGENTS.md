<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Pico — orientações do projeto

Pico é uma rede social PWA mobile-first para futevôlei, beach tennis e vôlei de praia.

**O ponto de encontro da areia. Me acha no Pico.**

## Prioridades

Responder quem joga onde o usuário joga, quem está disponível e o que acontece nas suas arenas.
Priorizar pessoas, perfis de arenas, comunidades próprias, check-in, feed e descoberta. Ciclo 9 amplia expressamente o escopo: comunidades independentes ou vinculadas a arenas, com papéis e audiência próprios.
Manter fora do MVP: IA, voz, reservas, pagamentos, B2B, anúncios, ranking avançado, mapa em tempo real e app nativo.

## Leia antes de desenvolver

### Regra permanente por rodada

1. Ler AGENTS.md.
2. Ler os documentos em docs.
3. Atualizar o plano de ação antes de codar.
4. Atualizar o Deslopify antes de codar.
5. Executar as mudanças.
6. Rodar lint, typecheck e build.
7. Atualizar o plano de ação depois de codar.
8. Atualizar o Deslopify com aprendizados da rodada.
9. Atualizar o changelog.
10. Fazer commit.

Decisões pequenas devem ser tomadas com bom senso, sem pedir confirmação.
O plano corrente é docs/pico-product-plan.md; a revisão corrente é docs/deslopify.md.
Consultar também docs/pico-design-system.md, docs/pwa-roadmap.md e docs/04_SUPABASE_SCHEMA.md.
Os documentos numerados anteriores preservam a evolução histórica.

- README.md: setup, comandos, configuração e limites atuais.
- docs/00_PLANO_DE_ACAO_PICO_MVP.md: fases, modelo proposto e critérios de aceite.
- docs/skill_pico_dev.md: fluxo técnico.
- docs/skill_pico_deslopify.md: revisão visual e editorial.
- A documentação local de Next.js indicada acima, conforme a API alterada.

## Stack e estrutura

Next.js App Router, TypeScript strict, Tailwind CSS 4, Supabase/Postgres/Auth/Storage, Vercel e PWA.
Preservar npm e package-lock.json. O cache npm local em .npmrc resolve EACCES do cache global; não usar sudo npm install.
Rotas em src/app, UI em src/components/ui, domínio em src/components/pico e integrações em src/lib.
Server Components por padrão; manter interação no menor componente cliente necessário.
Tokens em src/app/globals.css. Reutilizar os componentes existentes.

## Produto e apresentação

Mobile-first, dark mode, grafite e areia, cards arredondados, transparência discreta e movimento reduzível.
Texto em pt-BR, curto, próximo e concreto. Uma ação principal por contexto.
Dados ilustrativos precisam de rótulo; não fingir cadastro, presença, salvamento ou métricas.
Demonstração exige configuração explícita. Ambientes conectados negam acesso social sem admissão vigente. O Ciclo 9 é exclusivo para revisão interna: não promover produção, abrir inscrições ou enviar convites externos.
Auth real e jogador fictício são estados distintos. Ações do demo ficam locais, identificadas e sem envio para outras pessoas.
Rotas canônicas: /feed, /arenas, /arenas/[slug], /checkin, /descobrir, /perfil.
Não implementar um recurso só porque apareceu como sugestão de rota no plano.

## Backend e privacidade

Sem segredos em Git, HTML, logs ou variáveis NEXT_PUBLIC_*.
Somente URL e publishable key públicas do Supabase no cliente.
Toda tabela exposta precisa de RLS, autoria verificada e migrations versionadas.
Storage exige políticas, limites de upload e vínculo ao proprietário.
Autorização usa getClaims/getUser no servidor; nunca confia apenas em getSession ou estado React.
O helper server.ts atual é para Route Handlers/Server Actions; implementar renovação via proxy antes de páginas privadas no servidor.
Presença é voluntária e expira; não rastrear localização contínua.

## Autonomia e entrega

Avançar com decisões razoáveis e reversíveis, sem pedir confirmação a cada etapa.
Pedir confirmação somente diante de risco real de apagar dados, expor segredo, sobrescrever trabalho importante ou alterar algo sensível.
Preservar alterações existentes e não publicar em destinos não solicitados.
Executar lint, typecheck, build e smoke pertinente. Não declarar validação real de Supabase sem configuração e exercício dos fluxos.
Atualizar documentação e informar limitações. Fazer commit/push quando autorizado, sem inventar remote ou identidade Git.
