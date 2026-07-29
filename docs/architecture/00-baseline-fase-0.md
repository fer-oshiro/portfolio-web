# Linha de base — Fase 0

Registro executado em 2026-07-29, antes das migrações do roadmap. Esta sessão
foi somente de inspeção, execução dos comandos existentes e documentação.
Nenhum problema encontrado foi corrigido.

## Estado de referência

- Commit atual: `d62dda97c39bde6c9d5f7c35a4f366955af3c59a`
  (`Merge pull request #12 from fer-oshiro/refactor/change-project-name`).
- Node.js: `v24.13.1`.
- npm: `11.8.0`.
- Turbo: `2.10.7`.
- Dependências já estavam instaladas.
- Antes da auditoria, `git status --short --untracked-files=all` mostrava
  somente `docs/` como conteúdo não rastreado:
  - `docs/architecture-roadmap.md`;
  - `docs/architecture/01-contexto-e-arquitetura.md` a
    `docs/architecture/09-decisoes-e-pronto.md`;
  - `docs/architecture/README.md`.
- Esses arquivos foram tratados como mudanças preexistentes do usuário e não
  foram alterados.

## Validações automáticas

Execute, a partir da raiz:

```bash
npm run format:check
npm run check-types
npm test
npm run lint
npm run build
```

| Comando                | Código | Resultado registrado                                         |
| ---------------------- | -----: | ------------------------------------------------------------ |
| `npm run format:check` |      0 | todos os arquivos verificados usam a formatação do Prettier  |
| `npm run check-types`  |      0 | 10 tarefas bem-sucedidas; 10 recuperadas do cache            |
| `npm test`             |      0 | 1 arquivo e 3 testes passaram; resultado recuperado do cache |
| `npm run lint`         |      0 | 9 tarefas bem-sucedidas; 54 warnings e nenhum erro           |
| `npm run build`        |      0 | 10 tarefas bem-sucedidas; 10 recuperadas do cache            |

O uso do cache é parte desta linha de base: os comandos não foram forçados com
`--force`.

### Warnings de lint conhecidos

| Workspace            | Warnings | Principais regras registradas                                     |
| -------------------- | -------: | ----------------------------------------------------------------- |
| `chat-api`           |        1 | `turbo/no-undeclared-env-vars`                                    |
| `ws-api`             |        6 | `turbo/no-undeclared-env-vars`                                    |
| `@fer-oshiro/shell`  |        5 | `@typescript-eslint/no-require-imports`                           |
| `@fer-oshiro/resume` |        5 | `@typescript-eslint/no-require-imports`                           |
| `@fer-oshiro/blog`   |        8 | hook condicional, imutabilidade e imports CommonJS                |
| `@fer-oshiro/home`   |       29 | pureza, imutabilidade, effects, dependências, variáveis e imports |

Arquivos e ocorrências relevantes:

- `apps/web/blog/src/components/Object.tsx`: `useTexture` condicional e mutação da
  textura retornada pelo hook;
- `apps/web/home/src/components/Board/Board.tsx`: `Math.random` durante render;
- `apps/web/home/src/components/WebSocket.tsx` e
  `apps/web/home/src/hooks/useGyro.ts`: atualização síncrona de estado em effect;
- `apps/web/home/src/pages/Home/Room.tsx`: mutação da textura retornada pelo hook;
- vários effects do `home`: dependências ausentes;
- variáveis de ambiente não declaradas no `turbo.json`;
- arquivos `webpack.config.js`: uso de `require()`.

### Warnings de build conhecidos

- `blog`: limite recomendado excedido por um GLB de 774 KiB e chunks de
  724 KiB e 1,55 MiB;
- `home`: limite recomendado excedido por chunks de 338 KiB, 724 KiB e
  1,52 MiB, uma imagem de 11 MiB e um MP3 de 7,08 MiB;
- Storybook/Vite: chunks minificados maiores que 500 kB;
- bundles backend reportados pelo esbuild: aproximadamente 9,6 MiB
  (`ws-api`), 1,8 MiB (`chat-api`) e 1,9 MiB (`draw-api`).

## Execução local e portas

Comandos atuais:

```bash
npm run dev
npm run dev:back
```

| Serviço                 | Porta | Resultado                                               |
| ----------------------- | ----: | ------------------------------------------------------- |
| shell                   |  3000 | iniciou e compilou                                      |
| home                    |  3001 | iniciou e compilou                                      |
| resume                  |  3002 | iniciou e compilou                                      |
| blog                    |  3003 | iniciou e compilou                                      |
| Storybook               |  6006 | iniciou                                                 |
| backend WebSocket atual |  8080 | iniciou                                                 |
| DynamoDB local opcional |  8000 | porta definida no Compose; não iniciado nesta auditoria |

