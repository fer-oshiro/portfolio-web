# Plano seguro para o novo cenário do jogo do gato

## Status e finalidade

Este documento descreve uma iniciativa nova. Ele não faz parte das fases já
executadas em `docs/architecture` e não reabre os itens concluídos naquele
roadmap.

O objetivo é permitir a criação de um cenário 3D para o jogo do gato sem:

- aumentar desnecessariamente o tempo de abertura da sala;
- exibir uma tela vazia durante a navegação;
- manter mais de um contexto WebGL ativo;
- perder o estado do desenho ou do jogo;
- acumular áudio, listeners ou recursos gráficos após várias visitas;
- alterar os contratos já consolidados de câmera, realtime e Module
  Federation.

Este plano deve ser executado em etapas. Cada etapa possui um gate de saída. A
etapa seguinte só pode começar depois que o gate atual estiver atendido.

## Escopo

### Incluído

- runtime compartilhado para as cenas 3D `room` e `cat`;
- carregamento sob demanda do código e dos assets do gato;
- preload oportunista do cenário do gato;
- sincronização entre prontidão da cena e animação de transição;
- ciclo de vida do áudio do minigame;
- persistência do estado necessário do jogo fora da árvore 3D;
- otimização dos assets diretamente relacionados à experiência;
- testes automatizados do estado temporal;
- smoke tests de navegação, carregamento e estabilidade;
- medição antes e depois da mudança.

### Não incluído

- reescrever câmera, realtime, drawing ou gallery;
- trocar Zustand por outra biblioteca;
- adicionar uma biblioteca de máquina de estados;
- redesenhar as transições `brush` e `cat`;
- modificar o protocolo do controle remoto;
- criar um sistema genérico para uma quantidade ilimitada de cenas;
- alterar infraestrutura, backend ou deploy;
- produzir o conteúdo artístico definitivo antes de o runtime estar estável.

Se uma necessidade fora desse escopo aparecer, ela deve ser registrada
separadamente. Não deve ser incorporada silenciosamente a uma etapa deste
plano.

## Ponto de partida já existente

As seguintes decisões são consideradas prontas e devem ser preservadas:

- `navigation-store` é baseado em uma função de transição pura;
- a duração da animação não fica no store;
- a animação emite `coverFinished` e `revealFinished`;
- navegação concorrente é ignorada;
- `SceneController` converte intenções em comandos;
- câmera e navegação têm responsabilidades separadas;
- `room`, `draw` e `cat` são domínios identificáveis;
- `Draw` usa DOM/SVG e não precisa ser convertido em cena Three.js.

Arquivos de referência:

- `apps/web/home/src/pages/Home/index.tsx`;
- `apps/web/home/src/features/room/scene/Room.tsx`;
- `apps/web/home/src/features/cat-game/components/CatMiniGame.tsx`;
- `apps/web/home/src/features/cat-game/components/Game.tsx`;
- `apps/web/home/src/features/scene-navigation/navigation-types.ts`;
- `apps/web/home/src/features/scene-navigation/navigation-store.ts`;
- `apps/web/home/src/features/scene-navigation/components/Transition.tsx`;
- `apps/web/home/src/features/scene-navigation/cat-transition.ts`;
- `apps/web/home/src/features/scene-navigation/brush-transition.ts`.

## Diagnóstico do estado atual

Atualmente, `Home` monta `Room`, `Draw` e `CatMiniGame` simultaneamente. A cena
visível é escolhida com `display: none` ou `hidden`.

Isso preserva estado local e torna a troca imediata, mas possui limites:

1. `Room` cria um `Canvas` próprio.
2. `CatMiniGame` cria outro `Canvas`, mesmo quando está oculto.
3. Um cenário completo dentro de `CatMiniGame` passaria a competir por CPU,
   GPU e memória com a sala.
4. O `Suspense` de `Home` engloba todas as cenas montadas. Um asset futuro do
   gato pode bloquear a primeira renderização da sala.
5. A troca ocorre depois da cobertura terminar, mas não existe um evento que
   informe que o destino está pronto.
6. `useProgress` observa carregamentos globais do Drei. Um preload posterior
   pode interferir no overlay pensado para o boot inicial.
7. `Game` instancia objetos de áudio ao montar e pode criar novos
   `Tone.Player` a cada clique em play.

O problema não é a máquina de navegação existente. O problema é que ela ainda
não representa a prontidão do destino e que as cenas 3D não compartilham o
mesmo runtime.

## Resultado esperado

Ao final, o fluxo deve ser:

```text
room visível
  │
  ├── preload em idle, foco ou hover ──► código/assets do gato entram no cache
  │
  └── usuário ativa o hotspot
          │
          ├── inicia a cobertura
          ├── garante o carregamento do destino
          │
          └── cobertura terminou
                  │
                  ├── destino pronto ──► troca a cena e revela
                  │
                  └── ainda carregando ─► mantém a cobertura opaca
                                              │
                                              ├── pronto ─► troca e revela
                                              └── erro ───► revela a origem e avisa
```

Em condições normais, o preload termina antes do clique. Em rede lenta, a
transição funciona como uma cobertura segura: o usuário pode esperar um pouco,
mas nunca vê uma cena parcialmente montada ou uma tela vazia.

## Regras que não podem ser quebradas

