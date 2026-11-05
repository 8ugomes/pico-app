# Teste em aparelho e Simulator: 05/11/2026

Registro da primeira execução da matriz de `docs/MOBILE_APP.md` com o build Debug local do Pico Social Preview (`com.picosocial.preview`, sem `server.url`). Cada linha diz onde a evidência foi obtida. Só vale como aparelho o que o responsável viu no iPhone.

## Ambientes

| Item | Valor |
| --- | --- |
| Aparelho físico | iPhone 15 (iPhone15,4), iOS 27, pessoal do responsável |
| Simulator | iPhone 17, iOS 27.0, mesmo bundle Debug (arquivo em `build/native-ios`) |
| Xcode | 27.1 |
| Assinatura | Personal Team (Apple Development) com perfil automático. O ID da Team foi passado por linha de comando e **não** foi gravado no projeto |
| Build do aparelho | `xcodebuild` com `DerivedData` fora de `~/Documents` |
| Pacote | `capacitor.config.json` sem `server.url` e sem URL `http` |

## O que passou antes de abrir o app

- `native:doctor`: iOS completo. Pendências só do Android SDK (fora de escopo).
- `mobile:build`, `native:sync:ios` e `native:build:ios` (Simulator): sucesso.
- Instalação no iPhone: sucesso. A primeira abertura exigiu confiar no perfil de desenvolvedor em Ajustes, Geral, VPN e Gerenciamento de Dispositivo (ação do responsável).
- Developer Mode ligado no aparelho; `devicectl` passou de `connected (no DDI)` para `connected` depois de abrir o Xcode.

## Obstáculo de build encontrado

`CodeSign` falhou com "resource fork, Finder information, or similar detritus not allowed" quando o `DerivedData` ficou dentro de `~/Documents` (pasta sob o File Provider do iCloud, que marca os arquivos copiados para o `.app`). Compilar com `-derivedDataPath` em diretório fora de Documents resolveu. O build pelo botão Run do Xcode usa o `DerivedData` padrão em `~/Library` e não deve sofrer disso.

## Matriz

| # | Teste | Aparelho (iPhone 15) | Simulator (iPhone 17) |
| --- | --- | --- | --- |
| 1 | Abertura fria | **Visto.** Splash aparece por menos de 1 s e sem animação. Tela de entrada carregou e foi aprovada visualmente pelo responsável | Splash Manteiga e entrada carregadas em ~3 s |
| 2 | Usar só neste iPhone | Não executado em aparelho | Passou: perfil, arena e jogo criados e listados |
| 3 | Modo avião | Pendente | Não aplicável |
| 4 | Retomada (processo encerrado) | Pendente | Não executado |
| 5 | Exportação | Pendente | Botão presente; folha nativa não exercitada |
| 6 | Exclusão do espaço local | Pendente | Apenas a tela de confirmação foi vista; não apagado |
| 7 | Texto ampliado | Pendente | Não executado |
| 8 | Tema claro e escuro | Pendente | Passou nos dois temas em Perfil e entrada |

## Achados de layout (Simulator, para confirmar no aparelho)

1. **Data do jogo vaza para fora do diálogo.** No diálogo Registrar jogo, o campo de data é mais largo que os outros e perde a borda direita fora da tela.
2. **Rolagem herdada ao trocar de aba.** Ao ir do Início para Arenas, a nova tela chega rolada cerca de 60 px e o botão Adicionar fica parcialmente sob o cabeçalho. Voltar ao topo corrige.
3. **Teclado cobre ações.** Na criação do perfil local, o nome recebe foco automático e o teclado cobre metade do formulário. No diálogo Adicionar arena, o botão de enviar fica cortado pela borda do teclado, mas ainda é tocável.
4. **Botão Adicionar arena do Início** abre a aba Arenas sem abrir o formulário.
5. **Pílula da aba ativa encosta na borda** da tela em Início (esquerda) e Perfil (direita).
6. **Margens laterais mudam** (cerca de 10 pt para 19 pt) depois de abrir um diálogo, na mesma sessão.
7. **Contraste:** iniciais do avatar (bege sobre lavanda) quase invisíveis; texto "Vôlei de praia" lavanda sobre o arco lavanda na entrada; relógio da barra de status escuro sobre o gradiente escuro quando a tela está rolada.
8. **Splash curto e sem animação** (relato do responsável no aparelho).

## O que este registro não comprova

Keychain, câmera/HEIC, permissões, Range/TUS com mídia real, VoiceOver, desempenho, Data Protection com aparelho bloqueado e ciclo de vida continuam exigindo execução no iPhone. As imagens do Simulator não substituem o aparelho.
