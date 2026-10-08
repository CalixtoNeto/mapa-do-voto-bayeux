// Análises de um candidato: dinheiro da campanha, quem é (perfil e bens), concentração do voto e dobradinhas.
// cfg diz como cada site identifica o candidato e os lugares (municípios ou bairros); ver analises.mjs.
import { nf, pct, sentence, titleCase, NORM, dinheiro, centavos } from './formato.mjs';
import { BarraDeOrigens, ListaDeBarras } from './componentes.mjs';
import { fichaDoPerfil, variacaoDoPatrimonio } from './ficha.mjs';
import { resumoFinanceiro, custoPorVoto, concentracao, parceirosDeVoto } from './calculos.mjs';
const { html, useMemo } = window.htmPreact;

function semPrestacao(financas, ano) {
  if (financas) return 'O TSE não tem prestação de contas deste candidato.';
  return +ano < 2018 ? 'O TSE publica a prestação de contas dos candidatos neste formato a partir de 2018.'
    : 'A prestação de contas desta eleição ainda não foi gerada para o site.';
}

const posicaoNoCusto = (linhas, cand) => {
  const comCusto = linhas.filter(l => l.custo != null).sort((a, b) => a.custo - b.custo);
  return { posicao: comCusto.findIndex(l => l.cand.key === cand.key) + 1, de: comCusto.length };
};

function NumerosDoDinheiro({ r, custo, posicao, cfg, cand }) {
  return html`<dl class="stats">
    <div><dt>Recebido</dt><dd>${dinheiro(r.recebido)}</dd></div>
    <div><dt>Gasto declarado</dt><dd>${dinheiro(r.gasto)}</dd></div>
    <div><dt>Custo por voto${cand.turno !== '1' ? ' (2º turno)' : ''}</dt><dd>${custo != null ? centavos(custo) : '—'}</dd>
      ${posicao.posicao > 0 ? html`<small>${posicao.posicao}º menor entre ${posicao.de}</small>` : null}</div>
    <div><dt>Fundo eleitoral</dt><dd>${dinheiro(r.fefc)}</dd>${r.recebido ? html`<small>${pct(r.fefc / r.recebido, 0)} do recebido</small>` : null}</div>
  </dl>`;
}

function notasDoDinheiro(r, financas, cfg, cand) {
  return [
    !financas.final && 'Prestação de contas parcial: a final é entregue até 30 dias depois da eleição.',
    'Gasto: despesas contratadas declaradas ao TSE' + (r.repasses ? `, sem ${dinheiro(r.repasses)} doados a outras campanhas.` : '.'),
    `Custo por voto: gasto dividido pelos votos ${cfg.regiao}.`,
    cfg.ehMajoritario(cand) && 'Em cargos majoritários, o dinheiro é da chapa e cobre os dois turnos.',
    r.deCandidatos ? `${dinheiro(r.deCandidatos)} vieram de outros candidatos (podem incluir fundo eleitoral repassado).` : '',
  ].filter(Boolean);
}

export function criarPainelDoCandidato(cfg) {
  function Dinheiro({ cand, financas, ano, linhasDoCargo }) {
    const f = financas?.c?.[cfg.chaveDe(cand)];
    const cab = html`<h2 id="din">Dinheiro da campanha</h2>`;
    const fora = cfg.foraDasFinancas(cand);
    if (fora || !f) return html`<section class="analise" aria-labelledby="din">${cab}<p class="hint">${fora || semPrestacao(financas, ano)}</p></section>`;
    const r = resumoFinanceiro(f), custo = custoPorVoto(r.gasto, cand.total);
    return html`<section class="analise" aria-labelledby="din">${cab}
      <${NumerosDoDinheiro} r=${r} custo=${custo} posicao=${posicaoNoCusto(linhasDoCargo, cand)} cfg=${cfg} cand=${cand} />
      <${BarraDeOrigens} grupos=${r.grupos} total=${r.recebido} />
      ${r.categorias.length > 0 && html`<h3>Maiores despesas</h3><${ListaDeBarras} itens=${r.categorias.map(([n, v]) => ({ n: sentence(n), v, rotulo: dinheiro(v) }))} />`}
      ${notasDoDinheiro(r, financas, cfg, cand).map(n => html`<p class="hint">${n}</p>`)}
    </section>`;
  }

  function QuemE({ cand, perfis, patrimonio }) {
    const p = perfis?.c?.[cfg.chaveDe(cand)];
    if (!p) return null;
    const evolucao = patrimonio[NORM(cand.nome || cand.urna)] || [];
    return html`<section class="analise" aria-labelledby="qe"><h2 id="qe">Quem é</h2>
      <dl class="ficha">${fichaDoPerfil(p).map(([dt, dd]) => html`<div><dt>${dt}</dt><dd>${dd}</dd></div>`)}</dl>
      ${evolucao.length > 1 && html`<h3>Bens declarados em cada eleição</h3>
        <${ListaDeBarras} itens=${[...evolucao].sort((a, b) => a[0] - b[0]).map(([ano, v]) => ({ n: ano, v, rotulo: dinheiro(v) }))} />
        <p class="hint">${variacaoDoPatrimonio(evolucao)} Valores nominais, sem correção pela inflação; a ligação entre eleições é pelo nome completo.</p>`}
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

  return { Dinheiro, QuemE, Concentracao, Dobradinhas };
}

function calcularDobradinhas(cfg, ds, cand, par) {
  const doPar = ds.cands.filter(c => c.cargo === par && c.turno === cand.turno);
  const somaDoPar = doPar.reduce((s, c) => s + c.total, 0);
  const tot = { [cand.cargo]: cfg.totDe(ds, cand), [par]: doPar[0] ? cfg.totDe(ds, doPar[0]) : {} };
  const parcela = (c, lugar) => { const t = tot[c.cargo][lugar]; return t ? (cfg.votosDe(c)[lugar] || 0) / t : 0; };
  return parceirosDeVoto(cand, doPar, { lugares: cfg.lugares(ds), parcela, quantos: 6, minimo: somaDoPar * 0.002 })
    .filter(p => p.r > 0.2);
}
