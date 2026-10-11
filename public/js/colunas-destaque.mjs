// Colunas com a base em zero em que cada coluna pode ficar em tom escuro (ex.: eleições municipais entre as gerais).
import { alturasDasColunas } from './calculos-graficos.mjs';
const { html } = window.htmPreact;

// itens: [{ n, v, rotulo, escuro? }]; o rótulo é o valor já formatado.
export function ColunasDestacadas({ itens, descricao }) {
  const alturas = alturasDasColunas(itens.map(i => i.v));
  return html`<div class="colunas destacadas" role="img" aria-label=${descricao}>${itens.map((i, k) => html`<div class=${i.escuro ? 'escura' : ''}>
    <span class="cv">${i.rotulo}</span><i style=${`height:${alturas[k]}%`}></i><span class="cn">${i.n}</span></div>`)}</div>`;
}
