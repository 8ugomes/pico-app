# ADR 0001: cliente iOS local, API móvel e sessão segura

- Estado: aceito e implementado localmente; distribuição bloqueada por gates externos
- Data: 18/09/2026
- Escopo: gate N4 do Pico Social no iOS

## Contexto

O produto web usa Next.js App Router, Server Components, Route Handlers, cookies e renderização por requisição. Esses contratos não podem ser exportados estaticamente sem quebrar autenticação, rotas dinâmicas e autorização. O preview Capacitor por `server.url` comprovou o scaffold, mas não é um artefato de loja e cria dependência integral da interface remota.

O aplicativo deve preservar a PWA, o backend Vercel/Supabase, RLS, autoria, audiência e mídia privada. A equipe precisa avançar incrementalmente, sem reescrita integral em Swift e sem misturar autenticação web por cookie com autenticação móvel por Bearer.

## Decisão

1. Criar um cliente React/TypeScript em `apps/mobile/`, compilado por esbuild para `native-shell/`. O Capacitor empacota somente estes arquivos locais. `server.url` continua disponível exclusivamente no preview de desenvolvimento e é rejeitado pelo gate de release.
2. Manter Next.js/Vercel como PWA e BFF. Criar `/api/mobile/v1` como fronteira explícita, com DTOs versionados, `Cache-Control: private, no-store`, CORS por origem exata e `X-Pico-Client-Version` obrigatório.
3. Manter endpoints web inalterados: cookie, SameSite e proteção de origem. Rotas móveis rejeitam cookies e aceitam somente `Authorization: Bearer`. Não existe fallback entre os dois modelos.
4. Usar Supabase Auth por trás do BFF para cadastro, login e rotação. O access token vive somente em memória. O refresh token fica em item Keychain `kSecClassGenericPassword`, acessível apenas neste dispositivo e somente desbloqueado. Uma ponte Capacitor local oferece salvar, ler e apagar esse único segredo; não expõe uma chave/valor genérica.
5. Toda chamada de dados cria um cliente Supabase no servidor com o Bearer verificado. `auth.getUser(accessToken)` confirma identidade e o mesmo token segue à Data API para que RLS/RPCs continuem sendo a autoridade. O BFF nunca usa service role para leituras sociais comuns.
6. A API publica sua versão, versão mínima do cliente e capacidades. Cliente incompatível recebe HTTP 426 e mostra atualização obrigatória. A URL da loja permanece ausente até existir um registro oficial.
7. Escritas reutilizam validadores e RPCs atuais e conservam chaves de tentativa. Não haverá fila automática de escrita: rascunhos de publicação, perfil e jogo usam Capacitor Preferences, são isolados pelo ID da conta e removidos no logout mesmo quando a revogação remota falha, mas a pessoa decide tentar novamente. Preferences não armazena senha, access token ou refresh token.
8. Usar bridges oficiais do Capacitor para ciclo de vida, rede, teclado, câmera, share sheet, status bar, splash e haptics. Permissões são just-in-time. O cliente valida origem e formato e roteia deep links para publicação, jogador, comunidade, arena e seções do perfil; Universal Links só recebem entitlements/AASA após domínio e bundle ID definitivos.
9. Reproduzir vídeo privado já autorizado em player nativo, com `URLSessionConfiguration.ephemeral`, Bearer apenas em memória e faixas reautorizadas pela API. A infraestrutura de envio usa TUS direto ao Storage por autorização curta, em chunks de 6 MiB, com progresso, retomada pelo mesmo MP4 e cancelamento/limpeza explícitos. Criar/publicar vídeo permanece desabilitado na primeira versão; ativação futura exige sanitização/transcoding, validação física e decisão para MOV/HEVC.
10. Manter uma cobertura de privacidade sobre o snapshot do app até a sessão ser revalidada e o novo estado ser renderizado na retomada. Um marcador booleano de instalação e dados não secretos de rascunho/guia usam `UserDefaults`/Preferences; o manifesto agrega `NSPrivacyAccessedAPICategoryUserDefaults`/`CA92.1` e o `FileTimestamp`/`C617.1`/`3B52.1` usado pelo SDK de câmera.
11. Consultar o estado da conta antes de carregar o perfil. Exclusão parcial entra em `deletion_pending` e pode ser confirmada novamente para continuar limpeza de Storage, RPC e Auth. Suspensão, revogação e perfil incompleto preservam somente os direitos de exportar/excluir, logout, suporte e textos legais, sem reabrir dados sociais.
12. Fechar leitura direta dos buckets privados por migration. O cliente recebe bytes apenas de endpoints BFF que verificam `can_read_media` ou `can_read_post_video`; URL de Storage não substitui autorização atual.
13. Associar toda operação autenticada a uma geração de sessão. Logout, expiração ou limpeza avançam a geração; respostas e refresh iniciados antes disso não podem restaurar token, estado privado ou UI. A limpeza é Keychain-first e mantém um tombstone sem segredo até apagar o conteúdo local da última conta.
14. Persistir chave e payload de tentativas de comentário e compartilhamento de jogo até a confirmação do servidor. O banco faz deduplicação/fingerprint; relançamento reutiliza a tentativa exata, sem fila automática ou mutação em background.
15. Oferecer exclusão confirmada de posts/comentários próprios e tornar denúncias/uploads sem uso visíveis na Conta, mantendo ações destrutivas deliberadas e recuperáveis por nova tentativa.

