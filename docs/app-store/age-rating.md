# Classificação etária · folha de decisão

Status: **pré-preenchimento; o App Store Connect calcula a classificação final**.

O sistema atual da Apple usa 4+, 9+, 13+, 16+ e 18+ em iOS/iPadOS 26+, com variações regionais. A classificação é obrigatória e pode variar por país. Não selecionar “Made for Kids”: o Pico não foi definido nem implementado como produto infantil.

## Respostas de capacidade

| Pergunta/capacidade | Resposta provisória | Evidência e cuidado |
| --- | --- | --- |
| Parental Controls | No | O produto não oferece controles parentais. |
| Age Assurance | No | Não há idade declarada/verificada nem Declared Age Range API. |
| Unrestricted Web Access | No | Links controlados para suporte/políticas não equivalem a navegador aberto. Revalidar qualquer WebView externo. |
| User-Generated Content | **Yes** | Pessoas publicam texto, foto/vídeo, comentários e perfil. |
| Social Media | **Yes** | Feed, likes, comentários, republicações e descoberta amplificam UGC. |
| Social Media Disabled for Users Under 13 | **No** na build atual | Só selecionar Yes se o app usar ao menos Declared Age Range API e entregar apenas UGC apropriado para menores de 13, como a Apple define. |
| Messaging and Chat | **Yes** | A definição Apple inclui publicação pública; posts/comentários/menções permitem comunicação direta. |
| Advertising | No | Não há anúncios ou promoção paga. |

## Conteúdo e frequência

Responder conforme a build e o conteúdo disponível na data do envio, inclusive UGC que a conta de revisão consegue acessar.

| Descritor | Hipótese inicial | Gate |
| --- | --- | --- |
| Profanity or Crude Humor | `None` somente se catálogo controlado e moderação confirmarem | Auditar feed, perfis, comentários e mídia antes de enviar. |
| Horror/Fear Themes | `None` | Auditar UGC. |
| Alcohol, Tobacco, or Drug Use or References | `None` | Auditar UGC e diretrizes. |
| Medical or Treatment Information | `None` | O diário esportivo não oferece diagnóstico/tratamento. |
| Health or Wellness Topics | `None` ou `Infrequent`, decisão humana | Esportes, por si só, não devem virar alegação de saúde; conferir todo conteúdo editorial. |
| Mature or Suggestive Themes | `None` | Auditar UGC e fotografias. |
| Sexual Content or Nudity | `None` | Auditar UGC; trajes esportivos não devem ser classificados por suposição. |
| Graphic Sexual Content and Nudity | `None` | Conteúdo proibido pelas diretrizes. |
| Cartoon/Fantasy Violence | `None` | Sem função correspondente. |
| Realistic Violence | `None` | Sem função correspondente; auditar UGC. |
| Prolonged Graphic/Sadistic Violence | `None` | Conteúdo proibido. |
| Guns or Other Weapons | `None` | Sem função correspondente; auditar UGC. |
| Gambling / Simulated Gambling / Loot Boxes | `None` | Fora do produto. |
| Contests | `None` | Não confundir esporte praticado ou jogo privado com competição/ranking dentro do app. |

## Resultado esperado, não definitivo

Marcar `Social Media = Yes` corresponde, na tabela atual da Apple, a:

- classificação global esperada de **13+** em sistemas 26+;
- **A16** para a classificação regional autodeclarada no Brasil;
- **16+** na Austrália;
- **15+** na Coreia;
- **16+** no Vietnã.

O App Store Connect é a autoridade do cálculo e também mostra a classificação para versões anteriores do sistema. Não codificar ou divulgar esses números antes de salvar o questionário final.

## Decisão humana sobre menores

Antes da distribuição, o titular precisa escolher e documentar:

- idade mínima contratual do Pico;
- se menores de 18 anos podem criar conta;
- se menores de 13 anos são proibidos;
- como idade/consentimento será tratado, sem afirmar verificação inexistente;
- se a classificação calculada deve ser elevada para coincidir com os Termos;
- quem responde por privacidade e segurança de menores.

Se os Termos exigirem idade maior do que o cálculo Apple, usar `Override to Higher Age Rating`. Não usar o override para reduzir a classificação.

## Checklist

- [ ] Conteúdo acessível à conta de revisão auditado no mesmo dia do envio.
- [ ] UGC, Social Media e Messaging and Chat marcados Yes.
- [ ] Social Media Disabled for Users Under 13 marcado No enquanto não houver a implementação exigida.
- [ ] Nenhuma resposta baseada apenas em intenção ou diretriz; a build e seu conteúdo governam.
- [ ] Política de menores aprovada e refletida em Termos/Privacidade/onboarding.
- [ ] Resultado global e Brasil registrados após salvar o questionário.
- [ ] Metadata e screenshots permanecem apropriados para 4+, mesmo que o app tenha classificação maior, conforme a regra 2.3.8.

Referências: [Age ratings values and definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions), [Set an app age rating](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating) e App Review Guidelines [2.3.6](https://developer.apple.com/app-store/review/guidelines/#accurate-metadata).
