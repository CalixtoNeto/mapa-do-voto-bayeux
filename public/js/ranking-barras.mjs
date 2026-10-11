// Ranking em barras do sistema visual: posição, nome, valor e parcela, e uma barra de 8px que mede só um número.
const { html } = window.htmPreact;

// itens: [{ n, v, rotulo, parcela?, nota?, marca?, destaque?, posicao?, aoClicar? }]: v mede a barra (o maior ocupa 100%).
// A linha em destaque leva fundo de 7% de vermelho e barra escura; descricao diz o que a barra mede.
export function RankingDeBarras({ itens, descricao }) {
  const topo = Math.max(1e-9, ...itens.map(i => i.v));
  return html`<ol class="rank-barras" aria-label=${descricao}>${itens.map((i, k) => html`<li class=${i.destaque ? 'destaque' : ''}>
    <span class="pos">${i.posicao ?? k + 1}</span>
    <span class="nm">${i.aoClicar ? html`<button type="button" class="link" onClick=${i.aoClicar}>${i.n}</button>` : i.n}${i.nota && html`<small>${i.nota}</small>`}</span>
    <span class="vv"><b>${i.rotulo}</b>${i.marca && html`<em>${i.marca}</em>`}</span><span class="pc">${i.parcela || ''}</span>
    <span class="trilho" aria-hidden="true"><i style=${`width:${Math.max(1, i.v / topo * 100).toFixed(1)}%`}></i></span></li>`)}</ol>`;
}
