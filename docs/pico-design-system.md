# Pico — design system

O Pico mantém preto e carvão, acento verde-água e conteúdo social em primeiro plano. O refino de setembro de 2026 aplica o mesmo sistema à interface conectada e aos componentes existentes de demonstração. Não altera audiência, admissão ou regras de dados.

## Tokens canônicos

`src/app/globals.css` define as cores, escala e geometria. `forms.css` centraliza controles e diálogos; `social.css`, `social-pages.css` e `profile.css` aplicam suas variantes. Não duplicar regras de input nas telas.

| Token | Valor | Uso |
| --- | --- | --- |
| `--background` | `#07080a` | Fundo |
| `--graphite` | `#111317` | Cards de leitura |
| `--surface-overlay` | `#1c2026` | Elevação e fallback opaco |
| `--surface-input` | Branco a 5% | Campos integrados |
| `--foreground` | `#f2f3f4` | Texto principal |
| `--text-secondary` | `#c2c6cb` | Labels e apoio |
| `--text-muted` | `#b4bac3` | Metadados |
| `--accent` | `#4de1c1` | Ação principal, seleção e foco |
| `--accent-ink` | `#08221e` | Texto da ação principal |
| `--sand` | `#c8a96a` | Champagne restrito à assinatura da marca |
| `--error` | `#ffb5a7` | Erro |
| `--radius-control` | `1rem` | Campos e botões |
| `--radius-card` | `1.375rem` | Cards |
| `--radius-panel` | `1.875rem` | Diálogos e painéis elevados |
| `--radius-pill` | `999px` | Seleções compactas |

Fonte única: `-apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. Controles, menus e diálogos herdam a mesma família. Não há download ou distribuição da SF Pro nem carregamento da Geist.

Corpo e texto digitado: `1rem`; metadados: `.8125rem`; labels: `.875rem`; seções: `1.25rem`; diálogos: `1.375rem`; títulos principais: `1.75–2rem`. Pesos 400, 500 e 600. A navegação compacta usa `.75rem`. Os tokens de espaço vão de `.25rem` a `2rem`, em passos de quatro pixels na escala padrão.

## Materiais e interação

Cards de publicações e pessoas usam fundo estável. Formulários elevados e diálogos usam carvão com preenchimento a 92%, blur de 18px, borda neutra e sombra discreta. A regra base é opaca; `@supports` habilita translucidez, e `prefers-reduced-transparency` retorna ao opaco. Campos não recebem outro blur.

O diálogo nativo mantém cabeçalho e fechamento de 44px fora da única área de rolagem. A ação permanece no fluxo, sem cobrir conteúdo ou teclado. Escape e eventos de fechamento não se propagam ao diálogo pai; o foco retorna ao acionador. Tab/Shift+Tab permanecem entre controles visíveis e habilitados. O recorte de foto devolve o foco ao seletor de arquivo.

`ChoiceChip` mantém um checkbox nativo, teclado e checkmark além da mudança de cor. Formulários de comunidade preservam campos, validações, seleção múltipla e as opções exatas de audiência. O compositor de publicação usa um acionador compacto e abre os mesmos campos em diálogo; o rascunho fica preservado ao fechar e reabrir.

Transições curtas, sem animação de blur. `prefers-reduced-motion` desliga movimento. Controles menores têm alvo de 44px; texto pode crescer e quebrar sem cortar conteúdo.

## Referências e evidência

Não foram encontrados prints originais do Yankee ou um anexo de imagem do formulário. Na [página pública do Yankee](https://play.google.com/store/apps/details?id=com.yankee.foretheist), foi observado um feed escuro com foto dominante, recortes arredondados e controles discretos. É apoio de composição, sem copiar pessoas, marca ou funcionalidades.

A stack de sistema e a separação entre conteúdo e superfícies elevadas seguem a direção das referências oficiais: [Apple Design](https://developer.apple.com/design/human-interface-guidelines/), [fontes Apple](https://developer.apple.com/fonts/) e [Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/). A simplicidade solicitada a partir do ChatGPT orienta agrupamento e discrição dos controles, sem prometer reprodução de um material nativo em CSS.

Capturas reais, cobertura e limites da validação estão em [visual-review/README.md](visual-review/README.md). A fixture local renderiza o app real e simula apenas APIs; não comprova infraestrutura ou persistência remota.
