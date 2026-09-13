---
name: pico-deslopify
description: Revisar a interface e o texto do Pico para manter clareza, personalidade e qualidade visual sem excessos.
---

# Revisão visual e editorial do Pico

Guia vigente, exposto como skill em [.agents/skills/pico-deslopify](../.agents/skills/pico-deslopify/SKILL.md). Use antes/depois de implementar uma tela ou quando a interface perder identidade. Complementa skill_pico_dev.md e o [contexto institucional](pico-company-context.md).

A revisão agora também acontece antes de codar. Critérios e aprendizados por rodada ficam em [deslopify.md](deslopify.md).
Critério vigente: uso social em 390px, pessoas reconhecíveis e jogos privados registrados depois da experiência. A decisão de pós-jogo substitui o check-in central da rodada 2.

## Pergunta central

Uma pessoa que joga na areia reconhece para quem é a tela e entende a próxima ação?

## Identidade

- Marca: Pico Social; assinatura curta Pico. Tagline: O ponto de encontro da areia. Frase: Me acha no Pico.
- Tom próximo, brasileiro e adulto. Esportivo sem gritar; social sem sobrecarregar.
- Aura Manteiga é a direção escolhida: Manteiga/Cacau/Papel/Lavanda, claro editorial e escuro próprio. [Manual](brand-exploration/aura-manteiga/MANUAL.md) e [design system](pico-design-system.md) orientam a aplicação; a antiga marca verde-água não orienta novas telas.
- Syne expressiva nos títulos; Manrope legível em leitura e operação. Contraste, espaço e hierarquia antes de ornamento. Escala de produção, não o texto pequeno das miniaturas.
- Curvas editoriais pontuais, fotografia protagonista e superfícies calmas. Reduzir repetição de cards, blur, bordas e sombras. Não remover informação funcional para simular minimalismo.
- Onboarding assistido usa dicas curtas e controles reais. Perfil inicial, comunidade oficial e tutorial continuam distintos; pausa, saída e retomada visíveis. Ver [domínios](pico-domains.md).

## Cortes prioritários

Remova ou reescreva:

- Jargão de startup, promessas vazias, slogans empilhados e texto que descreve o design.
- Blocos genéricos de recursos, métricas inventadas, depoimentos falsos e números de usuários fictícios.
- Aparência de painel corporativo ou serviço de reserva.
- Botões redundantes, ações sem destino e elementos que parecem clicáveis sem ser.
- Gradientes espalhados, brilhos excessivos, sombras pesadas e arco-íris de chips.
- Emojis decorativos em toda frase, ícones inconsistentes e animação constante.
- Modais ou etapas que só aumentam o caminho até a ação.
- Texto técnico sobre banco, infraestrutura ou implementação em fluxos de jogador.

## Exemplos de texto

| Evitar | Preferir |
| --- | --- |
| Potencialize seu networking esportivo | Encontre sua próxima dupla. |
| Gerencie suas experiências esportivas | Encontre gente do seu esporte. |
| Explore nosso ecossistema de arenas | Encontre sua arena. |
| Operação realizada com sucesso | Jogo registrado. |
| Nenhum registro encontrado | Ainda não tem ninguém por aqui. |
| Erro desconhecido | Não foi possível carregar. Tente novamente. |

Contextualize estados vazios: ofereça uma ação útil apenas se ela existir.

## Revisão de uma tela

1. Hierarquia: uma ação primária reconhecível, título útil e texto curto.
2. Conteúdo: promessas correspondem ao produto; exemplos estão identificados.
3. Composição: elementos alinhados, respiro intencional e densidade adequada.
4. Celular: layout em 320–430px, chips quebram linha, botões tocáveis, teclado não inviabiliza o formulário.
5. Texto ampliado: nenhuma informação cortada ou dependente de uma altura rígida.
6. Acessibilidade: foco, semântica, contraste, labels e reduced motion.
7. Estados: envio, erro, vazio, carregamento e indisponibilidade têm resposta honesta.
8. Imagens: relevantes, otimizadas, sem marcas alheias e sem representar arena fictícia como real.
9. Desempenho: evitar JavaScript, blur e animações sem benefício claro.

Priorize os problemas que impedem uso ou entendimento. Não redesenhe a tela inteira só por gosto pessoal.

Quando o pedido for redesign integral, aplicar [pico-redesign](../.agents/skills/pico-redesign/SKILL.md) e cobrir todas as superfícies existentes. A revisão durante criação usa amostra representativa de mobile/desktop e ambos os temas, correção em lote e confirmação dos pontos alterados. Não exigir heavy testing ou repetição da suíte completa para refinos cosméticos; ampliar por falha ou risco. Manter os checks obrigatórios e verificar os comportamentos críticos alterados no fechamento.

## Checklist de conclusão

- [ ] Tem cara de Pico e mantém o foco em pessoas, arenas e encontros.
- [ ] Texto soa natural em português.
- [ ] Não há reservas, pagamentos ou recursos fora do MVP.
- [ ] Nada sugere dados ao vivo quando os dados são ilustrativos.
- [ ] A ação principal tem destino e feedback adequados.
- [ ] Hierarquia, leitura e toque funcionam no celular.
- [ ] Estados vazios e erros fazem sentido.
- [ ] Remover mais elementos não melhoraria a compreensão.
