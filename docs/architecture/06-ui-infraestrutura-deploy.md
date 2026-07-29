# UI, infraestrutura e deploy

## Pacote de UI

### Fronteira pública

Consumir:

```ts
import { Button } from '@fer-oshiro/ui'
```

e o CSS publicado pelo pacote.

Não consumir:

```text
packages/ui/src/*
```

O alias do Webpack para o source interno deve ser removido depois que o watch
do pacote funcionar de forma confiável.

### Desenvolvimento

O Turbo deve garantir que `ui` esteja compilado ou em watch antes/durante o
desenvolvimento dos remotes consumidores.

Preservar:

- atualização durante desenvolvimento;
- exports públicos;
- CSS gerado;
- Storybook.

### Escopo inicial do design system

Não migrar todos os estilos inline.

Priorizar elementos repetidos:

- botão;
- modal/panel;
- loading e erro;
- links sociais;
- campos;
- controles do drawing.

Posicionamento e materiais de Three.js continuam nas features.

## Configuração web

### Remotes

Centralizar no shell:

- nome do remote;
- URL local;
- URL de produção;
- fallback.

Não espalhar endereços entre componentes e routers.

### WebSocket

O `home` deve obter a URL WebSocket por configuração de build:

- local: `ws://localhost:8080`;
- produção: valor configurado/injetado.

Não manter a URL concreta do API Gateway dentro de uma feature.

## Lambdas

Continuar com:

```text
signaling Lambda
chat Lambda
drawing Lambda
```

Terraform passa a consumir:

```text
../../apps/backend/realtime/dist/aws/signaling.zip
../../apps/backend/realtime/dist/aws/chat.zip
../../apps/backend/realtime/dist/aws/drawing.zip
```

Os paths devem ser verificados a partir de `infra/terraform`.

## IAM

Substituir a role compartilhada por permissões proporcionais.

### Signaling

- DynamoDB da tabela de conexões;
- `execute-api:ManageConnections`;
- CloudWatch Logs.

### Chat

- `execute-api:ManageConnections`;
- CloudWatch Logs;
- sem S3 e DynamoDB, salvo necessidade real.

### Drawing

- `execute-api:ManageConnections`;
- `s3:ListBucket`;
- `s3:PutObject`;
- leitura necessária para gallery;
- CloudWatch Logs.

## Variáveis Terraform

Alinhar:

- bucket;
- região;
- tabela;
- URL pública;
- secrets.

O código não deve ignorar uma variável fornecida pelo Terraform em favor de
constante hardcoded.

## Deploy backend

Fluxo:

```bash
npm run check-types
npm test
npm run build
terraform -chdir=infra/terraform init
terraform -chdir=infra/terraform plan
terraform -chdir=infra/terraform apply
```

`apply` permanece explícito e nunca faz parte do build.

## Deploy web

Atualizar os paths:

```text
apps/web/shell/dist
apps/web/home/dist
apps/web/blog/dist
apps/web/resume/dist
```

O script deve:

- executar a partir da raiz;
- usar `set -euo pipefail`;
- não depender de `cd ..`;
- fazer build antes do sync;
- sincronizar cada artefato no prefixo correto;
- invalidar CloudFront depois de todos os syncs;
- receber profile e distribution por configuração ou argumento.

## Ordem de deploy

Para mudanças compatíveis:

1. backend;
2. remotes;
3. shell.

Para mudança incompatível de contrato:

1. backend compatível com versão antiga e nova;
2. remotes;
3. shell;
4. remoção da compatibilidade antiga em entrega posterior.

## Checklist

### UI

- [ ] parar de importar `packages/ui/src`;
- [ ] configurar build/watch;
- [ ] remover alias interno;
- [ ] validar CSS standalone;
- [ ] validar Storybook;
- [ ] extrair apenas padrões repetidos.

### Configuração

- [ ] centralizar URLs dos remotes;
- [ ] centralizar URL WebSocket;
- [ ] remover bucket/região/URLs hardcoded;
- [ ] validar variáveis obrigatórias.

### Infraestrutura

- [ ] atualizar paths dos ZIPs;
- [ ] separar IAM;
- [ ] alinhar envs;
- [ ] validar retenção de logs;
- [ ] revisar permissões S3;
- [ ] executar Terraform plan.

### Deploy

- [ ] atualizar paths web;
- [ ] remover dependência de diretório atual;
- [ ] documentar pré-requisitos;
- [ ] manter plan antes de apply;
- [ ] executar smoke em produção.
