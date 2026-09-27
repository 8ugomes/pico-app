# Metadata pt-BR · versão 1.0

Status: **rascunho editorial**. Conferir cada afirmação contra a build candidata. A Apple exige metadata precisa e screenshots do app em uso; não enviar recursos ausentes, conteúdo real de terceiros ou placeholders.

## App Information

| Campo | Rascunho ou decisão | Estado |
| --- | --- | --- |
| Nome | `Pico Social` | Cabe no limite de 30 caracteres. Confirmar disponibilidade e titularidade antes de reservar. |
| Ícone | `[[ICONE_FINAL_APROVADO]]` | O mestre Pico Club permanece provisório; não enviar antes da decisão visual explícita. |
| Subtitle | `Encontre sua turma na areia` | 27 caracteres; cabe no limite de 30. |
| Primary language | `Portuguese (Brazil)` | Proposta; confirmar no registro do app. |
| Primary category | `Social Networking` | Recomendação: a função central conecta pessoas e comunidades. |
| Secondary category | `Sports` | Recomendação: o recorte é futevôlei, beach tennis e vôlei de praia. |
| Content Rights | `Yes, it contains/shows/accesses third-party content` | Resposta conservadora porque há UGC e catálogo de arenas. Só confirmar após o gate de direitos. |
| Bundle ID | `[[BUNDLE_ID_FINAL]]` | Imutável depois do primeiro upload; precisa coincidir com Xcode. |
| SKU | `[[SKU_INTERNO_NAO_SECRETO]]` | Imutável após criar o registro; não é mostrado ao público. |
| License Agreement | `Apple Standard EULA`, provisoriamente | Jurídico deve decidir se os termos públicos exigem EULA customizada. |
| Age Rating | Gerado pelo questionário | Ver [age-rating.md](age-rating.md); resultado esperado pela capacidade social: global 13+ e regional Brasil A16 em sistemas atuais, sem prometer o cálculo final. |
| DSA | `[[TRADER_OU_NAO_TRADER]]` | Declaração humana obrigatória mesmo se não houver distribuição na UE. |

As definições oficiais de categoria indicam Social Networking para apps que conectam pessoas por texto, foto ou vídeo e desenvolvem comunidades; Sports cobre atividades esportivas recreativas. A categoria primária deve representar a experiência central: [Apple, Categories and Discoverability](https://developer.apple.com/app-store/categories/).

## Version Information · pt-BR

### Promotional Text

Limite Apple: 170 caracteres. Rascunho: 154 caracteres.

> Encontre pessoas, arenas e comunidades de futevôlei, beach tennis e vôlei de praia. Compartilhe o que acontece na areia com a audiência que você escolher.

### Description

Limite Apple: 4.000 caracteres; texto simples, sem HTML.

> Pico Social é o ponto de encontro de quem joga futevôlei, beach tennis e vôlei de praia.
>
> Encontre sua turma
> Descubra pessoas pelos esportes e lugares que vocês têm em comum. Acompanhe perfis e veja o que acontece nas suas arenas.
>
> Participe de comunidades
> Entre em comunidades abertas, solicite acesso quando houver aprovação e converse com participantes dentro da audiência de cada grupo.
>
> Compartilhe o que acontece na areia
> Publique texto ou foto no seu perfil, em arenas e em comunidades disponíveis. Antes de publicar, você vê quem poderá acessar o conteúdo e em quais destinos ele aparecerá.
>
> Guarde seus jogos
> Registre arena, modalidade e data depois de jogar. Esse histórico é privado. Compartilhar um jogo é uma ação separada, com audiência explícita.
>
> Mantenha o controle
> Edite ou exclua conteúdo próprio, denuncie conteúdo inadequado, bloqueie outra pessoa, baixe seus dados e inicie a exclusão da conta no aplicativo.
>
> O Pico não mostra presença ao vivo, não coleta localização contínua e não oferece reservas ou pagamentos.

Antes do envio, remover qualquer parágrafo cuja jornada não esteja completa na build iOS candidata.

Nota de produto para a ficha: a build `1.0` pode reproduzir vídeo já autorizado, mas não cria/publica novos vídeos. A infraestrutura TUS de MP4 permanece desligada até sanitização/transcoding e validação física; MOV/HEVC não são aceitos. Não anunciar upload, “vídeos da câmera” ou suporte geral a formatos.

### Keywords

Limite Apple: 100 bytes. Rascunho: 86 bytes em UTF-8.

`futevôlei,beach tennis,vôlei de praia,arenas,comunidades,esportes de areia,jogadores`

Não repetir `Pico Social`, não usar nomes de concorrentes e não inserir preço ou alegações sem comprovação.

### URLs

| Campo | Valor para preencher | Gate |
| --- | --- | --- |
| Support URL | `[[HTTPS_PUBLICO_CONTROLADO]]/suporte` | Precisa mostrar contato público real; a página atual ainda declara que o canal está pendente. |
| Marketing URL | `[[HTTPS_PUBLICO_CONTROLADO]]` ou deixar vazio | Opcional; usar somente domínio controlado e conteúdo final. |
| Privacy Policy URL | `[[HTTPS_PUBLICO_CONTROLADO]]/privacidade` | Obrigatório e também acessível dentro do app. |
| Privacy Choices URL | `[[HTTPS_PUBLICO_CONTROLADO]]/privacidade#seu-controle` | Opcional; usar somente se a âncora pública e as instruções existirem. |
| Accessibility URL | `[[HTTPS_PUBLICO_CONTROLADO]]/acessibilidade` | Opcional; não publicar até existir auditoria e página correspondente. |

### Outros campos

| Campo | Rascunho |
| --- | --- |
| Copyright | `2026 [[NOME_LEGAL_DO_TITULAR]]` |
| Version | `1.0` |
| Build | `[[BUILD_UNICO_CRESCENTE]]` |
| Price | `Free` enquanto pagamentos e assinaturas permanecerem fora do escopo. |
| In-App Purchases | Nenhuma na primeira versão. |
| App Store territories | `[[PAISES_E_REGIOES_APROVADOS]]` |
| Release option | `Manually release this version` |
| Disponibilidade do app de iPhone em Apple silicon Mac | `[[DECIDIR_E_TESTAR]]` |
| Disponibilidade do app de iPhone em Apple Vision Pro | `[[DECIDIR_E_TESTAR]]` |

`What’s New in This Version` não aparece na primeira versão. Para atualizações, descrever mudanças concretas; não usar apenas “melhorias e correções” quando houver mudança material.

## Validação final da ficha

- [ ] Nome, ícone instalado, ícone da App Store e screenshots representam a mesma marca.
- [ ] A build contém todas as jornadas citadas acima.
- [ ] A ficha não promete upload de vídeo; qualquer menção a reprodução corresponde ao gate físico de Range da build.
- [ ] Não há promessa de localização ao vivo, reservas, pagamentos, ranking ou IA.
- [ ] URLs abrem sem login, sem redirecionamento quebrado e sem placeholder.
- [ ] Screenshots usam contas fictícias controladas e mídia com direitos comprovados.
- [ ] Contato, copyright e titular usam dados legais reais.
- [ ] Contagem de caracteres/bytes foi refeita no conteúdo final.

Referências: [App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information), [Platform version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information) e App Review Guidelines [2.3](https://developer.apple.com/app-store/review/guidelines/#accurate-metadata).
