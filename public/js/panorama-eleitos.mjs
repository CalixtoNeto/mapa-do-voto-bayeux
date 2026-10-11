// Partidos em hierarquia, como a árvore do gasto: a lista dos partidos e, ao tocar num, os candidatos dele.
import { nf, pct, dinheiro, centavos } from './formato.mjs';
import { porPartido } from './calculos.mjs';
import { nomeDe, usarLimite } from './componentes.mjs';
import { Cartao } from './cartao.mjs';
const { html, useMemo, useState } = window.htmPreact;

const resumoDoPartido = p => `${p.eleitos} ${p.eleitos === 1 ? 'eleito' : 'eleitos'} de ${p.candidatos} candidatos${p.gasto ? ` · gastou ${dinheiro(p.gasto)} · ${centavos(p.custo)} por voto` : ''}${p.fefc ? ` · fundo eleitoral ${dinheiro(p.fefc)}` : ''}`;
const resumoDoCandidato = (l, eleito) => `${eleito ? 'eleito · ' : ''}${l.gasto ? `gastou ${dinheiro(l.gasto)}` : 'sem gasto declarado'}${l.custo != null ? ` · ${centavos(l.custo)} por voto` : ''}${l.fefc ? ` · fundo eleitoral ${dinheiro(l.fefc)}` : ''}`;

function Barra({ v, max }) {
  return html`<span class="bar" aria-hidden="true"><i style=${`width:${(v / max * 100).toFixed(1)}%`}></i></span>`;
}

function Trilha({ aberto, total, abrir }) {
  return html`<nav class="trilha" aria-label="Caminho nos partidos"><button type="button" class="link" aria-current=${aberto ? null : 'true'} onClick=${() => abrir(null)}>Todos os partidos · ${nf.format(total)} votos</button>
    ${aberto && html`<span aria-hidden="true">›</span><button type="button" class="link" aria-current="true">${aberto}</button>`}</nav>`;
}

function CandidatosDoPartido({ p, linhas, ctx, onPick }) {
  const cands = linhas.filter(l => (l.cand.partido || '?') === p.partido).sort((a, b) => b.cand.total - a.cand.total);
  const max = Math.max(1, ...cands.map(l => l.cand.total));
  return html`<p class="hint">${resumoDoPartido(p)}. Toque num candidato para vê-lo no mapa.</p>
    <ul class="partidos">${cands.map(l => html`<li><button type="button" class="abre" onClick=${() => onPick && onPick(l.cand)}>
      <span class="nm">${nomeDe(l.cand)}</span><span class="vv">${nf.format(l.cand.total)} votos <small>${pct(l.cand.total / p.votos, 0)}</small></span>
      <${Barra} v=${l.cand.total} max=${max} /><span class="meta">${resumoDoCandidato(l, ctx.eleito(l.cand))}</span></button></li>`)}</ul>`;
}

export function Partidos({ linhas, ctx, onPick }) {
  const lista = useMemo(() => porPartido(linhas, ctx.eleito), [linhas, ctx]);
  const [aberto, setAberto] = useState(null);
  const [limite, botao] = usarLimite(lista.length);
  if (lista.length < 2) return null;
  const p = aberto && lista.find(x => x.partido === aberto), total = lista.reduce((s, x) => s + x.votos, 0);
  const max = Math.max(1, ...lista.map(x => x.votos));
  return html`<${Cartao} tipo="Lista · hierarquia" titulo="Partidos e seus candidatos" sub="Toque num partido para abrir os candidatos dele."
      nota="Votos nominais dos candidatos de cada partido (sem os de legenda); a porcentagem é sobre os votos nominais do cargo.">
    <${Trilha} aberto=${p && p.partido} total=${total} abrir=${setAberto} />
    ${p ? html`<${CandidatosDoPartido} p=${p} linhas=${linhas} ctx=${ctx} onPick=${onPick} />`
      : html`<ul class="partidos">${lista.slice(0, limite).map(x => html`<li><button type="button" class="abre" onClick=${() => setAberto(x.partido)}>
        <span class="nm">${x.partido} ›</span><span class="vv">${nf.format(x.votos)} votos <small>${pct(x.votos / total, 0)}</small></span>
        <${Barra} v=${x.votos} max=${max} /><span class="meta">${resumoDoPartido(x)}</span></button></li>`)}</ul>${botao}`}<//>`;
}
