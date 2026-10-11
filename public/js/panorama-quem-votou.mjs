// "Quem votou em quem": a rosca dos votos por candidato (ou por partido, quando são muitos) e a pizza do eleitorado inteiro.
import { nf, pct } from './formato.mjs';
import { nomeDe } from './componentes.mjs';
import { Cartao } from './cartao.mjs';
import { Bloco } from './estrutura.mjs';
import { Rosca } from './graficos.mjs';
import { partesComResto } from './calculos-graficos.mjs';
import { porPartido } from './calculos.mjs';
import { PizzaDoEleitorado } from './panorama-pizza.mjs';
import { SerieDosColocados } from './panorama-colocados.mjs';
const { html, useMemo } = window.htmPreact;

const CORES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
const comParcela = (v, total) => html`${nf.format(v)} <small>${pct(v / total, 1)}</small>`;
const MUITOS = 12;

function RoscaDosVotos({ cands, porCandidato }) {
  const itens = useMemo(() => porCandidato ? cands.map(c => ({ nome: nomeDe(c), v: c.total }))
    : porPartido(cands.map(cand => ({ cand })), () => false).map(p => ({ nome: p.partido, v: p.votos })), [cands, porCandidato]);
  const total = itens.reduce((s, i) => s + i.v, 0);
  const partes = partesComResto(itens, CORES, 'var(--s0)').map(p => ({ ...p, rotulo: comParcela(p.v, total) }));
  const que = porCandidato ? 'válidos por candidato' : 'nominais por partido';
  return html`<${Cartao} tipo="Rosca" titulo=${`Votos ${que}`} sub=${`${nf.format(total)} votos ${porCandidato ? 'válidos' : 'nominais'}`}
      nota=${`Fatias com legenda em lista: a cor identifica, o número confirma. ${partes.length > 4 ? 'As menores somam em "Outros".' : ''}`}>
    <${Rosca} partes=${partes} centro=${{ rotulo: porCandidato ? 'Válidos' : 'Nominais', valor: nf.format(total) }}
      descricao=${`Votos ${que}: ${partes.map(p => `${p.nome} ${nf.format(p.v)}`).join(', ')}`} /><//>`;
}

export function QuemVotouEmQuem({ cfg, cands, ctx }) {
  if (!cands.length) return null;
  const majoritario = cfg.ehMajoritario(cands[0]);
  return html`<${Bloco} id="b-quem" titulo="Quem votou em quem" colunas="metade"
      lede="Rosca e pizza servem para parte de um todo. A rosca leva o total no centro; a pizza, quando o todo é o eleitorado inteiro.">
    <${RoscaDosVotos} cands=${cands} porCandidato=${majoritario || cands.length <= MUITOS} />
    ${ctx?.comparecimento && html`<${PizzaDoEleitorado} comparecimento=${ctx.comparecimento} />`}
    ${majoritario && html`<${SerieDosColocados} cfg=${cfg} />`}<//>`;
}
