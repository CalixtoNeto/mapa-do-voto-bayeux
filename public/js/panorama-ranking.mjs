// Lista dos mais votados ao lado do mapa: barra de votos, marca de eleito e o primeiro não eleito em destaque.
import { nf, pct } from './formato.mjs';
import { nomeDe } from './componentes.mjs';
import { rankingComMarca, doisPrimeiros } from './calculos-votos.mjs';
import { RankingDeBarras } from './ranking-barras.mjs';
import { Cartao } from './cartao.mjs';
const { html, useMemo, useState } = window.htmPreact;

const NO_INICIO = 10;

export function MaisVotados({ cands, ctx, onPick }) {
  const [todos, setTodos] = useState(false);
  const validos = useMemo(() => doisPrimeiros(cands, 0).validos, [cands]);
  const { itens, temEleitos } = useMemo(() => rankingComMarca(cands, ctx?.eleito || (() => false), todos ? cands.length : NO_INICIO), [cands, ctx, todos]);
  if (!cands.length) return null;
  const linhas = itens.map(i => ({ n: nomeDe(i.cand), v: i.cand.total, rotulo: nf.format(i.cand.total), parcela: pct(i.cand.total / validos, 1),
    posicao: i.posicao, destaque: i.destaque, marca: temEleitos ? (i.eleito ? 'eleito' : 'não eleito') : '', nota: i.cand.partido, aoClicar: () => onPick(i.cand) }));
  return html`<${Cartao} tipo="Barra horizontal · ranking" titulo=${todos ? 'Todos os candidatos' : `Os ${Math.min(NO_INICIO, cands.length)} mais votados`}
      sub=${temEleitos ? 'Votos. Fundo vermelho: o não eleito com mais votos.' : 'Votos nominais.'}
      nota="A barra mede os votos do candidato (o maior ocupa a linha toda); a porcentagem é sobre os votos dos candidatos do cargo. Toque num nome para vê-lo no mapa.">
    <${RankingDeBarras} itens=${linhas} descricao="Candidatos do mais ao menos votado" />
    ${cands.length > NO_INICIO && html`<button type="button" class="link" onClick=${() => setTodos(t => !t)}>${todos ? 'Ver só os mais votados' : `Ver todos (${cands.length})`}</button>`}
  <//>`;
}
