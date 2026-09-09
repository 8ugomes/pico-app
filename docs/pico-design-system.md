# Pico — design system

## Direção

Um app social de areia, escuro e próximo. Primeiro celular; desktop preserva o ritmo do feed.

## Tokens

| Token | Valor | Uso |
| --- | --- | --- |
| background | #070707 | fundo |
| graphite | #111111 | superfícies |
| surface | rgba(255,255,255,.06) | cards |
| surfaceStrong | rgba(255,255,255,.10) | estados ativos |
| border | rgba(255,255,255,.12) | separadores |
| primary | #FFFFFF | texto principal |
| secondary | rgba(255,255,255,.72) | apoio |
| muted | rgba(255,255,255,.54) | metadados |
| sand | #D8B46A | ação principal |
| coral | #FF6B4A | curtidas e erros |
| ocean | #67D4FF | esporte/contexto pontual |
| green | #3FE29B | presença |

## Tipografia e ritmo

Geist. Corpo 16px; controles 14–16px; metadata 12–13px; títulos 26–32px. Evitar títulos de landing.
Espaçamento baseado em 4px. Margens laterais 20px no celular. Raio 20–26px nos cards, 14px nos inputs e 999px em chips.
Alvos mínimos 44px. Separar label visual de área de toque quando necessário.

## Componentes implementados

AppShell, BottomNav, PageHeading, PlayerAvatar, SportFilter, PostCard, ArenaCard, PlayerCard, Modal, EmptyState, DemoProvider, PostComposer e as views de cada rota.
Reaproveitar Button, Input, Brand e utilitário cn.

## Comportamento

Navegação com aria-current; filtros com aria-pressed; labels explícitos; status com aria-live.
Dialog nativo com showModal e fechamento por Escape.
Transições de 150–220ms, sem movimento contínuo; respeitar prefers-reduced-motion.
Foto com dimensões reservadas e alternativa textual. Sem dependência de imagens remotas em runtime.

## Layout

Em telas estreitas: uma coluna, header compacto e barra inferior fixa com safe area.
Em desktop: navegação lateral e conteúdo social com largura de leitura limitada; informações de comunidade secundárias.
Não usar grades de indicadores ou aparência de painel administrativo.

## Aplicação na rodada 2

Tokens globais em globals.css, base social em social.css e telas específicas em social-pages.css. Retratos em uma imagem 3×2 local, exibidos como avatares com dimensões fixas. Arena ilustrativa local com recorte por contexto.

Referência mobile 390px; ajustes compactos abaixo de 360px; navegação lateral a partir de 800px e coluna secundária a partir de 1160px. Nenhuma captura visual foi usada como comprovação nesta rodada.
