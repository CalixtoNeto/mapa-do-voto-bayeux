// Dinheiro de uma campanha em fluxo (origem → campanha → categoria de gasto), com o treemap das categorias como outra visão.
import { dinheiro, sentence } from './formato.mjs';
import { grafoDaCampanha } from './calculos-fluxo-campanha.mjs';
import { agruparRestante } from './calculos-sankey.mjs';
import { Sankey } from './sankey.mjs';
import { Treemap } from './treemap.mjs';
import { Alternar } from './alternar.mjs';
const { html } = window.htmPreact;

export function FluxoDaCampanha({ r }) {
  const grafo = grafoDaCampanha(r);
  if (!grafo) return null;
  const categorias = agruparRestante(r.categorias.filter(c => c[1] > 0).map(c => ({ n: sentence(c[0]), v: c[1] })), 12, 'Outras categorias');
  return html`<h3>De onde veio e para onde foi</h3>
    <p class="hint">A espessura de cada faixa é o valor. O que entra e o que sai podem diferir: o gasto é só o declarado como contratado.</p>
    <${Alternar} rotulo="Forma de ver o dinheiro da campanha" visoes=${[
      { id: 'fluxo', rotulo: 'Fluxo', corpo: html`<${Sankey} grafo=${grafo} formato=${dinheiro} altura=${300} descricao="Origem do dinheiro da campanha e categorias de gasto" />` },
      { id: 'treemap', rotulo: 'Gastos em blocos', corpo: html`<${Treemap} itens=${categorias} formato=${dinheiro} altura=${300} descricao="Gasto por categoria" />` }]} />`;
}
