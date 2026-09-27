# Aplicativo Pico Social: fundação, arquitetura e plano

Status atualizado em 26/09/2026: **cliente React local, API móvel versionada, sessão iOS em Keychain e jornadas essenciais implementadas e validadas localmente. As sete migrations aditivas e o backend integrado foram publicados no ambiente principal com preservação confirmada; aparelho físico, identidade final, assinatura e distribuição continuam pendentes**.

A primeira versão distribuível foi delimitada a **iPhone em retrato** (`TARGETED_DEVICE_FAMILY = 1`). O projeto Android permanece preservado, sem ser regenerado ou ampliado nesta rodada. iPad só volta ao escopo depois de uma validação própria de layout, rotação, acessibilidade e metadata.

O teste da PWA justificou iniciar a transição para iOS e Android. A decisão é preservar o produto web publicado e empacotar de forma progressiva, sem transformar um WebView remoto em versão de loja e sem reescrever o produto inteiro antes de medir o que realmente exige código nativo.

## Estado implementado nesta rodada

- Capacitor 8 com versões fixadas e cliente React/TypeScript empacotado em `apps/mobile`, gerado localmente em `native-shell`; o pacote de distribuição não usa `server.url`.
- API explícita em `/api/mobile/v1`, com origem iOS exata, `Authorization: Bearer`, cookies recusados, versão mínima negociada, IDs de requisição e respostas sem cache.
- Access token somente em memória e refresh token somente no Data Protection Keychain, como item não sincronizável e acessível apenas com o aparelho desbloqueado. Refresh é serializado e repetido no máximo uma vez depois de `401`; uma geração de sessão invalida respostas e renovações tardias depois de logout/expiração. A limpeza é Keychain-first e usa um tombstone sem segredo em `UserDefaults`: se for interrompida, continua no próximo bootstrap antes de aceitar outra sessão. Logout limpa também conteúdo local da conta mesmo se a revogação remota falhar, e o cover nativo só sai depois de a tela revalidada ser efetivamente renderizada.
- Fluxos locais de cadastro/login, restauração de sessão, perfil, feed, comentários, republicações, pessoas, comunidades, arenas, foto, jogo privado com edição/exclusão/compartilhamento separado, denúncia, bloqueio/desbloqueio, exportação e exclusão de conta. Posts e comentários próprios têm exclusão confirmada; Conta lista denúncias e mídia sem uso e permite remover uploads órfãos. Conta suspensa/revogada e perfil inicial incompleto conservam acesso a exportar, excluir, sair, ajuda e textos legais sem liberar o social. Se uma exclusão ficou parcial, o bootstrap consulta `/account` antes do perfil, abre `deletion_pending` e permite continuar a limpeza de Storage, RPC e Auth.
- Rascunhos de publicação, perfil e jogo ficam no Capacitor Preferences, isolados pelo ID da conta e removidos na saída. Tentativas de comentário e de compartilhamento de jogo conservam payload e chave idempotente até confirmação, inclusive após relançamento, sem fila automática. Nenhuma dessas chaves guarda senha, access token ou refresh token. O guia opcional de três passos usa outra chave por conta, permite pausa/retomada e não executa ação social.
- Rotas HTTPS confiáveis para publicação, jogador, comunidade, arena e seções do perfil são analisadas e abertas no destino exato do cliente. Universal Links, entitlement e AASA não foram ativados: dependem do domínio e do bundle ID finais.
- Vídeo privado já autorizado abre em player nativo com `URLSession` efêmera, Bearer apenas em memória e leitura por faixas reautorizadas. O transporte TUS de MP4 de até 45 MiB foi implementado em chunks, com progresso, retomada pela seleção do mesmo arquivo e cancelamento explícito, mas criar/publicar vídeo permanece desabilitado na capacidade `1.0`. Ativação depende de sanitização/transcoding e validação física; MOV/HEVC não são aceitos.
- Bridges oficiais para ciclo de vida, links, browser, câmera/seletor, teclado, rede, compartilhamento, haptics, splash e status bar, mais a bridge mínima de sessão segura.
- Manifesto de privacidade sem tracking, com `UserDefaults`/`CA92.1` e a declaração agregada do SDK de câmera para `FileTimestamp`/`C617.1`/`3B52.1`, scheme Release compartilhado, preflight somente-leitura e pacote editorial da App Store em `docs/app-store/`.
- Filtro preventivo determinístico aplicado no servidor aos campos textuais publicados. Fotos importadas do catálogo de arenas ficam fora das respostas do cliente iOS enquanto não houver direitos explícitos.
- Nome e identificador reversíveis de laboratório: **Pico Social Preview** e `com.picosocial.preview`. O mestre Pico Club também permanece como ícone provisório; nenhum dos três deve chegar ao upload final sem decisão humana.
- Preview do Pico hospedado somente com duas variáveis explícitas e URL HTTPS sem credenciais, query ou fragmento.
- Ícone, foreground adaptativo e splash reproduzíveis a partir dos mestres Pico Club, sem placeholder do Capacitor.
- Identificação do pacote por `PicoNativeApp/1` no user agent para não oferecer instalação da PWA dentro do próprio aplicativo, sem marcador de Preview na candidata.
- Diagnóstico local, testes estruturais e preflight que falham se o pacote iOS voltar a depender de `server.url`, contiver logs/segredos conhecidos ou perder o PrivacyInfo/scheme.
- Cinco migrations aditivas do cliente móvel cobrem exportação com notificações recebidas; moderação textual também contra escrita direta que contorne o BFF; remoção da policy genérica de leitura de `storage.objects`; leitura própria do estado de admissão da conta; e criação idempotente de comentários com fingerprint. Duas migrations adicionais preparam mensagens diretas e Web Push. As sete foram aplicadas no Supabase principal após dry-run; o inventário confirmou 131/131 identidades preservadas, sem remoção ou troca de autoria. Mensagens e push permaneceram desligados por feature flag e configuração do banco, com zero conversa, mensagem, assinatura ou item de fila criado.

