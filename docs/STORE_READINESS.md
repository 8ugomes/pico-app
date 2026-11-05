# Prontidão para App Store e Google Play (05/11/2026)

Matriz de requisitos das lojas e da legislação brasileira contra o estado real do Pico Social. Serve para auditar e preparar; **não é aconselhamento jurídico** e não substitui revisão de advogado. Nenhuma submissão, assinatura, upload ou ação nas contas das lojas foi feita. Ver também [MOBILE_APP.md](MOBILE_APP.md), [pacote editorial](app-store/) e [gates humanos](app-store/human-gates.md).

## Como ler

Fontes consultadas em **05/11/2026**. Páginas das lojas foram lidas por ferramenta de extração automática (resumo de página, não leitura humana do texto integral); citações são curtas e conferem com o resumo recebido. A lei foi lida do texto do Planalto pela mesma ferramenta e **deve ser relida por quem decide**. "Não verificado" = não consegui confirmar na fonte oficial nesta rodada.

Status: **Atende** (verificado em código/teste local), **Parcial**, **Pendente humano**, **Não verificado**. "Atende" nunca significa validado em aparelho, em backend real ou aprovado pela loja.

## Apple

| Requisito | Fonte (consulta 05/11/2026) | Estado real do Pico | Status |
| --- | --- | --- | --- |
| 1.2 conteúdo de usuários: filtro, denúncia com resposta em tempo hábil, bloqueio, contato publicado | [App Review Guidelines 1.2](https://developer.apple.com/app-store/review/guidelines/): "A method for filtering objectionable material", "A mechanism to report offensive content and timely responses to concerns", "The ability to block abusive users", "Published contact information" | Filtro textual determinístico no servidor; denúncia de jogador, publicação e comentário; bloqueio/desbloqueio nos dois sentidos (testes de contrato nesta rodada e RLS em `beta-safety`). **Contato publicado ausente** (`/suporte` diz que o canal não foi configurado) e **sem escala/SLA de moderação**. Mídia não tem classificação semântica. | Parcial; contato e operação de moderação pendentes humanos |
| 5.1.1(v) exclusão de conta no app | [Guideline 5.1.1(v)](https://developer.apple.com/app-store/review/guidelines/) e [Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app/): iniciar dentro do app, fácil de achar; fora de setores regulados não exigir telefone, e-mail ou chat; apenas desativar não basta; confirmação por reautenticação permitida; informar prazo e retenções | Conta e privacidade, "Excluir minha conta", digitar `EXCLUIR` e senha; rota apaga mídia (3 buckets), dados privados e a identidade Auth, com retomada. Também disponível com acesso suspenso. Sem e-mail/chat. Falta texto de retenção por obrigação legal (depende de decisão jurídica) | Atende no código/teste local; não exercitado contra backend real |
| 5.1.1(i) política de privacidade | Guidelines 5.1.1(i): link "in the App Store Connect metadata field and within the app in an easily accessible manner" | Link de Privacidade em acesso, visita, modo local e Conta. `/privacidade` existe, mas **URL pública final e controlador não definidos**; campo no App Store Connect é ação humana | Parcial |
| 2.1 conta de demonstração e backend ligado | Guidelines 2.1(a): incluir "demo account info (and turn on your back-end service!)" se há login; demo embutida só com aprovação prévia da Apple | Há modo local (sem conta) e visita informativa, mas o produto social exige conta. **Supabase principal respondeu 503 em 23/10**; é preciso conta de revisão e backend saudável durante a revisão | Pendente humano (backend, conta de revisão) |
| 2.3 metadados e faixa etária honestos | Guidelines 2.3 e 2.3.6: responder o questionário etário com honestidade | Pacote editorial em `docs/app-store/` (ficha, faixa etária); política de menores não decidida | Pendente humano |
| 4.2 não ser site embalado | Guidelines 4.2: "features, content, and UI that elevate it beyond a repackaged website"; 4.2.2 | Cliente React empacotado, Keychain, modo privado em arquivo protegido, câmera, share sheet, player nativo. Sem `server.url` (verificado por preflight). Julgamento é da Apple | Atende estruturalmente; aprovação depende da revisão |
| Rótulos de privacidade (App Privacy) | [App privacy details](https://developer.apple.com/app-store/app-privacy-details/): obrigatório para novos apps e atualizações, incluir SDKs de terceiros, manter atualizado | Rascunho em `docs/app-store/`; publicar no App Store Connect é ação humana e exige URL de política | Pendente humano |
| Manifesto de privacidade | Documentação de privacy manifests da Apple: **não verificado** (página não renderizou na ferramenta; o que se sabe veio de memória) | `PrivacyInfo` agregado (tracking `false`, UserDefaults `CA92.1`, FileTimestamp `C617.1`/`3B52.1`), conferido pelo preflight local | Não verificado contra a fonte oficial |
| Apple para o Brasil: apps 18+ e Declared Age Range | [Apple Developer News, 24/02/2026](https://developer.apple.com/news/?id=f5zj08ey): bloqueio de downloads 18+ no Brasil para quem não é adulto confirmado, desde 24/02/2026; API Declared Age Range atualizada (faixa etária só se usuário/responsável concordar); loot boxes viram 18+ | Pico não usa Declared Age Range e não declara loot boxes. Faixa etária e eventual 18+ dependem da política de menores. Pode haver obrigação do desenvolvedor de confirmar idade por conta própria ("may have separate obligations"), a ser avaliada com advogado | Pendente humano |

## Google Play (Android permanece pausado; matriz para quando voltar)

| Requisito | Fonte (consulta 05/11/2026) | Estado real | Status |
| --- | --- | --- | --- |
| Conta pessoal nova: teste fechado, 12 testadores, 14 dias contínuos | [Ajuda Play Console 14151465](https://support.google.com/googleplay/android-developer/answer/14151465): contas pessoais criadas após 13/11/2023 | Não há conta Play nem build Android validada | Pendente humano |
| Data safety | [Ajuda 10787469](https://support.google.com/googleplay/android-developer/answer/10787469): obrigatório (inclusive teste fechado), deve refletir SDKs; link de política exigido | Não preenchido; deve espelhar o inventário de dados e SDKs do app | Pendente humano |
| Exclusão de conta no app e por link web | [Ajuda 13327111](https://support.google.com/googleplay/android-developer/answer/13327111): caminho no app e recurso web para pedir exclusão sem reinstalar | Caminho no app existe. **Não há página web pública de exclusão** (a exclusão web exige sessão em `/conta`) | Parcial |
| Termos com aceite não pulável antes de criar UGC | [Política de UGC](https://support.google.com/googleplay/android-developer/answer/9876937): "Requires users accept the app's terms of use and/or user policy before users can create or upload UGC", denúncia/bloqueio no app, moderação | Checkbox obrigatório no cadastro e validação no servidor (`terms_required`), versão registrada em metadados do usuário | Atende no código/teste local |
| API alvo 36 | [Ajuda 11926878](https://support.google.com/googleplay/android-developer/answer/11926878): novos apps e atualizações devem mirar Android 16 (API 36) desde 31/08/2026 (prorrogação até 01/11/2026 já passou) | Projeto Android usa compile/target 36 conforme `MOBILE_APP.md`; não revalidado | Parcial, não revalidado |

## Brasil

| Tema | Fonte | Leitura | Status |
| --- | --- | --- | --- |
| ECA Digital, Lei 15.211/2025 | [Planalto](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/L15211.htm), 05/11/2026 | Vigência em 17/03/2026 (art. 41-A, com a redação da Lei 15.352/2026). Aplica-se a produto de TI "direcionado a crianças e a adolescentes" ou de "acesso provável por eles" (art. 1). Verificação confiável de idade, sem autodeclaração, para conteúdo impróprio a menores (art. 9, §1). Lojas e sistemas operacionais devem aferir idade e expor sinal por API (art. 12). Para redes sociais: art. 24 e §§ (informar se o serviço é inadequado a menores, suspensão com recurso por responsável quando há indícios de conta de menor, regras próprias de tratamento de dados, art. 25). Contas de "até 16 anos" ligadas a responsáveis aparece no art. 24, caput | **Não afirmo** como isso se aplica ao Pico (se é de "acesso provável" por menores, qual idade mínima adotar, como implementar vinculação). O texto foi lido por ferramenta automática; exige leitura integral e parecer jurídico | Pendente humano |

Não é aconselhamento jurídico. O Pico hoje não verifica idade nem vincula contas; nada disso foi implementado, por depender de decisão do dono.

## O que foi implementado nesta rodada (código)

- Cadastro móvel: checkbox obrigatório e desmarcado de Termos e Diretrizes; o cliente envia `termsAccepted` e `termsVersion`; o servidor recusa sem aceite (`terms_required`, 400) e grava `terms_version` e `terms_accepted_at` nos metadados do usuário. Versão `2026-09-18`, igual à data das páginas públicas. Nenhuma migration nem alteração de Auth.
- Links de Privacidade, Termos, Diretrizes e Suporte visíveis na entrada, na visita sem conta, no modo local e na Conta (incluindo acesso restrito).
- Teste `tests/mobile-store-readiness.test.mjs`: aceite (comportamental), links, contrato de denúncia/bloqueio (cliente e `parseMutation`) e caminho de exclusão (UI sem e-mail/chat e rota).

## Verificado vs. não verificado

- Verificado localmente: lint, tipos, 334 testes, `native:verify`, preflight 7/16 com 0 falhas técnicas.
- Não verificado: qualquer fluxo contra Supabase real (503 em 23/10), iPhone físico, TestFlight, aprovação das lojas, revisão jurídica.
- Reproduzir: o teste de exclusão é estrutural sobre a rota; a exclusão real exige ambiente conectado controlado.

## Decisões do dono (nenhuma foi tomada aqui)

1. **Política para menores:** idade mínima, tratamento de contas de menores e de 16, uso de Declared Age Range, classificação etária e eventual 18+. Depende de parecer jurídico sobre a Lei 15.211.
2. **Identidade do publicador:** pessoa física ou jurídica, nome do controlador.
3. **Domínio e contatos:** origem HTTPS pública, e-mail de suporte e de privacidade, responsável por moderação e prazo de resposta a denúncias.
4. **Conta Apple Developer:** time, contratos, bundle ID, nome final e certificado de distribuição (e conta Google Play, com os 12 testadores, se Android voltar).
5. **Proteção do cadastro:** Turnstile ou admissão controlada.
6. **Restabelecer o Supabase principal** (health 503 em 23/10) e fornecer conta de revisão.
7. **Exclusão por link web** (Google Play) e texto de retenção legal.
8. **Skill `app-store-review`:** confirmar se quer instalar a partir do repositório original (`safaiyeh/app-store-review-skill`); a cópia `p4l4c10s` foi recusada (ver [pico-skills](pico-skills.md)).
