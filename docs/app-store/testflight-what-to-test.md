# TestFlight · descrição e What to Test

Status: **template para a primeira build externa**.

TestFlight não relaxa as regras da App Store. Para testers externos, preencher Beta App Description, Feedback Email, contato e informações da revisão beta; a primeira build externa passa por TestFlight App Review. A Apple permite até 10.000 testers externos, mas o primeiro grupo do Pico deve ser pequeno e identificado.

## Beta App Description · pt-BR

> Pico Social aproxima praticantes de futevôlei, beach tennis e vôlei de praia por pessoas, comunidades e arenas. Esta versão beta testa o cliente iOS local, sessão segura, publicação com audiência explícita, foto, jogos privados e controles de segurança.

## What to Test · pt-BR

> Nesta rodada, concentre-se em continuidade e privacidade:
>
> 1. Faça login, encerre e reabra o app. Confirme que a sessão volta sem mostrar dados de outra conta.
> 2. Coloque o app em segundo plano, retome, alterne a rede e use modo avião. Nenhuma ação pendente deve ser enviada automaticamente.
> 3. Percorra Início, Pessoas, Comunidades, Arenas e Perfil. Verifique voltar, teclado, safe areas, tema claro/escuro e texto ampliado.
> 4. Crie uma publicação de teste. Confira audiência e destinos antes de enviar; feche/retome o rascunho e confirme que uma tentativa repetida não duplica o post.
> 5. Escolha uma foto pela câmera ou biblioteca. Recuse a permissão uma vez, tente novamente e confirme que a foto só é enviada depois da sua ação.
> 6. Reproduza um vídeo controlado já autorizado e avance/retorne no player. Confirme que a criação/publicação de vídeo não aparece nesta versão.
> 7. Comente e republique/desfaça uma publicação permitida. Contagens e estados devem vir do servidor, sem duplicação.
> 8. Em Perfil > Meus jogos, salve e edite uma partida passada. O registro deve ficar privado. Compartilhar precisa abrir uma ação separada com audiência visível.
> 9. Em conteúdo da conta de teste, experimente denunciar, bloquear e desbloquear. A denúncia deve ficar privada; o bloqueio deve interromper a visibilidade entre as contas.
> 10. Abra links controlados de publicação, jogador, comunidade e arena. Cada um deve chegar ao item exato; links de outra origem não devem navegar.
> 11. Baixe seus dados e teste exclusão somente com uma conta descartável criada para essa finalidade.
> 12. Ative VoiceOver, Aumentar Texto e Reduzir Movimento nas jornadas principais. Informe qualquer controle sem nome, corte de texto ou movimento persistente.
>
> Ao enviar feedback, informe versão/build, modelo do iPhone, versão do iOS, tela, ação e resultado. Não envie senha, token nem conteúdo privado de terceiros.

## Campos de Test Information

| Campo | Valor |
| --- | --- |
| Feedback Email | `[[EMAIL_BETA_MONITORADO]]` |
| Contact first/last name | `[[CONTATO_REAL]]` |
| Contact phone | `[[TELEFONE_COM_DDI]]` |
| Contact email | `[[EMAIL_REVIEW_MONITORADO]]` |
| Sign-in required | Sim |
| Demo account | Inserir somente no App Store Connect; conta persistente e sem 2FA. |
| Privacy Policy URL | `[[FINAL_PRIVACY_URL]]` |

## Matriz de evidência por build

Preencher uma linha por combinação realmente exercitada; “abriu no Simulator” não vale como aparelho físico.

| Build | Superfície | OS | Conta | Rede | Fluxos | Resultado | Evidência/issue |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `[[BUILD]]` | iPhone físico `[[MODELO]]` | `[[IOS]]` | primária | Wi-Fi/celular/offline | 1–12 | `[[PASS/FAIL]]` | `[[LINK_PRIVADO]]` |
| `[[BUILD]]` | iPhone físico secundário `[[MODELO]]` | `[[IOS]]` | secundária | Wi-Fi/offline | 1–12 | `[[PASS/FAIL]]` | `[[LINK_PRIVADO]]` |

## Saída do beta fechado

- [ ] Feedback Email recebe e é acompanhado por uma pessoa responsável.
- [ ] Nenhuma quebra de isolamento, duplicação, perda de rascunho ou vazamento de token ficou aberta.
- [ ] Login, refresh, logout e troca de conta funcionam em instalação limpa e retomada.
- [ ] Câmera/biblioteca foram exercitadas em iPhone físico, inclusive uma foto HEIC real.
- [ ] Range/seek e revogação de vídeo existente foram exercitados em iPhone físico; criação/publicação de vídeo continua desligada na `1.0`.
- [ ] Rascunhos não cruzam contas e logout apaga conteúdo local da identidade anterior.
- [ ] Denúncia entrou na fila e um operador comprovou a análise/medida em ambiente controlado.
- [ ] Exclusão removeu uma conta descartável e permitiu continuar a revisão com outra conta.
- [ ] A build não depende de `server.url` e não contém segredos.
- [ ] Known Issues foi atualizado; nenhuma limitação central foi escondida.
- [ ] A próxima build usa número maior e explica mudanças concretas.

Referências: [Provide test information](https://developer.apple.com/help/app-store-connect/test-a-beta-version/provide-test-information), [Invite external testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers) e [TestFlight](https://developer.apple.com/testflight/).
