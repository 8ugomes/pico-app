# Pico Social — contexto institucional, produto e marca

Referência vigente desde 13/09/2026. Usar em estratégia, design, conteúdo, planejamento e desenvolvimento do projeto. Este documento registra decisões do responsável; não representa pesquisa com jogadores nem comprovação de resultados comerciais.

## Quem somos

**Pico Social**, com assinatura curta **Pico**, é uma rede social PWA mobile-first para quem pratica futevôlei, beach tennis e vôlei de praia. Aproxima pessoas por modalidades, arenas e comunidades, e dá continuidade à experiência depois do jogo.

**O ponto de encontro da areia.** É a assinatura institucional. **Me acha no Pico.** É a expressão de campanha e convite. Aura Manteiga é o nome interno da identidade visual escolhida, não outra empresa, produto ou plano pago.

## Público e valor

O público de produto são praticantes dos três esportes, incluindo quem está começando e quem já tem seus lugares e grupos. Organizadores e responsáveis por arenas participam por meio dos papéis existentes. A linguagem jovem é uma escolha estética, não uma faixa etária de cadastro ou uma alegação demográfica.

O Pico ajuda a responder: quem joga onde eu jogo, quais comunidades combinam comigo e o que acontece nas minhas arenas. Priorizar reconhecimento entre pessoas, pertencimento, expressão pessoal e clareza sobre quem vê cada informação. “Premium” significa cuidado, acabamento e qualidade de uso; não implica exclusividade econômica, elitismo ou assinatura paga.

## Marca escolhida

- Direção: **Aura Manteiga**, editorial de moda jovem, expressivo, artístico, elegante e refinado.
- Cores de marca: Manteiga `#F2E3B5`, Cacau `#44342F`, Papel `#F8F3E7`, Lavanda de apoio `#CBBBE0`. Os papéis claros/escuros e estados funcionais estão nos tokens do manual.
- Tipografia: Syne 600–800 nos títulos e momentos de marca; Manrope 400–700 na leitura e operação. Logo vetorial em contornos entregue no pacote; não redigitar ou regenerar.
- Direção de arte: luz difusa, textura de pele e areia, pessoas e gestos reconhecíveis dos esportes. Fotografia protagonista, curvas editoriais pontuais, ritmo e espaço livre. Superfícies calmas, contraste e legibilidade nas tarefas.
- Claro como referência editorial e escuro próprio. Na futura implementação, acompanhar o dispositivo inicialmente e preservar eventual preferência explícita já existente.
- Voz: pt-BR próximo, adulto, breve e concreto. Ação clara e feedback honesto; sem linguagem de infraestrutura nos fluxos do jogador.

Os [ativos e o manual](brand-exploration/aura-manteiga/README.md) consolidam a decisão. O [design system](pico-design-system.md) traduz a identidade para o produto. Ritual, Pulso, Pistache e a Aura lavanda pertencem à exploração anterior; não reabrir a direção salvo pedido do responsável.

## Experiência e limites

Navegação principal: Início, Pessoas, Comunidades, Arenas e Perfil. Conteúdo específico por destino; não transformar tudo em cards idênticos ou em capas de campanha. Jogos são registros retrospectivos privados, acessíveis por perfil/conta; compartilhar exige outra ação e audiência explícita.

O onboarding assistido deve ajudar a entender e usar controles reais, com pausa, saída e retomada. É opcional e não equivale a IA, atendimento humano ou assistente de voz. A configuração inicial de perfil, o aviso de entrada na comunidade oficial e o tutorial têm finalidades e persistências distintas. O tutorial não executa ações sociais nem concede acesso. Consulte [domínios](pico-domains.md) e [onboarding](ONBOARDING.md).

Cadastro aberto com e-mail confirmado e admissão automática não restaura contas suspensas, revogadas ou excluídas. Audiências, papéis e RLS continuam vigentes. Demo é explicitamente rotulado e local; fotografia sintética do estudo não representa pessoas ou arenas reais. A pendência operacional de SMTP não pode ser resolvida ocultando confirmação de e-mail.

Fora do escopo atual: reservas, pagamentos, B2B, anúncios, IA/voz, ranking avançado, presença ou mapa em tempo real, localização contínua e app nativo. Um redesign integral pode reorganizar a apresentação e a assistência da jornada; não autoriza ampliar esse escopo.

## Contexto de empresa disponível

O nome de marca, o propósito, os esportes, a direção estética e a comunidade oficial estão documentados. Razão social, CNPJ, composição societária, equipe, história de fundação, modelo de receita, preços, parceiros, dimensão da base e métricas comerciais **não foram informados neste contexto**. Não preencher essas lacunas com suposições ou depoimentos. Consultar o responsável quando algum dado for necessário a uma peça institucional ou documento jurídico.

O endereço operacional conhecido é o projeto Vercel `pico-app`, em `pico-app-sepia.vercel.app`; isso não comprova domínio comercial registrado. Detalhes de ambiente e publicação ficam em [ENVIRONMENTS.md](ENVIRONMENTS.md), sem segredos neste documento.

## Fontes e estado de implementação

1. Pedido atual e decisões explícitas do responsável definem o escopo da tarefa; [AGENTS.md](../AGENTS.md) define o fluxo do projeto.
2. Este contexto e o [plano corrente](pico-product-plan.md) registram direção e prioridade. Os documentos de [domínio](pico-domains.md) definem os contratos funcionais.
3. [MANUAL.md](brand-exploration/aura-manteiga/MANUAL.md), [manual visual](brand-exploration/aura-manteiga/manual.html), [tokens.json](brand-exploration/aura-manteiga/tokens.json), logos e fontes definem a identidade escolhida. O PDF consolidado está em `output/pdf/Pico-Social-Manual-Aura-Manteiga.pdf`.
4. O código e as evidências de release informam o que está implementado e publicado. Em 13/09/2026, o manual está entregue; a migração do código para Aura Manteiga ainda está pendente. Não afirmar que o aplicativo foi redesenhado apenas porque a documentação mudou.
5. Propostas anteriores, PDFs de exploração e registros de rodadas antigas preservam histórico. Se houver divergência material, registre-a; não trate mockup como autorização para alterar privacidade ou schema.

As [skills locais](pico-skills.md) usam esta referência compartilhada. O [prompt principal](brand-exploration/aura-manteiga/PROMPT-PRODUCAO.md) é um artefato para execução futura: a simples leitura do arquivo não inicia implementação, publicação ou mensagens externas.