Esta entrega ainda não contém um `.ipa` assinado, não usa identidade ou provisionamento Apple e não está pronta para TestFlight. Compilar ou abrir no Simulator não comprova Keychain, câmera, HEIC, upload/reprodução de MP4, permissões, Universal Links, ciclo de vida, VoiceOver, desempenho ou rede em iPhone físico.

## Por que o Next.js atual não entra diretamente no pacote

O cliente validado também é servidor. Hoje há 23 Route Handlers, cookies de Auth, proteção de origem, rotas dinâmicas, redirects/headers, imagens e renderização por requisição. Esses recursos estão entre os que o próprio Next.js declara incompatíveis com exportação estática. Trocar apenas para `output: "export"` quebraria jornadas e não produziria um cliente seguro.

Um bundle local também roda em uma origem como `capacitor://localhost`. Os cookies do domínio Vercel não acompanham essa origem, APIs relativas deixam de apontar automaticamente para o servidor e as mutações atuais recusam outra origem. Não se deve resolver isso abrindo CORS indiscriminadamente, retirando a proteção de origem ou reduzindo RLS.

## Arquitetura de transição

| Superfície | Papel durante a transição | Regra |
| --- | --- | --- |
| PWA Next.js/Vercel | Produto público e referência funcional | Continua disponível, com os contratos e a sessão web atuais. |
| Pico Social Preview | Prova interna de WebView, barras, teclado, mídia e ciclo de vida | Pode carregar uma origem HTTPS explícita; nunca é artefato de loja. |
| Cliente local do Capacitor | Interface React versionada e empacotada no binário | Usa a API móvel, plugins oficiais e sessão segura; não depende de `server.url`. |
| Next.js + Supabase | Backend/BFF, Auth, mídia e regras compartilhadas | Autoria, audiência, admissão e RLS continuam sendo autoridade. |

A decisão registrada em `docs/adr/0001-ios-local-client.md` mantém o servidor web como PWA e BFF e usa o cliente React/DOM de `apps/mobile` para iOS. Expo/React Native só deve substituir essa arquitetura se medições em aparelhos demonstrarem uma limitação persistente que o shell híbrido não resolva incrementalmente.

## Comandos

Pré-requisitos e estado do host:

```bash
npm run native:doctor
```

