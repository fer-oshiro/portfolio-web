# AGENTS.md

Guia para agentes de IA que trabalham neste repositório.

Monorepo (npm workspaces + Turbo) do portfólio: quatro microfrontends com
Module Federation, um backend realtime via WebSocket com entrypoints local e
AWS Lambda, Storybook e packages compartilhados. A documentação do projeto está
em português, em `docs/` e no `README.md`.

## Comandos

Node `24.13.1` e npm `11.8.0` (`.nvmrc`, `engines`).

```bash
npm install
npm run dev        # shell :3000, home :3001, resume :3002, blog :3003, backend local :8080
npm run dev:web    # só microfrontends
npm run dev:back   # só backend local (lê .env se existir)
npm run dev:docs   # Storybook :6006
```

Validações (os hooks do Husky rodam as mesmas):

```bash
npm run format:check   # Prettier só em ts/tsx/md
npm run check-types
npm test
npm run lint
npm run build
```

- `pre-commit`: Prettier nos arquivos staged + testes de `realtime-contract`;
  `pre-push`: `format:check`, `test`, `check-types`, `lint`; `commit-msg`:
  commitlint (Conventional Commits).
- Por workspace: `npm run <script> --workspace @fer-oshiro/<nome>`. Nomes:
  `shell`, `home`, `blog`, `resume`, `backend`, `docs` (Storybook), `ui`,
  `realtime-contract`.
- Só `home`, `backend` e `realtime-contract` têm testes.
- Um teste no home/contract (Vitest, filtro por caminho):
  `npm test --workspace @fer-oshiro/home -- navigation-store`
- Um teste no backend (`node:test` + `tsx`; passar argumentos via npm ainda roda
  o glob inteiro): `cd apps/backend && node --import tsx --test src/features/chat/service.test.ts`
- O lint usa `eslint-plugin-only-warn`, então nunca falha. Não introduza novos
  warnings na área alterada.
- `npm run build --workspace @fer-oshiro/backend` gera cinco bundles esbuild e
  ZIPs em `apps/backend/dist/aws/` (`authorizer`, `signaling`, `chat`,
  `drawing`, `cost-guard`), consumidos pelo Terraform.

### Deploy e infraestrutura

`deploy:web`, `deploy:back` e `terraform apply` publicam em produção. Não rode
nenhum deles sem pedido explícito. Para auditar o Terraform sem mutação:

```bash
terraform -chdir=infra/terraform init -input=false
terraform -chdir=infra/terraform fmt -check
terraform -chdir=infra/terraform validate
terraform -chdir=infra/terraform plan -input=false -lock=false -detailed-exitcode
```

`.env`, `.envrc` e `*.tfvars` contêm secrets em texto puro: não exiba seu
conteúdo (nem com `terraform fmt -diff`). `deploy:back` só atualiza o código
das Lambdas; mudanças de env, memória, timeout ou IAM exigem Terraform.
Detalhes de Turnstile/Groq/Twilio/AWS em `docs/operations/public-api-cost-protection.md`.

## Arquitetura

### Regras de dependência

```text
Shell ──► contrato público dos remotes (home/Home, blog/Blog, resume/Resume)
Remote ──► packages pelos exports públicos
Backend entrypoints ──► features ──► ports/contratos; adapters ──► features
```

Proibido: um remote importar source de outro remote; importar
`packages/*/src` por caminho; package importar `apps/*`; shell conhecer stores
ou componentes internos dos remotes; feature do backend conhecer Lambda, SDK da
AWS ou `process.env`.

### Microfrontends (`apps/web/*`)

- Webpack + swc em cada app. O shell é dono do router superior, das URLs dos
  remotes (`apps/web/shell/src/config/remotes.js`, a única fonte) e de um
  `RemoteBoundary` (loading + erro) por remote. Os tipos dos módulos remotos
  ficam em `apps/web/shell/src/types/remote-modules.d.ts`.
- Cada remote tem `src/app/<X>Remote.tsx` (exposto via MF; não cria
  `BrowserRouter`) e `<X>Standalone.tsx` (cria o próprio router). Rotas
  internas pertencem ao remote.
- `shared` do MF tem só `react`, `react-dom` e `react-router` como singletons.
  Não adicione libs ao `shared` sem necessidade real de instância única.
- `@fer-oshiro/realtime-contract` é consumido como source TS (exports apontam
  para `src/`). `@fer-oshiro/ui` é consumido pelo `dist` + `styles.css`; o
  `dev` do home faz build e watch do `ui` automaticamente via Turbo.

### Protocolo realtime

`packages/realtime-contract` define com Zod as mensagens do cliente
(`action`: `join`, `signal`, `chat`, `get_drawings`, `save_drawing`) e do
servidor (`type`: `joined`, `signal`, `chat_chunk`, `chat_done`, `drawings`,
`upload_grant`, `error`, ...). Frontend e backend validam tudo por esses
schemas. Para mudança incompatível: backend compatível com as duas versões,
depois remotes, depois shell, e só então remover a compatibilidade.

### Backend (`apps/backend/src`)

- `features/<x>/` (`service.ts`, `ports.ts`, `index.ts`) contém a regra e
  depende só de ports e do contrato. `adapters/aws` (API Gateway, DynamoDB,
  S3, Groq, Twilio, Turnstile) e `adapters/local` (memória) implementam os
  ports.
