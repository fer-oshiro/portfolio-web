# Microfrontend Resume

O frontend Resume possui dois modos de entrada:

- O Module Federation expõe o componente React padrão como `resume/Resume`.
- A entrada standalone renderiza `ResumeStandalone` e monta a mesma raiz
  `ResumeRemote`.

O contrato público se limita ao componente raiz. Componentes e estilos
permanecem internos a este remote.
