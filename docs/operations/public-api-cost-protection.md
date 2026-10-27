# Proteção de custo das APIs públicas

Este runbook cobre as alterações manuais necessárias em Cloudflare, Groq,
Twilio e AWS para ativar a proteção implementada no repositório. O código cria
as proteções, mas esta sessão **não** executa `terraform apply`, deploy web nem
altera contas externas.

## Resultado esperado

- cada conexão WebSocket apresenta um token Cloudflare Turnstile novo;
- o authorizer valida o token, `hostname` e `action` no servidor e cria uma
  sessão anônima de duas horas ligada ao `connectionId`;
- quotas atômicas por sessão e por dia UTC impedem que concorrência ultrapasse
  os limites antes de Groq, Twilio ou S3 serem chamados;
- as Lambdas possuem concorrência reservada e API Gateway mantém throttles por
  rota;
- Groq limita cada resposta a 300 tokens;
- credenciais TURN duram 10 minutos e só são emitidas uma vez por sessão;
- upload usa Presigned POST de cinco minutos, limitado a SVG e 1 MB pela policy
  do próprio S3;
- AWS envia alarmes por SNS e acompanha um budget mensal de US$ 10;
- um Usage Trigger diário de US$ 2 suspende automaticamente a subconta Twilio.

### Quotas padrão

| Ação           | Por sessão | Global por dia UTC |
| -------------- | ---------: | -----------------: |
| Total          |        300 |              5.000 |
| Chat/Groq      |         10 |                100 |
| Listar galeria |         30 |              5.000 |
| Join           |          6 |              5.000 |
| Upload         |          3 |                 20 |
| Signaling      |        200 |              5.000 |
| TURN           |          1 |                 10 |
| Novas sessões  |          — |                500 |

Esses valores ficam em `security_quotas` no Terraform. A quota de `signal`
conta somente SDP e candidatos ICE enviados pelo WebSocket. O limite de novas
sessões fica em `security_max_daily_sessions`.

O heartbeat (`ping`, enviado após 3 minutos sem tráfego) não consome quota: a
Lambda de signaling responde `pong` e a rota fica limitada só pelo throttle do
API Gateway. Ele evita o idle timeout de 10 minutos do API Gateway, que fazia
cada aba ociosa reconectar e abrir uma sessão nova.

## Giroscópio e capacidade

O giroscópio não passa pelo API Gateway depois que o WebRTC conecta. Os dados
são enviados pelo WebRTC DataChannel e, quando necessário, encaminhados pelo
relay TURN. Portanto, 30 mensagens por segundo não consomem a quota de 200
`signal` nem enfrentam o throttle WebSocket de 5 req/s.

Hoje o frontend limita o envio a um evento a cada 60 ms, aproximadamente
16,7 mensagens/s. Para chegar a 30 mensagens/s seria necessário reduzir esse
intervalo para cerca de 33 ms e medir perda/latência no celular. Isso é uma
decisão de fluidez, não de quota da API pública.

## 1. Cloudflare Turnstile

1. Abra **Cloudflare Dashboard → Turnstile → Add widget**.
2. Use um nome como `portfolio-prod`, modo **Managed** e autorize o hostname
   `fer-oshiro.com`.
3. Guarde o **site key** para o build web e o **secret key** para a Lambda.
4. No deploy web, forneça o site key sem tratá-lo como segredo:

   ```bash
   TURNSTILE_SITE_KEY='site-key' npm run deploy:web -- \
     --bucket nome-do-bucket \
     --distribution-id ID_DA_DISTRIBUICAO
   ```

5. Forneça o secret ao Terraform por um cofre/variável de CI:

   ```bash
   export TF_VAR_turnstile_secret_key='secret-key'
   export TF_VAR_turnstile_hostname='fer-oshiro.com'
   ```

