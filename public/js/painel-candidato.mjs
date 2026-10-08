// Análises de um candidato: quem é, concentração do voto e dobradinhas; o dinheiro (painel-dinheiro.mjs),
// a força do voto (painel-voto.mjs) e a evolução patrimonial (painel-patrimonio.mjs) vêm dos outros painéis.
// cfg diz como cada site identifica o candidato e os lugares (municípios ou bairros); ver analises.mjs.
import { nf, sentence, titleCase } from './formato.mjs';
import { fichaDoPerfil } from './ficha.mjs';
import { concentracao, parceirosDeVoto } from './calculos.mjs';
import { criarDinheiro } from './painel-dinheiro.mjs';
import { criarForcaDoVoto } from './painel-voto.mjs';
import { criarPatrimonio } from './painel-patrimonio.mjs';
const { html, useMemo } = window.htmPreact;

export function criarPainelDoCandidato(cfg) {
  // A evolução dos bens fica em Evolução patrimonial (painel-patrimonio.mjs).
  function QuemE({ cand, perfis }) {
    const p = perfis?.c?.[cfg.chaveDe(cand)];
    if (!p) return null;
    return html`<section class="analise" aria-labelledby="qe"><h2 id="qe">Quem é</h2>
      <dl class="ficha">${fichaDoPerfil(p).map(([dt, dd]) => html`<div><dt>${dt}</dt><dd>${dd}</dd></div>`)}</dl>
    </section>`;
  }

  function Concentracao({ cand }) {
    const c = useMemo(() => concentracao(cfg.votosDe(cand)), [cand]);
    if (!c.lugares) return null;
    const efetivo = c.efetivo.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    return html`<p class="hint concentracao">Metade dos votos veio de <strong>${c.metade} ${c.metade === 1 ? cfg.lugarNome : cfg.lugaresNome}</strong>${` (de ${c.lugares} com voto). Número efetivo de ${cfg.lugaresNome}: `}<strong>${efetivo}</strong>${' — perto de 1 é voto de reduto; quanto maior, mais espalhado.'}</p>`;
  }

  function Dobradinhas({ cand, ds, onPick }) {
    const par = cfg.cargoPar[cand.cargo];
    const lista = useMemo(() => par ? calcularDobradinhas(cfg, ds, cand, par) : [], [ds, cand, par]);
    if (!lista.length) return null;
    return html`<section class="analise" aria-labelledby="db"><h2 id="db">Dobradinhas prováveis</h2>
      <p class="hint">Candidatos a ${sentence(cfg.nomeDoCargo[par]).toLowerCase()} cujos votos sobem e descem nos mesmos ${cfg.lugaresNome} que os de ${titleCase(cand.urna || cand.nome)}.</p>
      <ol class="lista-cands">${lista.map(({ cand: c, r }) => html`<li><button type="button" onClick=${() => onPick(c)}>
        <span class="nm">${titleCase(c.urna || c.nome)}</span><span class="meta">${c.nr}${c.partido ? ' · ' + c.partido : ''} · ${nf.format(c.total)} votos</span>
        <span class="vv">${r.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span></button></li>`)}</ol>
      <p class="hint">O número é a correlação (de −1 a 1) entre as parcelas de voto de cada um em cada ${cfg.lugarNome}. Indica votos no mesmo eleitorado, não acordo político.</p>
    </section>`;
  }

  return { Dinheiro: criarDinheiro(cfg), QuemE, Concentracao, Dobradinhas, ForcaDoVoto: criarForcaDoVoto(cfg), Patrimonio: criarPatrimonio(cfg) };
}

function calcularDobradinhas(cfg, ds, cand, par) {
  const doPar = ds.cands.filter(c => c.cargo === par && c.turno === cand.turno);
  const somaDoPar = doPar.reduce((s, c) => s + c.total, 0);
  const tot = { [cand.cargo]: cfg.totDe(ds, cand), [par]: doPar[0] ? cfg.totDe(ds, doPar[0]) : {} };
  const parcela = (c, lugar) => { const t = tot[c.cargo][lugar]; return t ? (cfg.votosDe(c)[lugar] || 0) / t : 0; };
  return parceirosDeVoto(cand, doPar, { lugares: cfg.lugares(ds), parcela, quantos: 6, minimo: somaDoPar * 0.002 })
    .filter(p => p.r > 0.2);
}
