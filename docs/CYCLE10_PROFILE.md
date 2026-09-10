# Ciclo 10 — perfil premium e fotos HEIC

## AUDIT / PLAN

O responsável autorizou integrar o Ciclo 9 na main, corrigir a duplicação do editor, organizar e refinar o perfil e implementar HEIC. Não autorizou lançamento público, convites externos nem contratação. PR #1 foi integrado em fee5b0ce27dcb26eb3374c1bc889474011f00e1a.

O código anterior de ConnectedProfile usava key={profile.id} em ProfileEditor e AvatarEditor no mesmo fragmento. Esse conflito de identidade pode provocar reconciliação incorreta; não confundir com StrictMode, que não deve ser desativado. Além disso, edição, feed, histórico e avatar ficavam simultaneamente na tela.

Plano: identidade única no contêiner do perfil; árvores exclusivas de leitura/edição; tabs para publicações, Picos e atividade; foto integrada ao contexto de edição sem aninhar forms; campos controlados e rascunho preservado durante refresh, confirmação de descarte e troca de conta limpa. Layout escuro e espaçado sem mudar a identidade de arenas/comunidades.

HEIC: decodificação nativa quando disponível, fallback heic-to 1.5.2 CSP por import dinâmico, validação de contêiner/dimensões, processamento local sem serviços externos, normalização e recorte existentes. Limites e licenciamento em THIRD_PARTY_HEIC.md. A variante não suportada deve falhar com mensagem, nunca fingir upload bem-sucedido.

Pendência de composer: sugerir explicitamente mural de arena de check-in ativo somente quando permitido. Nenhuma distribuição ou publicação automática e nenhuma ampliação de audiência.

## VERIFY

Executar lint, typecheck, suíte SQL/contratos e build. Nova regressão usa componentes React reais, StrictMode e Chromium/WebKit com API/Auth/Storage sintéticos: repetições de abrir/fechar editor, refresh sem perda de draft, erro de gravação, cancelamento, troca de conta, viewport e conversão de fixture HEVC real gerada por libheif. Isso não prova ambiente hospedado, entrega de e-mail ou aparelhos físicos.

A entrega só deve declarar resultados após execução dos checks. Deploy interno permanece separado da integração Git; nenhuma migration é necessária para esta rodada. SMTP, aparelhos físicos e responsabilidades operacionais continuam gates externos não concluídos.