Os projetos gerados usam iOS 15+ e Android API 24+ (compile/target 36). Este host tem Node 24, Xcode 27.0, runtime iOS 27.0, Android Studio Quail 4 2026.1.4 e Temurin JDK 21. O wrapper Gradle 8.14.3 abriu com essa JVM; Android SDK/API 36 e emulador permanecem pausados. No Xcode 27, simuladores são exibidos no Device Hub integrado.

Gerar o cliente local, sincronizar somente o iOS e conferir que nenhum endereço remoto ficou no pacote:

```bash
npm run native:assets
npm run mobile:build
npm run native:sync:ios
npm run native:verify
npm run native:build:ios
npm run native:preflight:ios
```

Abrir o projeto iOS:

```bash
npm run native:open:ios
```

`native:verify` mantém as verificações dos ativos Android versionados, mas exige configuração sincronizada somente do iOS porque a sincronização desta missão é deliberadamente `cap sync ios`. `native:verify:all` sincroniza e exige as duas plataformas quando o Android voltar ao escopo. O trabalho Android e Google Play fica para depois da submissão iOS.

Para um preview interno hospedado, usar uma origem HTTPS controlada e não incluir tokens na URL:

```bash
PICO_NATIVE_PREVIEW=1 \
PICO_NATIVE_PREVIEW_URL=https://preview-controlado.exemplo/feed \
npm run native:sync:ios
```

Depois do ensaio, `npm run native:verify` sincroniza novamente a configuração local e falha se os artefatos gerados ainda contiverem `server.url`. Não usar o ambiente principal para criar contas, posts ou mídia de teste.

No Capacitor 8 para iOS, o caminho inicial deve estar na própria `server.url`; `server.appStartPath` também participa da validação do arquivo local e fez o app encerrar ao procurar `public/feed`. A configuração e o teste de regressão preservam esse detalhe.

## Plano por gates

### N0 · Fundação reproduzível — concluída localmente

Entregas: dependências, projetos iOS/Android, shell local, configuração de preview restrita, ativos Aura Manteiga, detecção do pacote, diagnóstico, testes e CI. Gate local: sync sem URL remota, testes de configuração, lint, tipos, suíte web e build.

### N1 · Preview em aparelhos — Simulator comprovado no baseline, gate físico aberto

Preparar Xcode/Simulator e instalar somente builds debug em aparelhos controlados. Nesta missão, exercitar ao menos um iPhone físico representativo. O gate é uma matriz registrada de abertura fria, login, retomada, navegação, mídia e falha de rede sem perda, duplicação ou vazamento de sessão.

### N2 · Camada de plataforma — implementada localmente, associação externa aberta

As bridges para estado ativo/inativo, links, browser, câmera/seletor, teclado, rede, compartilhamento, haptics, splash e status bar estão integradas. Safe areas e movimento reduzido estão no cliente. O roteador interno valida origem/caminho e abre publicações, jogadores, comunidades, arenas e seções do perfil; Universal Links continuam corretamente bloqueados por domínio, bundle ID, entitlement e AASA definitivos. Nenhuma permissão é pedida antes da ação que a utiliza.

### N3 · Movimento, ícones e resposta — primeira camada web validada, gate físico aberto

As cinco abas mantêm geometria estável, mostram resposta pendente no ícone acionado e recebem a rota em 220 ms; movimento reduzido remove deslocamento e animação. A entrada sem sessão foi retirada do shell e o guia opcional foi reduzido a três passos. A amostra local cobriu temas, texto ampliado, teclado e larguras móveis/desktop, e o pacote continuou compilando para o Simulator. Ainda falta medir em iPhone físico, expandir a gramática para publicação, seleções, menus e diálogos e somente então avaliar haptics semânticos. O gate exige continuidade visual, foco/teclado preservados e ausência de feedback de sucesso antes da confirmação do servidor.

### N4 · Cliente distribuível — implementado localmente, gates conectado e físico abertos

