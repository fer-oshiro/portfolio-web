# Contexto, princípios e arquitetura-alvo

## Objetivo

Este roadmap orienta uma reorganização gradual do portfólio.

Objetivos:

- manter Module Federation como parte intencional do estudo;
- isolar `shell`, `home`, `blog` e `resume`;
- separar aplicações web, backend e Storybook;
- ter um backend organizado por domínio, com entrypoints AWS e local;
- rodar localmente sem emulador de Lambda;
- continuar publicando três Lambdas independentes;
- organizar o `home` por domínio;
- desacoplar navegação, câmera, transições e efeitos;
- reduzir estado global e dependências implícitas;
- usar qualidade e documentação como apoio, sem burocracia rígida.

## Princípios

### Preservar antes de melhorar

Cada etapa deve preservar o comportamento existente antes de introduzir uma
melhoria.

Evitar no mesmo PR:

- mover diretórios;
- alterar comportamento;
- trocar estado;
- trocar build;
- alterar Terraform.

### Apps são executáveis; packages são reutilizáveis

- `apps` contém unidades que iniciam, compilam ou são publicadas;
- `packages` contém contratos e implementações reutilizadas;
- um package não importa `apps/*`;
- um microfrontend não importa o source de outro;
- features backend não conhecem Lambda, API Gateway ou SDK da AWS.

### Abstrações devem ser conquistadas

Uma feature começa simples:

```text
feature/
├── service.ts
├── ports.ts
├── types.ts
└── index.ts
```

Não criar `domain`, `application`, `infrastructure`, `repositories` e
`use-cases` sem responsabilidades reais para essas pastas.

### Mover sem apagar

Procedimento padrão:

1. criar ou mover o módulo;
2. preservar um reexport no caminho antigo, se necessário;
3. atualizar consumidores;
4. procurar imports antigos;
5. executar typecheck e build;
6. testar manualmente o fluxo afetado;
7. remover a compatibilidade antiga em outro commit, se possível.

## Situação inicial (Fase 0)

Esta era a estrutura registrada antes da execução do roadmap:

```text
apps/
├── shell/
├── home/
├── blog/
├── resume/
├── docs/
├── ws-api/
├── chat-api/
└── draw-api/

packages/
├── realtime-contract/
├── ui/
├── eslint-config/
└── typescript-config/

scripts/
└── local-server.ts
```

## Situação consolidada (Fase 12)

```text
apps/
├── web/
│   ├── shell/
│   ├── home/
│   ├── blog/
│   └── resume/
├── backend/
└── storybook/

packages/
├── realtime-contract/
├── ui/
├── eslint-config/
└── typescript-config/
```

Os workspaces backend antigos e os caminhos temporários de compatibilidade do
`home` foram removidos na Fase 12 depois da busca por consumidores. As
referências a eles nas seções de mapeamento abaixo registram a migração, não o
estado atual.

### O que deve ser preservado

- npm workspaces e Turbo;
- TypeScript estrito;
- contratos realtime validados com Zod;
- Module Federation;
- Terraform;
- três Lambdas por responsabilidade;
- experiência local já existente;
- design system e Storybook.

### Problemas estruturais registrados na Fase 0

- `apps/` mistura navegador, Lambda e tooling;
- endereços e configurações de remotes estão espalhados;
- Webpacks repetem muita configuração;
- `home` acessa o source de `packages/ui`;
- o servidor local importa source interno de três apps backend;
- providers WebSocket AWS estão duplicados;
- handlers misturam regra, configuração e SDK;
- realtime frontend usa estado mutável no escopo do módulo;
- câmera, localização e transição chamam setters cruzados;
- timers no store controlam comportamento visual;
- componentes acumulam UI, estado e integração;
- bucket, região e URLs aparecem hardcoded;
- desenvolvimento e deploy dependem de conhecimento implícito.

## Arquitetura-alvo

```text
apps/
├── web/
│   ├── shell/
│   ├── home/
│   ├── blog/
│   └── resume/
├── backend/
└── storybook/

packages/
├── realtime-contract/
├── ui/
├── eslint-config/
└── typescript-config/

infra/
├── terraform/
├── scripts/
└── docker-compose.yml

docs/
└── architecture/
```

Fluxo:

```text
Browser
└── Shell
    ├── Home
    │   └── WebSocket
    │       ├── entrypoint local ──► features ──► adapters locais
    │       └── API Gateway ───────► Lambdas ───► adapters AWS
    ├── Blog
    └── Resume
```

## Regra de dependência do backend

```text
entrypoints ──► features ──► contratos e tipos
     │              ▲
     └──► adapters ─┘
```

Proibido:

```text
feature ─X─► entrypoint
feature ─X─► evento Lambda
feature ─X─► process.env
package ─X─► apps/*
```

## Organização dos workspaces

Configuração desejada:

```json
{
  "workspaces": ["apps/web/*", "apps/backend", "apps/storybook", "packages/*"]
}
```

Os nomes npm devem ser preservados na primeira movimentação.

### Primeiro mapeamento

| Atual           | Destino inicial         |
| --------------- | ----------------------- |
| `apps/shell`    | `apps/web/shell`        |
| `apps/home`     | `apps/web/home`         |
| `apps/blog`     | `apps/web/blog`         |
| `apps/resume`   | `apps/web/resume`       |
| `apps/docs`     | `apps/storybook`        |
| `apps/ws-api`   | `apps/backend/ws-api`   |
| `apps/chat-api` | `apps/backend/chat-api` |
| `apps/draw-api` | `apps/backend/draw-api` |

Os três backends permanecem separados logo após esse movimento. A união em
`apps/backend` acontece somente depois que a nova taxonomia estiver
validada.

### Referências afetadas

- workspaces e lockfile;
- aliases dos Webpacks;
- paths do Terraform;
- script de deploy web;
- imports do servidor local;
- documentação;
- paths relativos de configs.

Imports internos de `src` tendem a permanecer iguais porque cada app será
movido como unidade.
