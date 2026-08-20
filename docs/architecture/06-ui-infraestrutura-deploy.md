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

O backend produz cinco funções com responsabilidades isoladas:

```text
authorizer Lambda
signaling Lambda
chat Lambda
drawing Lambda
cost-guard Lambda
```

Terraform passa a consumir:

```text
../../apps/backend/dist/aws/authorizer.zip
../../apps/backend/dist/aws/signaling.zip
../../apps/backend/dist/aws/chat.zip
../../apps/backend/dist/aws/drawing.zip
../../apps/backend/dist/aws/cost-guard.zip
```

Os paths devem ser verificados a partir de `infra/terraform`.

## IAM

Substituir a role compartilhada por permissões proporcionais.

### Signaling

- DynamoDB da tabela/índice de conexões e vínculo de sessão;
- consumo atômico das quotas de `join`, `signal` e `turn`;
- `execute-api:ManageConnections`;
- CloudWatch Logs.

### Chat

- `execute-api:ManageConnections`;
- leitura da sessão e consumo atômico da quota de chat;
- CloudWatch Logs;
- sem S3.

### Drawing

- `execute-api:ManageConnections`;
- `s3:ListBucket`;
- `s3:PutObject`;
- leitura da sessão e consumo atômico das quotas de drawing;
- CloudWatch Logs.

### Authorizer

- criação da sessão no DynamoDB somente após validar Turnstile;
- CloudWatch Logs;
- sem acesso a Groq, S3 ou Twilio.

### Cost guard

- deduplicação do callback na tabela de segurança;
- publicação no tópico SNS;
- credenciais Twilio da conta principal somente para suspender a subconta;
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

### Pré-requisitos do Terraform

- Terraform 1.5 ou superior;
- credenciais AWS válidas para ler o backend S3 e os recursos gerenciados;
- `drawings_public_base_url`, `groq_api_key`, credenciais da subconta e da conta
  principal Twilio, `turnstile_secret_key` e `security_alert_email` fornecidos
  por mecanismo seguro;
- os cinco ZIPs em `apps/backend/dist/aws/`;
- revisão humana do plan antes de qualquer `apply`.

O procedimento por plataforma e a ordem de rollout estão no
[runbook de proteção de custo](../operations/public-api-cost-protection.md).

Arquivos `*.tfvars` são ignorados pelo Git, mas armazenam texto puro. Não
registrar valores na documentação, não usar `terraform fmt -diff` sobre um
arquivo com secrets e preferir um mecanismo seguro de injeção. Os valores
sensitive também podem existir no state; o backend deve permanecer criptografado
e com acesso restrito.

Para uma auditoria sem mutação remota:

```bash
terraform -chdir=infra/terraform init -input=false
terraform -chdir=infra/terraform fmt -check
terraform -chdir=infra/terraform validate
terraform -chdir=infra/terraform plan \
  -input=false \
  -lock=false \
  -detailed-exitcode
```

O `plan` com `-lock=false` não cria lock remoto. O código de saída é 0 quando
não há mudanças, 2 quando há mudanças a revisar e 1 quando ocorre erro. Um
futuro `apply` exige autorização explícita e um novo plan imediatamente antes
da execução.

### Revisão da sessão 6 da Fase 11

Revisão realizada em 2026-08-08 sobre o commit
`d3bf97ab57b8ca73c75f04b4e7f9c2453f220f01`.

| Verificação                 | Resultado                                                              |
| --------------------------- | ---------------------------------------------------------------------- |
| ZIPs das três Lambdas       | presentes nos paths esperados                                          |
| `terraform fmt -check`      | arquivos `.tf` formatados; `terraform.tfvars` local requer alinhamento |
| `terraform validate`        | configuração válida                                                    |
| `terraform plan`            | código 0, `No changes`                                                 |
| Criações/alterações         | nenhuma                                                                |
| Substituições/destruições   | nenhuma                                                                |
| `terraform apply`           | não executado                                                          |
| Deploy ou smoke de produção | não executados; são ações fora da sessão 6 e dependem de autorização   |

O provider AWS foi inicializado em diretório temporário para não alterar o
cache local. O plan foi executado com `-input=false`, `-lock=false`, sem
arquivo de saída e apenas com refresh de leitura do estado e dos recursos AWS.

#### Revisão manual

- signaling: `GetItem`, `Scan`, `PutItem` e `DeleteItem` limitados à tabela de
  conexões, além de `ManageConnections` e escrita no log da função;
- chat: somente `ManageConnections` e escrita no log da função, sem S3 ou
  DynamoDB;
- drawing: `ListBucket` limitado ao prefixo `gallery/`, `PutObject` limitado a
  `submissions/`, além de `ManageConnections` e escrita no log da função;
- logs: os três grupos são criados previamente e mantêm retenção de 90 dias;
- S3 de desenhos: acesso público direto bloqueado; leitura de `gallery/`
  permitida ao CloudFront somente quando a origem é a distribuição declarada;
- artefatos Lambda, rotas WebSocket, stage, buckets, tabela e distribuição não
  apresentam drift em relação ao código.

#### Pendências identificadas

O resultado `No changes` significa que código, state e recursos gerenciados
estão alinhados; não significa que a configuração seja portátil ou que recursos
fora do state tenham sido auditados.

- backend, bucket do site e CloudFront ainda contêm nomes, IDs, domínios e ARNs
  específicos da conta; `state_bucket` está declarado, mas não configura o
  backend;
- `.terraform.lock.hcl` está ignorado, portanto a seleção exata do provider não
  é reproduzida por um clone novo;
- o CORS do bucket de desenhos aceita qualquer origem e mais métodos que o
  fluxo atual de upload exige;
- as permissões de invocação do API Gateway usam `/*/*`, abrangendo todos os
  stages e routes da API;
- secrets locais precisam ser rotacionados se forem exibidos por ferramentas e
  nunca devem ser incluídos em logs ou documentação.

Essas pendências não geraram mudanças no plan e não foram corrigidas nesta
sessão, pois pertencem às sessões de configuração/IAM/S3 anteriores ou exigem
uma decisão operacional separada.

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
- [x] executar Terraform plan.

### Deploy

- [ ] atualizar paths web;
- [ ] remover dependência de diretório atual;
- [x] documentar pré-requisitos;
- [x] manter plan antes de apply;
- [ ] executar smoke em produção.