1. Deve existir no máximo um `Canvas` Three.js na Home.
2. `Draw` permanece DOM/SVG e deve preservar o desenho ao visitar outra cena.
3. O boot da sala não pode aguardar os assets do gato.
4. A cena só pode ser revelada depois de confirmar prontidão.
5. Eventos atrasados devem ser ignorados quando não correspondem ao
   `targetScene` atual.
6. O store não pode usar `setTimeout` para simular prontidão.
7. O clique repetido durante uma transição não pode iniciar uma segunda
   navegação.
8. Áudio só pode começar após gesto do usuário.
9. Sair do gato deve pausar ou encerrar áudio ativo.
10. Remontagens e React Strict Mode não podem duplicar players ou eventos.
11. Uma falha de carregamento deve manter a aplicação navegável.
12. Cada etapa deve passar por testes e build antes da próxima.

## Arquitetura-alvo

```text
Home
├── Transition
├── SceneViewport
│   └── Canvas único
│       ├── RoomScene
│       └── CatScene, somente depois de solicitado ou pré-carregado
├── RoomOverlay
├── CatGameOverlay
└── Draw, DOM/SVG preservado

SceneController
├── cameraStore
├── navigationStore
└── scene runtime
    ├── registro de módulos
    ├── status de carregamento
    └── sinal de sceneReady/sceneFailed
```

### Estrutura de arquivos sugerida

Os nomes podem ser ajustados durante a implementação, mas as responsabilidades
não devem ser misturadas.

```text
apps/web/home/src/features/
├── room/
│   ├── components/
│   └── scene/
│       ├── RoomScene.tsx
│       └── RoomOverlay.tsx
├── cat-game/
│   ├── audio/
│   │   └── cat-audio-controller.ts
│   ├── components/
│   │   └── CatGameOverlay.tsx
│   ├── scene/
│   │   └── CatScene.tsx
│   └── cat-game-store.ts
└── scene-navigation/
    ├── components/
    │   ├── SceneViewport.tsx
    │   ├── SceneReady.tsx
    │   └── Transition.tsx
    ├── scene-registry.ts
    ├── navigation-types.ts
    └── navigation-store.ts
```

Evitar criar `shared`, `utils` ou um novo domínio genérico apenas para guardar
um ou dois arquivos. O runtime pertence a `scene-navigation`; conteúdo e áudio
do gato pertencem a `cat-game`.

## Contrato de navegação proposto

### Estados

O contrato atual precisa representar a situação em que a cobertura terminou,
mas o destino ainda não está pronto.

Uma forma segura de fazer isso é adicionar `covered` e o status do destino:

```ts
type TargetStatus = 'loading' | 'ready' | 'failed'

type TransitionPhase = 'idle' | 'covering' | 'covered' | 'revealing'

type IdleNavigationState = {
  currentScene: Scene
  targetScene: null
  phase: 'idle'
  effect: 'none'
}

type PendingNavigationState = {
  currentScene: Scene
  targetScene: Scene
  phase: 'covering' | 'covered'
  effect: ActiveTransitionEffect
  targetStatus: TargetStatus
}

type RevealingNavigationState = {
  currentScene: Scene
  targetScene: null
  phase: 'revealing'
  effect: ActiveTransitionEffect
}
```

Não é obrigatório copiar exatamente esses aliases, mas todos os estados
impossíveis devem continuar impossíveis pelo TypeScript. Por exemplo, `idle`
não pode ter `targetScene` e `covered` não pode ter efeito `none`.

### Eventos

```ts
type NavigationEvent =
  | {
      type: 'navigate'
      targetScene: Scene
      effect: ActiveTransitionEffect
    }
  | { type: 'sceneReady'; scene: Scene }
  | { type: 'sceneFailed'; scene: Scene; reason: string }
  | { type: 'coverFinished' }
  | { type: 'revealFinished' }
  | { type: 'cancelNavigation' }
```

O erro armazenado deve ser uma mensagem ou código seguro para UI. Não guardar
objetos `Error`, loaders ou Promises dentro do Zustand.

### Tabela de transições obrigatórias

| Estado atual       | Evento                             | Próximo estado         | Observação                     |
| ------------------ | ---------------------------------- | ---------------------- | ------------------------------ |
| `idle`             | `navigate` válido                  | `covering/loading`     | Registra o destino uma vez     |
| `covering/loading` | `sceneReady` correspondente        | `covering/ready`       | Aguarda a cobertura            |
| `covering/loading` | `sceneFailed` correspondente       | `covering/failed`      | Aguarda cobrir antes de voltar |
| `covering/*`       | `coverFinished` com destino pronto | `revealing` no destino | Troca somente coberto          |
| `covering/loading` | `coverFinished`                    | `covered/loading`      | Mantém overlay opaco           |
| `covering/failed`  | `coverFinished`                    | `revealing` na origem  | Não troca a cena               |
| `covered/loading`  | `sceneReady` correspondente        | `revealing` no destino | Troca e começa a revelar       |
| `covered/loading`  | `sceneFailed` correspondente       | `revealing` na origem  | Mostra erro após revelar       |
| `revealing`        | `revealFinished`                   | `idle`                 | Limpa efeito e destino         |

Eventos `sceneReady` e `sceneFailed` de outra cena, de uma tentativa antiga ou
recebidos em `idle` devem ser ignorados.

### Comportamento das animações

