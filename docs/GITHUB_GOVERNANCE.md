# GitHub — diagnóstico e proteção

## Estado verificado em 2026-09-09

O [PR #1](https://github.com/8ugomes/pico-app/pull/1) está aberto, em rascunho e sem merge. `main` permanece no Ciclo 8 (`7d6f288`); `cycle-9-internal` contém o Ciclo 9. Essa separação preserva a revisão interna e não representa perda ou divergência acidental de código. O Preview interno usa o código de `e891dca`; commits posteriores de documentação não alteram esse artefato.

A [execução antiga que falhou](https://github.com/8ugomes/pico-app/actions/runs/34416746882) encontrou `spawnSync rg ENOENT`: o teste de contrato de formulários dependia de ripgrep, ausente no runner Linux. O commit `1d43037` substituiu essa dependência pela leitura de arquivos com Node. A [CI do PR em 2098fb0](https://github.com/8ugomes/pico-app/actions/runs/34417821167) passou, incluindo lint, TypeScript, 72 testes e build. A falha antiga permanece no histórico; ela não descreve o resultado atual.

O aviso de branch desprotegida é independente da execução da CI. A consulta remota retornou zero rulesets e `protected: false` para ambas as branches. As regras abaixo foram preparadas na interface autenticada, mas **ainda não foram salvas**: o GitHub exigiu confirmação de identidade e a solicitação GitHub Mobile expirou. Não considerar a proteção ativa antes de conferir a configuração persistida no remoto. Nenhum plano foi contratado e nenhum merge foi feito.

## Configuração preparada

| Regra | `main` (branch padrão) | `cycle-9-internal` |
| --- | --- | --- |
| Bloquear force push | Sim | Sim |
| Bloquear exclusão | Sim | Sim |
| Exigir PR para integrar | Sim | Não |
| Exigir check `verify`, origem GitHub Actions | Sim | Não como bloqueio de push |
| Exigir branch atualizada com a base | Sim | Não |
| Exigir discussões resolvidas | Sim | Não |
| Aprovações obrigatórias | 0 | Não se aplica |
| Atores com bypass | Nenhum | Nenhum |

A CI executa em pushes para ambas e em PRs. O gate de integração fica na `main`, enquanto a branch de revisão aceita novos commits normais. Não foram adicionadas exigências de scanners, assinaturas ou deploys que o projeto não fornece.

Os PRs atuais são criados pela conta do responsável, que não pode aprovar o próprio PR. Por isso, a configuração prevê PR obrigatório com CI aprovada, mas zero aprovações obrigatórias. Reavaliar a quantidade quando houver um segundo revisor com acesso; não atribuir a terceiros um papel sem autorização.

## Conclusão pendente

1. O responsável conclui a confirmação de identidade solicitada pelo GitHub na aba já preparada.
2. Salvar os dois rulesets com enforcement `Active` e sem bypass.
3. Consultar os rulesets persistidos e seus alvos/regras; verificar `protected: true` nas duas branches.
4. Conferir que o PR continua em rascunho, sem merge, e que o SHA da `main` foi preservado.
5. Atualizar este documento com a evidência efetiva. Não testar a proteção tentando apagar ou sobrescrever branches reais.

Se o GitHub apresentar uma limitação de plano ao salvar, registrar o bloqueio e pedir a decisão do responsável. Não mudar a visibilidade do repositório nem contratar plano para contornar essa limitação.
