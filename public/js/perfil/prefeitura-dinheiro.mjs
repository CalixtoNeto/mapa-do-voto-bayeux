// Prefeitura: para onde vai o dinheiro (treemap por função e árvore) e a evolução (anos em linha, meses em colunas).
import { dinheiro } from '../formato.mjs';
import { Bloco } from '../estrutura.mjs';
import { Cartao } from '../cartao.mjs';
import { Treemap } from '../treemap.mjs';
import { Sankey } from '../sankey.mjs';
import { Alternar } from '../alternar.mjs';
import { grafoDaPrefeitura } from './calculos-fluxo-perfil.mjs';
import { LinhaDoTempo } from '../linha-do-tempo.mjs';
import { ColunasMensais } from '../colunas-mensais.mjs';
import { ArvoreDeGastos } from './arvore.mjs';
import { pagoDoAno, anoParcial, serieAnualDoMunicipio, mesesDoAno, extremosCompletos } from './calculos-municipio.mjs';
import { nomeDaFuncao, pontosDeDestaque, rotulosEspacados } from './calculos-fatias.mjs';
import { milhoes } from './formato-perfil.mjs';
const { html } = window.htmPreact;

function PagoPorFuncao({ a, funcoes }) {
  const grafo = grafoDaPrefeitura(a), formato = dinheiro;
  const treemap = html`<${Treemap} itens=${funcoes} formato=${formato} altura=${420} descricao=${`Valor pago por função em ${a.ano}`} />`;
  return html`<${Cartao} tipo="Treemap · fluxo" titulo=${`Pago por função, ${a.ano}`} sub=${`${dinheiro(pagoDoAno(a))}. Em blocos, a área é proporcional ao valor; em fluxo, a faixa mostra de qual órgão saiu.`}
    nota="Cor mais escura = valor maior. Blocos e nós pequenos ficam sem rótulo: passe o cursor sobre eles ou use a árvore ao lado.">
    ${grafo ? html`<${Alternar} rotulo="Forma de ver o pago por função" visoes=${[{ id: 'blocos', rotulo: 'Blocos', corpo: treemap },
      { id: 'fluxo', rotulo: 'Fluxo', corpo: html`<${Sankey} grafo=${grafo} formato=${formato} altura=${420} descricao=${`Pago por órgão e por função em ${a.ano}`} />` }]} />` : treemap}<//>`;
}

export function ParaOndeVai({ a, detalhe }) {
  const funcoes = (a.despesas?.funcoes || []).map(([n, v]) => ({ n: nomeDaFuncao(n), v }));
  return html`<${Bloco} id="pa" titulo="Para onde vai o dinheiro" colunas="sessenta"
    lede="Um total que se abre em partes: o treemap mostra o tamanho relativo de cada função, o fluxo liga o órgão que pagou à função; a árvore ao lado abre cada função em tipos de gasto, fornecedores e origens.">
    ${funcoes.length > 0 && html`<${PagoPorFuncao} a=${a} funcoes=${funcoes} />`}
    <${Cartao} tipo="Árvore expansível" titulo="Abra uma função" sub="Do total até quem recebeu">
      <${ArvoreDeGastos} key=${a.ano} arvores=${detalhe?.arvores} ano=${a.ano} /><//>
  <//>`;
}

const comoMi = v => v == null ? null : v / 1e6;
const serie = (nome, cor, valores, parcial, rotulos = pontosDeDestaque(valores)) => ({ nome, cor, parcial, rotulos, pontos: valores, formato: v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) });

function AnoAAno({ anos }) {
  const dados = serieAnualDoMunicipio(anos), parcial = dados.some(d => d.parcial), extremos = extremosCompletos(dados);
  const ponto = campo => dados.map(d => d[campo] == null ? null : [Number(d.ano), comoMi(d[campo])]);
  const [primeiro, ultimo] = [dados[0], dados[dados.length - 1]];
  return html`<${Cartao} tipo="Série temporal · linhas e área" titulo=${`Pago e receitas por ano, ${primeiro.ano} a ${ultimo.ano}`}
    sub=${`R$ milhões.${parcial ? ` Tracejado: ${ultimo.ano}, parcial.` : ''}`}
    nota=${extremos && `A área sob a linha de pago ajuda a ver o ritmo de crescimento: de ${dinheiro(extremos.de.pago)} em ${extremos.de.ano} para ${dinheiro(extremos.ate.pago)} em ${extremos.ate.ano}.`}>
    <${LinhaDoTempo} area series=${[serie('Pago', 'var(--r5)', ponto('pago'), ultimo.parcial), serie('Receitas', 'var(--antes)', ponto('receitas'), ultimo.parcial, false)]}
      rotulosX=${rotulosEspacados(dados.map(d => [Number(d.ano), d.ano]))} descricao="Pago e receitas da Prefeitura em cada ano" /><//>`;
}

function MesAMes({ a }) {
  const meses = mesesDoAno(a), parciais = meses.filter(m => m.parcial).length;
  return html`<${Cartao} tipo="Colunas · série mensal" titulo=${`Pago por mês em ${a.ano}`}
    sub=${`R$ milhões.${parciais ? ` Colunas tracejadas são meses parciais: ainda faltam lançamentos.` : ''}`}
    nota=${anoParcial(a) ? 'Meses sem pagamento aparecem com um traço.' : null}>
    <${ColunasMensais} itens=${meses.map(m => ({ n: m.mes, v: m.v, rotulo: milhoes(m.v), parcial: m.parcial }))}
      descricao=${`Pago em cada mês de ${a.ano}: ` + meses.filter(m => m.v).map(m => `${m.mes}, ${dinheiro(m.v)}${m.parcial ? ' (parcial)' : ''}`).join('; ')} /><//>`;
}

export function AoLongoDoTempo({ anos, a }) {
  return html`<${Bloco} id="pt" titulo="Ao longo do tempo" colunas="dois-tercos"
    lede="Pago e receitas ano a ano, e o que foi pago em cada mês do ano escolhido. O que está tracejado ainda está em andamento.">
    ${anos.some(x => x.despesas) && html`<${AnoAAno} anos=${anos} />`}<${MesAMes} a=${a} /><//>`;
}