O cliente local, a fronteira `/api/mobile/v1`, Bearer, CORS exato, compatibilidade de versão, Keychain, rascunhos por conta, comentários, republicações, desbloqueio, jogos editáveis/compartilháveis, mídia privada, player Range, exportação e exclusão retomável estão implementados. A leitura direta do Storage foi fechada no banco principal; bytes devem sair somente do BFF após autorização. A infraestrutura TUS existe e foi testada isoladamente, mas a capacidade móvel não oferece criação/publicação de vídeo na `1.0`: metadata bruta e fluxo MOV/HEVC ainda exigem sanitização/transcoding e iPhone físico. O backend integrado foi publicado pela `main`, com versão e saúde conferidas no domínio principal. Ainda faltam testar uma sessão controlada da build candidata contra esse deployment e provar os fluxos em aparelho. Universal Links aguardam domínio e identificadores definitivos.

### N5 · Hardening e beta fechado — preparado, bloqueado por decisões humanas

O repositório já contém PrivacyInfo agregado com `CA92.1`, `C617.1` e `3B52.1`, scheme Release, preflight, textos públicos e o pacote de metadata/TestFlight/revisão. Um archive Release sem assinatura foi compilado e inspecionado apenas como prova local. Faltam nome, bundle ID, ícone, conta/time/certificado Apple, entidade legal, domínio, contatos, política de recuperação de conta, proteção antiabuso do cadastro, operação de moderação e direitos. Depois desses gates, gerar e validar o archive assinado, enviar ao App Store Connect e executar TestFlight. Google Play permanece fora desta missão.

## Gramática de movimento proposta

| Momento | Tratamento inicial | Feedback tátil |
| --- | --- | --- |
| Pressionar ação | 160 ms, escala/opacity discretas, sem deslocar layout | Nenhum por padrão. |
| Selecionar aba, esporte ou destino | Estado de ícone e indicador em 160 ms | Seleção leve, uma vez, após a mudança. |
| Abrir menu, diálogo ou compositor | Opacidade + transformação curta em 220 ms | Nenhum ao apenas abrir. |
| Trocar destino principal | Continuidade em 220 ms, deslocamento máximo discreto, conteúdo legível imediatamente | Nenhum por navegação comum. |
| Confirmar publicação, entrada ou salvamento | Resposta de até 280 ms depois da confirmação real | Sucesso somente se o servidor confirmou. |
| Erro ou offline | Mensagem estável, sem sacudir repetidamente | Aviso raro; nunca em loop ou em cada validação de campo. |

Ícones continuam em Lucide e precisam expressar estado também por forma, rótulo ou indicador, não apenas por cor. Em `prefers-reduced-motion: reduce`, o conteúdo deve chegar sem translação/escala e sem autoplay; haptics não substituem texto, foco ou estado visual.

## Matriz mínima de aparelho

1. Abrir a frio, splash, tema claro/escuro, barra de status, recorte e safe areas.
2. Cadastro/login, perfil inicial, logout, relançamento, troca de conta e expiração de sessão.
3. Cinco destinos principais, links internos, links externos, teclado e texto ampliado.
4. Foto de câmera/galeria e HEIC real; validar recusa de permissão, rotação, pouco armazenamento, memória e erro honesto para formato não aceito.
5. Leitura Range/seek/revogação de vídeo privado já autorizado. Confirmar também que criação/publicação de vídeo permanece indisponível na `1.0`. Antes de ativar no futuro, exercer TUS com MP4 real, progresso, pausa, retomada pelo mesmo arquivo, cancelamento, limpeza, sanitização/transcoding e recusa/conversão definida de MOV/HEVC.
6. Feed, audiência, comentários, republicações, comunidade privada, jogo privado, edição/compartilhamento explícito, denúncia, bloqueio/desbloqueio, exportação e exclusão.
7. Background/foreground, modo avião, processo encerrado, atualização incompatível, retomada de rascunho por conta e ausência de reenvio automático.
8. Movimento normal/reduzido, VoiceOver, foco, alvo de toque e contraste nos dois temas.

## Decisões externas antes de assinar

- Nome público e bundle/application ID definitivos.
- Domínio próprio e controle dos arquivos de associação de links.
- Conta Apple Developer, entidade publicadora e responsáveis por assinatura.
- Contato público, controlador, política de privacidade publicada, termos, classificação etária e informações de coleta.
- Política de cadastro e recuperação: nesta beta não há confirmação nem SMTP; antes do beta externo, decidir recuperação e ativar Turnstile no Supabase Auth ou admissão controlada.
- Matriz mínima de versões/aparelhos e política de compatibilidade entre cliente e API.
- Escopo do primeiro beta e quem pode receber convites.

