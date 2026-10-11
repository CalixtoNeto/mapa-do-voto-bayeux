// Conteúdo que abre sob demanda dentro de um cartão (a árvore completa, a lista longa), recolhido por padrão.
const { html } = window.htmPreact;

export const Desdobrar = ({ titulo, children }) => html`<details class="como-ler desdobrar"><summary>${titulo}</summary><div>${children}</div></details>`;
