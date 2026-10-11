// Concentração do fundo eleitoral, reeleição e maiores fornecedores do cargo.
import { pct, titleCase, dinheiro } from './formato.mjs';
import { concentracaoDoFundo, reeleicao } from './calculos.mjs';
import { nomeDe, usarLimite } from './componentes.mjs';
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

export function FornecedoresDoCargo({ cfg, cands, financas, onPick }) {
  const porChave = useMemo(() => new Map(cands.map(c => [cfg.chaveDe(c), c])), [cands]);
  const lista = useMemo(() => (financas?.fornecedores || []).map(f => {
    const para = f.c.filter(([k]) => porChave.has(k)).map(([k, v]) => ({ cand: porChave.get(k), v }));
    return { ...f, para, v: para.reduce((s, p) => s + p.v, 0) };
  }).filter(f => f.para.length).sort((a, b) => b.v - a.v).slice(0, 30), [financas, porChave]);
  const [limite, botao] = usarLimite(lista.length);
  if (!lista.length) return null;
  return html`<${Cartao} tipo="Lista · fornecedores" titulo="Maiores fornecedores"
      nota="Despesas contratadas pelos candidatos deste cargo, somadas pelo CPF/CNPJ do fornecedor (que o site não mostra).">
    <ol class="doadores">${lista.slice(0, limite).map(f => html`<li><div class="cab"><span class="nm">${titleCase(f.n)}</span><span class="vv">${dinheiro(f.v)}</span></div>
      <p>${f.para.slice(0, 5).map((p, i) => html`${i ? ', ' : ''}<button type="button" class="link" onClick=${() => onPick(p.cand)}>${nomeDe(p.cand)}</button> (${dinheiro(p.v)})`)}${f.para.length > 5 ? ` e mais ${f.para.length - 5}` : ''}</p></li>`)}</ol>${botao}<//>`;
}
