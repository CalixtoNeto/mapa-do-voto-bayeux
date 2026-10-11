// Emendas com Bayeux como destino: execução por autor e por ano (empenhado × pago), funções e convênios.
import { dinheiro } from '../formato.mjs';
import { Bloco } from '../estrutura.mjs';
import { Cartao } from '../cartao.mjs';
import { ColunasSobrepostas } from '../colunas-pilhas.mjs';
import { Ranking } from '../ranking.mjs';
import { ListaDeConvenios } from './execucao.mjs';
import { ArvoreComLegenda } from './arvore-legenda.mjs';
import { arvoreDaExecucao } from './arvores-emendas.mjs';
import { anosCompletos, funcoesComValor } from './calculos-emendas.mjs';
import { milhoes, participacao } from './formato-perfil.mjs';
import { nomeProprio } from './pecas.mjs';
const { html } = window.htmPreact;

function PorAutor({ e }) {
  const arvore = arvoreDaExecucao(e.porAutor);
  return html`<${Cartao} tipo="Árvore expansível · empenhado e pago" titulo="Por autor" sub=${`${dinheiro(arvore.v)} empenhados.`}
    nota="O valor é o empenhado (reservado); abaixo, a parte já paga e a que ainda não saiu.">
    <${ArvoreComLegenda} legenda="Autor → pago e ainda não pago · R$" arvore=${arvore} escala="maior"
      rotulo=${(nome, nivel) => nivel === 0 ? nomeProprio(nome) : nome} /><//>`;
}

function PorAno({ e }) {
  const anos = anosCompletos(e.porAno), ultimo = anos.length - 1;
  const itens = anos.map((a, k) => ({ n: k === 0 || k === ultimo ? a.ano : a.ano.slice(2), a: a.empenhado, b: a.pago, rotuloB: milhoes(a.pago) }));
  return html`<${Cartao} tipo="Colunas sobrepostas · série por ano" titulo="Empenhado e pago por ano"
    sub="R$ milhões. Coluna larga e clara: empenhado. Coluna estreita e escura: pago. Anos sem emenda aparecem como traço."
    nota="O rótulo mostra o valor pago no ano.">
    <${ColunasSobrepostas} itens=${itens} descricao=${'Empenhado e pago por ano: ' + anos.filter(a => a.empenhado).map(a => `${a.ano}, empenhado ${dinheiro(a.empenhado)}, pago ${dinheiro(a.pago)}`).join('; ')} /><//>`;
}

function PorFuncao({ e }) {
  const lista = funcoesComValor(e.porFuncao), total = lista.reduce((s, f) => s + f.v, 0);
  return html`<${Cartao} classe="largo" tipo="Barra horizontal · ranking" titulo="Emendas por função" sub="R$ milhões, valores do arquivo de emendas">
    <${Ranking} descricao="Emendas por função" itens=${lista.map(f => ({ n: f.n, v: f.v, rotulo: dinheiro(f.v), lado: participacao(f.v, total) }))} /><//>`;
}

export function Execucao({ e }) {
  const empenhado = e.porAno.reduce((s, a) => s + a[1], 0), pago = e.porAno.reduce((s, a) => s + a[2], 0);
  return html`<${Bloco} id="ed" titulo="Execução das emendas com Bayeux como destino" colunas="um-terco"
    lede=${`${dinheiro(empenhado)} empenhados e ${dinheiro(pago)} pagos. Empenhado é o valor reservado; pago é o que já saiu.`}>
    <${PorAutor} e=${e} /><${PorAno} e=${e} /><${PorFuncao} e=${e} />
    ${e.convenios.length > 0 && html`<${Cartao} classe="largo" tipo="Lista · convênios" titulo="Convênios mais recentes"
      nota="Emendas em que o Portal registra Bayeux como local de aplicação: valor empenhado e pago (com restos a pagar).">
      <${ListaDeConvenios} convenios=${e.convenios} /><//>`}<//>`;
}
