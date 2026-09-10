# GitHub — diagnóstico e proteção

## Estado verificado em 2026-09-09

O [PR #1](https://github.com/8ugomes/pico-app/pull/1) foi integrado à main em `fee5b0c`, com CI aprovada. A branch `cycle-9-internal` preserva o histórico dessa revisão. O responsável autorizou em seguida unificar a publicação no projeto principal; configuração corrente em [ENVIRONMENTS.md](ENVIRONMENTS.md).

A [execução antiga que falhou](https://github.com/8ugomes/pico-app/actions/runs/34416746882) encontrou `spawnSync rg ENOENT`: o teste de contrato de formulários dependia de ripgrep, ausente no runner Linux. O commit `1d43037` substituiu essa dependência pela leitura de arquivos com Node. A [CI do PR em 2098fb0](https://github.com/8ugomes/pico-app/actions/runs/34417821167) passou, incluindo lint, TypeScript, 72 testes e build. A falha antiga permanece no histórico; ela não descreve o resultado atual.

O aviso de branch desprotegida era independente da execução da CI. Após o responsável concluir a confirmação de identidade do GitHub, os dois rulesets foram salvos e verificados pela API: enforcement `active`, nenhuma exceção e `protected: true` para ambas as branches. Nenhum plano foi contratado para ativar as proteções. A [CI do diagnóstico em 27c7623](https://github.com/8ugomes/pico-app/actions/runs/34420925485) também passou, incluindo os 72 testes.

## Configuração aplicada

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

## Evidência remota

| Ruleset | Alvo remoto | Estado e regras conferidos |
| --- | --- | --- |
| [22706380 — main](https://github.com/8ugomes/pico-app/rules/22706380) | `~DEFAULT_BRANCH`, resolvido para `main` | `active`; `deletion`, `non_fast_forward`, `pull_request`, `required_status_checks` |
| [22706456 — revisão](https://github.com/8ugomes/pico-app/rules/22706456) | `refs/heads/cycle-9-internal` | `active`; `deletion`, `non_fast_forward` |

O ruleset da main registra `verify` com `integration_id: 15368` (GitHub Actions), `strict_required_status_checks_policy: true`, `required_review_thread_resolution: true` e zero aprovações obrigatórias. Ambos retornaram `bypass_actors: []` e `current_user_can_bypass: never`. Os endpoints de branches retornaram `protected: true`.

O PR #1 foi integrado somente após as verificações exigidas; a CI do merge fee5b0c passou. As proteções continuam aplicadas, e novas mudanças na main passam por PR. A ativação das regras não mudou dados do Supabase. A verificação leu as regras efetivamente persistidas; não tentou apagar ou sobrescrever branches reais. A proteção está concluída e não depende mais de autenticação ou decisão de plano.
