# Portfólio

## Giroscópio

O acesso ao giroscópio exige HTTPS. Para desenvolvimento:

```bash
npm run dev
ngrok config add-authtoken ...
ngrok http 3000
```

## Terraform

O Terraform exige versão 1.5 ou superior, credenciais AWS capazes de ler o
backend S3 e os recursos gerenciados e os seguintes valores locais:

- `drawings_public_base_url`;
- `groq_api_key`;
- `twilio_account_sid`;
- `twilio_auth_token`.

Não registre secrets no Git. `terraform.tfvars` é ignorado pelo repositório,
mas continua sendo um arquivo de texto local; prefira um mecanismo seguro para
fornecer os valores e evite comandos que imprimam seu conteúdo.

Para validar e revisar mudanças sem aplicá-las:

```bash
terraform -chdir=infra/terraform init -input=false
terraform -chdir=infra/terraform fmt -check
terraform -chdir=infra/terraform validate
terraform -chdir=infra/terraform plan \
  -input=false \
  -lock=false \
  -detailed-exitcode
```

Com `-detailed-exitcode`, código 0 significa nenhuma mudança, 2 significa que
há mudanças para revisar e 1 indica erro. `terraform apply` não faz parte do
build ou do deploy web e só deve ser executado após revisão do plan e
autorização explícita. O registro da última revisão está em
[`docs/architecture/06-ui-infraestrutura-deploy.md`](./docs/architecture/06-ui-infraestrutura-deploy.md#revisao-da-sessao-6-da-fase-11).

## Deploy web

O deploy web exige Node.js e npm nas versões declaradas no `package.json`, AWS
CLI configurada e credenciais com permissão para sincronizar os quatro prefixos
do bucket S3 e criar uma invalidação no CloudFront. O comando executa o build de
todos os workspaces antes de publicar.

Passe a configuração por argumentos:

```bash
direnv allow .

npm run deploy:web -- \
  --bucket nome-do-bucket \
  --distribution-id ID_DA_DISTRIBUICAO \
  --profile nome-do-profile
```

O profile é opcional quando a cadeia padrão de credenciais da AWS já está
configurada. Também é possível usar variáveis de ambiente; argumentos têm
precedência:

```bash
WEB_DEPLOY_BUCKET=nome-do-bucket \
CLOUDFRONT_DISTRIBUTION_ID=ID_DA_DISTRIBUICAO \
AWS_PROFILE=nome-do-profile \
npm run deploy:web
```

O script pode ser chamado de qualquer diretório porque resolve a raiz do
repositório a partir da própria localização. Ele publica, em ordem, `shell`,
`home`, `blog` e `resume`; a invalidação só é solicitada após todos os syncs
terminarem com sucesso. Para conferir opções sem build ou acesso à AWS:

```bash
npm run deploy:web -- --help
```
