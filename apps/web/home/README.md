# Microfrontend Home

O frontend Home possui dois modos de entrada:

- O Module Federation expõe o componente React padrão como `home/Home`.
  `HomeRemote` utiliza o router fornecido pelo shell.
- A entrada standalone renderiza `HomeStandalone`, que fornece seu próprio
  `BrowserRouter` e monta a mesma raiz remota.

O contrato público se limita ao componente raiz. Rotas, providers de realtime,
estado, componentes e assets permanecem internos a este remote.