O backend usa Siteverify e falha fechado se a Cloudflare estiver indisponível,
se a `action` não for `realtime-connect` ou se o hostname divergir. Tokens
Turnstile expiram em cinco minutos e são de uso único, por isso o frontend pede
outro token a cada reconexão. Consulte a
[validação server-side oficial](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

Em desenvolvimento local, deixe `TURNSTILE_SITE_KEY` vazio e use o backend
local. Não aponte um frontend local sem desafio para o WebSocket de produção.

## 2. Groq

1. Use uma organização dedicada ao portfólio; assim o cap não afeta outras
   aplicações.
2. Crie o projeto `portfolio-prod`, selecione-o e gere uma chave exclusiva.
3. Em **Manage Projects → View → Rate limits**, aplique limites conservadores
   ao modelo `openai/gpt-oss-20b`. Se todos os campos estiverem disponíveis,
   comece com 10 RPM e 100 RPD; nunca aumente os limites da organização para
   acomodar este projeto.
4. Passe a chave nova em `TF_VAR_groq_api_key` e revogue a chave antiga depois
   do smoke test.
5. Em **Settings → Billing → Limits**, configure o spend limit mensal em
   **US$ 5** e alertas em **US$ 2,50**, **US$ 3,75** e **US$ 4,50**. Confirme
   também os emails de billing.

Os limites de projeto são mais restritivos que os da organização, conforme a
[documentação de Projects](https://console.groq.com/docs/projects). O spend
limit é o corte financeiro principal, mas a contabilização pode atrasar de
10 a 15 minutos; veja [Spend Limits](https://console.groq.com/docs/spend-limits).
As quotas do DynamoDB e a concorrência reservada reduzem esse intervalo de
exposição.

## 3. Twilio

### Criar e usar uma subconta dedicada

1. Na conta principal Twilio, crie uma subconta chamada `portfolio-prod`.
2. Use o SID e Auth Token **da subconta** nas variáveis já existentes:

   ```bash
   export TF_VAR_twilio_account_sid='SID-da-subconta'
   export TF_VAR_twilio_auth_token='token-da-subconta'
   ```

3. Forneça também credenciais da conta principal somente ao circuit breaker:

   ```bash
   export TF_VAR_twilio_parent_account_sid='SID-da-conta-principal'
   export TF_VAR_twilio_parent_auth_token='token-da-conta-principal'
   ```

A Lambda de signaling cria os tokens Network Traversal usando a subconta. A
Lambda de proteção usa a conta principal apenas para mudar o status dessa
subconta para `suspended`; ela não suspende a conta principal.

### Criar os Usage Triggers

Depois do `terraform apply`, obtenha a callback exata:

```bash
terraform -chdir=infra/terraform output -raw twilio_usage_trigger_webhook_url
```

Crie os dois triggers **dentro da subconta**, ambos com método `POST` e a URL
acima:

| Uso          | Trigger by | Recorrência | Valor | Ação do código               |
| ------------ | ---------- | ----------- | ----: | ---------------------------- |
| `totalprice` | `price`    | `daily`     | US$ 2 | suspende a subconta e alerta |
| `totalprice` | `price`    | `monthly`   | US$ 5 | somente alerta               |

O endpoint valida `X-Twilio-Signature`, SID, categoria, recorrência, limite e
`IdempotencyToken`. A Twilio pode repetir callbacks; o token é persistido no
DynamoDB para que o efeito ocorra uma vez. A lista oficial de parâmetros e o
comportamento de retries estão em
[UsageTrigger callbacks](https://www.twilio.com/docs/usage/api/usage-trigger#usagetrigger-callbacks).

Não reative automaticamente a subconta. Depois de uma suspensão, investigue o
uso, rotacione credenciais se necessário e só então reative manualmente pela
conta principal.

## 4. AWS

### Antes do apply

1. Em **Billing and Cost Management → Cost allocation tags**, ative a tag
   definida pelo usuário `Project`. O valor usado pelo stack é `portfolio` por
   padrão. A ativação pode levar até 24 horas e, em AWS Organizations, pode
   exigir a conta de gerenciamento. Consulte
   [User-defined cost allocation tags](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/custom-tags.html).
2. Defina o email que receberá SNS, sem registrar o valor no Git:

   ```bash
   export TF_VAR_security_alert_email='email-de-alertas'
   ```

3. Além das variáveis já citadas, forneça
   `TF_VAR_drawings_public_base_url`. O budget padrão é US$ 10 e pode ser
   alterado com `TF_VAR_aws_monthly_budget_usd`.
4. Gere os cinco ZIPs antes do plan:

   ```bash
   npm run build --workspace @fer-oshiro/backend
   ```

5. Valide e revise sem aplicar:

   ```bash
   terraform -chdir=infra/terraform init -input=false
   terraform -chdir=infra/terraform fmt -check
   terraform -chdir=infra/terraform validate
   terraform -chdir=infra/terraform plan \
     -input=false \
     -lock=false \
     -detailed-exitcode
   ```

O plan deve mostrar, entre outras mudanças, duas Lambdas novas (`authorizer` e
`cost-guard`), tabela de segurança, GSI `roomId-index`, TTLs, authorizer no
`$connect`, quotas, concorrência reservada, SNS, alarmes e AWS Budget. Revise
qualquer substituição ou destruição antes de autorizar um apply.

### Depois do apply

1. Confirme o email enviado pela assinatura SNS; sem essa confirmação os
   alarmes não chegam.
2. Confirme que o budget `portfolio-monthly` filtra `Project=portfolio`. Como a
   conta AWS é compartilhada, esse budget é de alerta e depende de tagging; ele
   não é um hard cap nem desliga recursos automaticamente.
3. Configure os Usage Triggers Twilio com o output criado.
4. Verifique no CloudWatch os alarmes de erros, throttles, quotas rejeitadas e
   pico de desafios negados.
5. Mantenha o backend S3 do Terraform criptografado e restrito: variáveis
   `sensitive` ainda podem existir no state.

## 5. Ordem segura de rollout

1. Crie o widget Turnstile, a organização/projeto/chave Groq e a subconta
   Twilio; ainda não crie os Usage Triggers.
2. Publique primeiro o frontend com `TURNSTILE_SITE_KEY`. A query `challenge`
   é ignorada pelo API Gateway antigo, e o frontend mantém leitura temporária
   de `upload_url`, então esse passo é compatível com o backend atual.
3. Gere os cinco ZIPs, faça `terraform plan`, revise e só então execute um
   `terraform apply` explicitamente autorizado.
4. Confirme a assinatura SNS.
5. Crie os dois Usage Triggers Twilio usando o output do Terraform.
6. Faça o smoke test abaixo e então revogue as credenciais antigas.

## Smoke test

- abrir o desktop em `https://fer-oshiro.com` e conectar o celular pelo QR;
- confirmar `join`, offer/answer e ICE sem erro de sessão;
- ativar o giroscópio por alguns minutos e confirmar que não aparecem requests
  `signal` contínuos no WebSocket;
- enviar uma pergunta ao chat e receber `chat_done`;
- enviar um desenho SVG e confirmar um `POST` para S3 e objeto menor que 1 MB;
- confirmar que uma conexão sem `challenge` recebe negação no `$connect`;
- conferir logs sem token Turnstile, query string, Auth Tokens ou API keys;
- verificar SNS confirmado, alarmes em `OK` e budget visível;
- confirmar os dois Usage Triggers ativos na **subconta**, não na conta mãe.

## Resposta a incidentes

- **Groq bloqueado:** o frontend recebe erro genérico; revise o dashboard antes
  de aumentar/remover o cap.
- **Twilio suspensa:** investigue o Usage Record e mantenha a subconta parada;
  a experiência pode usar STUN quando a rede dos pares permitir.
- **Quota diária atingida:** confirme o alarme e o item `day#AAAA-MM-DD` na
  tabela de segurança; não edite o contador durante um ataque.
- **Turnstile indisponível:** novas conexões falham fechado. A sessão WebSocket
  já aberta continua até desconectar ou expirar.
- **Upload negado:** confira tamanho, `Content-Type=image/svg+xml`, validade de
  cinco minutos e todos os fields assinados do formulário.
