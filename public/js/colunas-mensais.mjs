// Colunas de uma série curta em que alguns períodos ainda estão sendo lançados: esses ficam só com contorno tracejado,
// e quem não tem dado mostra um traço.
import { alturasDasColunas } from './calculos-graficos.mjs';
const { html } = window.htmPreact;

// itens: [{ n, v | null, rotulo, parcial }]
export function ColunasMensais({ itens, descricao }) {
  const alturas = alturasDasColunas(itens.map(i => i.v || 0));
  return html`<div class="colunas mensais" role="img" aria-label=${descricao}>${itens.map((i, k) => html`<div class=${i.parcial ? 'parcial' : ''}>
    <span class="cv">${i.v == null ? '—' : i.rotulo}</span><i style=${`height:${alturas[k]}%`}></i><span class="cn">${i.n}</span></div>`)}</div>`;
}
