// Candidato por candidato: o ranking de dinheiro (recebido, gasto, fundo eleitoral, custo por voto) com a ordem à escolha.
import { nf, dinheiro, centavos } from './formato.mjs';
import { nomeDe, usarLimite } from './componentes.mjs';
import { Cartao } from './cartao.mjs';
const { html, useState } = window.htmPreact;

const ORDENS = {
  custo: ['Menor custo por voto', l => l.custo != null, (a, b) => a.custo - b.custo, l => centavos(l.custo)],
  caro: ['Maior custo por voto', l => l.custo != null, (a, b) => b.custo - a.custo, l => centavos(l.custo)],
  fefc: ['Mais fundo eleitoral', l => l.fefc > 0, (a, b) => b.fefc - a.fefc, l => dinheiro(l.fefc)],
  recebido: ['Mais dinheiro recebido', l => l.recebido > 0, (a, b) => b.recebido - a.recebido, l => dinheiro(l.recebido)],
  gasto: ['Maior gasto', l => l.gasto > 0, (a, b) => b.gasto - a.gasto, l => dinheiro(l.gasto)],
};

export function RankingFinanceiro({ linhas, selecionado, onPick }) {
  const [ordem, setOrdem] = useState('gasto');
  const [, filtro, comparar, valor] = ORDENS[ordem];
  const lista = linhas.filter(filtro).sort(comparar);
  const [limite, botao] = usarLimite(lista.length);
  return html`<${Cartao} tipo="Lista · ordem à escolha" titulo="Candidato por candidato" sub="Escolha o critério; toque num nome para vê-lo no mapa."
      nota="Custo por voto é gasto dividido pelos votos: uma conta do site, não um julgamento sobre as campanhas.">
    <select aria-label="Ordenar candidatos" value=${ordem} onChange=${e => setOrdem(e.target.value)}>
      ${Object.keys(ORDENS).map(o => html`<option value=${o}>${ORDENS[o][0]}</option>`)}</select>
    <ol class="lista-cands">${lista.slice(0, limite).map((l, i) => html`<li class=${l.cand.key === selecionado ? 'on' : ''}><button type="button" onClick=${() => onPick(l.cand)}>
      <span class="pos">${i + 1}</span><span class="nm">${nomeDe(l.cand)}</span>
      <span class="meta">${l.cand.partido || ''} · ${nf.format(l.cand.total)} votos · gastou ${dinheiro(l.gasto)}</span><span class="vv">${valor(l)}</span>
    </button></li>`)}</ol>${botao}<//>`;
}
