# Screenshots · formatos e shot list

Status: **roteiro; nenhuma captura final produzida**.

A Apple aceita de uma a dez imagens por conjunto, em `.jpeg`, `.jpg` ou `.png`, sem canal alpha/transparência. Screenshots devem mostrar o app em uso, não apenas ícone, splash ou login. Texto e overlays explicativos são permitidos, mas a imagem precisa representar a experiência real. Fontes: [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) e App Review Guidelines [2.3.3 e 2.3.9](https://developer.apple.com/app-store/review/guidelines/#accurate-metadata).

## Conjuntos necessários

O target da primeira versão foi deliberadamente fechado em `TARGETED_DEVICE_FAMILY = 1`: a build candidata é iPhone-only. Isso evita prometer uma experiência iPad ainda não validada. Reativar iPad exige novo passe de layout, rotação, acessibilidade, screenshots e metadata antes do archive.

### iPhone

Produzir o conjunto principal para display de 6,9 polegadas. Tamanhos retrato aceitos atualmente:

- `1320 × 2868 px` — recomendado para captura no iPhone 18 Pro Max Simulator.
- `1290 × 2796 px`.
- `1260 × 2736 px`.

Um conjunto de 6,5 polegadas só é obrigatório se o de 6,9 não for fornecido. Não ampliar manualmente uma captura menor; capturar no Simulator correspondente ou compor a partir de uma captura 1:1 preservando a UI.

## História recomendada · 7 tomadas

Usar esta ordem no iPhone, sem fingir um layout que a build não tem.

| Ordem | Tela real | Mensagem curta sugerida | O que precisa aparecer |
| --- | --- | --- | --- |
| 1 | Início | `O que acontece na sua areia` | Feed já autenticado, conteúdo controlado, autoria e audiência legíveis. Não usar splash/login como primeira imagem. |
| 2 | Pessoas | `Encontre quem joga com você` | Descoberta por esporte/lugar e ação Acompanhar, sem métrica inventada. |
| 3 | Comunidades | `Sua turma, com contexto` | Lista/detalhe de comunidade e estado real de entrada ou participação. |
| 4 | Arenas | `Os lugares que fazem parte do jogo` | Diretório e detalhe com capa autorizada, se houver, modalidades e relação com comunidades. Não usar foto importada. |
| 5 | Compositor | `Você escolhe onde publicar` | Texto/foto controlados, audiência e destinos explícitos antes de enviar. Não mostrar upload de vídeo na `1.0`; reprodução existente só entra em outra tomada se o player fechar o gate físico. |
| 6 | Meus jogos | `Seu jogo fica privado` | Arena, modalidade e data de uma partida passada; explicar que compartilhar é separado. |
| 7 | Perfil/conta | `Perfil, segurança e controle` | Perfil e entrada para bloqueios, denúncias, download e exclusão, somente se esses fluxos estiverem completos no iOS. |

Se houver apenas cinco imagens, manter 1, 2, 3, 5 e 6. Não sacrificar a distinção de audiência/privacidade por uma frase promocional maior.

## Dados e direitos

- Criar uma conta de marketing separada, fictícia e claramente controlada.
- Não fotografar ou copiar perfil, avatar, e-mail, denúncia ou comunidade privada de pessoa real.
- Usar somente imagens próprias, sintéticas rotuladas ou com licença que cubra marketing da loja.
- A URL de origem de uma foto de arena não equivale a licença. Retirar do enquadramento qualquer ativo sem prova de uso comercial.
- Evitar status bar com horário/notificações incoerentes, banners de debug, indicador de rede artificial ou texto de preview.
- Não exibir senha, e-mail de login, UUID, token, URL interna, nome do projeto Supabase/Vercel ou dados administrativos.

## Produção e QA

1. Congelar a build candidata e o dataset controlado.
2. Capturar cada estado diretamente na build Release, em tema claro e com locale pt-BR. O conjunto principal pode usar um tema, mas a seleção deve representar a experiência real.
3. Preservar a captura bruta em pasta privada; não versionar conteúdo pessoal.
4. Se houver tratamento editorial, não mover controles, inventar conteúdo nem ocultar avisos essenciais.
5. Exportar em sRGB, sem alpha e nas dimensões exatas.
6. Conferir pixel size, perfil de cor, texto, safe areas, ausência de transparência e ordem.
7. Abrir cada imagem na prévia do App Store Connect antes de enviar para revisão.
8. Repetir todas as capturas se a UI, conteúdo ou comportamento mostrado mudar materialmente.

Checklist final:

- [ ] De 1 a 10 imagens por conjunto; recomendação Pico: 5–7.
- [ ] iPhone 6,9 completo.
- [ ] Archive confirma `TARGETED_DEVICE_FAMILY = 1`; nenhuma metadata promete iPad.
- [ ] Nenhum screenshot é só splash, login ou arte de título.
- [ ] Nenhuma pessoa real ou mídia sem licença.
- [ ] Nenhum recurso ausente, preço, prêmio ou alegação não verificável.
- [ ] Screenshots correspondem ao mesmo nome, ícone e versão da ficha.