O `npm run dev` também emite warning de depreciação para `turbo run dev
--parallel`.

A primeira tentativa de abrir portas dentro do sandbox falhou com `EPERM`.
Repetido fora do sandbox, o frontend iniciou normalmente. Ao final, todos os
processos temporários foram encerrados e as portas 3000–3003, 6006 e 8080
estavam fechadas.

## Smoke executado

Com o frontend em execução, retornaram HTTP 200:

- shell em `/` e `/blog` (incluindo o fallback de rota);
- `home`, `resume` e `blog` em modo standalone;
- `remoteEntry.js` dos três remotes;
- Storybook.

Com apenas o backend em execução, um handshake WebSocket e uma mensagem
inválida retornaram corretamente:

```json
{
  "type": "error",
  "source": "signaling",
  "code": "INVALID_MESSAGE",
  "message": "Mensagem WebSocket inválida."
}
```

No smoke integrado, o frontend conectou ao WebSocket e enviou
`get_drawings` e `join`. O tratamento de `get_drawings` tentou acessar AWS e
derrubou o processo filho com:

```text
CredentialsProviderError: Token is expired. To refresh this SSO session run
'aws sso login' with the corresponding profile.
```

A sessão AWS não foi renovada e o problema não foi corrigido.

Não foram testados:

- inspeção visual e interações 3D, câmera, hotspots, transições e overlay,
  pois a auditoria automatizada disponível foi limitada a HTTP e WebSocket;
- fluxo mobile, QR Code, WebRTC, giroscópio e reconexão, por exigirem dois
  dispositivos/contextos de navegador;
- chat, gallery, upload, presigned URL e TURN completos, por dependerem de
  providers externos e credenciais válidas;
- mouse/touch no drawing, por exigir interação de navegador;
- fallback provocado por indisponibilidade de remote, pois isso exigiria
  interromper seletivamente um serviço durante um teste visual;
- DynamoDB local, pois não é exigido pelo backend local atual e não foi
  necessário para os smokes básicos;
- Terraform `plan` e qualquer deploy, pois a Fase 0 pede confirmação dos
  paths, não mudanças ou operações externas.

## Variáveis registradas somente por nome

Arquivos locais e código:

- `AWS_PROFILE`;
- `AWS_REGION`;
- `AWS_DEFAULT_REGION`;
- `TABLE_NAME`;
- `GROQ_API_KEY`;
- `TWILIO_ACCOUNT_SID`;
- `TWILIO_AUTH_TOKEN`;
- `NODE_ENV`;
- `PORT`;
- `DYNAMODB_HOST`;
- `DYNAMODB_PORT`.

Variáveis declaradas pelo Terraform:

- `aws_region`;
- `groq_api_key`;
- `project_name`;
- `s3_bucket_name`;
- `state_bucket`;
- `twilio_account_sid`;
- `twilio_auth_token`.

Nenhum valor foi registrado.

## Lambdas e Terraform

O build confirmou três artefatos válidos:

| Artefato                               |         Tamanho | Entradas no ZIP |
| -------------------------------------- | --------------: | --------------: |
| `apps/backend/ws-api/dist/index.zip`   | 5.594.384 bytes |           2.977 |
| `apps/backend/chat-api/dist/index.zip` |   332.236 bytes |               1 |
| `apps/backend/draw-api/dist/index.zip` |   333.168 bytes |               1 |

`unzip -tq` não encontrou erro de integridade. O ZIP de `ws-api` contém, além
do bundle, arquivos previamente acumulados sob `node_modules` e outros
arquivos auxiliares; o script de build atualiza o ZIP existente sem limpá-lo.
Isso foi apenas registrado.

Partindo de `infra/terraform`, os três paths usados em `lambda.tf` existem:

```text
../../apps/backend/ws-api/dist/index.zip
../../apps/backend/chat-api/dist/index.zip
../../apps/backend/draw-api/dist/index.zip
```

Eles alimentam, respectivamente, `ws_handler`, `chat_handler` e
`draw_handler`.

## Pendências da linha de base

- 54 warnings de lint conhecidos;
- warnings de tamanho de bundles e assets;
- `npm run dev` usa a opção `--parallel` depreciada;
- backend local pode acessar providers AWS durante o fluxo integrado e cair
  quando a sessão SSO está expirada;
- ZIP de `ws-api` acumula 2.977 entradas;
- smokes manuais e dependentes de credenciais permanecem pendentes pelos
  motivos registrados acima.
