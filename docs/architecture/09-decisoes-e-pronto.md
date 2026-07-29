# Decisões em aberto e definição de pronto

## Decisões já tomadas

- Module Federation será mantido como objetivo de estudo.
- Os microfrontends ficarão em `apps/web/*`.
- Backends serão consolidados em `apps/backend/realtime`.
- O backend terá três entrypoints AWS e um local.
- Três Lambdas continuarão existindo.
- Desenvolvimento local não usará emulador de Lambda.
- O `home` será organizado por domínio.
- Navegação será dirigida pelo fim real das animações, não por timers no store.
- Não será adicionada uma biblioteca de máquina de estados inicialmente.
- Testes não terão meta de cobertura.
- Documentação será evolutiva.

## Decisões em aberto

- desenhos locais em memória ou diretório temporário;
- adapter Groq real disponível no modo local;
- geração automática de tipos do Module Federation;
- navigation store como reducer puro ou Zustand;
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

- [ ] apps agrupados em `web`, `backend` e `tooling`;
- [ ] cada remote funciona standalone e pelo shell;
- [ ] não há imports internos entre aplicações;
- [ ] Module Federation compartilha dependências explícitas;
- [ ] backend possui um workspace e quatro entrypoints;
- [ ] local e AWS usam as mesmas features;
- [ ] backend local não depende de emulador;
- [ ] três ZIPs são gerados;
- [ ] `home` está organizado por domínio;
- [ ] realtime não depende de mutáveis globais;
- [ ] transições não usam timers no store;
- [ ] câmera e efeito têm responsabilidades separadas;
- [ ] `packages/ui` é consumido pela API pública;
- [ ] configuração não está hardcoded nas features;
- [ ] smoke tests principais estão documentados;
- [ ] README explica desenvolvimento e deploy;
- [ ] documentação corresponde à estrutura real.

## Resultado esperado

Não é necessário atingir uma arquitetura perfeita.

Ao final deve ser claro:

- onde cada código fica;
- quem pode depender de quem;
- como executar localmente;
- como gerar e publicar artefatos;
- como mover uma feature sem conhecer todo o repositório;
- como identificar uma mudança segura e reversível.
