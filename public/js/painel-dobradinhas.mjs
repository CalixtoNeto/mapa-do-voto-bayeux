// Dobradinhas prováveis com os candidatos de todos os outros cargos da mesma eleição (calculos-dobradinhas.mjs).
import { nf, sentence, titleCase } from './formato.mjs';
import { dobradinhasPorCargo, forcaDaCorrelacao } from './calculos.mjs';
const { html, useMemo } = window.htmPreact;

const correlacaoComSinal = r => r.toLocaleString('pt-BR', { maximumFractionDigits: 2, signDisplay: 'exceptZero' });

function calcular(cfg, ds, cand) {
  const daEleicao = ds.cands.filter(c => c.turno === cand.turno), totais = new Map();
  const totDoCargo = c => { if (!totais.has(c.cargo)) totais.set(c.cargo, cfg.totDe(ds, c)); return totais.get(c.cargo); };
  const parcela = (c, lugar) => { const t = totDoCargo(c)[lugar]; return t ? (cfg.votosDe(c)[lugar] || 0) / t : 0; };
  return dobradinhasPorCargo(cand, daEleicao, { lugares: cfg.lugares(ds), parcela, ordem: Object.keys(cfg.nomeDoCargo) });
}

function Grupo({ cfg, grupo, onPick }) {
  const nome = sentence(cfg.nomeDoCargo[grupo.cargo] || grupo.cargo);
  return html`<h3>${nome}</h3>
    <ol class="lista-cands">${grupo.lista.map(({ cand: c, r }) => html`<li><button type="button" onClick=${() => onPick(c)}>
      <span class="nm">${titleCase(c.urna || c.nome)}</span><span class="meta">${c.nr}${c.partido ? ' · ' + c.partido : ''} · ${nf.format(c.total)} votos · ${forcaDaCorrelacao(r)}</span>
      <span class="vv">${correlacaoComSinal(r)}</span></button></li>`)}</ol>
    <p class="hint">${grupo.todos ? `Todos os candidatos a ${nome.toLowerCase()} com pelo menos 0,5% dos votos.` : `Os mais parecidos entre os candidatos a ${nome.toLowerCase()} (correlação acima de 0,1).`}</p>`;
}

export function criarDobradinhas(cfg) {
  return function Dobradinhas({ cand, ds, onPick }) {
    const grupos = useMemo(() => cand && ds ? calcular(cfg, ds, cand) : [], [ds, cand]);
    if (!grupos.length) return null;
    return html`<section class="analise" aria-labelledby="db"><h2 id="db">Dobradinhas prováveis</h2>
      <p class="hint">Candidatos de outros cargos (e, para senador, os outros senadores) cujos votos sobem e descem nos mesmos ${cfg.lugaresNome} que os de ${titleCase(cand.urna || cand.nome)}.</p>
      ${grupos.map(g => html`<${Grupo} cfg=${cfg} grupo=${g} onPick=${onPick} />`)}
      <p class="hint">O número é a correlação (de −1 a 1) entre as parcelas de voto de cada um em cada ${cfg.lugarNome}: perto de 1, vão bem e mal nos mesmos lugares; negativo, onde um vai bem o outro vai mal. Abaixo de 0,3 a relação é fraca. Indica votos no mesmo eleitorado, não acordo político.</p>
    </section>`;
  };
}
