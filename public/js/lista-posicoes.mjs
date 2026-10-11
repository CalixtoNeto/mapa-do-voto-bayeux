// Lista de linhas "nome · valor · detalhe" (e um gráfico opcional por linha), usada nos cartões por lugar.
const { html } = window.htmPreact;

// itens: [[nome, valor, detalhe, extra]]; valor e extra podem ser texto ou elementos.
export function ListaDePosicoes({ itens }) {
  return html`<ul class="posicoes">${itens.map(([nm, vv, sm, extra]) => html`<li><span class="nm">${nm}</span><span class="vv">${vv}</span><small>${sm}</small>${extra}</li>`)}</ul>`;
}
