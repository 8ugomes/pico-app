---
name: pico-deslopify
description: Revisar a interface e o texto do Pico para manter clareza, personalidade e qualidade visual sem excessos.
---

# Revisão visual e editorial do Pico

Use após implementar uma tela ou quando a interface perder identidade. Este guia complementa skill_pico_dev.md.

## Pergunta central

Uma pessoa que joga na areia reconhece para quem é a tela e entende a próxima ação?

## Identidade

- Marca: Pico. Tagline: O ponto de encontro da areia. Frase: Me acha no Pico.
- Tom próximo, brasileiro e adulto. Esportivo sem gritar; social sem sobrecarregar.
- Grafite profundo e destaque areia. Outras cores só comunicam informação específica.
- Tipografia clara, contraste, bastante espaço e hierarquia forte.
- Raio de borda e transparência coerentes. Glassmorphism precisa de contraste e função.

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
| Gerencie suas experiências esportivas | Quem tá na areia hoje? |
| Explore nosso ecossistema de arenas | Encontre sua arena. |
| Operação realizada com sucesso | Check-in feito. |
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

## Checklist de conclusão

- [ ] Tem cara de Pico e mantém o foco em pessoas, arenas e encontros.
- [ ] Texto soa natural em português.
- [ ] Não há reservas, pagamentos ou recursos fora do MVP.
- [ ] Nada sugere dados ao vivo quando os dados são ilustrativos.
- [ ] A ação principal tem destino e feedback adequados.
- [ ] Hierarquia, leitura e toque funcionam no celular.
- [ ] Estados vazios e erros fazem sentido.
- [ ] Remover mais elementos não melhoraria a compreensão.
