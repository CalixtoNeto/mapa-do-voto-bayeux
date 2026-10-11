// Panorama de um cargo numa eleição: dinheiro (custo por voto, fundo eleitoral, gasto × votos) e voto
// concentrado ou espalhado. Fundo por partido, perfil e doadores estão em panorama-partidos.mjs; dinheiro e
// eleição, partidos, concentração e fornecedores em panorama-eleitos.mjs; os lugares em panorama-lugares.mjs.
import { nf, dinheiro, centavos } from './formato.mjs';
import { linhasFinanceiras, concentracao, ehEleito } from './calculos.mjs';
import { GraficoGastoVotos } from './grafico-gasto.mjs';
import { nomeDe } from './componentes.mjs';
import { FundoPorPartido, PerfilDoCargo, Doadores } from './panorama-partidos.mjs';
import { DinheiroElege, Partidos, ConcentracaoDoFundo, FornecedoresDoCargo } from './panorama-eleitos.mjs';
import { criarLugaresDoCargo } from './panorama-lugares.mjs';
const { html, useState, useMemo } = window.htmPreact;

const ORDENS = {
  custo: ['Menor custo por voto', l => l.custo != null, (a, b) => a.custo - b.custo, l => centavos(l.custo)],
  caro: ['Maior custo por voto', l => l.custo != null, (a, b) => b.custo - a.custo, l => centavos(l.custo)],
  fefc: ['Mais fundo eleitoral', l => l.fefc > 0, (a, b) => b.fefc - a.fefc, l => dinheiro(l.fefc)],
  recebido: ['Mais dinheiro recebido', l => l.recebido > 0, (a, b) => b.recebido - a.recebido, l => dinheiro(l.recebido)],
  gasto: ['Maior gasto', l => l.gasto > 0, (a, b) => b.gasto - a.gasto, l => dinheiro(l.gasto)],
};

function RankingFinanceiro({ linhas, ordensValidas, selecionado, onPick }) {
  const [ordem, setOrdem] = useState(ordensValidas[0]);
  const [, filtro, comparar, valor] = ORDENS[ordem];
  const lista = linhas.filter(filtro).sort(comparar);
  return html`<div class="analise"><div class="rk-head"><h3>Ranking</h3>
      <select aria-label="Ordenar candidatos" value=${ordem} onChange=${e => setOrdem(e.target.value)}>
        ${ordensValidas.map(o => html`<option value=${o}>${ORDENS[o][0]}</option>`)}</select></div>
    <ol class="lista-cands">${lista.map((l, i) => html`<li class=${l.cand.key === selecionado ? 'on' : ''}><button type="button" onClick=${() => onPick(l.cand)}>
      <span class="pos">${i + 1}</span><span class="nm">${nomeDe(l.cand)}</span>
      <span class="meta">${l.cand.partido || ''} · ${nf.format(l.cand.total)} votos · gastou ${dinheiro(l.gasto)}</span><span class="vv">${valor(l)}</span>
    </button></li>`)}</ol></div>`;
}

function DinheiroDoCargo({ cfg, cands, financas, ano, selecionado, onPick, eleito }) {
  const linhas = useMemo(() => financas ? linhasFinanceiras(cands, financas, cfg.chaveDe) : [], [cands, financas]);
  const fora = cands[0] ? cfg.foraDasFinancas(cands[0]) : '';
  if (fora) return html`<p class="hint">${fora}</p>`;
  if (!financas) return html`<p class="hint">${+ano < 2018 ? 'O TSE publica a prestação de contas dos candidatos neste formato a partir de 2018.' : 'A prestação de contas desta eleição ainda não foi gerada para o site.'}</p>`;
  const comGasto = linhas.filter(l => l.gasto > 0);
  const gasto = comGasto.reduce((s, l) => s + l.gasto, 0), votos = comGasto.reduce((s, l) => s + l.cand.total, 0);
  return html`<dl class="stats">
      <div><dt>Fundo eleitoral recebido</dt><dd>${dinheiro(linhas.reduce((s, l) => s + l.fefc, 0))}</dd></div>
      <div><dt>Gasto declarado</dt><dd>${dinheiro(gasto)}</dd></div>
      <div><dt>Custo médio por voto</dt><dd>${votos ? centavos(gasto / votos) : '—'}</dd></div>
      <div><dt>Candidatos com gastos</dt><dd>${comGasto.length} de ${cands.length}</dd></div></dl>
    ${!financas.final && html`<p class="aviso" role="note">Prestação de contas parcial: a final é entregue até 30 dias depois da eleição e os números ainda vão mudar.</p>`}
    <${GraficoGastoVotos} linhas=${linhas} selecionado=${selecionado} onPick=${k => onPick(cands.find(c => c.key === k))} eleito=${eleito} />
    <${RankingFinanceiro} linhas=${linhas} ordensValidas=${Object.keys(ORDENS)} selecionado=${selecionado} onPick=${onPick} />`;
}

