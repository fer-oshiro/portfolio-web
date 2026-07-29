# Isolamento dos microfrontends

## Objetivo

Manter Module Federation como ferramenta de estudo, mas fazer com que as
fronteiras existam também no código, no build e no desenvolvimento local.

## Responsabilidade do shell

O shell possui:

- router superior;
- layout comum, se existir;
- carregamento dos remotes;
- loading boundary;
- error boundary por remote;
- registro de endereços dos remotes;
- fallback quando um remote estiver indisponível.

O shell não conhece:

- stores do `home`;
- WebSocket ou WebRTC;
- componentes internos;
- câmera e Three.js;
- assets;
- detalhes das rotas internas.

Estrutura sugerida:

```text
apps/web/shell/src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── remote-boundary.tsx
├── config/
│   └── remotes.ts
├── types/
│   └── remote-modules.d.ts
├── index.tsx
├── index.css
└── index.html
```

## Dois modos por remote

Cada remote terá:

1. uma raiz exposta pelo Module Federation;
2. um bootstrap standalone.

Exemplo:

```text
apps/web/home/src/app/
├── HomeRemote.tsx
├── HomeStandalone.tsx
├── providers.tsx
└── router.tsx
```

Regras:

- `HomeRemote` não cria outro `BrowserRouter`;
- `HomeStandalone` cria o router necessário para execução isolada;
- `providers` monta apenas providers do próprio remote;
- rotas internas pertencem ao remote;
- o shell controla apenas a rota superior.

Aplicar o mesmo padrão de forma proporcional em `blog` e `resume`.

## Contratos públicos

Contratos iniciais:

```text
home/Home
blog/Blog
resume/Resume
```

O shell consome somente um componente raiz.

As declarações TypeScript permanecem temporariamente em:

```text
apps/web/shell/src/types/remote-modules.d.ts
```

Não adicionar dependência para geração automática de tipos nesta fase.

## Shared dependencies

Evitar:

```js
shared: {
  ...deps
}
```

Compartilhar explicitamente apenas o necessário:

```text
react
react-dom
react-router
```

Bibliotecas específicas devem permanecer no remote consumidor:

- Three.js;
- Zustand;
- Tone;
- `perfect-freehand`;
- QR Code;
- WebSocket;
- bibliotecas de animação.

Uma biblioteca só entra em `shared` quando houver necessidade real de uma única
instância em runtime.

## Configuração de URLs

O shell é o único responsável por localizar os remotes.

Criar uma configuração única para:

- desenvolvimento local;
- produção;
- preview futuro, se surgir.

Não repetir URLs entre router, componentes e Webpack.

## Pacotes compartilhados

Compartilhar um package do monorepo não significa compartilhar sua instância
pelo Module Federation.

`@fer-oshiro/ui` e `@fer-oshiro/realtime-contract` podem ser dependências de
build dos remotes. Suas APIs devem ser consumidas somente pelos exports
públicos.

Proibido:

```text
apps/web/home/src ──► apps/web/blog/src
apps/web/home/src ──► packages/ui/src
```

Permitido:

```text
apps/web/home ──► @fer-oshiro/ui
apps/web/home ──► @fer-oshiro/realtime-contract
```

## Fallbacks

Cada montagem remota no shell deve possuir:

- estado de carregamento;
- captura de erro;
- mensagem/fallback local;
- possibilidade de continuar navegando para outro remote.

Uma falha em `blog` não deve derrubar `home` ou o shell inteiro.

## Critério de isolamento

Um remote está suficientemente isolado quando:

- seu build funciona sem source de outro remote;
- abre em modo standalone;
- abre pelo shell;
- o shell importa apenas seu contrato público;
- dependências específicas não são compartilhadas automaticamente;
- falha de carregamento apresenta fallback;
- os estilos não dependem da ordem de montagem de outro remote.

## Checklist de implementação

- [ ] criar `app/` em cada frontend;
- [ ] separar `RemoteApp` e `StandaloneApp`;
- [ ] mover providers para a raiz do remote;
- [ ] manter router superior no shell;
- [ ] manter rotas internas no remote;
- [ ] centralizar declarações de módulos no shell;
- [ ] criar configuração única de URLs;
- [ ] remover `...deps` de `shared`;
- [ ] adicionar boundary por remote;
- [ ] validar execução standalone;
- [ ] validar execução pelo shell;
- [ ] procurar imports cruzando `apps/web/*/src`;
- [ ] documentar módulos expostos.
