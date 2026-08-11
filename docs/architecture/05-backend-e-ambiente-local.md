# Backend unificado e desenvolvimento local

## Objetivo

Substituir três workspaces backend e um script acoplado por um workspace com:

- três entrypoints AWS;
- um entrypoint local;
- features compartilhadas;
- adapters diferentes por ambiente.

Uma aplicação backend continuará produzindo três Lambdas.

## Estrutura-alvo

```text
apps/backend/
├── package.json
├── tsconfig.json
├── scripts/
│   └── build.mjs
└── src/
    ├── features/
    │   ├── signaling/
    │   │   ├── service.ts
    │   │   ├── ports.ts
    │   │   ├── types.ts
    │   │   └── index.ts
    │   ├── chat/
    │   │   ├── service.ts
    │   │   ├── ports.ts
    │   │   ├── prompt.ts
    │   │   └── index.ts
    │   └── drawing/
    │       ├── service.ts
    │       ├── ports.ts
    │       └── index.ts
    ├── adapters/
    │   ├── aws/
    │   │   ├── api-gateway-publisher.ts
    │   │   ├── dynamodb-connections.ts
    │   │   ├── groq-chat.ts
    │   │   ├── s3-drawings.ts
    │   │   └── twilio-turn.ts
    │   └── local/
    │       ├── local-websocket-publisher.ts
    │       ├── memory-connections.ts
    │       ├── local-chat.ts
    │       ├── local-drawings.ts
    │       └── local-turn.ts
    ├── entrypoints/
    │   ├── aws/
    │   │   ├── signaling.ts
    │   │   ├── chat.ts
    │   │   └── drawing.ts
    │   └── local.ts
    └── config/
        ├── env.ts
        └── types.ts
```

Não criar pastas vazias.

## Ports

### Signaling

```ts
interface ConnectionRepository {
  save(connection: Connection): Promise<void>
  remove(connectionId: string): Promise<void>
  findById(connectionId: string): Promise<Connection | null>
  findByRoom(roomId: string): Promise<Connection[]>
}

interface TurnProvider {
  getIceServers(): Promise<IceServer[]>
}

interface MessagePublisher {
  send(connectionId: string, message: ServerMessage): Promise<void>
}
```

### Chat

```ts
interface ChatProvider {
  stream(message: string): AsyncIterable<string>
}
```

O service de chat controla chunking e usa `MessagePublisher`.

### Drawing

```ts
interface DrawingStorage {
  list(): Promise<Drawing[]>
  createUpload(name: string): Promise<{ url: string }>
}
```

O contrato pode evoluir para suportar o upload local, mas as mensagens enviadas
ao frontend continuam compatíveis com `realtime-contract`.

## Features

Features:

- recebem dados tipados;
- orquestram a operação;
- dependem de ports e contratos;
- não recebem evento Lambda;
- não criam clientes AWS;
- não leem `process.env`;
- não conhecem a URL do API Gateway.

## Adapters AWS

- API Gateway publisher: envia mensagens à conexão;
- DynamoDB: persiste e busca conexões;
- Twilio: fornece TURN/ICE;
- Groq: faz streaming do chat;
- S3: lista desenhos e cria presigned URLs.

Clientes externos devem ser criados uma vez por processo e injetados.

## Entrypoints AWS

Cada entrypoint:

1. recebe o evento;
2. obtém route e connection ID;
3. faz parsing JSON;
4. valida com Zod;
5. seleciona a feature;
6. chama o service;
7. traduz erros para mensagem realtime;
8. retorna status.

## Mapeamento da migração

As origens desta tabela são históricas. Os três workspaces antigos foram
removidos na Fase 12 depois que build, Terraform e buscas de referência
confirmaram `apps/backend` como único consumidor ativo.

| Origem                         | Destino                                  |
| ------------------------------ | ---------------------------------------- |
| `ws-api/src/index.ts`          | signaling service, adapters e entrypoint |
| `ws-api/src/twilio.ts`         | `twilio-turn.ts`                         |
| `chat-api/src/index.ts`        | chat service, prompt, Groq e entrypoint  |
| `draw-api/src/index.ts`        | drawing service, S3 e entrypoint         |
| providers WebSocket duplicados | `api-gateway-publisher.ts`               |
| `scripts/local-server.ts`      | entrypoint local e adapters locais       |
| `scripts/websocket/*`          | publisher local                          |

