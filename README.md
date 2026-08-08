# Portfólio

## Giroscópio

O acesso ao giroscópio exige HTTPS. Para desenvolvimento:

```bash
npm run dev
ngrok config add-authtoken ...
ngrok http 3000
```

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
