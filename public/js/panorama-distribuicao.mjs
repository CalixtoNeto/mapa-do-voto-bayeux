// Cargos com muitos candidatos (vereador, deputado): quantos tiveram quantos votos e como as vagas se dividiram entre os partidos.
import { nf, pct } from './formato.mjs';
import { Cartao } from './cartao.mjs';
import { Bloco } from './estrutura.mjs';
import { Colunas, Waffle } from './graficos.mjs';
import { contarPorFaixa } from './calculos-svg.mjs';
import { gruposDeAssentos } from './calculos-graficos.mjs';
import { cortesDaDistribuicao, candidatosAbaixoDe } from './calculos-votos.mjs';
import { porPartido } from './calculos.mjs';
const { html, useMemo } = window.htmPreact;

function Histograma({ cands }) {
  const votos = cands.map(c => c.total), cortes = cortesDaDistribuicao(Math.max(...votos));
  const faixas = contarPorFaixa(votos, cortes), ultima = faixas[faixas.length - 1];
  const abaixo = candidatosAbaixoDe(votos, cortes[2]);
  return html`<${Cartao} tipo="Colunas · distribuição" titulo="Quantos candidatos tiveram quantos votos" sub=${`Faixas de votos, ${cands.length} candidatos`}
      nota=${`${nf.format(abaixo)} dos ${cands.length} candidatos (${pct(abaixo / cands.length, 0)}) tiveram menos de ${nf.format(cortes[2])} votos. A última coluna, em tom escuro, reúne os ${ultima.n} com ${nf.format(cortes[5])} votos ou mais.`}>
    <${Colunas} itens=${faixas.map(f => ({ n: f.rotulo, v: f.n, rotulo: String(f.n) }))}
      descricao=${`Candidatos por faixa de votos: ${faixas.map(f => `${f.rotulo} votos, ${f.n}`).join('; ')}`} /><//>`;
}

const CORES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];

function ComposicaoDaCasa({ cands, eleito, cargoNome }) {
  const grupos = useMemo(() => gruposDeAssentos(porPartido(cands.map(cand => ({ cand })), eleito), CORES, 'var(--s0)'), [cands, eleito]);
  const total = grupos.reduce((s, g) => s + g.n, 0);
  if (!total || total > 120) return null;
  return html`<${Cartao} tipo="Waffle · assentos" titulo="Como as vagas se dividiram" sub=${`${total} eleitos, um quadrado por ${cargoNome}`}
      nota="Um quadrado por eleito. A legenda é uma lista com o número ao lado: a cor identifica, o número confirma.">
    <${Waffle} grupos=${grupos} descricao=${`${total} eleitos: ${grupos.map(g => `${g.nome} ${g.n}`).join(', ')}`} /><//>`;
}

export function DistribuicaoDosVotos({ cands, ctx }) {
  if (cands.length < 2) return null;
  const cargoNome = String(cands[0].cargoNome || 'candidato').toLowerCase();
  return html`<${Bloco} id="b-distribuicao" titulo=${`${cands[0].cargoNome || 'Candidatos'}: como os votos se espalharam`} colunas="metade"
      lede="Distribuição dos votos em colunas e composição das vagas em waffle.">
    <${Histograma} cands=${cands} />
    ${ctx && html`<${ComposicaoDaCasa} cands=${cands} eleito=${ctx.eleito} cargoNome=${cargoNome} />`}<//>`;
}