`getCatAnimation` e `getBrushAnimation` devem tratar explicitamente todas as
fases:

- `idle`: efeito oculto e nenhum evento de conclusão;
- `covering`: anima até cobrir e emite `coverFinished`;
- `covered`: permanece totalmente coberto, sem animação e sem evento;
- `revealing`: revela e emite `revealFinished`.

Não usar o antigo comportamento “qualquer fase diferente de `covering` revela”,
pois isso faria `covered` revelar antes de o destino estar pronto.

O atraso fixo usado atualmente na revelação não deve representar carregamento.
Se ainda existir uma pausa estética, ela precisa ser curta, documentada e ficar
somente na camada de animação.

## Contrato do runtime de cenas

### Registro

O registro diferencia código carregado de cena visualmente pronta:

```ts
type SceneModule = {
  Scene: React.ComponentType<{ active: boolean }>
}

type SceneDefinition = {
  kind: 'three' | 'dom'
  load: () => Promise<SceneModule>
}
```

Diretrizes:

- `room` pode permanecer eager porque é a cena inicial;
- `cat` deve usar `import()` dinâmico;
- `draw` continua DOM e pode ser considerado pronto imediatamente;
- chamar `load()` mais de uma vez deve reutilizar a mesma Promise do import;
- a Promise em andamento deve ser limpa se o import falhar, permitindo retry;
- um módulo carregado com sucesso pode permanecer no cache da sessão;
- o módulo carregado não significa que GLTFs e texturas já estão prontos.

Não declarar uma única instância global de `React.lazy` se ela impedir uma nova
tentativa depois da rejeição do primeiro import. O registro deve controlar a
Promise em andamento, o módulo resolvido e o número da tentativa. Em uma falha,
deve limpar somente a tentativa rejeitada e permitir que o error boundary seja
remontado com uma nova chave.

### Prontidão visual

`CatScene` deve ficar dentro de um `Suspense` exclusivo do destino. Um
componente `SceneReady` só emite o evento após a subárvore suspensa montar com
sucesso.

Requisitos:

- o `Suspense` do gato não pode suspender `RoomScene`;
- o destino pode montar invisível enquanto a origem ainda está visível;
- depois da primeira montagem bem-sucedida, o destino pode permanecer montado
  e invisível para evitar recompilação de shaders na volta;
- `visible={false}` não interrompe `useFrame`; hooks por frame devem verificar
  a prop `active` e retornar imediatamente quando inativos;
- o evento `sceneReady` deve ser idempotente para suportar Strict Mode;
- um error boundary específico deve converter falha em `sceneFailed`.

Uma cena que já ficou pronta precisa confirmar readiness novamente quando se
tornar o destino de uma navegação futura. Isso pode ser feito pelo runtime ao
observar `targetScene` ou por `SceneReady` ao receber `targeted=true`. Não
depender apenas do primeiro `useEffect` da montagem, pois a sala e o gato podem
continuar montados entre visitas.

Para este projeto, manter `room` e `cat` montados depois da primeira visita é
aceitável, desde que compartilhem um único `Canvas` e que a cena inativa não
execute atualizações por frame. Se novas cenas forem criadas futuramente, a
política de retenção deverá ser reavaliada antes de manter todas em memória.

### Preload

O preload deve ser apenas uma antecipação do mesmo caminho de carregamento
usado pela navegação. Não criar uma segunda implementação exclusiva para
preload.

Ordem recomendada de gatilhos:

1. depois que o boot inicial da sala estiver concluído;
2. durante tempo ocioso com `requestIdleCallback`;
3. ao entrar em hover ou foco no hotspot do gato;
4. imediatamente ao receber a intenção de navegação, caso ainda não tenha
   começado.

Fornecer fallback para navegadores sem `requestIdleCallback`:

```ts
const scheduleIdle = (callback: () => void) => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback)
  }

  return window.setTimeout(callback, 1_000)
}
```

O retorno deve ter cleanup correspondente. O timeout serve apenas para
agendamento do preload na UI; ele não pode entrar no navigation store nem
simular que uma cena ficou pronta.

### Boot inicial independente

O overlay inicial não deve depender indefinidamente do `useProgress` global.
Depois que o preload do gato começar, o progresso global pode voltar a mudar.

Criar um latch específico para o boot:

```text
pending ── room pronta + condição inicial da gallery ──► running ──► done
```

Depois de `running`, carregamentos posteriores não podem reiniciar ou cancelar
a animação inicial. Depois de `done`, o overlay inicial nunca volta a ficar
opaco.

Não alterar o comportamento de erro da gallery dentro desta iniciativa. Caso
ele seja considerado inadequado, registrar uma tarefa própria.

## Estratégia do `Canvas` único

### Separação necessária

O componente atual `Room` combina:

- wrapper de página;
- modal DOM;
- criação do `Canvas`;
- câmera e interação;
- conteúdo Three.js.

Antes de compartilhar o `Canvas`, separar sem alterar comportamento:

```text
Room
├── RoomOverlay: modal e UI DOM
└── RoomScene: meshes, luzes, câmera e interação
```

O mesmo vale para o gato:

```text
CatMiniGame
├── CatGameOverlay: botões e HUD
└── CatScene: conteúdo Three.js
```

`SceneViewport` passa a possuir:

