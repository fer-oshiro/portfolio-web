# Decisões em aberto e definição de pronto

## Decisões já tomadas

- Module Federation será mantido como objetivo de estudo.
- Os microfrontends ficarão em `apps/web/*`.
- Backends serão consolidados em `apps/backend`.
- O backend terá três entrypoints AWS e um local.
- Três Lambdas continuarão existindo.
- Desenvolvimento local não usará emulador de Lambda.
- O `home` será organizado por domínio.
- Navegação será dirigida pelo fim real das animações, não por timers no store.
- Não será adicionada uma biblioteca de máquina de estados inicialmente.
- O navigation store usa Zustand sobre uma função de transição pura.
- Desenhos locais permanecem em memória durante a execução do processo.
- O modo local usa Groq quando `GROQ_API_KEY` está disponível e um provider de
  fallback quando não está.
- Testes não terão meta de cobertura.
- Documentação será evolutiva.

## Decisões em aberto

- geração automática de tipos do Module Federation;
- profile/info como feature própria;
- momento de transformar warnings críticos em erros;
- CI remoto além dos hooks;
- pipeline de deploy;
- ambiente de preview.

Ao fechar uma decisão:

1. registrar escolha;
2. registrar motivação;
3. registrar fase afetada;
4. atualizar o guia correspondente.

## Definição geral de pronto

- [x] apps agrupados em `web`, `backend` e `tooling`;
- [ ] cada remote funciona standalone e pelo shell;
- [x] não há imports internos entre aplicações;
- [ ] Module Federation compartilha dependências explícitas;
- [x] backend possui um workspace e quatro entrypoints;
- [x] local e AWS usam as mesmas features;
- [x] backend local não depende de emulador;
- [x] três ZIPs são gerados;
- [x] `home` está organizado por domínio;
- [x] realtime não depende de mutáveis globais;
- [x] transições não usam timers no store;
- [x] câmera e efeito têm responsabilidades separadas;
- [x] `packages/ui` é consumido pela API pública;
- [x] configuração não está hardcoded nas features;
- [x] smoke tests principais estão documentados;
- [x] README explica desenvolvimento e deploy;
- [x] documentação corresponde à estrutura real.

## Resultado esperado

Não é necessário atingir uma arquitetura perfeita.

Ao final deve ser claro:

- onde cada código fica;
- quem pode depender de quem;
- como executar localmente;
- como gerar e publicar artefatos;
- como mover uma feature sem conhecer todo o repositório;
- como identificar uma mudança segura e reversível.
