# Microfrontend Blog

O frontend Blog possui dois modos de entrada:

- O Module Federation expõe o componente React padrão como `blog/Blog`.
  `BlogRemote` utiliza o router fornecido pelo shell.
- A entrada standalone renderiza `BlogStandalone`, que fornece seu próprio
  `BrowserRouter` e monta a mesma raiz remota.

O contrato público se limita ao componente raiz. Rotas, componentes e assets
permanecem internos a este remote.
