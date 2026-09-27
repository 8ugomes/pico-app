# Checklist de submissão iOS

Status: **aberto**. Marcar somente com evidência da mesma build candidata.

## 0. Decisões e operação

- [ ] Todos os itens de [human-gates.md](human-gates.md) necessários para assinatura/TestFlight estão fechados.
- [ ] Entidade publicadora, Apple Team e Account Holder estão confirmados.
- [ ] Nome público, bundle ID, SKU, ícone e versão foram aprovados.
- [ ] Política de idade/menores foi aprovada.
- [ ] Canal público de suporte e contato de privacidade estão ativos e monitorados.
- [ ] Moderação tem filtro, responsáveis, escalonamento e resposta testada.
- [ ] Cadastro aberto tem Turnstile ativo no Supabase Auth, ou foi substituído por admissão controlada; o controle foi testado por fora do BFF móvel.
- [ ] Cadastro continua sem confirmação/SMTP conforme a decisão vigente; a ausência de recuperação está aprovada e claramente informada, ou um fluxo real foi configurado e testado.
- [ ] Direitos de marca, arena, UGC e screenshots estão documentados.

## 1. Binário Release

- [ ] Checkout limpo, commit identificado e dependências bloqueadas.
- [ ] `Release`/`Archive` usa o bundle ID final e números de versão/build exclusivos.
- [ ] Nome instalado e ícone final coincidem com a ficha.
- [ ] Nenhum `server.url`, marcador Preview, menu de debug, host de laboratório ou segredo no bundle.
- [ ] Apenas HTTPS; sem exceção ATS ampla.
- [ ] Refresh token somente no Keychain; access token em memória; logout/expiração apagam sessão.
- [ ] Preferences/UserDefaults contém apenas rascunhos, guia e marcador de instalação por conta; não contém senha, access token nem refresh token.
- [ ] `PrivacyInfo.xcprivacy` está no target e seu Privacy Report foi revisado.
- [ ] Required Reason APIs do app e SDKs têm razões permitidas e verdadeiras; `UserDefaults`/`CA92.1` e `FileTimestamp`/`C617.1`/`3B52.1` correspondem ao uso real e aparecem no archive assinado.
- [ ] Permissões têm purpose strings específicas e só aparecem após ação da pessoa.
- [ ] `ITSAppUsesNonExemptEncryption` reflete a decisão registrada de export compliance.
- [ ] Lista de frameworks/SDKs e licenças do archive foi auditada.
- [ ] Archive validado pelo Xcode/App Store Connect sem erro pendente.

## 2. Qualidade em aparelho

- [ ] iPhone físico: abertura fria, login/cadastro, sessão, cinco destinos e logout.
- [ ] Background/foreground, encerramento do processo, rede perdida, modo avião e atualização incompatível.
- [ ] Câmera e biblioteca com permissão aceita/negada; HEIC real; upload e acesso privado.
- [ ] A build `1.0` não oferece criação/publicação de vídeo; nenhum controle oculto ou chamada alternativa contorna o feature gate.
- [ ] Player nativo de vídeo já autorizado faz Range/seek, perde acesso após revogação e não persiste Bearer ou vídeo integral em arquivo/cache.
- [ ] Se o upload for reaberto numa versão futura: MP4/TUS progride, cancela, retoma e limpa reserva/metadata; sanitização/transcoding e MOV/HEVC têm contrato e evidência física próprios.
- [ ] Publicação idempotente, audiência pública/privada, comentário, curtida e republicação.
- [ ] Jogos privados, correção/exclusão e compartilhamento separado.
- [ ] Denúncia, bloqueio/desbloqueio, exportação e exclusão da conta.
- [ ] Exclusão interrompida reaparece antes do perfil e pode continuar limpeza de Storage/RPC/Auth com nova confirmação.
- [ ] Rascunhos de publicação, perfil e jogo retomam somente na mesma conta, não enviam sozinhos e são apagados no logout/exclusão local.
- [ ] Buckets privados não permitem leitura direta; foto/vídeo só chega pelo BFF depois de `can_read_media`/`can_read_post_video`, inclusive após revogação.
- [ ] Deep links aceitos abrem o post/jogador/comunidade/arena/seção exatos; origem/caminho inválido não navega. Universal Links só são marcados se entitlement e AASA finais estiverem publicados.
- [ ] VoiceOver, Voice Control, texto ≥200%, contraste, tema escuro e movimento reduzido nos fluxos comuns.
- [ ] Archive confirma a decisão iPhone-only (`TARGETED_DEVICE_FAMILY = 1`) e retrato; iPad não é anunciado nesta versão.
- [ ] Nenhum dado real foi criado ou copiado apenas para o teste.