- o único `Canvas`;
- configuração de DPR;
- configuração do renderer;
- câmera compartilhada;
- boundaries de carregamento das cenas;
- visibilidade e atividade de cada cena;
- pausa do frameloop quando `Draw` for a cena ativa.

### Política de renderização

- `room` ativa: frameloop normal e somente `RoomScene` visível;
- `cat` ativa: frameloop normal e somente `CatScene` visível;
- `draw` ativa: viewport 3D oculto e frameloop pausado;
- destino carregando: pode montar invisível, mas não executar lógica de jogo;
- destino coberto e pronto: fazer a troca de visibilidade antes de revelar.

Não alterar câmera e renderização na mesma extração. Primeiro mover o conteúdo
para componentes de cena preservando os canvases atuais; só depois conectar ao
viewport compartilhado.

## Estado do jogo do gato

Dados que precisam sobreviver à desmontagem ou à troca de visibilidade devem
ficar em `cat-game-store.ts`:

- fase do jogo;
- pontuação;
- itens quebrados ou coletados;
- configuração de som;
- status necessário para retomar uma partida.

Não colocar no store:

- instâncias de `THREE.Object3D`;
- geometrias, materiais ou texturas;
- `Tone.Player`, `AudioContext` ou elementos `Audio`;
- refs de componentes;
- valores derivados a cada frame.

Animações, velocidade e posição de objetos que só importam durante um frame
podem permanecer em refs ou dentro do loop do jogo. Persistir apenas o estado
de domínio necessário para reconstruir a cena.

## Ciclo de vida do áudio

O áudio deve possuir um controlador explícito, testável e idempotente.

### Regras

- importar `tone` dinamicamente no primeiro gesto que realmente precisa dele;
- executar `Tone.start()` apenas em resposta ao gesto do usuário;
- reutilizar um único player de música;
- impedir dois carregamentos simultâneos da mesma música;
- não iniciar música apenas porque a cena foi pré-carregada;
- pausar ou parar ao sair da cena, conforme a regra do jogo;
- chamar `dispose()` quando o controlador for destruído;
- remover listeners e cancelar callbacks no cleanup;
- capturar rejeições de `audio.play()`;
- manter efeitos curtos independentes, mas reiniciar `currentTime` quando a
  regra esperada for tocar novamente desde o início.

### Casos mínimos de teste

- dois cliques rápidos em play criam apenas um player;
- stop antes do carregamento terminar não inicia música depois;
- sair do gato interrompe a música;
- voltar ao gato permite tocar novamente;
- preload da cena não produz som;
- falha no arquivo de áudio não bloqueia a navegação.

## Orçamento inicial de assets

Os limites abaixo são provisórios e devem ser confirmados na Fase 0. Qualquer
exceção precisa ser registrada com a medição correspondente.

| Recurso                                                  |         Limite inicial sugerido |
| -------------------------------------------------------- | ------------------------------: |
| Total transferido pelo novo cenário, sem música opcional |                            5 MB |
| Maior textura individual                                 |                            2 MB |
| Resolução de textura para caminho mobile                 |                     2048 × 2048 |
| GLB comprimido principal                                 |                            3 MB |
| Aumento do chunk inicial gzip                            |                          100 KB |
| Música opcional                                          | não pertence ao caminho crítico |

Diretrizes:

- preferir KTX2 para texturas usadas pelo Three.js quando o pipeline estiver
  validado;
- usar WebP quando KTX2 não trouxer benefício suficiente ou complicar o
  pipeline;
- usar Draco ou Meshopt para geometria, mas não os dois sem medição;
- manter mipmaps para objetos 3D vistos em diferentes distâncias;
- evitar texturas 4K quando 2K não apresentar diferença visível;
- carregar a música somente depois da ação do usuário;
- registrar tamanho original, tamanho final e impacto visual.

A textura atual `room.png` possui aproximadamente 11 MB no repositório e deve
ser medida como possível otimização independente. Não substituir o arquivo sem
comparação visual da sala em desktop e mobile.

## Plano de execução

### Fase 0 — Baseline e proteção

**Effort recomendado:** `medium`.

**Objetivo:** obter números de comparação e confirmar que o estado inicial está
verde antes de modificar comportamento.

Passos:

1. Confirmar que o working tree não possui alterações desconhecidas na área.
2. Executar os testes atuais do Home.
3. Executar typecheck, lint e build do Home.
4. Registrar os tamanhos de `apps/web/home/dist`.
5. Abrir o Home standalone com cache desabilitado.
6. Registrar tempo até a sala aparecer e até a câmera chegar ao destino.
7. Registrar recursos baixados no carregamento inicial.
8. Confirmar a quantidade atual de elementos `canvas`.
9. Executar `room → cat → room` cinco vezes e observar memória e áudio.
10. Registrar limitações do dispositivo, navegador, rede e CPU usados.

Comandos:

```bash
npm test --workspace @fer-oshiro/home
npm run check-types --workspace @fer-oshiro/home
npm run lint --workspace @fer-oshiro/home
npm run build --workspace @fer-oshiro/home
find apps/web/home/dist -maxdepth 1 -type f -exec du -h {} + | sort -h
```

Registro mínimo esperado:

```text
Data:
Commit:
Navegador e versão:
Dispositivo:
Viewport:
CPU throttling:
Rede:
Tempo de boot:
Quantidade de Canvas:
Transferência inicial:
Maior long task:
Problemas já existentes:
```

