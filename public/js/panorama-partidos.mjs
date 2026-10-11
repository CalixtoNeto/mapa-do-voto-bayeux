// Panorama do cargo: fundo eleitoral por partido (e a cota de gênero) e perfil de candidatos e eleitos.
import { pct, sentence, dinheiro } from './formato.mjs';
import { cotaPorPartido, perfilDoGrupo } from './calculos.mjs';
import { nomeDe, usarLimite } from './componentes.mjs';
import { Cartao } from './cartao.mjs';
import { ArvoreDoCargo } from './arvore-do-cargo.mjs';
import { arvoreDoFundo } from './calculos-arvores-dinheiro.mjs';
const { html, useMemo } = window.htmPreact;

const metaDoPartido = p => {
  const m = p.fefcMulheres / p.fefc, n = p.fefcNegros / p.fefc;
  return `${m < 0.3 ? '⚠ ' : ''}${pct(m, 0)} para mulheres · ${pct(n, 0)} para pessoas negras · ${p.mulheres} de ${p.candidatos} candidaturas são de mulheres`;
};

export function FundoPorPartido({ cfg, cands, financas, perfis, onPick }) {
  const linhas = useMemo(() => cotaPorPartido(cands, financas, perfis, cfg.chaveDe).filter(p => p.fefc > 0), [cands, financas, perfis]);
  const [limite, botao] = usarLimite(linhas.length);
  const partidoDe = c => perfis?.c?.[cfg.chaveDe(c)]?.p || c.partido || '?';
  const arvore = useMemo(() => arvoreDoFundo(linhas.slice(0, limite), cands, financas, cfg.chaveDe, { nomeDe, nota: metaDoPartido, partidoDe }), [linhas, limite]);
  if (!linhas.length) return null;
  return html`<${Cartao} tipo="Árvore de barras · por partido" titulo="Fundo eleitoral por partido" sub="A barra mede o fundo eleitoral recebido pelos candidatos do partido."
      nota=${`Toque num partido para ver os candidatos que receberam o fundo. ⚠ marca os partidos que deram menos de 30% do fundo eleitoral ${cfg.regiao} a mulheres. A regra dos 30% vale para o total nacional do partido, então isto indica como o dinheiro foi distribuído aqui, não uma irregularidade. Pessoas negras: pretas e pardas.`}>
    <${ArvoreDoCargo} arvore=${arvore} formato=${dinheiro} onPick=${onPick} ordenar=${true} legenda="Partido → candidato · fundo eleitoral" />${botao}<//>`;
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
  return html`<${Cartao} tipo="Barras · candidatos e eleitos" titulo="Quem disputou e quem se elegeu" sub="Cada barra mede a parcela do grupo entre os candidatos e entre os eleitos."
      nota="Candidatos que receberam votos nesta eleição, pelo cadastro do TSE (autodeclaração).">
    <${BarrasDoPerfil} titulo="Gênero" linhas=${grupos.g} totalCands=${totalCands} totalEleitos=${totalEleitos} />
    <${BarrasDoPerfil} titulo="Cor ou raça" linhas=${grupos.r} totalCands=${totalCands} totalEleitos=${totalEleitos} /><//>`;
}
