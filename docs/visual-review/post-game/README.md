# Pós-jogo — verificação local em 12/09/2026

Capturas novas deste incremento, feitas pelo script `tests/browser-games.mjs`. A demonstração usa build Next local; a UI conectada usa o Next real com respostas de API controladas em memória. As chamadas fora de localhost foram bloqueadas pelo navegador. Nenhuma captura representa Supabase hospedado ou o site publicado.

Verificações realizadas:

- Lint e typecheck aprovados; build Next em modo demo explícito aprovado.
- 75 testes locais aprovados em Node/PGlite. Após a última alteração de proteção no demo, os 9 testes desse módulo foram repetidos e passaram.
- PostgreSQL descartável: RLS, admissão, contas A/B, datas futuras/civis/inválidas, paginação, versões, tentativas idempotentes, chave de exclusão contra retry atrasado, cascade da conta e upgrade preservando registros legados sem convertê-los.
- 10 verificações HTTP dos Route Handlers reais: autenticação ausente, origem cruzada, campos forjados, data futura, paginação inválida e endpoints/filtro de presença aposentados. Sem sessão ou chamadas remotas; não comprovam persistência via Supabase hospedado.
- Chromium: nove destinos demo (feed, arenas/detalhe, descoberta, perfis próprio/alheio, comunidades, privacidade e instalação), redirecionamento de link antigo, registro/correção/exclusão e bloqueio de data futura.
- UI conectada com fixture: falha de leitura e recuperação; erro ao salvar preserva campos; resposta perdida mantém o UUID e não duplica o registro; correção e exclusão. As escritas da fixture são somente `/api/games`.
- 320/390/430 px; formulário conectado em altura de 620 px, rolagem interna e botão de envio alcançável; Escape fecha. Sem overflow horizontal detectado. Inspeção visual das capturas de registro e formulário de 320 px. Os rótulos da barra usam a forma curta existente “Turmas” para manter leitura em celular; o refinamento editorial completo pertence à integração.

`checks.json` lista o percurso automatizado. Os PNGs de formulário mostram o viewport após rolar para a ação; demais capturas são de página completa e a barra fixa conserva sua posição de viewport. O aviso de nova versão e o indicador do Next dev nas capturas conectadas pertencem ao ambiente de fixture.

Limites: não houve dispositivo físico, teclado móvel real, instalação PWA, Supabase hospedado, concorrência em múltiplas conexões de PostgreSQL ou novo deploy. Os testes de perfil/HEIC e hosted de ciclos anteriores não foram reexecutados nesta rodada. A descoberta, o compositor e demais superfícies conectadas foram auditados no código; a navegação conectada automatizada desta rodada concentra-se em Meus jogos. A integração completa seguirá na tarefa responsável.

Reprodução: iniciar demo em `localhost:3013`, Next conectado em `localhost:3015` com chave fictícia e ambiente de desenvolvimento coerente (nenhum endpoint remoto será usado pela fixture), então executar `node tests/browser-games.mjs` com Playwright disponível. `PLAYWRIGHT_MODULE` e `BROWSER_EXECUTABLE` permitem usar o runtime/browser local instalado. Nenhuma credencial é necessária para esse teste visual.