## Build

Saída:

```text
apps/backend/dist/aws/
├── signaling/
│   └── index.js
├── chat/
│   └── index.js
├── drawing/
│   └── index.js
├── signaling.zip
├── chat.zip
└── drawing.zip
```

Manter esbuild e ZIP independente por entrypoint.

O build:

- limpa somente o próprio `dist`;
- cria três bundles;
- cria três ZIPs;
- falha se qualquer etapa falhar.

Não adicionar framework de deploy.

## Desenvolvimento local

### Resultado

```bash
npm run dev
```

deve iniciar:

- shell;
- home;
- blog;
- resume;
- backend local.

Storybook usa comando separado.

### Tecnologias

- `node:http`;
- `ws`;
- `tsx watch`;
- memória;
- as mesmas features das Lambdas.

Não usar:

- API Gateway local;
- Lambda local;
- DynamoDB obrigatório;
- `serverless-offline`;
- SAM Local.

### Connections

```text
MemoryConnectionRepository
└── Map<connectionId, Connection>
```

Dados desaparecem ao reiniciar.

### TURN

- padrão local usa STUN;
- Twilio pode ser habilitado quando houver credenciais;
- falha do Twilio não impede o desenvolvimento local.

### Chat

- com `GROQ_API_KEY`, adapter real pode ser usado;
- sem chave, provider local envia chunks previsíveis.

### Drawing

Opção inicial:

- HTTP e WebSocket na porta `8080`;
- `PUT` recebe SVG;
- SVG fica em memória;
- `GET` serve SVG;
- gallery recebe URLs locais;
- reiniciar limpa os dados.

Isso usa APIs nativas do Node.

### Dispatcher local

Aceitar:

```text
join
signal
chat
get_drawings
save_drawing
```

Fluxo:

1. validar mensagem;
2. selecionar feature;
3. fornecer adapters locais;
4. validar mensagem de saída;
5. publicar ao cliente.

### Scripts

Workspace backend:

```json
{
  "scripts": {
    "dev": "tsx watch src/entrypoints/local.ts",
    "build": "node scripts/build.mjs",
    "check-types": "tsc --noEmit",
    "lint": "eslint ."
  }
}
```

Raiz:

```text
dev       frontend + backend local
dev:web   somente microfrontends
dev:back  somente backend
dev:docs  Storybook
```

Os filtros do Turbo devem usar os nomes reais dos workspaces.

`ws` e `dotenv` devem ser dependências diretas do backend, pois já são usados
pelo servidor atual.

## Configuração

Somente `config/env.ts` lê `process.env`.

```ts
type BackendConfig = {
  mode: 'local' | 'aws'
  awsRegion: string
  tableName?: string
  drawingsBucket?: string
  drawingsPublicBaseUrl?: string
  groqApiKey?: string
  twilioAccountSid?: string
  twilioAuthToken?: string
}
```

Regras:

- AWS falha cedo quando variável obrigatória estiver ausente;
- local permite secrets opcionais;
- mensagens citam o nome, nunca o valor;
- secrets não entram em frontend;
- `.env` continua ignorado.

| Variável                   | Local                | AWS                       |
| -------------------------- | -------------------- | ------------------------- |
| `PORT`                     | padrão 8080          | não usada                 |
| `AWS_REGION`               | opcional             | obrigatória               |
| `TABLE_NAME`               | não usada em memória | obrigatória               |
| `DRAWINGS_BUCKET`          | não usada em memória | obrigatória               |
| `DRAWINGS_PUBLIC_BASE_URL` | URL local            | obrigatória               |
| `GROQ_API_KEY`             | opcional             | necessária para chat real |
| `TWILIO_ACCOUNT_SID`       | opcional             | necessária para TURN real |
| `TWILIO_AUTH_TOKEN`        | opcional             | necessária para TURN real |

## Critério de conclusão

- um workspace backend;
- três ZIPs;
- quatro entrypoints;
- features independentes de AWS;
- local funciona sem emulador;
- frontend usa o mesmo protocolo nos dois ambientes;
- Terraform encontra os artefatos.