**Gate:** não avançar se testes, typecheck ou build falharem sem antes confirmar
e registrar que a falha já existia.

**Commit sugerido:** nenhum, exceto se o baseline for registrado em um arquivo
próprio dentro desta pasta.

### Fase 1 — Prontidão no modelo de navegação

**Effort recomendado:** `high`.

**Objetivo:** representar carregamento sem conectar ainda o novo cenário.

Arquivos principais:

- `navigation-types.ts`;
- `navigation-store.ts`;
- `navigation-store.test.ts`;
- `scene-controller.tsx`;
- `cat-transition.ts` e teste;
- `brush-transition.ts` e teste.

Ordem obrigatória:

1. Adicionar testes para a tabela de transições proposta.
2. Confirmar que os testes novos falham pelo motivo esperado.
3. Adicionar `covered` e o status do destino.
4. Implementar `sceneReady` e `sceneFailed` como eventos idempotentes.
5. Manter o bloqueio de navegação concorrente.
6. Atualizar as funções puras das animações.
7. Garantir que `covered` não emita callbacks de conclusão.
8. Criar uma ponte temporária e explícita no controller que marque as cenas
   atualmente eager como prontas logo após `navigate`.
9. Preservar os fluxos atuais `room → draw → room` e `room → cat → room`.

A ponte do passo 8 é necessária para manter cada commit executável antes de o
runtime real existir. Ela não usa Promise nem timer: apenas traduz o fato atual
de que todas as cenas já estão montadas. Nomear ou comentar essa ponte para que
ela seja facilmente encontrada e removê-la obrigatoriamente na Fase 5.

Testes obrigatórios:

- destino fica pronto antes de `coverFinished`;
- destino fica pronto depois de `coverFinished`;
- falha antes da cobertura terminar;
- falha depois da cobertura terminar;
- readiness de outra cena é ignorada;
- readiness atrasada de uma navegação cancelada é ignorada;
- segundo `navigate` continua ignorado;
- `covered` mantém brush completamente coberto;
- `covered` mantém cat completamente coberto;
- `revealFinished` limpa efeito e status temporário.

**Gate:** todos os testes puros passam e nenhuma UI foi conectada a uma Promise
ou timer.

**Commit sugerido:** `refactor(home): model scene readiness in navigation`.

### Fase 2 — Isolar o boot inicial

**Effort recomendado:** `high`.

**Objetivo:** impedir que o preload futuro reinicie ou cancele o overlay
inicial.

Passos:

1. Identificar exatamente quais condições significam “sala inicial pronta”.
2. Separar esse sinal do progresso global de assets futuros.
3. Criar latch `pending → running → done`.
4. Garantir que `running` não volte para `pending`.
5. Garantir que `done` seja definitivo enquanto `Home` estiver montada.
6. Preservar o reset inicial da câmera.
7. Simular um novo carregamento depois do boot e confirmar que o overlay não
   reaparece.

Não fazer nesta fase:

- criar o Canvas compartilhado;
- alterar a gallery;
- carregar assets do gato;
- mudar duração ou aparência da introdução.

**Gate:** carregamentos posteriores não alteram a opacidade do overlay de boot.

**Commit sugerido:** `fix(home): isolate initial loading transition`.

### Fase 3 — Extrair cenas sem alterar o runtime

**Effort recomendado:** `medium`.

**Objetivo:** separar conteúdo Three.js de wrappers e overlays antes de mover o
Canvas.

Passos:

1. Extrair `RoomScene` do componente atual `Room`.
2. Extrair o modal da sala para `RoomOverlay`, se necessário.
3. Extrair `CatScene` e `CatGameOverlay`.
4. Manter temporariamente os dois canvases atuais.
5. Confirmar que não houve mudança visual ou de navegação.
6. Confirmar que imports públicos continuam passando pelos `index.ts` das
   features.

Regras:

- não alterar iluminação, DPR, câmera ou posições;
- não otimizar assets nesta fase;
- não transformar estado local do jogo ainda;
- remover a compatibilidade temporária antes de concluir a Fase 4.

**Gate:** comportamento visual equivalente ao baseline e build sem novos
warnings na área alterada.

**Commit sugerido:** `refactor(home): separate scene content from viewports`.

### Fase 4 — Criar o Canvas compartilhado

**Effort recomendado:** `high`.

**Objetivo:** usar um único renderer e um único contexto WebGL.

Passos:

1. Criar `SceneViewport` com a configuração atual do Canvas da sala.
2. Mover `RoomScene` para o viewport compartilhado.
3. Mover `CatScene` para o mesmo viewport.
4. Renderizar somente uma cena como visível.
5. Passar `active` explicitamente para cenas e sistemas por frame.
6. Fazer `CameraController`, `InteractionManager` e `SakuraStar` ignorarem
   frames quando não pertencem à cena ativa, quando aplicável.
7. Fazer `InteractionManager` intersectar somente a raiz da cena ativa, em vez
   de todos os filhos do scene graph global.
8. Pausar o frameloop enquanto `Draw` estiver ativo.
9. Manter `Draw` montado e oculto como hoje para preservar linhas locais.
10. Remover os canvases antigos de `Room` e `CatMiniGame`.
11. Procurar por todas as ocorrências de `<Canvas` e confirmar a propriedade.