function Redutos({ cfg, cands, selecionado, onPick }) {
  const [ordem, setOrdem] = useState('reduto');
  const linhas = useMemo(() => {
    const soma = cands.reduce((s, c) => s + c.total, 0);
    return cands.filter(c => c.total >= soma * 0.005).slice(0, 60).map(cand => ({ cand, ...concentracao(cfg.votosDe(cand)) }));
  }, [cands]);
  if (linhas.length < 2) return null;
  const lista = [...linhas].sort((a, b) => ordem === 'reduto' ? a.efetivo - b.efetivo : b.efetivo - a.efetivo);
  const casas = v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return html`<section class="analise" aria-labelledby="rd"><div class="rk-head"><h2 id="rd">Voto de reduto ou espalhado</h2>
      <select aria-label="Ordenar" value=${ordem} onChange=${e => setOrdem(e.target.value)}><option value="reduto">Mais concentrados</option><option value="espalhado">Mais espalhados</option></select></div>
    <ol class="lista-cands">${lista.map((l, i) => html`<li class=${l.cand.key === selecionado ? 'on' : ''}><button type="button" onClick=${() => onPick(l.cand)}>
      <span class="pos">${i + 1}</span><span class="nm">${nomeDe(l.cand)}</span>
      <span class="meta">${nf.format(l.cand.total)} votos · metade em ${l.metade} ${l.metade === 1 ? cfg.lugarNome : cfg.lugaresNome}</span><span class="vv">${casas(l.efetivo)}</span></button></li>`)}</ol>
    <p class="hint">Número efetivo de ${cfg.lugaresNome}: perto de 1, o voto vem quase todo de um lugar; quanto maior, mais espalhado. Só candidatos com pelo menos 0,5% dos votos do cargo.</p></section>`;
}

export function criarPanorama(cfg) {
  const LugaresDoCargo = criarLugaresDoCargo(cfg);
  // cands: os candidatos do cargo no turno mostrado, como o site os monta (com partido); ctx: contexto.mjs.
  return function Panorama({ cands, ano, financas, perfis, selecionado, onPick, ctx }) {
    const eleito = c => ehEleito(c.sit || perfis?.c?.[cfg.chaveDe(c)]?.s);
    const linhas = useMemo(() => linhasFinanceiras(cands, financas, cfg.chaveDe), [cands, financas]);
    return html`<section class="analise" aria-labelledby="dc"><h2 id="dc">Dinheiro da campanha</h2>
        <${DinheiroDoCargo} cfg=${cfg} cands=${cands} financas=${financas} ano=${ano} selecionado=${selecionado} onPick=${onPick} eleito=${eleito} /></section>
      ${financas && perfis && html`<${FundoPorPartido} cfg=${cfg} cands=${cands} financas=${financas} perfis=${perfis} />`}
      ${perfis && html`<${PerfilDoCargo} cfg=${cfg} cands=${cands} perfis=${perfis} />`}
      ${ctx && html`<${DinheiroElege} linhas=${financas ? linhas : []} ctx=${ctx} />`}
      ${ctx && html`<${Partidos} linhas=${linhas} ctx=${ctx} onPick=${onPick} />`}
      ${ctx && html`<${ConcentracaoDoFundo} linhas=${financas ? linhas : []} ctx=${ctx} />`}
      <${Redutos} cfg=${cfg} cands=${cands} selecionado=${selecionado} onPick=${onPick} />
      ${ctx && html`<${LugaresDoCargo} ctx=${ctx} />`}
      ${financas && html`<${Doadores} cfg=${cfg} cands=${cands} financas=${financas} onPick=${onPick} />`}
      ${financas && html`<${FornecedoresDoCargo} cfg=${cfg} cands=${cands} financas=${financas} onPick=${onPick} />`}`;
  };
}
