// Concentração do fundo eleitoral e reeleição.
import { pct, dinheiro } from './formato.mjs';
import { concentracaoDoFundo, reeleicao } from './calculos.mjs';
import { Cartao } from './cartao.mjs';
const { html, useMemo } = window.htmPreact;

export function ConcentracaoDoFundo({ linhas, ctx }) {
  const c = useMemo(() => concentracaoDoFundo(linhas), [linhas]);
  const re = useMemo(() => ctx.perfis ? reeleicao(ctx.cands, ctx.perfis, ctx.chaveDe, ctx.eleito) : null, [ctx]);
  if (!c && !re?.tentaram) return null;
  return html`<${Cartao} tipo="Números · concentração" titulo="Concentração e reeleição"
      nota="Gini: 0 quando todos recebem o mesmo, perto de 1 quando um só leva quase tudo. Contas do site sobre o fundo eleitoral declarado.">
    <dl class="stats">
    ${c && html`<div><dt>Fundo eleitoral para os 10% que mais receberam</dt><dd>${pct(c.topo, 0)}</dd><small>de ${dinheiro(c.total)} entre ${c.recebedores} candidatos</small></div>
      <div><dt>Índice de Gini do fundo</dt><dd>${c.gini.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</dd><small>0 = todos iguais · 1 = um só leva tudo</small></div>`}
    ${re?.tentaram > 0 && html`<div><dt>Reeleição</dt><dd>${pct(re.conseguiram / re.tentaram, 0)}</dd><small>${re.conseguiram} de ${re.tentaram} que tentaram se reelegeram</small></div>`}
  </dl><//>`;
}