## 3. App Store Connect

- [ ] Registro criado antes do upload, com Bundle ID correspondente.
- [ ] Acordos vigentes aceitos pela Account Holder.
- [ ] DSA trader status declarado; informação pública verificada se aplicável.
- [ ] Preço, territórios, Mac/Apple silicon e Vision Pro decididos.
- [ ] Categoria Social Networking/Sports confirmada.
- [ ] Questionário etário salvo e resultado documentado.
- [ ] Content Rights respondido após auditoria.
- [ ] App Privacy publicada e coerente com política/manifest/archive.
- [ ] Privacy Policy URL, Support URL e demais URLs abrem publicamente.
- [ ] Accessibility Nutrition Labels só indicam recursos validados em **todas** as tarefas comuns; deixar sem alegação é preferível a metadata falsa.

## 4. TestFlight

- [ ] Build processada e sem `Missing Compliance`.
- [ ] Grupo interno criado; contas têm papéis adequados.
- [ ] `Beta App Description`, Feedback Email e contato preenchidos.
- [ ] Smoke interno concluído em instalação recebida pelo TestFlight, não só Xcode.
- [ ] Grupo externo pequeno criado; `What to Test` corresponde à build.
- [ ] Primeira build externa aprovada em TestFlight App Review.
- [ ] Feedback, screenshots de erro e crashes acompanhados.
- [ ] Nenhum issue de isolamento, perda de dados, sessão ou moderação permanece aberto.

## 5. Ficha e App Review

- [ ] [Metadata pt-BR](metadata-pt-BR.md) revisada por produto e titular.
- [ ] Screenshots finais em iPhone 6,9 polegadas; sem alpha e sem dado pessoal.
- [ ] Conta primária e backup de review testadas em instalação limpa.
- [ ] Credenciais inseridas somente nos campos privados do App Store Connect.
- [ ] Notes for Review atualizadas com caminhos exatos e funções não óbvias.
- [ ] Backend e equipe de contato estarão disponíveis durante a revisão.
- [ ] Exclusão de conta inicia dentro do app; não depende apenas de suporte.
- [ ] UGC cumpre filtro, denúncia/resposta oportuna, bloqueio e contato publicado.
- [ ] Build selecionada e todas as pendências do App Store Connect resolvidas.
- [ ] Opção de release configurada como **manual**.
- [ ] Envio para review autorizado pelo responsável.

## 6. Após a análise

- [ ] Mensagens da Apple respondidas no App Store Connect com evidência concreta e sem dados de usuários.
- [ ] Qualquer rejeição reproduzida e corrigida em novo build; não ocultar função para revisão.
- [ ] Aprovação registrada sem publicar automaticamente.
- [ ] Titular deu autorização separada e explícita para lançamento público.
- [ ] Suporte, moderação, incidentes e rollback estão de plantão na janela escolhida.
- [ ] Após release, smoke de download público e jornadas críticas concluído; sem seed/reset.

Fontes operacionais: [App Store Connect workflow](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-workflow), [Upload builds](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds), [Choose a build](https://developer.apple.com/help/app-store-connect/manage-builds/choose-a-build-to-submit), [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) e [Accessibility Nutrition Labels](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels).
