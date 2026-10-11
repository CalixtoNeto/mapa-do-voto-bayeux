// Legenda de cores em uma linha, para quando o gráfico (barras empilhadas, execução) não traz a sua.
const { html } = window.htmPreact;

// itens: [[nome, cor]]
export const Legenda = ({ itens }) => html`<ul class="legenda-linha">${itens.map(([nome, cor]) =>
  html`<li><i style=${`background:${cor}`}></i>${nome}</li>`)}</ul>`;