## Alternativas consideradas

- `output: export` do Next.js: rejeitado; a aplicação depende de recursos incompatíveis e a mudança degradaria o produto web.
- WebView remoto como produção: rejeitado; viola o gate local e oferece pouco valor nativo.
- SwiftUI integral: rejeitado; duplicaria produto e contratos antes de existir evidência para a reescrita.
- React Native/Expo agora: adiado; permanece alternativa se medições em aparelho provarem limites persistentes de WKWebView/câmera/listas.
- Refresh token em `localStorage`, IndexedDB ou Preferences: rejeitado por exposição desnecessária do segredo.
- Download integral de vídeo para arquivo temporário: rejeitado; aumenta retenção local e memória. O player pede somente as faixas necessárias e impede redirects.
- Converter MOV/HEVC silenciosamente na primeira versão: rejeitado. Como metadata bruta e codecs capturados ainda não foram saneados/validados, a consequência é manter todo novo upload/publicação de vídeo desabilitado na `1.0`, não apenas recusar extensões.

## Consequências

O repositório ganha um segundo cliente visual e DTOs móveis, mas reutiliza TypeScript, validadores, RPCs, tokens e ativos. Mudanças de schema continuam independentes. Cada endpoint móvel exige revisão de CORS, versão e autorização. Mídia grande depende de upload em streaming e validação física; o player não carrega o vídeo inteiro em memória. Metadados locais de retomada podem indicar um rascunho ou upload, mas nunca substituem o Keychain nem autorizam nova escrita sozinhos.

O bundle ID, nome, domínio, assinatura e ícone finais continuam decisões externas. Sem domínio/bundle final, o roteamento pode ser testado com URL entregue ao app, mas Universal Links não estão associados. Até fechar esses dados, builds de Simulator usam a identidade Preview e nenhum archive é chamado de distribuível.

Cadastro continua sem confirmação de e-mail e sem SMTP por decisão vigente. Essa arquitetura não torna SMTP requisito para criar conta; antes do beta externo, o responsável ainda precisa decidir recuperação e ativar Turnstile no Supabase Auth ou substituir a abertura por admissão controlada.

Fechar a policy genérica de leitura do Storage é uma mudança versionada de banco, não efeito automático do cliente. Enquanto a migration não for publicada e exercitada com duas identidades, o código local não prova que leitura direta está negada no ambiente hospedado.

## Verificação e rollback

Testes devem provar rejeição de cookie/origem/versão/token, rotação/limpeza do refresh token, invalidação de respostas tardias, RLS com identidades distintas, idempotência de escrita, isolamento/limpeza dos rascunhos, direitos de conta restrita, retomada de exclusão, validação dos links e ausência de `server.url`. Mídia deve negar leitura direta do Storage e liberar no BFF somente após `can_read_media`/`can_read_post_video`. Na `1.0`, vídeo deve provar autorização/Range para mídia existente e que a criação/publicação permanece inacessível. TUS, retomada, cancelamento, limpeza e sanitização entram no gate de uma ativação futura. O archive deve conter o `PrivacyInfo.xcprivacy` agregado com `CA92.1`, `C617.1` e `3B52.1`, sem segredos ou hosts não permitidos.

Rollback de código retorna ao último cliente local estável e à versão anterior da API; a compatibilidade mínima não é elevada antes de a build correspondente estar disponível. Nenhuma migration ou dado é revertido por trocar o cliente.
