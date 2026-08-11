# Roadmap de execução e effort recomendado

## Como interpretar o effort

Os níveis abaixo são recomendações para configurar o reasoning effort da IA ao
executar cada fase.

Eles não substituem:

- escopo pequeno;
- contexto claro;
- revisão do diff;
- comandos de validação;
- smoke test humano.

A [orientação atual da OpenAI](https://developers.openai.com/api/docs/guides/latest-model)
usa `medium` como ponto inicial equilibrado, `low` para tarefas sensíveis a
latência, `high` ou `xhigh` quando houver ganho de qualidade, e reserva `max`
para os casos mais difíceis e orientados à qualidade. A tabela abaixo adapta
essa escala ao risco de cada fase deste projeto.

| Effort   | Perfil da tarefa                                     | Exemplos neste roadmap                      |
| -------- | ---------------------------------------------------- | ------------------------------------------- |
| `low`    | mecânica, localizada e fácil de validar              | documentação e limpeza final                |
| `medium` | vários arquivos, mas transformação previsível        | movimentos de diretório e feature           |
| `high`   | múltiplas fronteiras e decisões de implementação     | Module Federation, realtime e backend local |
| `xhigh`  | protocolo, concorrência, estado complexo ou produção | extração backend, transições e IAM/deploy   |

### Regra prática

- Comece no effort indicado.
- Aumente um nível se a fase tiver divergido do estado descrito.
- Se `xhigh` ainda parecer insuficiente, divida a tarefa em sessões menores em
  vez de usar uma execução longa e ampla.
- `max` não é recomendado como padrão para este roadmap. O principal risco
  aqui é escopo excessivo, não falta de raciocínio bruto.
- Use uma nova sessão quando mudar de fase ou de domínio importante.

### Contexto para fornecer à IA

Em toda execução, informe:

1. qual fase e subetapa será realizada;
2. que o comportamento deve ser preservado;
3. quais documentos arquiteturais se aplicam;
4. o que está fora do escopo;
5. quais comandos devem ser executados;
6. quais smoke tests devem ser realizados;
7. que arquivos antigos não devem ser apagados antes da busca de referências.

Template:

```text
Execute somente a Fase X, subetapa Y, descrita em
docs/architecture/08-roadmap-de-execucao.md.

Leia também:
- <guias relevantes>

Preserve o comportamento atual.
Não faça:
- <itens fora do escopo>

Antes de remover qualquer caminho antigo, procure todos os consumidores.
Ao final, rode:
- <comandos>

Informe:
- arquivos alterados;
- decisões tomadas;
- validações executadas;
- pendências deixadas.
```

---

## Fase 0 — Registrar a linha de base

**Effort recomendado:** `medium`

### Por que

Os comandos são simples, mas a IA precisa distinguir falhas anteriores de
regressões futuras e compreender os fluxos existentes.

### Escopo ideal da sessão

Uma única sessão somente de inspeção e documentação. Não corrigir problemas.

### Pré-condições

- repositório disponível;
- dependências instaladas;
- mudanças locais identificadas;
- secrets locais não serão expostos em logs ou documentação.

### Tarefas

- [x] executar `git status --short`;
- [x] registrar mudanças existentes que não pertencem à migração;
- [x] executar `npm run format:check`;
- [x] executar `npm run check-types`;
- [x] executar `npm test`;
- [x] executar `npm run lint`;
- [x] registrar warnings conhecidos sem corrigi-los;
- [x] executar `npm run build`;
- [x] iniciar frontend;
- [x] iniciar backend local atual;
- [x] registrar portas;
- [x] registrar variáveis por nome, nunca valor;
- [x] confirmar artefatos Lambda;
- [x] confirmar paths usados pelo Terraform;
- [x] executar smoke dos fluxos disponíveis;
- [x] registrar o que não pode ser testado e por quê.

### Não incluir

- correção de lint;
- movimentação de arquivos;
- alteração de package scripts;
- alteração de Terraform;
- novas features.

### Validação

Não há diff de código, exceto eventual atualização documental autorizada.

### Critério de saída

- baseline registrado;
- comandos reproduzíveis;
- problemas preexistentes identificados.

### Prompt sugerido

```text
Use effort medium. Execute somente a Fase 0 do roadmap.
Faça uma auditoria read-only e registre a linha de base.
Não corrija nenhum problema encontrado.
```

---

## Fase 1 — Reorganizar `apps/` por tipo

**Effort recomendado:** `medium`

### Por que

É uma mudança ampla, mas mecânica. O destino de cada diretório e as referências
afetadas já são conhecidos.

### Escopo ideal

Uma sessão para mover diretórios e uma segunda sessão curta para validar paths,
se o diff ficar grande.

### Pré-condições

- Fase 0 concluída;
- working tree entendida;
- builds atuais conhecidos;
- nenhuma refatoração comportamental pendente misturada.

### Tarefas

- [x] criar `apps/web`;
- [x] mover shell;
- [x] mover home;
- [x] mover blog;
- [x] mover resume;
- [x] criar `apps/tooling`;
- [x] mover docs/Storybook;
- [x] criar `apps/backend`;
- [x] mover ws-api;
- [x] mover chat-api;
- [x] mover draw-api;
- [x] atualizar workspaces;
- [x] regenerar lockfile com npm;
- [x] corrigir aliases Webpack;
- [x] corrigir paths Terraform;
- [x] corrigir deploy web;
- [x] corrigir imports do servidor local;
- [x] buscar todos os paths antigos;
- [x] preservar nomes npm;
- [x] preservar módulos federados;
- [x] preservar portas;
- [x] preservar outputs.

### Não incluir

- unir os backends;
- reorganizar `home/src`;
- alterar Module Federation;
- alterar estado;
- remover servidor local;
- mudar nomes dos packages.

### Validação

```bash
npm install
npm run format:check
npm run check-types
npm test
npm run lint
npm run build
```

Smoke:

- shell e três remotes;
- servidor local atual;
- Terraform plan encontra os ZIPs.

### Critério de saída

- nova taxonomia física;
- comportamento igual;
- busca pelos paths antigos sem ocorrências relevantes.

### Prompt sugerido

```text
Use effort medium. Execute somente a Fase 1.
Faça movimentos com git mv, preserve nomes de packages e comportamento.
Não una os backends nem reorganize o source interno.
```

---

## Fase 2 — Formalizar os contratos dos microfrontends

**Effort recomendado:** `high`

### Por que

Envolve router, providers, runtime compartilhado e dois modos de inicialização.
Erros podem aparecer apenas ao carregar pelo shell ou apenas no standalone.

### Divisão recomendada

Sessão 1:

- shell e boundaries.

Sessão 2:

- `home` remote/standalone.

Sessão 3:

- `blog` e `resume`;
- shared dependencies.

### Tarefas

- [x] criar `app/` em cada frontend;
- [x] separar raiz remota e standalone;
- [x] manter router superior no shell;
- [x] manter rotas internas em cada remote;
- [x] mover providers próprios;
- [x] centralizar declarações dos módulos;
- [x] centralizar configuração dos remotes;
- [x] substituir `...deps` por lista explícita;
- [x] compartilhar React, React DOM e React Router quando necessário;
- [x] adicionar loading boundary;
- [x] adicionar error boundary;
- [x] preservar módulos expostos;
- [x] validar estilos isolados;
- [x] documentar contrato público.

### Não incluir

- reorganização por domínio do `home`;
- troca da biblioteca de router;
- geração automática de tipos;
- compartilhamento prematuro de Three.js/Zustand;
- alteração visual.

### Validação

- build individual de cada remote;
- standalone de cada remote;
- carregamento pelo shell;
- refresh de rotas;
- remote indisponível não derruba shell.

### Critério de saída

- contrato público mínimo;
- dois modos por remote;
- nenhuma importação interna entre remotes.

### Prompt sugerido

```text
Use effort high. Execute apenas a subetapa <shell|home|blog-resume> da Fase 2.
Preserve os nomes home/Home, blog/Blog e resume/Resume.
Não mova features internas.
```

---

## Fase 3 — Consolidar o backend em um workspace

**Effort recomendado:** `high`

### Por que

Muda o grafo de workspaces, build e artefatos consumidos pelo Terraform, mas
ainda deve preservar a lógica existente.

### Divisão recomendada

Sessão 1:

- criar workspace e mover entrypoints sem apagar originais.

Sessão 2:

- build multi-entrypoint e ZIPs.

Sessão 3:

- Terraform e remoção dos workspaces antigos.

### Tarefas

- [x] criar `apps/backend/realtime`;
- [x] unificar dependências;
- [x] declarar `ws` e `dotenv`;
- [x] criar signaling entrypoint;
- [x] criar chat entrypoint;
- [x] criar drawing entrypoint;
- [x] preservar export `handler`;
- [x] criar build por entrypoint;
- [x] gerar três ZIPs;
- [x] atualizar Turbo;
- [x] atualizar Terraform;
- [x] confirmar hash dos artefatos;
- [x] procurar imports dos workspaces antigos;
- [x] remover workspaces antigos somente após validação.

### Não incluir

- extrair ports;
- reescrever handlers;
- alterar protocolo;
- criar backend local novo;
- separar IAM.

### Validação

- typecheck do workspace;
- três bundles;
- três ZIPs;
- Terraform plan;
- contratos realtime inalterados.

### Critério de saída

- um workspace;
- três entrypoints AWS;
- Terraform usa os novos artefatos.

### Prompt sugerido

```text
Use effort high. Execute somente a subetapa <workspace|build|terraform> da
Fase 3. Preserve integralmente o comportamento dos handlers.
```

---

## Fase 4 — Extrair features e adapters backend

**Effort recomendado:** `xhigh`

### Por que

É a fase de maior raciocínio backend. Ela altera fronteiras de domínio,
injeção de dependência, tratamento de erros e integração assíncrona sem poder
alterar o protocolo.

### Divisão obrigatória

Não executar toda a fase em uma sessão.

Sessões:

1. publisher compartilhado;
2. signaling ports e service;
3. signaling adapters AWS;
4. chat port, service e adapter;
5. drawing port, service e adapter;
6. simplificação dos entrypoints;
7. revisão de contratos e erros.

### Tarefas — transporte

- [x] definir `MessagePublisher`;
- [x] implementar API Gateway publisher;
- [x] remover providers duplicados;
- [x] manter validação de saída;
- [x] preservar comportamento de conexão stale.

### Tarefas — signaling

- [x] definir `ConnectionRepository`;
- [x] definir `TurnProvider`;
- [x] definir tipos internos;
- [x] mover join para service;
- [x] mover signal para service;
- [x] mover disconnect para service;
- [x] implementar DynamoDB repository;
- [x] implementar Twilio provider;
- [x] impedir service de importar AWS;
- [x] preservar validação de mesma sala.

### Tarefas — chat

- [x] definir `ChatProvider`;
- [x] mover prompt;
- [x] mover chunking;
- [x] implementar Groq provider;
- [x] preservar limite e schema da mensagem;
- [x] preservar `chat_done`;
- [x] preservar erro com source `chat`.

### Tarefas — drawing

- [x] definir `DrawingStorage`;
- [x] mover listagem;
- [x] mover criação de upload;
- [x] implementar S3 storage;
- [x] remover bucket hardcoded;
- [x] preservar formato de `drawings`;
- [x] preservar erro com source `draw`.

### Não incluir

- backend local;
- mudança de schema;
- mudança visual;
- unificação das Lambdas;
- framework de DI;
- framework de domínio.

### Validação

- testes pequenos com fakes;
- typecheck;
- build de três entrypoints;
- comparação das mensagens antes/depois;
- Terraform plan ainda válido.

### Critério de saída

- features não importam AWS;
- entrypoints pequenos;
- adapters implementam ports;
- protocolo preservado.

### Prompt sugerido

```text
Use effort xhigh. Execute somente <subetapa> da Fase 4.
Não altere realtime-contract nem outras features.
Antes de editar, mapeie o fluxo atual dessa operação.
Use adapters fake apenas para testes pequenos.
```

---

## Fase 5 — Criar o backend local definitivo

**Effort recomendado:** `high`

### Por que

Integra HTTP, WebSocket, memória, upload e providers locais, mas as interfaces
já estarão definidas pela Fase 4.

### Divisão recomendada

Sessão 1:

- HTTP/WebSocket e dispatcher.

Sessão 2:

- signaling local.

Sessão 3:

- chat e drawing locais.

Sessão 4:

- scripts Turbo e remoção do servidor antigo.

### Tarefas

- [x] criar entrypoint local;
- [x] criar HTTP server;
- [x] anexar WebSocket server;
- [x] implementar dispatcher;
- [x] implementar memory connection repository;
- [x] implementar local publisher;
- [x] criar fallback STUN;
- [x] criar chat previsível sem secret;
- [x] permitir Groq opcional;
- [x] criar upload SVG local;
- [x] servir SVG local;
- [x] manter schemas;
- [x] criar script `dev`;
- [x] criar `dev:web`;
- [x] criar `dev:back`;
- [x] criar `dev:docs`;
- [x] fazer `dev` iniciar portfólio completo;
- [x] excluir Storybook do comando principal;
- [x] remover servidor antigo depois do smoke.

### Não incluir

- persistência local sofisticada;
- autenticação;
- emulador AWS;
- mudança de protocolo;
- deploy.

### Validação

- duas conexões na mesma sala;
- signaling completo;
- DataChannel;
- chat sem secret;
- drawing sem S3;
- gallery local;
- reinício limpa memória;
- `npm run dev` inicia tudo.

### Critério de saída

Uma pessoa consegue testar o fluxo principal sem infraestrutura AWS local.

### Prompt sugerido

```text
Use effort high. Execute somente <subetapa> da Fase 5.
Use APIs nativas do Node e dependências já adotadas.
Não adicione serverless-offline, SAM ou persistência complexa.
```

---

## Fase 6 — Reorganizar o Home por domínio

**Effort recomendado:** `medium`

### Por que

O destino está documentado e a fase é principalmente mecânica. O risco vem do
número de imports e assets.

### Uma sessão por feature

Ordem:

1. drawing;
2. assistant;
3. gallery;
4. cat-game;
5. remote-control;
6. room;
7. scene-navigation.

### Procedimento por sessão

- [x] ler o mapa da feature;
- [x] listar consumidores;
- [x] mover arquivos;
- [x] mover assets exclusivos;
- [x] criar API pública;
- [x] atualizar imports;
- [x] preservar reexports necessários;
- [x] buscar paths antigos;
- [x] executar validações;
- [ ] fazer smoke da feature.

Pendência confirmada na Fase 12: o smoke visual individual das sete features
não possui registro completo.

### Não incluir

- refatorar lógica;
- alterar stores;
- reescrever componentes;
- mudar CSS;
- extrair design system;
- corrigir assuntos não relacionados.

### Validação

- typecheck;
- build do home;
- build do shell;
- smoke exclusivo da feature.

### Critério de saída

- código localizado por domínio;
- comportamento inalterado.

### Prompt sugerido

```text
Use effort medium. Mova somente a feature <nome> conforme a Fase 6.
Não refatore seu comportamento. Preserve reexports até confirmar todos os
consumidores.
```

---

## Fase 7 — Isolar o cliente realtime frontend

**Effort recomendado:** `high`

### Por que

Altera ciclo de vida, subscriptions, reconexão e vários consumidores.

### Divisão recomendada

Sessão 1:

- classe/objeto `RealtimeClient`.

Sessão 2:

- Context e camada de compatibilidade.

Sessão 3:

- consumidores de drawing/assistant/gallery.

Sessão 4:

- WebRTC e remoção de globals.

### Tarefas

- [x] criar cliente;
- [x] mover fila;
- [x] mover listeners;
- [x] mover ready state;
- [x] criar Context;
- [x] conectar ao montar;
- [x] limpar ao desmontar;
- [x] preservar hooks existentes;
- [x] migrar consumidores;
- [x] validar reconexão;
- [x] validar standalone;
- [x] remover mutáveis globais.

### Não incluir

- trocar biblioteca WebSocket;
- reescrever WebRTC;
- alterar protocolo;
- reorganizar navegação.

### Validação

- conexão inicial;
- fila antes de OPEN;
- reconexão;
- unsubscribe;
- desmontagem;
- remount;
- drawing, chat e signaling.

### Critério de saída

Cada provider possui uma instância e um ciclo de vida próprios.

### Prompt sugerido

```text
Use effort high. Execute somente <subetapa> da Fase 7.
Preserve a API pública dos hooks até todos os consumidores migrarem.
Não troque react-use-websocket.
```

---

## Fase 8 — Desacoplar navegação e transições

**Effort recomendado:** `xhigh`

### Por que

É uma migração de estado temporal. Envolve animações, render 3D, câmera e
possíveis eventos concorrentes.

### Divisão obrigatória

Sessão 1:

- modelar store e testes puros.

Sessão 2:

- adaptar brush.

Sessão 3:

- adaptar cat.

Sessão 4:

- separar camera controller.

Sessão 5:

- migrar hotspots e criar SceneController.

Sessão 6:

- remover stores/timers antigos.

### Tarefas

- [x] criar tipos;
- [x] criar estado inicial;
- [x] implementar `navigate`;
- [x] implementar `coverFinished`;
- [x] implementar `revealFinished`;
- [x] implementar cancelamento simples;
- [x] testar transições puras;
- [x] adaptar callbacks das animações;
- [x] trocar cena quando coberta;
- [x] mover configuração de câmera;
- [x] criar camera controller;
- [x] criar SceneController;
- [x] migrar hotspots;
- [x] bloquear navegação concorrente;
- [x] remover timers;
- [x] remover chamadas entre slices;
- [x] remover estado antigo somente após busca.

### Não incluir

- XState;
- nova animação;
- redesign;
- otimização prematura;
- remote control;
- mudança do modelo 3D.

### Validação

- room → draw → room;
- room → cat → room;
- clique repetido;
- clique durante transição;
- desktop;
- mobile;
- overlay sempre termina;
- câmera chega ao destino.

### Critério de saída

- estado descreve a fase;
- animação controla seu próprio tempo;
- store não usa timers;
- câmera não chama transição.

### Prompt sugerido

```text
Use effort xhigh. Execute apenas <subetapa> da Fase 8.
Modele e valide o estado antes de conectar à UI.
Não adicione biblioteca de máquina de estados.
```

---

## Fase 9 — Melhorar limites de estado e renderização

**Effort recomendado:** `high`

### Por que

Exige compreender frequência de atualização, seletores, Three.js e React para
não introduzir regressões visuais.

### Divisão recomendada

- sessão para stores por domínio;
- sessão para cursor/giroscópio;
- sessão para effects de sincronização.

### Tarefas

- [x] separar stores;
- [x] usar estado local;
- [x] adicionar seletores;
- [x] revisar cursor;
- [x] revisar giroscópio;
- [x] usar refs ou motion values;
- [x] remover estado derivado;
- [x] revisar effects;
- [ ] comparar renders/performance.

Pendência confirmada na Fase 12: existem testes de isolamento dos stores, mas
não há comparação documentada de renders ou medição de performance antes e
depois.

### Não incluir

- micro-otimização sem medição;
- troca de Zustand;
- redesign;
- refatoração backend.

### Validação

- comportamento visual;
- conexão remota;
- cursor responsivo;
- componentes não relacionados não renderizam a cada frame.

### Critério de saída

Dados de alta frequência não percorrem desnecessariamente toda a árvore React.

### Prompt sugerido

```text
Use effort high. Execute apenas <store|cursor-gyro|effects> da Fase 9.
Antes e depois, identifique quais componentes renderizam.
```

---

## Fase 10 — Consolidar UI e configuração web

**Effort recomendado:** `medium`

### Por que

As fronteiras já estarão claras; a maior parte é ajuste de exports, build/watch
e substituição gradual de componentes repetidos.

### Divisão recomendada

- sessão para package boundary;
- sessão para Turbo/watch;
- sessão para config de URLs;
- sessões opcionais por componente visual.

### Tarefas

- [x] remover imports do source de UI;
- [x] estabilizar exports;
- [x] configurar watch;
- [x] remover alias;
- [x] centralizar remotes;
- [x] centralizar WebSocket URL;
- [x] remover URLs concretas das features;
- [x] extrair padrões repetidos;
- [x] validar CSS isolado;
- [x] validar Storybook.

### Não incluir

- migração completa de estilos inline;
- nova biblioteca CSS;
- redesign;
- mudança de Module Federation.

### Validação

- home standalone;
- shell + home;
- Storybook;
- build limpo sem alias interno.

### Critério de saída

Consumers dependem apenas da API pública do package.

### Prompt sugerido

```text
Use effort medium. Execute somente <subetapa> da Fase 10.
Não migre estilos específicos da cena nem faça redesign.
```

---

## Fase 11 — Infraestrutura e deploy

**Effort recomendado:** `xhigh`

### Por que

Afeta permissões, secrets, artefatos e produção. Um erro pode impedir deploy ou
conceder acesso excessivo.

### Divisão obrigatória

Sessão 1:

- alinhar envs e paths.

Sessão 2:

- IAM signaling.

Sessão 3:

- IAM chat.

Sessão 4:

- IAM drawing.

Sessão 5:

- deploy web.

Sessão 6:

- revisão do Terraform plan e documentação.

### Tarefas

- [x] atualizar paths dos ZIPs;
- [x] alinhar nomes de env;
- [ ] remover hardcodes;
- [x] criar role/policy signaling;
- [x] criar role/policy chat;
- [x] criar role/policy drawing;
- [x] manter logs;
- [x] revisar S3;
- [x] atualizar script web;
- [x] remover `cd` implícito;
- [x] parametrizar profile/distribution;
- [x] documentar pré-requisitos;
- [x] executar plan;
- [x] revisar plan;
- [ ] aplicar apenas com autorização explícita;
- [ ] executar smoke em produção.

Pendências confirmadas na Fase 12: ainda existem nomes, IDs, domínios e ARNs
específicos da conta; nenhum `apply` autorizado nem smoke de produção foi
registrado.

### Não incluir

- `terraform apply` automático;
- alteração destrutiva sem revisão do plan;
- expansão ampla de permissões;
- secrets no repositório;
- framework de deploy.

### Validação

- build produz paths esperados;
- `terraform validate`;
- `terraform plan`;
- inspeção manual do IAM;
- deploy controlado;
- CloudWatch;
- rotas e frontend de produção.

### Critério de saída

- três Lambdas com permissões mínimas;
- build e Terraform alinhados;
- deploy reproduzível.

### Prompt sugerido

```text
Use effort xhigh. Execute somente <subetapa> da Fase 11.
Não execute terraform apply nem ações AWS mutáveis sem autorização explícita.
Apresente e revise o plan antes.
```

---

## Fase 12 — Limpeza e documentação final

**Effort recomendado:** `low`

### Por que

É uma fase mecânica depois que todas as substituições já foram validadas.

### Escopo ideal

Uma sessão para busca/limpeza e outra para documentação, se necessário.

### Tarefas

- [x] buscar paths antigos;
- [x] buscar reexports temporários;
- [x] confirmar consumidores;
- [x] remover diretórios vazios;
- [x] remover scripts substituídos;
- [x] remover configs duplicadas;
- [x] atualizar README;
- [x] atualizar árvores;
- [x] marcar fases concluídas;
- [x] registrar decisões;
- [x] preservar pendências não bloqueantes.

### Não incluir

- nova arquitetura;
- novas features;
- refatoração ampla;
- correções sem relação.

### Validação

- format;
- typecheck;
- testes;
- lint;
- build;
- smoke completo final.

### Critério de saída

- código e documentação correspondem;
- não há compatibilidade temporária sem justificativa.

### Registro de conclusão

Concluída em 2026-08-08. Foram removidos os três workspaces backend já
substituídos por `apps/backend`, os reexports temporários sem
consumidores do `home`, o alias temporário `CameraManager` e dois assets sem
referências. O script de deploy web e os caminhos ainda consumidos foram
preservados.

Validações executadas:

- `npm run format:check`;
- `npm run check-types`;
- `npm test` (92 testes);
- `npm run lint` (sem erros; warnings preexistentes preservados);
- `npm run build`;
- integridade dos três ZIPs e presença dos artefatos web/Storybook;
- `npm run deploy:web -- --help`;
- `terraform fmt -check` nos arquivos versionados e `terraform validate`.

O `terraform.tfvars` local e ignorado continua com a pendência de formatação já
registrada na Fase 11. Nenhum `plan`, `apply`, deploy ou smoke de produção foi
executado nesta fase.

### Prompt sugerido

```text
Use effort low. Execute a Fase 12.
Remova apenas caminhos comprovadamente sem consumidores.
Não introduza novas refatorações.
```

---

## Tabela resumida

| Fase | Tema                      | Effort   | Sessões recomendadas |
| ---- | ------------------------- | -------- | -------------------- |
| 0    | baseline                  | `medium` | 1                    |
| 1    | grupos de apps            | `medium` | 1–2                  |
| 2    | contratos MFE             | `high`   | 3                    |
| 3    | workspace backend         | `high`   | 3                    |
| 4    | features/adapters backend | `xhigh`  | 7                    |
| 5    | backend local             | `high`   | 4                    |
| 6    | Home por domínio          | `medium` | 7, uma por feature   |
| 7    | cliente realtime          | `high`   | 4                    |
| 8    | navegação/transições      | `xhigh`  | 6                    |
| 9    | estado/renderização       | `high`   | 3                    |
| 10   | UI/config web             | `medium` | 3–4                  |
| 11   | infraestrutura/deploy     | `xhigh`  | 6                    |
| 12   | limpeza/docs              | `low`    | 1–2                  |

## Ordem obrigatória e paralelismo possível

Dependências principais:

```text
0 → 1 → 2
      └→ 3 → 4 → 5
      └→ 6 → 7 → 8 → 9 → 10
3 → 4 → 11
2 → 10
5 + 10 + 11 → 12
```

Depois da Fase 1:

- microfrontends e consolidação backend podem avançar em branches diferentes;
- dentro do `home`, a movimentação por domínio deve ocorrer antes da
  refatoração de realtime e transições;
- infraestrutura deve esperar o formato final dos artefatos backend;
- limpeza final espera todas as frentes.

## Quando interromper uma sessão da IA

Interromper e revisar quando:

- o diff ultrapassar o domínio escolhido;
- surgir alteração não planejada de contrato;
- uma validação preexistente começar a falhar de forma diferente;
- a IA propuser apagar antes de buscar referências;
- Terraform mostrar remoção/substituição inesperada;
- o remote só funcionar pelo shell ou só standalone;
- uma fase exigir decisão listada como aberta;
- o working tree contiver mudanças desconhecidas na mesma área.
