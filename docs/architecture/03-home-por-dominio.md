# Organização interna do Home

## Objetivo

Organizar o `home` por capacidades da aplicação, evitando que uma mesma feature
fique espalhada entre `components`, `hooks`, `pages`, `service` e `store`.

A movimentação deve acontecer antes das refatorações comportamentais.

Os paths listados como “origens prováveis” nas seções abaixo são históricos.
Os reexports mantidos nesses locais durante a migração foram removidos na Fase
12 após a confirmação de que não tinham consumidores.

## Árvore-alvo

```text
apps/web/home/src/
├── app/
│   ├── HomeRemote.tsx
│   ├── HomeStandalone.tsx
│   ├── providers.tsx
│   └── router.tsx
├── features/
│   ├── room/
│   │   ├── components/
│   │   ├── scene/
│   │   ├── assets/
│   │   └── index.ts
│   ├── scene-navigation/
│   │   ├── components/
│   │   ├── camera/
│   │   ├── navigation-store.ts
│   │   ├── navigation-types.ts
│   │   └── index.ts
│   ├── remote-control/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── realtime/
│   │   ├── routes/
│   │   └── index.ts
│   ├── drawing/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── routes/
│   │   └── index.ts
│   ├── assistant/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   ├── gallery/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   └── cat-game/
│       ├── components/
│       ├── assets/
│       └── index.ts
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── config/
│   ├── types/
│   └── assets/
├── index.css
├── index.html
└── index.tsx
```

Não criar pastas vazias. Essa árvore define responsabilidades, não uma
obrigação de criar todos os níveis.

## Regra para `shared`

Mover para `shared` somente quando:

- duas ou mais features usam o elemento;
- o elemento não representa um conceito de uma feature;
- não conhece estado interno de uma feature.

Não usar `shared` como pasta para arquivos difíceis de classificar.

## Room

Destino:

```text
features/room/
```

Origens prováveis:

- `pages/Home/Room.tsx`;
- composição visual de `components/Board`;
- objeto 3D de `components/Computer`;
- `components/Star.tsx`;
- assets e modelos do quarto.

Responsabilidades:

- montar a cena;
- carregar os modelos;
- compor elementos do quarto;
- identificar hotspots;
- emitir intenções de interação.

Não deve:

- controlar a sequência completa da transição;
- gerenciar WebRTC;
- buscar desenhos diretamente;
- possuir o estado do assistant.

## Scene navigation

Destino:

```text
features/scene-navigation/
```

Origens prováveis:

- `components/Transition.tsx`;
- `components/CameraManager.tsx`;
- `components/CameraToDefault.tsx`;
- `components/InteractionManager.tsx`;
- slices de câmera, localização e transição.

Responsabilidades:

- cena atual;
- destino solicitado;
- fase da transição;
- efeito escolhido;
- configuração de câmera;
- coordenação entre animação e troca de cena.

A implementação detalhada está em
[Navegação, estado e realtime](./04-navegacao-estado-realtime.md).

## Remote control

Destino:

```text
features/remote-control/
```

Origens prováveis:

- `service/RealtimeProvider.tsx`;
- `service/constants.ts`;
- `hooks/usePeerSession.ts`;
- `hooks/useDesktopRTC.ts`;
- `hooks/useMobileRTC.ts`;
- `hooks/useGyro.ts`;
- `components/WebSocket.tsx`;
- `components/QRCode.tsx`;
- `components/Cursor`;
- `pages/Mobile.tsx`;
- estado de conexão, giroscópio e cursor.

Separações internas desejadas:

```text
remote-control/
├── components/
│   ├── ConnectionPanel.tsx
│   ├── RemoteCursor.tsx
│   └── RoomQRCode.tsx
├── hooks/
│   ├── use-peer-session.ts
│   ├── use-desktop-rtc.ts
│   ├── use-mobile-rtc.ts
│   └── use-gyro.ts
├── realtime/
├── routes/
│   └── MobileControllerPage.tsx
└── index.ts
```

O modal introdutório pode permanecer aqui inicialmente, mas deve virar um
componente separado da lógica RTC.

## Drawing

Destino:

```text
features/drawing/
```

Origens prováveis:

- `components/Canvas`;
- `pages/Home/Draw.tsx`;
- geração e exportação do SVG;
- upload;
- status do envio.

Separar gradualmente:

```text
drawing/
├── components/
│   ├── DrawingCanvas.tsx
│   ├── DrawingToolbar.tsx
│   └── DrawingSubmit.tsx
├── hooks/
│   └── use-drawing-upload.ts
├── model/
│   ├── stroke.ts
│   └── svg.ts
├── routes/
│   └── DrawingPage.tsx
└── index.ts
```

Não é necessário fazer toda essa extração durante a movimentação inicial.

## Assistant

Destino:

```text
features/assistant/
```

Origens prováveis:

- interface de chat em `components/Computer/Window.tsx`;
- envio de mensagens;
- `chat_chunk`;
- `chat_done`;
- estado da conversa.

O objeto 3D do computador continua em `room`. A janela e o comportamento do
chat pertencem a `assistant`.

Interface pública possível:

```ts
export { AssistantWindow } from './components/AssistantWindow'
```

`room` usa somente essa API pública.

## Gallery

Destino:

```text
features/gallery/
```

Origens prováveis:

- busca de desenhos em `components/Board/Board.tsx`;
- lista de desenhos;
- renderização das submissões.

O quadro 3D pode permanecer em `room`, consumindo:

```ts
import { DrawingGallery } from '../gallery'
```

## Cat game

Destino:

```text
features/cat-game/
```

Origens prováveis:

- `pages/Home/Cat.tsx`;
- `components/Game`;
- sons;
- estado específico do minigame.

## Imports entre features

Preferir:

```ts
import { AssistantWindow } from '../assistant'
```

Evitar:

```ts
import { AssistantWindow } from '../assistant/components/internal/Window'
```

Se duas features acessarem muitos detalhes internos uma da outra, revisar a
fronteira.

## Ordem segura da movimentação

1. drawing;
2. assistant;
3. gallery;
4. cat-game;
5. remote-control;
6. room;
7. scene-navigation.

Para cada feature:

- [ ] criar apenas as pastas necessárias;
- [ ] mover arquivos sem alterar comportamento;
- [ ] mover assets exclusivos;
- [ ] criar `index.ts` público;
- [ ] atualizar imports;
- [ ] manter reexport temporário, se necessário;
- [ ] buscar o caminho antigo;
- [ ] executar typecheck;
- [ ] executar build;
- [ ] testar manualmente a feature;
- [ ] remover compatibilidade antiga depois.

## Critério de conclusão

- cada comportamento principal tem um domínio identificável;
- `components` e `hooks` globais deixam de ser o destino padrão;
- `shared` contém apenas elementos realmente compartilhados;
- mover uma feature não exige conhecer todo o `home`;
- não houve mudança visual causada apenas pela reorganização.
