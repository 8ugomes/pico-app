# UGC, moderação e direitos de conteúdo

Status: **readiness checklist; há bloqueios abertos**.

O Pico é uma rede social com conteúdo gerado por usuários. A regra 1.2 da Apple exige, em conjunto: método para filtrar material indevido antes/ao publicar, mecanismo de denúncia com resposta oportuna, bloqueio de pessoas abusivas e contato publicado. Uma parte funcional já existe no produto, mas isso não basta para declarar o gate fechado.

## Matriz App Review 1.2

| Exigência Apple | Evidência atual no repositório | Estado | Critério de saída |
| --- | --- | --- | --- |
| Filtrar material indevido | `src/lib/moderation/text-filter.ts` recusa no servidor ameaça direta, exploração sexual de menores e spam por links; o filtro vale para posts, comentários, perfil e campos textuais de comunidades tanto na PWA quanto na API móvel. Uploads também validam tipo, tamanho e decodificação, mas não fazem classificação semântica de imagem/vídeo. | Implementado para texto; **validar política e mídia** | Exercitar bypass/repetição na build candidata, aprovar o limite consciente do filtro de mídia e documentar falso positivo, recurso e atualização. Rate limit ou denúncia posterior isolados não provam este item. |
| Denunciar conteúdo ofensivo | Denúncia de pessoa, post ou comentário, motivos, detalhes privados e status; moderação consegue examinar o alvo específico. | Implementado no web e cliente iOS; **validar conectado** | Exercitar em duas contas na build candidata; provar criação, fila, leitura restrita e resposta do operador. |
| Resposta oportuna | Operador pode dispensar, ocultar ou suspender com auditoria. A documentação pública atual diz que não há prazo configurado. | **Bloqueador operacional** | Nomear responsáveis, cobertura, prioridade, prazo interno e escalonamento; fazer ensaio de ponta a ponta e manter evidência privada. |
| Bloquear pessoas abusivas | Bloqueio bilateral remove visibilidade e conexões; desbloqueio existe em Conta no cliente iOS. | Implementado localmente; **validar conectado** | Provar bloqueio/desbloqueio entre duas contas, feed/perfil/mídia e estado após relançar. |
| Contato publicado | `/suporte` existe, mas declara que canal público ainda não foi configurado. | **Bloqueador** | Publicar e monitorar e-mail/formulário real no app e Support URL; contato deve ser atual e fácil de encontrar. |

Referência: [App Review Guidelines 1.2 e 1.5](https://developer.apple.com/app-store/review/guidelines/#safety).

## Política e operação mínimas

- [ ] Diretrizes públicas proíbem assédio, ameaça, exploração, spam, fraude, pornografia, conteúdo ilegal e violação de privacidade/direitos.
- [ ] Termos definem consequências e autorização necessária para publicar mídia de terceiros.
- [ ] Filtro funciona no servidor; trocar cliente ou repetir request não o contorna.
- [ ] Foto/vídeo passam por validação de formato/tamanho e por mecanismo de segurança aprovado antes de distribuição pública.
- [ ] A política deixa claro que a build `1.0` não recebe novo upload/publicação de vídeo pelo iPhone. A infraestrutura MP4/TUS não é tratada como pronta enquanto sanitização/transcoding, MOV/HEVC e aparelho físico estiverem abertos.
- [ ] Denúncia inclui alvo exato, autor, audiência e mídia acessível somente ao operador autorizado.
- [ ] Moderador consegue ocultar rapidamente conteúdo e suspender acesso sem abrir leitura geral de grupos privados.
- [ ] Bloqueio vale nos dois sentidos em perfil, feed, comentários, busca e mídia.
- [ ] Operação registra decisão e preserva evidência mínima sem copiar conteúdo pessoal para Git/issues.
- [ ] Existe caminho de urgência para ameaça física, exploração infantil ou risco imediato e orientação sobre autoridades quando aplicável.
- [ ] Existe processo de contestação/correção de erro de moderação, mesmo que a Apple não imponha um formato específico.
- [ ] Canal público de suporte e canal de privacidade são monitorados; resposta automática não é tratada como análise concluída.
- [ ] Conta de review consegue testar denúncia/bloqueio com conteúdo controlado.

## Direitos de conteúdo

A Apple exige direitos sobre ícones, screenshots, previews, conteúdo do app e serviços/mídia de terceiros. Fonte URL, crédito ou presença pública não substituem licença.

### Gate por conjunto

| Conjunto | Evidência necessária | Estado inicial |
| --- | --- | --- |
| Marca Pico Social/Pico Club e ícone | Titularidade/autorização do responsável; consistência entre nome e ícones. | Decisão final humana pendente. |
| Fontes Syne e Manrope | Licenças OFL preservadas no pacote/documentação. | Evidência local existente; conferir archive/avisos. |
| Dependência HEIC/HEIF | Aviso/licença e obrigações da versão efetivamente distribuída. | Documento local existe; revisar binário e distribuição. |
| Fotos de arenas | Licença escrita ou origem explicitamente reutilizável para app e marketing da App Store. | A API iOS remove fotos importadas sem direitos e mantém apenas capas autorizadas enviadas por responsáveis. Licença continua obrigatória antes de reativar qualquer foto do catálogo no iOS ou usá-la em marketing. |
| Nomes/logos de arenas | Uso permitido, factual e não enganoso; não sugerir parceria. | Revisão humana/jurídica necessária. |
| UGC de jogadores | Termos com licença limitada para hospedar, processar e exibir na audiência escolhida; mecanismo de remoção. | A licença limitada está redigida em `/termos`, mas continua pendente de aprovação jurídica. |
| Conta e dataset de review | Conteúdo fictício/controlado e direito para distribuição/teste. | Criar antes do TestFlight externo. |
| Screenshots e previews | Cada pessoa, marca, foto e vídeo licenciado para marketing. | Produzir apenas após fechar dataset. |
| Ícones Lucide e demais assets | Licença e avisos da versão distribuída. | Auditar SBOM/licenças do archive. |

## Content Rights no App Store Connect

Resposta provisória recomendada: **Yes, the app contains, shows, or accesses third-party content**. Antes de confirmar:

- [ ] titular aprova os Termos e a licença de UGC;
- [ ] todas as fotos oficiais/arenas exibidas na build têm autorização registrada;
- [ ] processo de retirada por copyright e canal público existem;
- [ ] screenshots usam apenas dataset liberado;
- [ ] documentação de autorização pode ser apresentada à Apple sob pedido;
- [ ] nenhum ícone/nome sugere endosso da Apple ou parceria inexistente.

Referências: App Review Guidelines [2.3.9](https://developer.apple.com/app-store/review/guidelines/#accurate-metadata) e [5.2](https://developer.apple.com/app-store/review/guidelines/#intellectual-property), além de [Content Rights em App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information).

## Gate de saída

Este documento só pode mudar para `pronto` quando houver:

1. filtro preventivo de texto testado na build candidata e política de mídia aprovada;
2. contato público real no app e na Support URL;
3. escala de moderação com tempo de resposta definido e ensaiado;
4. relatório de denúncia/bloqueio entre duas contas no iOS;
5. inventário de direitos sem foto/asset em estado desconhecido;
6. aprovação jurídica dos Termos, Diretrizes e processo de retirada.