- `entrypoints/aws/*.ts`: uma Lambda por arquivo. Cria clientes uma vez por
  processo, faz parse + Zod, consome quota atômica pelo `SecurityService` antes
  de chamar Groq/Twilio/S3 e traduz erros em mensagens `error` do contrato.
- `entrypoints/local.ts`: `node:http` + `ws` na porta 8080 usando as mesmas
  features com adapters locais (conexões e SVGs em memória; somem ao
  reiniciar). Sem `GROQ_API_KEY` o chat usa `LocalChatProvider`; com a chave,
  usa Groq. O modo local não tem authorizer/Turnstile. Sem emulador de Lambda.
- Só `config/env.ts` lê `process.env`; os loaders AWS falham cedo citando o
  nome da variável, nunca o valor.

### Home (`apps/web/home/src`)

Organizado por domínio em `features/` (`room`, `scene-navigation`,
`remote-control`, `drawing`, `assistant`, `gallery`, `cat-game`). Entre
features, importe só pelo `index.ts` da feature. Só crie `shared/` para algo
usado por duas ou mais features. `pages/Home/index.tsx` compõe as cenas.

**Navegação** (`features/scene-navigation`):

- `navigation-store.ts` é Zustand vanilla sobre a função pura
  `transitionNavigation(state, event)`. Fases:
  `idle → covering → (covered) → revealing → idle`. Enquanto a navegação está
  pendente, `targetStatus` vale `loading | ready | failed`. Os tipos tornam
  estados impossíveis irrepresentáveis; mantenha isso.
- As animações (`brush-transition.ts`, `cat-transition.ts`, puras) disparam
  `coverFinished`/`revealFinished` pelo fim real da animação. O store não tem
  `setTimeout` nem duração. Um `navigate` concorrente é ignorado, assim como
  `sceneReady`/`sceneFailed` atrasados ou de outra cena.
- Objetos da cena emitem intenções. `SceneController`
  (`scene-controller-model.ts`, puro) as traduz em comandos para navigation e
  camera stores. A câmera (`camera/`) calcula pose e nunca inicia transições.
- `SceneViewport` tem o **único `<Canvas>`** da Home. `room` é eager; `cat` é
  lazy via `pages/Home/scene-registry.ts` (`createSceneRegistry` memoiza a
  Promise do import e a limpa em falha para permitir retry). `LazyScene` e
  `SceneReady` emitem a prontidão, e `useScenePreload` pré-carrega o gato em
  idle depois do boot. Falha de carregamento revela a origem e mostra
  `SceneFailureNotice`.
- Cenas recebem `active`. Hooks de `useFrame` precisam retornar cedo quando
  inativos, e o raycast só atinge a raiz da cena ativa. `Draw` é DOM/SVG e fica
  montado e oculto para preservar o desenho; o frameloop pausa nele.
- O overlay de boot usa um latch próprio (`initial-boot.ts`), independente do
  `useProgress` global, para que o preload não o reabra.

**Estado:** stores por domínio (`navigation`, `camera`, `remote-control`,
`gallery`, `cat-game`), cada um com uma factory `createXStore` para testes (ver
`store-boundaries.test.ts`). Use seletores, não o store inteiro. Dados de alta
frequência (cursor, giroscópio) ficam em refs ou subscriptions específicas. Não
guarde em store objetos Three.js, players de áudio, Promises ou `Error`. O
áudio do gato (`cat-game/audio/cat-audio-controller.ts`) importa `tone`
dinamicamente no gesto do usuário, reutiliza um único player e tem
`stop`/`dispose` idempotentes.

**Realtime/remote control:** `RealtimeProvider` cria uma instância de
`RealtimeClient` (fila e listeners na instância, sem estado mutável de módulo)
sobre `react-use-websocket`. A URL do WebSocket e a site key do Turnstile são
injetadas no build via `DefinePlugin` (`WEBSOCKET_URL`, padrão
`ws://localhost:8080` em dev; `TURNSTILE_SITE_KEY`) e lidas só em
`config/urls.ts`. O celular (`/mobile`, via QR Code) envia o giroscópio pelo
DataChannel WebRTC (`simple-peer`), não pelo WebSocket. Giroscópio exige HTTPS:
`ngrok http 3000`.

## Observações práticas

- Sem o backend local, a gallery nunca confirma `drawingsReady` e o overlay
  inicial da Home fica opaco. Rode com `npm run dev`. Em Chrome headless o
  Turnstile não passa; para o boot concluir nos testes, use
  `galleryStore.setDrawingsReady(true)`.
- Em dev, deixe `TURNSTILE_SITE_KEY` vazio e nunca aponte um frontend local
  para o WebSocket de produção.
- `#leva` na URL mostra o painel de debug (Leva) da câmera.
- `infra/docker-compose.yml` (DynamoDB local) é opcional; o dev usa memória.

## Forma de trabalho

- Commits: Conventional Commits com escopo quando couber (ex.:
  `refactor(home): ...`), apenas a linha de assunto.
- Mudanças pequenas e reversíveis. Não misture no mesmo commit movimentação de
  arquivos com mudança de comportamento, nem asset binário com mudança de
  estado. Antes de remover um caminho antigo, procure consumidores.
- Falha preexistente: confirme, registre e não corrija fora do escopo.
- `docs/architecture/` é histórico de um roadmap concluído: não reabra
  decisões nem checklists dele. `docs/cat-game-scenario/README.md` é a
  iniciativa em andamento, executada uma fase por sessão e por commit, com gate
  de saída e commit sugerido por fase. Consulte o documento e o `git log` para
  ver a fase atual.
