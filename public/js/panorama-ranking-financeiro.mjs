// Candidato por candidato: o ranking de dinheiro (recebido, gasto, fundo eleitoral, custo por voto) com a ordem à escolha;
// cada candidato abre nas categorias de gasto e nos fornecedores.
import { nf, dinheiro, centavos } from './formato.mjs';
import { nomeDe, usarLimite } from './componentes.mjs';
import { Cartao } from './cartao.mjs';
import { ArvoreDoCargo } from './arvore-do-cargo.mjs';
import { arvoreDosCandidatosPeloDinheiro } from './calculos-arvores-dinheiro.mjs';
const { html, useMemo, useState } = window.htmPreact;

// [rótulo, filtro, ordem, valor, formato, valor em reais por voto?]
const ORDENS = {
  custo: ['Menor custo por voto', l => l.custo != null, (a, b) => a.custo - b.custo, l => l.custo, centavos, true],
  caro: ['Maior custo por voto', l => l.custo != null, (a, b) => b.custo - a.custo, l => l.custo, centavos, true],
  fefc: ['Mais fundo eleitoral', l => l.fefc > 0, (a, b) => b.fefc - a.fefc, l => l.fefc, dinheiro, false],
  recebido: ['Mais dinheiro recebido', l => l.recebido > 0, (a, b) => b.recebido - a.recebido, l => l.recebido, dinheiro, false],
  gasto: ['Maior gasto', l => l.gasto > 0, (a, b) => b.gasto - a.gasto, l => l.gasto, dinheiro, false],
};
const notaDe = l => `${l.cand.partido || ''} · ${nf.format(l.cand.total)} votos · gastou ${dinheiro(l.gasto)}`.replace(/^ · /, '');

export function RankingFinanceiro({ linhas, financas, selecionado, onPick, cfg }) {
  const [ordem, setOrdem] = useState('gasto');
  const [, filtro, comparar, valorDe, formato, porVoto] = ORDENS[ordem];
  const lista = useMemo(() => linhas.filter(filtro).sort(comparar), [linhas, ordem]);
  const [limite, botao] = usarLimite(lista.length);
  const arvore = useMemo(() => arvoreDosCandidatosPeloDinheiro(lista.slice(0, limite), financas, cfg.chaveDe,
    { nomeDe, valorDe, porVoto, nota: notaDe, ficha: true }), [lista, limite, financas]);
  return html`<${Cartao} tipo="Árvore de barras · ordem à escolha" titulo="Candidato por candidato" sub="Escolha o critério; toque num candidato para ver para onde foi o dinheiro dele."
      nota="Dentro do candidato, a porcentagem é sobre o gasto dele; no custo por voto, as categorias vêm em reais por voto. Custo por voto é gasto dividido pelos votos: uma conta do site, não um julgamento sobre as campanhas.">
    <select aria-label="Ordenar candidatos" value=${ordem} onChange=${e => setOrdem(e.target.value)}>
      ${Object.keys(ORDENS).map(o => html`<option value=${o}>${ORDENS[o][0]}</option>`)}</select>
    <${ArvoreDoCargo} arvore=${arvore} formato=${formato} onPick=${onPick} ativo=${k => k === selecionado}
      legenda=${`Candidato → categoria de gasto → fornecedor · ${porVoto ? 'R$ por voto' : 'R$'}`} />${botao}<//>`;
}