## Riscos que governam a próxima etapa

- **Wrapper raso:** a Apple exige mais do que um site reempacotado. Movimento sozinho não caracteriza valor nativo; ciclo de vida, mídia, links, segurança e uma experiência de plataforma coerente precisam fazer parte do produto.
- **Sessão e origem:** PWA e pacote podem ter sessões distintas. Não transportar cookies por suposição e não registrar tokens em logs, URL ou Git.
- **Mídia real:** HEIC, memória do WKWebView e player Range precisam de aparelhos. A `1.0` não cria/publica vídeo no iPhone. A implementação TUS aceita apenas MP4 de até 45 MiB, mas fica desligada até existir sanitização/transcoding e validação física; MOV/HEVC continuam fora do contrato. Emulação de navegador não comprova nenhum desses fluxos.
- **UGC e privacidade:** denúncia, bloqueio, exclusão e filtro textual têm contratos; mídia ainda não recebe classificação semântica. A página de suporte existe, porém não há contato final, escala de moderação nem SLA aprovados.
- **Atualizações:** um cliente local exige compatibilidade explícita com a API e rollback; um preview remoto pode mudar sem novo binário e por isso não serve como produção.

## Referências oficiais

- [Capacitor: configuração](https://capacitorjs.com/docs/config) — `webDir`, `server.url` para live reload e aviso de que a URL remota não é destinada a produção.
- [Capacitor: workflow](https://capacitorjs.com/docs/basics/workflow) — build dos ativos, sync e abertura dos projetos.
- [Capacitor: ambiente](https://capacitorjs.com/docs/getting-started/environment-setup) — versões atuais de Node, Xcode e Android Studio.
- [Capacitor: deep links](https://capacitorjs.com/docs/guides/deep-links) e [segurança](https://capacitorjs.com/docs/guides/security).
- [Apple App Review Guidelines, 4.2](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality) — funcionalidade mínima além de um site reempacotado.
- Documentação local do Next.js 16.3.4: `node_modules/next/dist/docs/01-app/02-guides/static-exports.md`.

## Evidência desta rodada e limite do registro

Na árvore integrada passaram ESLint, typecheck, os **262 testes**, build Next.js de produção em modo demo e com a configuração da beta, build do cliente móvel, `native:verify` com sync somente do iOS, build Debug para iOS Simulator e `npm audit --omit=dev` sem vulnerabilidades. O bundle `native-shell/app.js` e sua cópia no target têm o mesmo SHA-256. O archive Release sem assinatura terminou com `ARCHIVE SUCCEEDED`; o `.app` resultante é iPhone-only, usa a identidade provisória, não está assinado e contém o PrivacyInfo agregado. `native:preflight:ios` concluiu **7/16 checks**, com **9 gates humanos e 0 falhas técnicas**. `git diff --check`, `plutil` e o audit de segredos também passaram.

O smoke final instalou o Debug recém-gerado no iPhone 18 Pro simulado com iOS 27.0 e conferiu splash e estado de rede em claro/escuro com Dynamic Type grande, sem truncamento. As migrations e o deployment integrado já estão no ambiente principal, mas uma sessão controlada no binário ainda não foi exercitada; portanto esse smoke não comprova as jornadas conectadas. Keychain, câmera/HEIC, permissões, Range/TUS com mídia real, VoiceOver, desempenho e ciclo de vida continuam exigindo iPhone físico.

O Supabase principal foi retomado, respondeu saudável e recebeu somente as sete migrations listadas pelo dry-run. O inventário 131→131 foi preservado, os tipos foram regenerados e os switches de mensagens/push continuam `false`, com zero conversa, mensagem, assinatura ou item de fila. O frontend/API da integração foi promovido no domínio principal a partir de `66194b1a57db`; `/api/version` confirmou essa revisão, `/api/health` confirmou banco/Auth e a comparação do deploy preservou 131→131 registros sem remoção, troca de identidade ou edição. Ainda não houve assinatura, upload, TestFlight ou submissão. Cadastro segue sem confirmação e sem SMTP por decisão vigente; novos cadastros não dependem de SMTP. Recuperação por e-mail continua indisponível até decisão e configuração humana.
