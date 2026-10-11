// Lista dos mais votados ao lado do mapa: cada candidato abre nos lugares onde teve voto; o primeiro não eleito fica em destaque.
import { nf } from './formato.mjs';
import { rankingComMarca, doisPrimeiros } from './calculos-votos.mjs';
import { arvoreDeCandidatos } from './calculos-arvores-votos.mjs';
import { parcelaDe } from './calculos-arvores-dinheiro.mjs';
import { ArvoreDoCargo, opcoesDosLugares } from './arvore-do-cargo.mjs';
import { Cartao } from './cartao.mjs';
const { html, useMemo, useState } = window.htmPreact;

const NO_INICIO = 10;

export function criarMaisVotados(cfg) {
  return function MaisVotados({ cands, ctx, onPick }) {
    const [todos, setTodos] = useState(false);
    const validos = useMemo(() => doisPrimeiros(cands, 0).validos, [cands]);
    const { itens, temEleitos } = useMemo(() => rankingComMarca(cands, ctx?.eleito || (() => false), todos ? cands.length : NO_INICIO), [cands, ctx, todos]);
    const arvore = useMemo(() => ctx && arvoreDeCandidatos(itens.map(i => ({ cand: i.cand,
      nota: [`${parcelaDe(i.cand.total / validos)} dos votos`, i.cand.partido, temEleitos && (i.eleito ? 'eleito' : 'não eleito')].filter(Boolean).join(' · ') })),
      opcoesDosLugares(cfg, ctx.ds)), [itens, ctx, validos]);
    if (!cands.length || !arvore) return null;
    const fora = itens.find(i => i.destaque)?.cand.key;
    return html`<${Cartao} tipo="Árvore de barras · ranking" titulo=${todos ? 'Todos os candidatos' : `Os ${Math.min(NO_INICIO, cands.length)} mais votados`}
        sub=${temEleitos ? 'Votos. Fundo vermelho: o não eleito com mais votos.' : 'Votos nominais.'}
        nota=${`Toque num candidato para ver de quais ${cfg.lugaresNome} vieram os votos dele; a barra compara com o maior da lista e a porcentagem é sobre os votos dos candidatos do cargo. Dentro do candidato, a porcentagem é a parcela dos votos dele em cada ${cfg.lugarNome}.`}>
      <${ArvoreDoCargo} arvore=${arvore} formato=${nf.format} onPick=${onPick} ativo=${k => k === fora}
        legenda=${`Candidato → ${cfg.lugarNome} · votos · % dos votos`} />
      ${cands.length > NO_INICIO && html`<button type="button" class="link" onClick=${() => setTodos(t => !t)}>${todos ? 'Ver só os mais votados' : `Ver todos (${cands.length})`}</button>`}
    <//>`;
  };
}
