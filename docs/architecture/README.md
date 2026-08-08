# Arquitetura e roadmap

Este diretório divide a evolução arquitetural do portfólio em guias menores.
Comece pela visão geral e use o roadmap de execução como checklist.

## Ordem de leitura

1. [Contexto, princípios e arquitetura-alvo](./01-contexto-e-arquitetura.md)
2. [Isolamento dos microfrontends](./02-microfrontends.md)
3. [Organização interna do Home](./03-home-por-dominio.md)
4. [Navegação, estado e realtime no frontend](./04-navegacao-estado-realtime.md)
5. [Backend unificado e desenvolvimento local](./05-backend-e-ambiente-local.md)
6. [UI, infraestrutura e deploy](./06-ui-infraestrutura-deploy.md)
7. [Estratégia leve de qualidade](./07-qualidade.md)
8. [Roadmap de execução e effort recomendado](./08-roadmap-de-execucao.md)
9. [Decisões em aberto e definição de pronto](./09-decisoes-e-pronto.md)

## Visão rápida

```text
apps/
├── web/
│   ├── shell/
│   ├── home/
│   ├── blog/
│   └── resume/
├── backend/
│   └── realtime/
└── tooling/
    └── docs/

packages/
├── realtime-contract/
├── ui/
├── eslint-config/
└── typescript-config/
```

Direção das dependências:

```text
Shell ──► contratos públicos dos remotes
Remote ──► packages públicos

Backend entrypoints ──► features ──► contratos
        adapters ─────► features
```

Dependências proibidas:

```text
remote ─X─► source de outro remote
feature backend ─X─► AWS/Lambda
package ─X─► apps/*
shell ─X─► stores e componentes internos dos remotes
```

## Como usar os checklists

- Execute uma fase por vez.
- Prefira um PR por fase.
- Para fases grandes, execute um subitem por sessão da IA.
- Não combine movimentação de arquivos com alteração de comportamento.
- Só remova o caminho antigo depois de procurar referências e validar o novo.
- Atualize os checkboxes e decisões conforme o projeto evoluir.

## Escala de effort

Os rótulos no roadmap são recomendações iniciais para o nível de raciocínio da
IA, não garantias de resultado.

| Effort   | Usar quando                                                               |
| -------- | ------------------------------------------------------------------------- |
| `low`    | documentação, busca de referências e limpeza mecânica de baixo risco      |
| `medium` | movimentação ampla com destino conhecido e validações objetivas           |
| `high`   | refatoração entre múltiplas fronteiras, estado ou integração              |
| `xhigh`  | concorrência, protocolo, infraestrutura, IAM ou migração com alto impacto |

Se uma tarefa começar a misturar mais de uma responsabilidade, divida-a antes
de aumentar o effort.

## Status após a Fase 12

| Fases | Status                   | Observação                                                                                                      |
| ----- | ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 0–1   | concluídas               | baseline registrada e workspaces agrupados por tipo                                                             |
| 2     | parcial                  | contratos, modos standalone/remote e boundaries existem; compartilhamento explícito no shell permanece pendente |
| 3–10  | concluídas               | backend consolidado, ambiente local, Home por domínio, estado/realtime e UI/configuração migrados               |
| 11    | concluída no repositório | `apply` e smoke de produção permanecem ações operacionais dependentes de autorização                            |
| 12    | concluída                | paths sem consumidores removidos, documentação alinhada e validação local executada                             |

As pendências técnicas e operacionais continuam registradas em
[Decisões em aberto e definição de pronto](./09-decisoes-e-pronto.md) e na
[revisão da Fase 11](./06-ui-infraestrutura-deploy.md#revisao-da-sessao-6-da-fase-11).
