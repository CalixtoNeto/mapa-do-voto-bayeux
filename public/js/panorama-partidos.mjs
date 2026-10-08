// Panorama do cargo: fundo eleitoral por partido (e a cota de gênero), perfil de candidatos e eleitos,
// maiores doadores.
import { pct, sentence, titleCase, dinheiro } from './formato.mjs';
import { cotaPorPartido, perfilDoGrupo } from './calculos.mjs';
import { nomeDe, usarLimite } from './componentes.mjs';
const { html, useMemo } = window.htmPreact;

export function FundoPorPartido({ cfg, cands, financas, perfis }) {
  const linhas = useMemo(() => cotaPorPartido(cands, financas, perfis, cfg.chaveDe).filter(p => p.fefc > 0), [cands, financas, perfis]);
  const [limite, botao] = usarLimite(linhas.length);
  if (!linhas.length) return null;
  const max = linhas[0].fefc;
  return html`<section class="analise" aria-labelledby="fp"><h2 id="fp">Fundo eleitoral por partido</h2>
    <ul class="partidos">${linhas.slice(0, limite).map(p => { const m = p.fefcMulheres / p.fefc, n = p.fefcNegros / p.fefc;
      return html`<li><span class="nm">${p.partido}</span><span class="vv">${dinheiro(p.fefc)}</span>
        <span class="bar" aria-hidden="true"><i style=${`width:${(p.fefc / max * 100).toFixed(1)}%`}></i></span>
        <span class="meta"><span class=${m < 0.3 ? 'abaixo' : ''}>${m < 0.3 ? '⚠ ' : ''}${pct(m, 0)} para mulheres</span> · ${pct(n, 0)} para pessoas negras · ${p.mulheres} de ${p.candidatos} candidaturas são de mulheres</span></li>`; })}</ul>${botao}
    <p class="hint">⚠ marca os partidos que deram menos de 30% do fundo eleitoral ${cfg.regiao} a mulheres. A regra dos 30% vale para o total nacional do partido, então isto indica como o dinheiro foi distribuído aqui, não uma irregularidade. Pessoas negras: pretas e pardas.</p>
  </section>`;
}

function BarrasDoPerfil({ titulo, linhas, totalCands, totalEleitos }) {
  return html`<div class="perfil-grupo"><h3>${titulo}</h3><ul class="leg-perfil">${linhas.map(l => html`<li>
    <span class="nm">${sentence(l.valor)}</span>
    <span class="par"><span class="trilho"><i class="cand" style=${`width:${(l.candidatos / totalCands * 100).toFixed(1)}%`}></i></span><small>${pct(l.candidatos / totalCands, 0)} dos candidatos</small></span>
    <span class="par"><span class="trilho"><i class="eleito" style=${`width:${totalEleitos ? (l.eleitos / totalEleitos * 100).toFixed(1) : 0}%`}></i></span><small>${totalEleitos ? pct(l.eleitos / totalEleitos, 0) : '—'} dos eleitos</small></span>
  </li>`)}</ul></div>`;
}

export function PerfilDoCargo({ cfg, cands, perfis }) {
  const grupos = useMemo(() => ({ g: perfilDoGrupo(cands, perfis, cfg.chaveDe, 'g'), r: perfilDoGrupo(cands, perfis, cfg.chaveDe, 'r') }), [cands, perfis]);
  const totalCands = grupos.g.reduce((s, l) => s + l.candidatos, 0), totalEleitos = grupos.g.reduce((s, l) => s + l.eleitos, 0);
  if (!totalCands) return null;
  return html`<section class="analise" aria-labelledby="pf"><h2 id="pf">Quem disputou e quem se elegeu</h2>
    <${BarrasDoPerfil} titulo="Gênero" linhas=${grupos.g} totalCands=${totalCands} totalEleitos=${totalEleitos} />
    <${BarrasDoPerfil} titulo="Cor ou raça" linhas=${grupos.r} totalCands=${totalCands} totalEleitos=${totalEleitos} />
    <p class="hint">Candidatos que receberam votos nesta eleição, pelo cadastro do TSE (autodeclaração).</p></section>`;
}

export function Doadores({ cfg, cands, financas, onPick }) {
  const porChave = useMemo(() => new Map(cands.map(c => [cfg.chaveDe(c), c])), [cands]);
  const lista = useMemo(() => (financas?.doadores || []).map(d => {
    const para = d.c.filter(([k]) => porChave.has(k)).map(([k, v]) => ({ cand: porChave.get(k), v }));
    return { ...d, para, v: para.reduce((s, p) => s + p.v, 0) };
  }).filter(d => d.para.length).sort((a, b) => b.v - a.v).slice(0, 30), [financas, porChave]);
  const [limite, botao] = usarLimite(lista.length);
  if (!lista.length) return null;
  return html`<section class="analise" aria-labelledby="dd"><h2 id="dd">Maiores doadores</h2>
    <ol class="doadores">${lista.slice(0, limite).map(d => html`<li><div class="cab"><span class="nm">${titleCase(d.n)}</span><span class="vv">${dinheiro(d.v)}</span></div>
      <p>${d.para.slice(0, 5).map((p, i) => html`${i ? ', ' : ''}<button type="button" class="link" onClick=${() => onPick(p.cand)}>${nomeDe(p.cand)}</button> (${dinheiro(p.v)})`)}${d.para.length > 5 ? ` e mais ${d.para.length - 5}` : ''}</p></li>`)}</ol>${botao}
    <p class="hint">Doações de pessoas${financas.doadores.some(d => d.t === 'pj') ? ' e empresas' : ''} a candidatos deste cargo, somadas pelo CPF/CNPJ do doador (que o site não mostra).</p></section>`;
}
