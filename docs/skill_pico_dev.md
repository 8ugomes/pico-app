---
name: pico-dev
description: Desenvolver o Pico em Next.js, TypeScript e Supabase mantendo o foco social e o MVP enxuto.
---

# Desenvolvimento Pico

Guia vigente, exposto como skill em [.agents/skills/pico-dev](../.agents/skills/pico-dev/SKILL.md). Leia primeiro AGENTS.md, o [contexto institucional](pico-company-context.md), o plano corrente e os contratos do [mapa de domínios](pico-domains.md). A abertura de cadastro em OFFICIAL_COMMUNITY_AUTH.md substitui restrições históricas de convite.

Plano corrente: pico-product-plan.md. Antes de codar, atualizar também deslopify.md.
Ao concluir: atualizar ambos com resultados, atualizar CHANGELOG.md e fazer commit.
Na demonstração autorizada, ações em memória são permitidas com rótulo explícito; nunca confundir esse estado com dados salvos no Supabase.

## Antes de alterar

1. Verifique git status, os arquivos envolvidos, package.json e o lockfile.
2. Identifique a entrega atual e a jornada do usuário atendida.
3. Leia a documentação local da versão instalada do Next.js para APIs envolvidas.
4. Preserve mudanças do usuário. Faça alterações pequenas, reversíveis e completas.
5. Tome decisões razoáveis; só interrompa por exclusão de dados, exposição de segredo, sobrescrita relevante ou alteração sensível.

## Princípios

- Social-first: pessoas e pertencimento vêm antes de gestão de quadras.
- Mobile-first: a ação principal cabe em uma tela estreita com alvos de toque confortáveis.
- Texto brasileiro, direto e curto. Nome completo: Pico Social; assinatura curta: Pico.
- Identidade Aura Manteiga: Syne/Manrope, Manteiga/Cacau/Papel/Lavanda, referência editorial clara e escuro próprio. Usar o [manual](brand-exploration/aura-manteiga/MANUAL.md), os ativos e o [design system](pico-design-system.md); o código legado ainda será migrado.
- Redesign integral usa [pico-redesign](../.agents/skills/pico-redesign/SKILL.md), com leitura de todo o manual e cobertura de todos os domínios. Onboarding assistido é opcional, contextual e retomável; não confundir tutorial, formulário inicial e aviso de comunidade.
- Dados de demonstração identificados. Não simular atividade, salvamento ou autenticação.
- Não incluir IA, voz, reservas ou pagamentos.

## Implementação

- App Router em src/app; TypeScript strict.
- Server Components por padrão; use client apenas para interação e APIs do navegador.
- Componentes de interface em src/components/ui; componentes de domínio em src/components/pico.
- Utilitários e integrações em src/lib.
- Reutilize Button, Input, ChoiceChip, Modal, Avatar e os componentes de domínio antes de duplicar. Componentes com material legado devem ser adaptados ao sistema escolhido, sem impor vidro/transparência a todas as superfícies.
- Use cn para compor classes. Tailwind 4 e tokens em globals.css.
- Não adicionar biblioteca por conveniência se a stack resolve bem o problema.
- Framer Motion está instalado para fluxos que realmente precisem; transições simples ficam em CSS e respeitam prefers-reduced-motion.
- Não criar rotas vazias ou navegação apontando para páginas que não existem.

## Supabase

- Configuração pública em .env.local, seguindo .env.example.
- Configuração conectada ausente, cruzada ou indisponível deve falhar explicitamente, sem trocar silenciosamente para mock. Demo exige configuração explícita e identidade separada.
- O helper de servidor atual escreve cookies e se destina a Route Handlers/Server Actions.
- Adicione o proxy de renovação antes de autenticação em Server Components.
- O estado de sessão do cliente serve à interface; a autorização depende de validação no servidor e RLS.
- Migrations e tipos gerados acompanham mudanças de schema.
- Toda mutation valida entrada e autoria. Unique constraints impedem duplicação.
- Nunca registrar senha, token, código de confirmação ou dados pessoais em logs.
- Nunca ler, escrever ou divulgar secret/service_role no frontend.
- Quando a alteração envolver políticas/autorização, testar isolamento com identidades diferentes e contas de teste identificadas. Ajustes cosméticos não exigem repetir testes de banco remoto.

## Estados e acessibilidade

- Implementar loading, vazio, erro, sucesso e indisponibilidade onde fizerem sentido.
- A ação fica bloqueada durante envio e aceita nova tentativa após erro.
- Formulários usam label associado, autocomplete e mensagens em português.
- Links navegam; buttons executam ações. Ícones decorativos têm aria-hidden.
- Foco visível, contraste suficiente, navegação por teclado, texto ampliado e redução de movimento.
- Evitar tamanho de fonte menor que 16px em inputs de celular.
- Imagens com dimensão reservada, texto alternativo e peso adequado.

## Verificação e entrega

- npm run lint
- npm run typecheck
- npm run build
- Smoke pertinente das jornadas alteradas no app real, local ou compilado; uma resposta HTTP sozinha não comprova interação.
- Validar fluxos reais quando o backend estiver configurado; informar quando não foi possível.
- Durante criação visual, não repetir suíte completa ou matriz exaustiva após cada ajuste. Revisar uma amostra representativa, corrigir em lote e confirmar os pontos afetados. Não criar testes de padding, classe ou valor de token que só espelham o CSS.
- No fechamento, testes existentes pertinentes cobrem comportamentos alterados. Acrescentar testes quando houver risco real: sessão, audiência, publicação, isolamento/progresso do onboarding, foco ou formulários. Ampliar checks por falha, mudança ou preocupação não resolvida; manter os checks exigidos pela CI.
- Rever docs quando a arquitetura, configuração ou limites mudarem.
- Rever git diff, arquivos ignorados e presença de segredos antes do commit.
- Quando autorizado, fazer commit e push no remote existente. Sem remote, informar os comandos para conectá-lo.

## Definição de pronto

A jornada solicitada é utilizável dentro do escopo, os limites estão explícitos, as verificações pertinentes passam e a próxima pessoa consegue continuar pelo README e pelo plano.
