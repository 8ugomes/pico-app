# Pico

**O ponto de encontro da areia.**

**Me acha no Pico.**

Uma rede social PWA mobile-first para futevôlei, beach tennis e vôlei de praia. Pessoas, arenas e encontros são o centro do produto.

## Rodar localmente

Recomendado: Node.js 24 LTS e npm 11. Setup inicial verificado com Node 24.18.0 e npm 11.16.0.

```bash
npm install
npm run dev
```

Abra [Pico local](http://localhost:3000). Se a porta estiver ocupada, use a URL impressa pelo Next.js.

O projeto usa cache npm local em `.npm-cache`, definido em `.npmrc` e ignorado pelo Git. Isso contorna o erro EACCES causado por arquivos sem permissão no cache global do Mac, sem alterar permissões fora do projeto. Não é necessário usar sudo.

## Primeira entrega

- Home própria do Pico, responsiva e em dark mode.
- Fotografia original, cards translúcidos, chips de esporte e elementos sociais ilustrativos.
- Rotas de cadastro e entrada com a mesma identidade.
- Código de integração com Supabase Auth para e-mail/senha, confirmação PKCE e saída.
- Estado explícito de indisponibilidade quando as variáveis não foram preenchidas.
- Tokens, componentes reutilizáveis, ícones e metadados em português.
- Manifesto e ícones como base PWA. Service worker, offline e validação de instalação ficam para a fase de piloto.
- Plano de evolução e guias para continuidade.

Não há banco provisionado, usuários reais, feed, perfis, check-ins ou arenas persistidos nesta entrega. Cadastro e entrada reais dependem da configuração abaixo. Após autenticar, a tela confirma a sessão; onboarding e feed são próximas entregas. Nenhum número de atividade da home representa dados reais.

## Configurar Supabase Auth

A home funciona sem variáveis. Para habilitar os formulários:

1. Crie ou escolha o projeto Supabase.
2. Copie `.env.example` para `.env.local`.
3. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com os valores públicos do painel Connect.
4. Em Authentication, habilite e-mail/senha e confirmação de e-mail. Configure política mínima de senha compatível com os 8 caracteres exigidos no cadastro.
5. Configure Site URL como `http://localhost:3000` e permita `http://localhost:3000/auth/callback` nas Redirect URLs. Ajuste a porta se necessário.
6. Reinicie `npm run dev`. Em Vercel, configure os valores para o ambiente e faça um novo build, pois NEXT_PUBLIC_* é incorporado ao cliente.

O cadastro usa PKCE. Mantenha o template padrão de confirmação do Supabase baseado em `{{ .ConfirmationURL }}`. Abra o link no mesmo navegador em que iniciou o cadastro, onde fica o verificador PKCE. Callback inválido, expirado ou sem verificador retorna à tela de entrada com orientação.

Para produção, substitua as URLs locais pelo domínio HTTPS e permita o callback correspondente. Configure entrega de e-mails antes do piloto. Não use service_role ou secret key em variáveis públicas. Nenhuma chave foi incluída no repositório.

O cliente do navegador cuida da sessão nas telas de autenticação. O helper de servidor atual atende ao callback, com cookies e resposta sem cache. Antes de implementar páginas privadas em Server Components, adicione o proxy de renovação de sessão e valide identidade no servidor. RLS e migrations serão implementados junto com o modelo de dados.

Referências: [clientes Supabase com SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs), [URLs de retorno](https://supabase.com/docs/guides/auth/redirect-urls), [PWA no Next.js](https://nextjs.org/docs/app/guides/progressive-web-apps).

## Rotas existentes

| Rota | Comportamento |
| --- | --- |
| / | Apresentação pública do Pico |
| /signup | Cadastro; indisponível sem configuração |
| /login | Entrada, estado de sessão e saída |
| /auth/callback | Troca de código PKCE; erro recuperável se inválido |
| /manifest.webmanifest | Manifesto PWA |

As rotas de onboarding, feed, descoberta, check-in, arenas e perfis estão planejadas, não implementadas.

## Comandos de qualidade

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

`start` serve o build de produção. Use outra porta se o dev estiver aberto: `npm run start -- --port 3001`.

Smoke local: conferir resposta 200 de /, /login, /signup, manifesto e ícones; callback sem código deve redirecionar para a mensagem de confirmação. A verificação HTTP não substitui teste visual nem autenticação com backend real.

Com Supabase configurado, testar cadastro novo, confirmação no mesmo navegador, e-mail não confirmado, senha incorreta, login, recarga, saída e falha de rede. Antes do piloto, concluir recuperação de senha, reenvio de confirmação e testes de autorização entre usuários.

## Estrutura

```text
src/
  app/
    page.tsx                 Home pública
    login/                   Entrada
    signup/                  Cadastro
    auth/callback/           Confirmação PKCE
    manifest.ts              Base PWA
    globals.css              Tokens e estilos
  components/
    ui/                      Button, Input, GlassPanel, Avatar
    pico/                    Marca, chips e autenticação
  lib/
    supabase/                Configuração e clientes
    utils.ts                 Composição de classes
docs/
  00_PLANO_DE_ACAO_PICO_MVP.md
  skill_pico_dev.md
  skill_pico_deslopify.md
public/
  images/pico-court.webp
  icons/
```

## Direção visual

Fundo #070707, grafite #111111, areia #D8B46A e branco. Geist, transparência discreta, cantos arredondados, foco visível, alvos de toque confortáveis e respeito a prefers-reduced-motion.

A imagem em `public/images/pico-court.webp` foi gerada para este projeto e representa uma cena fictícia. Pessoas e arena dos cards também são fictícias. Não são depoimentos, presenças ao vivo ou afiliações reais.

## Próximos passos

Seguir [o plano do MVP](docs/00_PLANO_DE_ACAO_PICO_MVP.md): configurar e validar autenticação, criar schema com RLS, onboarding/perfil, arenas, check-in, feed e descoberta.

Ficam fora do MVP: IA, voz, reservas, pagamentos, B2B, anúncios, ranking avançado, mapa em tempo real e app nativo.

## Git e Vercel

Esta pasta chegou sem repositório Git ou remote. A primeira entrega inicializa Git localmente. Para conectar um repositório GitHub vazio, substitua SEU_USUARIO:

```bash
git remote add origin https://github.com/SEU_USUARIO/picoapp.git
git push -u origin main
```

Não force push sobre um repositório que já contenha trabalho. Depois, importe o repositório na Vercel usando o preset Next.js, build `npm run build` e as variáveis Supabase do ambiente. O deploy não faz parte desta entrega local.