Não assumir que `visible={false}` é suficiente para impedir raycast. O conjunto
de objetos enviado ao raycaster deve ser explicitamente limitado à raiz ativa.

Validações específicas:

```js
document.querySelectorAll('canvas').length
```

O resultado esperado na Home é `1`.

Também validar:

- modal da sala permanece sobre o Canvas;
- botões do gato continuam clicáveis;
- raycasting não reage a objetos da cena invisível;
- cursor não fica preso em `pointer` após a troca;
- câmera da sala mantém posição e interpolação;
- controles Leva continuam disponíveis apenas quando habilitados.

**Gate:** um Canvas, nenhum erro de contexto WebGL e navegação equivalente ao
baseline.

**Commit sugerido:** `refactor(home): share one canvas across 3d scenes`.

### Fase 5 — Lazy loading, preload e readiness real

**Effort recomendado:** `high`.

**Objetivo:** retirar o gato do caminho crítico e conectar o carregamento ao
estado de navegação.

Passos:

1. Criar `scene-registry.ts`.
2. Manter `room` eager e tornar `cat` um import dinâmico.
3. Criar um `Suspense` exclusivo para o destino.
4. Criar `SceneReady` e um error boundary do destino.
5. Emitir `sceneReady(scene)` somente depois da montagem completa.
6. Emitir `sceneFailed(scene, reason)` em falha de chunk ou asset.
7. Remover a ponte de readiness eager criada na Fase 1.
8. Garantir que um destino já pronto confirme readiness em toda nova navegação.
9. Limpar a Promise rejeitada e incrementar a chave da tentativa em retry.
10. Iniciar preload depois do boot, em idle.
11. Reutilizar o mesmo preload no hover/foco do hotspot.
12. Iniciar imediatamente no clique se ainda estiver `not-requested`.
13. Manter a cobertura em `covered` enquanto o destino estiver carregando.
14. Exibir uma indicação discreta de carregamento apenas se a espera coberta
    superar um limite visual definido na camada de UI.
15. Confirmar que o limite visual não altera o navigation store.

Cenários de rede obrigatórios:

- chunk do gato já em cache;
- chunk sem cache em rede rápida;
- chunk sem cache em Fast 3G ou Slow 4G;
- falha de chunk;
- falha de GLTF;
- clique antes do preload em idle;
- clique enquanto o preload já está em andamento;
- retorno ao gato com tudo em cache.

**Gate:** a sala aparece sem esperar o gato; nenhuma navegação revela destino
incompleto; falha retorna à origem de forma navegável.

**Commit sugerido:** `feat(home): preload cat scene behind transition`.

### Fase 6 — Estado e áudio do gato

**Effort recomendado:** `medium`.

**Objetivo:** tornar o minigame seguro para suspensão, inatividade e retorno.

Passos:

1. Definir quais dados precisam sobreviver à saída.
2. Criar `cat-game-store.ts` apenas com dados de domínio.
3. Remover dependência de estado importante exclusivamente local.
4. Criar o controlador de áudio.
5. Trocar o import estático de `tone` por import dinâmico.
6. Reutilizar player e Promise de carregamento.
7. Implementar stop e dispose idempotentes.
8. Pausar o jogo e áudio quando `active` se tornar falso.
9. Confirmar que preload não instancia ou inicia áudio.
10. Testar cliques repetidos e ciclos de entrada e saída.

**Gate:** dez ciclos `room → cat → room` não aumentam progressivamente a
quantidade de players, listeners ou reprodução simultânea.

**Commit sugerido:** `refactor(home): control cat game state and audio lifecycle`.

### Fase 7 — Otimizar assets existentes e definir budgets

**Effort recomendado:** `medium`.

**Objetivo:** criar espaço de performance antes de adicionar arte nova.

Executar uma categoria por vez:

1. textura da sala;
2. modelo e texturas do gato;
3. efeitos sonoros;
4. música opcional;
5. chunk JavaScript do gato.

Para cada asset:

1. registrar tamanho original;
2. gerar uma alternativa otimizada;
3. comparar visualmente;
4. testar desktop e mobile;
5. medir tamanho e tempo de decode;
6. substituir somente se a comparação for aprovada;
7. executar build para confirmar emissão e URL pública.

Não apagar o original antes da aprovação visual. A remoção deve acontecer no
mesmo commit que passa a referenciar o arquivo otimizado, depois de buscar
consumidores.

**Gate:** budgets confirmados e nenhuma regressão visual perceptível no
dispositivo de referência.

**Commit sugerido:** usar um commit por categoria, por exemplo
`perf(home): compress room texture`.

### Fase 8 — Construir o novo cenário

**Effort recomendado:** `medium`; usar `high` se gameplay, física ou shaders
forem implementados simultaneamente.

**Objetivo:** adicionar conteúdo somente depois de carregamento e runtime
estarem protegidos.

Ordem sugerida:

1. criar cenário vazio com cor de fundo;
2. adicionar modelo principal comprimido;
3. adicionar iluminação;
4. adicionar câmera específica, se necessária;
5. adicionar interações básicas;
6. adicionar efeitos sonoros;
7. adicionar música opcional;
8. adicionar HUD;
9. adicionar regras e progresso do jogo;
10. adicionar efeitos visuais de maior custo por último.

