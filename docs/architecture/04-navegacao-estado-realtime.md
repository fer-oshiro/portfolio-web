# Navegação, estado e realtime no frontend

## Parte 1 — Navegação, câmera e efeitos

### Problema atual

A navegação está distribuída entre:

- câmera;
- localização;
- transição;
- animações;
- timers;
- efeitos React.

Uma ação pode alterar câmera e efeito, aguardar, trocar cena e redefinir câmera.
Isso cria chamadas circulares e torna difícil saber qual estado é válido.

### Estado de navegação

```ts
type Scene = 'room' | 'draw' | 'cat'
type TransitionEffect = 'none' | 'brush' | 'cat'
type TransitionPhase = 'idle' | 'covering' | 'revealing'

type NavigationState = {
  currentScene: Scene
  targetScene: Scene | null
  phase: TransitionPhase
  effect: TransitionEffect
}
```

### Eventos

```ts
navigate(targetScene, effect)
coverFinished()
revealFinished()
cancelNavigation()
```

- `navigate`: registra destino e começa a cobrir;
- `coverFinished`: troca a cena quando ela não está visível;
- `revealFinished`: encerra o efeito;
- `cancelNavigation`: retorna para estado conhecido.

### Exemplo: room para draw

```text
1. Inicial
   currentScene = room
   targetScene = null
   phase = idle
   effect = none

2. navigate(draw, brush)
   currentScene = room
   targetScene = draw
   phase = covering
   effect = brush

3. coverFinished()
   currentScene = draw
   targetScene = null
   phase = revealing
   effect = brush

4. revealFinished()
   currentScene = draw
   targetScene = null
   phase = idle
   effect = none
```

O store não conhece a duração. A animação informa quando terminou.

### Câmera separada

```text
features/scene-navigation/camera/
├── camera-config.ts
├── camera-controller.tsx
└── camera-types.ts
```

- `camera-config` contém coordenadas e targets;
- `camera-controller` observa cena, hotspot e viewport;
- a câmera calcula seu destino;
- a câmera não inicia transições;
- transições não alteram coordenadas diretamente.

### SceneController

```text
interação
└── SceneController
    ├── navigation store
    └── camera controller
```

Objetos da cena emitem intenções, como:

```ts
onNavigate('draw')
```

Eles não chamam vários setters.

### Regras iniciais

- não adicionar XState;
- não usar `setTimeout` no store;
- não fazer slices chamarem actions umas das outras;
- não duplicar valores derivados;
- ignorar novo `navigate` enquanto `phase !== 'idle'`;
- manter duração na camada visual;
- adicionar cancelamento complexo somente quando existir caso real.

## Parte 2 — Estado por domínio

### Stores sugeridos

```text
scene-navigation/navigation-store.ts
remote-control/remote-control-store.ts
cat-game/cat-game-store.ts
```

Drawing e assistant começam com estado React local, salvo quando regiões
independentes precisarem compartilhar o estado.

### Estado local

Preferir local para:

- modal aberto;
- inputs;
- cor e tamanho do pincel;
- desenho atual;
- status de botão;
- logs mobile;
- controles de debug.

### Seletores Zustand

Preferir:

```ts
const currentScene = useNavigationStore((state) => state.currentScene)
```

Evitar selecionar o store inteiro.

### Alta frequência

Cursor, giroscópio e valores por frame devem usar, quando adequado:

- refs;
- motion values;
- estado no render loop;
- subscriptions específicas.

Não propagar cada frame pelo store global quando React não precisa renderizar.

## Parte 3 — Cliente realtime

### Problema atual

O provider mantém no escopo do módulo:

- listeners;
- fila;
- função de envio;
- owner;
- ready state.

Isso cria uma instância global implícita.

### Estrutura

```text
features/remote-control/realtime/
├── realtime-client.ts
├── realtime-context.tsx
├── realtime-types.ts
└── use-realtime-message.ts
```

Interface mínima:

```ts
interface RealtimeClient {
  connect(): void
  disconnect(): void
  send(message: ClientMessage): void
  subscribe<T extends ServerMessage['type']>(
    type: T,
    listener: (message: ServerMessageOf<T>) => void,
  ): () => void
  subscribeState(listener: () => void): () => void
  getReadyState(): ReadyState
}
```

### Ciclo de vida

- provider cria uma instância;
- instância guarda fila e listeners;
- provider conecta ao montar;
- provider desconecta e limpa ao desmontar;
- hooks obtêm a instância pelo Context;
- Zod valida mensagens recebidas e enviadas.

### Limite da primeira refatoração

- preservar `react-use-websocket`;
- preservar reconexão;
- preservar hooks públicos;
- mover apenas o estado global para uma instância;
- não reescrever WebRTC ao mesmo tempo.

## Checklist

### Navegação

- [ ] criar tipos;
- [ ] criar navigation store;
- [ ] implementar quatro eventos;
- [ ] adaptar brush;
- [ ] adaptar cat;
- [ ] disparar eventos pelo fim real da animação;
- [ ] trocar cena apenas quando coberta;
- [ ] mover configuração de câmera;
- [ ] criar camera controller;
- [ ] criar SceneController;
- [ ] migrar hotspots;
- [ ] impedir navegação concorrente;
- [ ] remover timers do store;
- [ ] remover chamadas entre slices;
- [ ] validar room → draw → room;
- [ ] validar room → cat → room.

### Estado

- [ ] separar stores por domínio;
- [ ] manter estado local onde possível;
- [ ] usar seletores;
- [ ] revisar dados de alta frequência;
- [ ] remover sincronizações de estado desnecessárias.

### Realtime

- [ ] criar `RealtimeClient`;
- [ ] mover fila e listeners;
- [ ] criar Context;
- [ ] preservar API pública temporariamente;
- [ ] migrar consumidores um por vez;
- [ ] validar reconexão;
- [ ] validar standalone;
- [ ] remover mutáveis globais.

## Testes pequenos recomendados

Testar apenas o comportamento puro:

- `idle → covering`;
- `covering → revealing`;
- `revealing → idle`;
- segundo `navigate` ignorado durante transição;
- cancelamento retorna a um estado válido;
- cliente limpa subscriptions ao desconectar.
