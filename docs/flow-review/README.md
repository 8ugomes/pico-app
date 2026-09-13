# Fluxo, senha e saída da conta — 13/09/2026

O cadastro agora exige confirmação exata da senha antes de chamar Auth. Login, cadastro, redefinição e confirmações de exclusão e exportação usam o mesmo campo com mostrar/ocultar: botão de 44px, teclado, nome acessível, estado pressionado e sem envio de formulário. Erros ficam junto ao campo, recebem foco e preservam o que foi digitado. A senha continua fora de persistência e logs; a política do provedor e as senhas legadas não mudaram.

“Sair da conta” aparece no topo do Perfil, da configuração inicial e de Minha conta. Usa a sessão local do dispositivo e navegação completa para descartar rascunhos e cache de interface. As outras abas da mesma sessão acompanham a saída. Evento de Auth e botão compartilham um único redirecionamento para evitar navegações concorrentes. O SDK instalado também remove a sessão local quando a revogação remota falha; o teste cobre essa situação sem afirmar revogação no servidor quando a rede está indisponível. Não altera conta, publicações, fotos ou jogos.

Depois de concluir o perfil a partir do cadastro, a pessoa chega ao Início. Foto, nome e esporte ficam no percurso principal; bio, cidade e bairro ficam em “Personalizar perfil”, opcional. O Início pergunta “Onde você joga?” enquanto não há arena acompanhada e mostra os vínculos existentes em Meus Picos. Textos de apoio foram reduzidos em entrada, perfil, tutorial, fotos e boas-vindas. Audiência, ingresso na comunidade, privacidade e recuperação por e-mail indisponível continuam informados.

As capas passam a usar proporção 4:3, com margem interna e contorno simples. A galeria usa tamanho natural com limite de altura e mantém o quadro inteiro; capas da gestão também usam contain. Um erro de imagem mostra “Foto indisponível”. Nenhuma foto original é cortada, trocada ou sobrescrita por esta alteração.

## Verificação

120 testes locais passaram, incluindo comparação exata de senha, Unicode, privacidade, onboarding, preservação de posts e catálogo. Lint, typecheck e build conectado passaram. Após refinar a configuração inicial, os dez testes pertinentes a perfil/onboarding/senha passaram novamente. O detector mecânico Impeccable não reportou ocorrências na amostra; a revisão visual cobre o produto compilado em 320/390px e desktop 1280px, claro/escuro, mais texto ampliado no Perfil.

[Resultados do navegador](results.json): 30 verificações aprovadas, sem erros de execução, com conta e foto descartáveis removidas. A execução cobre cadastro real no desenvolvimento, confirmação divergente sem request, olho por teclado, configuração com upload real, primeira arena, capas e falhas de imagem controladas, logout entre abas, retorno ao login e autenticação com a mesma senha. As contas e imagens descartáveis são removidas ao final, também quando o teste falha. Não são dados reais de jogadores. Fotos de arena são as do catálogo, salvo a capa vertical lisa explicitamente identificada como fixture.

Os primeiros ensaios encontraram diferenças no roteiro (duas ações “Agora não”, o destino anterior do perfil e o comportamento de logout do SDK); foram corrigidos no roteiro e, para o destino, no fluxo do produto. A primeira instalação compartilhada de dependências foi substituída por `npm ci` no worktree por incompatibilidade do Turbopack com symlink externo. A confirmação final também identificou redirecionamento duplicado entre o guard de sessão e o botão; o redirecionamento foi centralizado e recebeu regressão própria. Os resultados válidos são os da instalação isolada e do roteiro final. Não houve teste em aparelho físico nem entrega de e-mail.

## Publicação e preservação

Pedido autoriza commit, PR, integração após CI e deploy da main pelo `scripts/deploy.mjs` no projeto `pico-app`, domínio `pico-app-sepia.vercel.app`. A revisão servida deve ser conferida em `/api/version`; o recibo operacional fica em `.vercel`, fora do Git. O deploy compara IDs e hashes de conteúdo antes/depois. Esta rodada não contém migration, importação, seed ou alteração de política de Auth.

## Próximo levantamento

A [preparação estadual](../arena-state-research/README.md) cobre os 645 municípios e 3.225 links de consulta. Não representa pesquisa concluída: não foram importadas novas arenas. O catálogo atual de 17 unidades permanece íntegro. Busca anterior à paginação, localidades dinâmicas, conferência de fontes e direitos de imagem são critérios para a expansão.