Após cada item:

- medir tamanho do build;
- testar primeira entrada sem cache;
- testar entrada com cache;
- testar retorno à sala;
- testar mobile;
- confirmar que a cena inativa não atualiza por frame.

Não adicionar modelo, música, partículas, pós-processamento e gameplay no mesmo
commit. Assim, qualquer regressão de performance terá uma causa identificável.

**Gate:** cenário funcional dentro dos budgets e todos os critérios de aceite
atendidos.

### Fase 9 — Validação final e remoção de compatibilidade

**Effort recomendado:** `high` para investigação; `medium` se todas as medições
estiverem dentro do esperado.

Passos:

1. Procurar componentes e canvases antigos sem consumidores.
2. Remover apenas caminhos substituídos e já não importados.
3. Executar todos os testes do Home.
4. Executar typecheck, lint e build.
5. Repetir exatamente o ambiente registrado na Fase 0.
6. Comparar transferência, boot, long tasks, memória e quantidade de Canvas.
7. Executar a matriz manual completa.
8. Registrar diferenças e exceções de budget.
9. Confirmar funcionamento standalone e pelo shell.

**Gate:** definição de pronto integralmente atendida.

**Commit sugerido:** `test(home): validate cat scene loading lifecycle` ou um
commit de documentação, se nenhum código precisar mudar.

## Matriz de testes automatizados

### Navigation store

- [ ] `idle → covering/loading`;
- [ ] `sceneReady` antes da cobertura;
- [ ] `coverFinished` antes de `sceneReady`;
- [ ] `covered → revealing` quando o destino fica pronto;
- [ ] falha revela a origem;
- [ ] readiness de destino incorreto é ignorada;
- [ ] navegação concorrente é ignorada;
- [ ] cancelamento limpa tentativa ativa;
- [ ] `revealFinished` volta para estado canônico.

### Transições visuais puras

- [ ] brush oculto em `idle`;
- [ ] brush cobre em `covering`;
- [ ] brush permanece coberto em `covered`;
- [ ] brush revela somente em `revealing`;
- [ ] cat oculto em `idle`;
- [ ] cat cobre em `covering`;
- [ ] cat permanece coberto em `covered`;
- [ ] cat revela somente em `revealing`.

### Runtime

- [ ] import do gato é memoizado;
- [ ] readiness é emitida uma vez de forma efetiva;
- [ ] emissão duplicada é inofensiva;
- [ ] error boundary converte erro em `sceneFailed`;
- [ ] evento atrasado não muda uma navegação nova;
- [ ] preload não altera a cena atual.

### Áudio

- [ ] player único;
- [ ] play concorrente é deduplicado;
- [ ] stop é idempotente;
- [ ] dispose é idempotente;
- [ ] saída da cena interrompe reprodução;
- [ ] erro de áudio não quebra navegação.

## Matriz de smoke tests

Executar no mínimo em Chrome desktop e em um viewport mobile. Quando possível,
usar também um aparelho mobile real.

| Caso                     | Cache    | Rede              | Resultado esperado                            |
| ------------------------ | -------- | ----------------- | --------------------------------------------- |
| abrir Home               | vazio    | normal            | sala aparece sem aguardar gato                |
| abrir Home               | vazio    | lenta             | overlay inicial termina sem flash posterior   |
| entrar no gato após idle | aquecido | normal            | transição contínua                            |
| entrar imediatamente     | vazio    | lenta             | cobertura espera sem tela vazia               |
| falhar chunk do gato     | vazio    | offline após boot | origem reaparece com erro recuperável         |
| voltar para room         | aquecido | normal            | sala pronta e câmera correta                  |
| repetir dez vezes        | aquecido | normal            | sem áudio duplicado ou crescimento monotônico |
| visitar draw e voltar    | qualquer | normal            | desenho preservado                            |
| clique repetido          | qualquer | normal            | uma única navegação                           |
| redimensionar            | qualquer | normal            | Canvas e câmera se ajustam                    |
| controle remoto ativo    | qualquer | normal            | interação continua funcional                  |

## Critérios de aceite

### Funcionais

- [ ] `room → cat → room` funciona em desktop e mobile;
- [ ] `room → draw → room` não sofreu regressão;
- [ ] desenho local permanece após visitar outra cena;
- [ ] hotspot do gato continua acessível por mouse e controle remoto;
- [ ] falha do gato não bloqueia a sala;
- [ ] música respeita gesto do usuário;
- [ ] voltar interrompe áudio conforme esperado.

### Carregamento

- [ ] código do gato está em chunk separado;
- [ ] assets do gato não bloqueiam a primeira exibição da sala;
- [ ] preload reutiliza o mesmo carregamento da navegação;
- [ ] transição permanece coberta enquanto o destino não está pronto;
- [ ] o overlay de boot não reaparece durante preload;
- [ ] entrada aquecida não dispara novos downloads do cenário.

### Renderização

- [ ] existe exatamente um Canvas na Home;
- [ ] cena invisível não recebe raycast;
- [ ] cena inativa não executa lógica relevante por frame;
- [ ] `Draw` pausa o frameloop 3D;
- [ ] não há perda de contexto WebGL;
- [ ] não há flash de fundo entre cenas.

### Estabilidade

