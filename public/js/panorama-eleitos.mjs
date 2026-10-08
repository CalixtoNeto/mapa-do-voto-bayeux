// Panorama do cargo: o dinheiro elege?, partidos, concentração do fundo eleitoral, reeleição e maiores fornecedores.
import { nf, pct, titleCase, dinheiro, centavos } from './formato.mjs';
import { eleitosENaoEleitos, porPartido, concentracaoDoFundo, reeleicao } from './calculos.mjs';
import { nomeDe, usarLimite } from './componentes.mjs';
const { html, useMemo } = window.htmPreact;

export function DinheiroElege({ linhas, ctx }) {
  const r = useMemo(() => eleitosENaoEleitos(linhas, ctx.eleito), [linhas, ctx]);
  if (!r.eleitos.n || !r.naoEleitos.n || r.faixas.length < 2) return null;
  return html`<section class="analise" aria-labelledby="de"><h2 id="de">O dinheiro elege?</h2>
    <dl class="stats"><div><dt>Gasto mediano de quem se elegeu</dt><dd>${dinheiro(r.eleitos.gasto)}</dd><small>${r.eleitos.n} eleitos</small></div>
      <div><dt>De quem não se elegeu</dt><dd>${dinheiro(r.naoEleitos.gasto)}</dd><small>${r.naoEleitos.n} candidatos</small></div></dl>
    <h3>Chance de se eleger por faixa de gasto</h3>
    <ul class="posicoes">${r.faixas.map(f => html`<li><span class="nm">${dinheiro(f.de)} a ${dinheiro(f.ate)}</span>
      <span class="vv">${pct(f.eleitos / f.candidatos, 0)}</span><small>${f.eleitos} eleitos entre ${f.candidatos} candidatos</small></li>`)}</ul>
    <p class="hint">Faixas com o mesmo número de candidatos (quartis), só entre os que declararam gasto. Mostra associação, não causa: quem já tem mais chance também atrai mais dinheiro.</p></section>`;
}

export function Partidos({ linhas, ctx }) {
  const lista = useMemo(() => porPartido(linhas, ctx.eleito), [linhas, ctx]);
  const [limite, botao] = usarLimite(lista.length);
  if (lista.length < 2) return null;
  return html`<section class="analise" aria-labelledby="pt"><h2 id="pt">Partidos</h2>
    <ul class="partidos">${lista.slice(0, limite).map(p => html`<li><span class="nm">${p.partido}</span><span class="vv">${nf.format(p.votos)} votos</span>
      <span class="meta">${p.eleitos} ${p.eleitos === 1 ? 'eleito' : 'eleitos'} de ${p.candidatos} candidatos${p.gasto ? ` · gastou ${dinheiro(p.gasto)} · ${centavos(p.custo)} por voto` : ''}${p.fefc ? ` · fundo eleitoral ${dinheiro(p.fefc)}` : ''}</span></li>`)}</ul>${botao}
    <p class="hint">Votos nominais dos candidatos de cada partido (sem os de legenda).</p></section>`;
}

export function ConcentracaoDoFundo({ linhas, ctx }) {
  const c = useMemo(() => concentracaoDoFundo(linhas), [linhas]);
  const re = useMemo(() => ctx.perfis ? reeleicao(ctx.cands, ctx.perfis, ctx.chaveDe, ctx.eleito) : null, [ctx]);
  if (!c && !re?.tentaram) return null;
  return html`<section class="analise" aria-labelledby="cf"><h2 id="cf">Concentração e reeleição</h2><dl class="stats">
    ${c && html`<div><dt>Fundo eleitoral para os 10% que mais receberam</dt><dd>${pct(c.topo, 0)}</dd><small>de ${dinheiro(c.total)} entre ${c.recebedores} candidatos</small></div>
      <div><dt>Índice de Gini do fundo</dt><dd>${c.gini.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</dd><small>0 = todos iguais · 1 = um só leva tudo</small></div>`}
    ${re?.tentaram > 0 && html`<div><dt>Reeleição</dt><dd>${pct(re.conseguiram / re.tentaram, 0)}</dd><small>${re.conseguiram} de ${re.tentaram} que tentaram se reelegeram</small></div>`}
  </dl></section>`;
}

export function FornecedoresDoCargo({ cfg, cands, financas, onPick }) {
  const porChave = useMemo(() => new Map(cands.map(c => [cfg.chaveDe(c), c])), [cands]);
  const lista = useMemo(() => (financas?.fornecedores || []).map(f => {
    const para = f.c.filter(([k]) => porChave.has(k)).map(([k, v]) => ({ cand: porChave.get(k), v }));
    return { ...f, para, v: para.reduce((s, p) => s + p.v, 0) };
  }).filter(f => f.para.length).sort((a, b) => b.v - a.v).slice(0, 30), [financas, porChave]);
  const [limite, botao] = usarLimite(lista.length);
  if (!lista.length) return null;
  return html`<section class="analise" aria-labelledby="mf"><h2 id="mf">Maiores fornecedores</h2>
    <ol class="doadores">${lista.slice(0, limite).map(f => html`<li><div class="cab"><span class="nm">${titleCase(f.n)}</span><span class="vv">${dinheiro(f.v)}</span></div>
      <p>${f.para.slice(0, 5).map((p, i) => html`${i ? ', ' : ''}<button type="button" class="link" onClick=${() => onPick(p.cand)}>${nomeDe(p.cand)}</button> (${dinheiro(p.v)})`)}${f.para.length > 5 ? ` e mais ${f.para.length - 5}` : ''}</p></li>`)}</ol>${botao}
    <p class="hint">Despesas contratadas pelos candidatos deste cargo, somadas pelo CPF/CNPJ do fornecedor (que o site não mostra).</p></section>`;
}
