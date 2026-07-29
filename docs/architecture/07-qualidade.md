# Estratégia leve de qualidade

## Objetivo

Proteger contratos e migrações importantes sem exigir cobertura alta ou um
processo rígido enquanto a aplicação ainda está evoluindo.

## Verificações automáticas

```bash
npm run format:check
npm run check-types
npm test
npm run lint
npm run build
```

## Lint

O lint atual retorna sucesso com warnings relevantes.

Evolução gradual:

1. registrar os warnings iniciais;
2. não corrigir tudo no mesmo PR;
3. evitar novos warnings na área modificada;
4. promover regras críticas futuramente:
   - hooks condicionais;
   - dependências de hooks;
   - envs não declaradas;
   - imports entre apps;
5. manter regras estilísticas como warning quando necessário.

## Testes prioritários

Sem meta de cobertura.

Adicionar quando surgirem unidades puras:

- realtime contract;
- navigation store;
- signaling service com repository fake;
- chat service com provider fake;
- drawing service com storage fake;
- configuração de adapters quando houver risco real.

Não priorizar agora:

- snapshots extensos;
- cobertura de componentes 3D;
- pixel-perfect;
- E2E completo;
- teste criado apenas porque um arquivo mudou de pasta.

## Smoke test

### Shell e remotes

- [ ] shell abre em `/`;
- [ ] home carrega pelo shell;
- [ ] home abre standalone;
- [ ] blog carrega pelo shell;
- [ ] blog abre standalone;
- [ ] resume carrega pelo shell;
- [ ] resume abre standalone;
- [ ] refresh de rota funciona;
- [ ] falha de remote apresenta fallback.

### Home

- [ ] quarto carrega;
- [ ] câmera chega à posição inicial;
- [ ] hotspots respondem;
- [ ] room → draw funciona;
- [ ] draw → room funciona;
- [ ] room → cat funciona;
- [ ] cat → room funciona;
- [ ] overlay termina;
- [ ] Leva continua acessível quando habilitado.

### Remote control

- [ ] QR Code possui room ID;
- [ ] mobile entra na sala;
- [ ] signaling troca offer/answer/candidates;
- [ ] DataChannel conecta;
- [ ] giroscópio atualiza cursor;
- [ ] desconexão não derruba a página;
- [ ] reconexão cria nova sessão válida.

### Chat

- [ ] mensagem é enviada;
- [ ] chunks aparecem;
- [ ] `chat_done` encerra loading;
- [ ] erro aparece na interface;
- [ ] provider local funciona sem secret.

### Drawing

- [ ] mouse funciona;
- [ ] touch funciona;
- [ ] cor e tamanho funcionam;
- [ ] undo funciona;
- [ ] limpar funciona;
- [ ] SVG local é enviado;
- [ ] presigned URL AWS funciona;
- [ ] gallery lista desenhos;
- [ ] erro encerra loading.

### Deploy

- [ ] três ZIPs são gerados;
- [ ] Terraform plan encontra os ZIPs;
- [ ] cada rota aponta para a Lambda correta;
- [ ] shell usa URLs de produção;
- [ ] assets usam prefixos corretos.

## Regra por fase

Cada fase deve escolher apenas os smoke tests relacionados à área modificada,
além de typecheck e build.

Não é necessário repetir manualmente toda a aplicação depois de uma alteração
puramente documental.

## Registro de problemas

Se uma validação falhar:

1. confirmar se a falha já existia;
2. registrar comando e mensagem;
3. não corrigir assunto fora do escopo automaticamente;
4. decidir se a fase pode continuar;
5. criar pendência separada quando apropriado.