- [ ] dez ciclos de navegação não acumulam players;
- [ ] dez ciclos não acumulam listeners;
- [ ] heap não apresenta crescimento monotônico atribuível às cenas;
- [ ] erros de carregamento podem ser tentados novamente;
- [ ] Strict Mode não duplica efeitos persistentes.

### Qualidade

- [ ] testes do Home passam;
- [ ] typecheck do Home passa;
- [ ] lint não adiciona warnings na área alterada;
- [ ] build de produção passa;
- [ ] funcionamento standalone foi verificado;
- [ ] funcionamento pelo shell foi verificado;
- [ ] comparação com o baseline foi registrada.

## Estratégia de erro e recuperação

### Falha antes do clique

Se o preload em idle falhar, registrar o status como disponível para nova
tentativa. Não mostrar erro enquanto o usuário não demonstrar intenção de abrir
o gato.

### Falha durante a navegação

1. completar a cobertura;
2. não trocar `currentScene`;
3. iniciar revelação da cena de origem;
4. mostrar mensagem não bloqueante;
5. permitir uma nova tentativa depois que a navegação voltar a `idle`.

### Timeout de experiência

Um timeout pode controlar apenas a mensagem apresentada ao usuário, por
exemplo, trocar “Carregando” por “Isso está demorando mais que o esperado”. Ele
não deve declarar a cena pronta nem forçar a troca.

### Perda de contexto WebGL

Registrar listeners `webglcontextlost` e `webglcontextrestored` durante a
validação. Não criar automaticamente outro Canvas como resposta. Primeiro
preservar a tela de erro e permitir recarregar a experiência de forma
controlada.

## Estratégia de commits e rollback

Cada fase deve resultar em um commit pequeno e reversível. Não acumular todas
as fases em um único commit.

Regras:

- não misturar asset binário e mudança de estado no mesmo commit;
- não misturar extração de arquivos e mudança visual;
- não apagar implementação antiga antes de o consumidor novo funcionar;
- remover compatibilidade temporária dentro da fase que conclui a migração;
- se um gate falhar, corrigir na mesma fase ou reverter apenas o commit da
  fase;
- registrar problemas preexistentes sem corrigi-los fora do escopo.

Não é necessário criar feature flag permanente. Os commits pequenos são o
mecanismo de rollback desta iniciativa.

## Como pedir a execução para uma IA

Não solicitar a implementação inteira em uma única sessão. Usar uma sessão por
fase e começar sempre com este contrato:

```text
Leia docs/cat-game-scenario/README.md por completo.
Execute somente a Fase <N>.
Considere docs/architecture como histórico já concluído e não altere seus
checklists.
Preserve os comportamentos fora do escopo.
Antes de editar, inspecione os arquivos citados e os testes existentes.
Implemente primeiro o menor contrato puro possível.
Execute as validações definidas na fase.
Não avance para a próxima fase.
Ao final, liste arquivos alterados, testes executados, resultado do gate e
qualquer risco restante.
```

Escolha de effort:

| Fase | Effort                                                     |
| ---- | ---------------------------------------------------------- |
| 0    | `medium`                                                   |
| 1    | `high`                                                     |
| 2    | `high`                                                     |
| 3    | `medium`                                                   |
| 4    | `high`                                                     |
| 5    | `high`                                                     |
| 6    | `medium`                                                   |
| 7    | `medium`                                                   |
| 8    | `medium` ou `high`                                         |
| 9    | `high` para diagnóstico, `medium` para execução previsível |

Usar `low` apenas para correções documentais, renomes ou buscas mecânicas que
não alterem comportamento. Esta iniciativa não precisa de `xhigh` se as fases
forem respeitadas.

## Checklist de início de cada fase

- [ ] a fase anterior passou pelo gate;
- [ ] o working tree foi revisado;
- [ ] o escopo da sessão contém somente uma fase;
- [ ] testes relevantes foram identificados antes da edição;
- [ ] assets e arquivos binários não serão alterados junto com estado;
- [ ] existe um caminho claro para retornar ao comportamento anterior;
- [ ] nenhuma decisão já concluída em `docs/architecture` será reaberta.

## Checklist de encerramento de cada fase

- [ ] o diff contém apenas o escopo declarado;
- [ ] novos estados impossíveis foram evitados por tipos;
- [ ] efeitos possuem cleanup;
- [ ] callbacks atrasados são seguros;
- [ ] testes específicos passam;
- [ ] typecheck passa;
- [ ] lint não ganhou novos warnings relevantes;
- [ ] build passa;
- [ ] smoke test relacionado foi executado;
- [ ] o gate da fase foi explicitamente confirmado;
- [ ] pendências foram registradas sem ampliar o escopo.

## Definição de pronto

A iniciativa termina somente quando:

1. a Home utiliza um único Canvas;
2. o boot inicial não depende do cenário do gato;
3. código e assets do gato são carregados fora do caminho crítico;
4. a transição espera prontidão real;
5. falhas revelam novamente a origem;
6. estado importante do jogo sobrevive à navegação;
7. áudio possui ciclo de vida explícito;
8. a cena inativa não consome processamento relevante por frame;
9. budgets de asset estão registrados e atendidos ou justificados;
10. testes e matriz de smoke tests foram concluídos;
11. standalone e shell continuam funcionando;
12. a comparação final demonstra que a nova cena não piorou o carregamento
    inicial nem introduziu travadas visíveis na troca.
