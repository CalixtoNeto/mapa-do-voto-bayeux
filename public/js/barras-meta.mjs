// Barras com referência: cada linha mostra o valor de uma pessoa e um traço escuro marca a média do grupo.
const { html } = window.htmPreact;

// itens: [{ n, v, rotulo, nota }] com v entre 0 e max; meta: valor do traço.
export function BarrasComMeta({ itens, meta, max = 1, descricao }) {
  return html`<ul class="barras-meta" aria-label=${descricao}>${itens.map(i => html`<li>
    <span class="nm">${i.n}</span>
    <span class="trilho" aria-hidden="true"><i style=${`width:${Math.min(100, i.v / max * 100).toFixed(1)}%`}></i>
      ${meta != null && html`<u style=${`left:${(meta / max * 100).toFixed(1)}%`}></u>`}</span>
    <span class="vv"><b>${i.rotulo}</b>${i.nota && html`<small>${i.nota}</small>`}</span></li>`)}</ul>`;
}
