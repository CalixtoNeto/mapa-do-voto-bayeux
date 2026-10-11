// Abstenção ao longo do tempo: duas linhas (eleições municipais e gerais) e as colunas de eleitores aptos de cada eleição.
import { nf, pct } from './formato.mjs';
import { Cartao } from './cartao.mjs';
import { Bloco } from './estrutura.mjs';
import { LinhaDoTempo } from './linha-do-tempo.mjs';
import { ColunasDestacadas } from './colunas-destaque.mjs';
import { serieDeAbstencao, menorAbstencao, abstencaoDaEleicao } from './calculos-series.mjs';
const { html, useMemo } = window.htmPreact;

const mil = v => (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

function textoDaSerie(eleicoes) {
  const menor = menorAbstencao(eleicoes, 'municipal'), gerais = eleicoes.filter(e => e.tipo === 'geral').map(abstencaoDaEleicao);
  const outras = eleicoes.filter(e => e.tipo === 'municipal' && e.ano !== menor?.ano).map(abstencaoDaEleicao);
  const partes = [];
  if (menor && outras.length) partes.push(`${menor.ano} teve a menor abstenção entre as municipais (${pct(menor.taxa)}); nas outras, ficou entre ${pct(Math.min(...outras))} e ${pct(Math.max(...outras))}.`);
  if (gerais.length > 1) partes.push(`Nas gerais, ficou entre ${pct(Math.min(...gerais))} e ${pct(Math.max(...gerais))}.`);
  return `${partes.join(' ')} O eixo começa em zero.`;
}

function SerieDeAbstencao({ eleicoes }) {
  const s = serieDeAbstencao(eleicoes), anos = [...new Set(eleicoes.map(e => e.ano))].sort();
  const serie = (nome, cor, pontos) => pontos.length && { nome, cor, pontos, formato: v => pct(v, 1) };
  const series = [serie('Municipais', 'var(--r5)', s.municipal), serie('Gerais', 'var(--s2)', s.geral)].filter(Boolean);
  return html`<${Cartao} tipo=${`Série temporal · ${series.length > 1 ? 'duas linhas' : 'linha'}`} titulo=${`Abstenção por eleição, ${anos[0]} a ${anos[anos.length - 1]}`}
      sub="% dos eleitores aptos que não compareceram" nota=${textoDaSerie(eleicoes)}>
    <ul class="legenda-linha"><li><i style="background:var(--r5)"></i>Municipais (prefeito)</li>${s.geral.length > 0 && html`<li><i style="background:var(--s2)"></i>Gerais (governador)</li>`}</ul>
    <${LinhaDoTempo} series=${series} rotulosX=${anos.map(a => [+a, a])} formatoEixo=${v => pct(v, 0)}
      descricao=${`Abstenção por eleição: ${series.map(x => `${x.nome}: ${x.pontos.map(p => `${p[0]}, ${pct(p[1], 1)}`).join('; ')}`).join('. ')}`} /><//>`;
}

function ColunasDeAptos({ eleicoes }) {
  const lista = [...eleicoes].sort((a, b) => a.ano - b.ano);
  return html`<${Cartao} tipo="Colunas · eleitores aptos" titulo="Eleitorado por eleição" sub="Milhares de eleitores aptos"
      nota="As colunas escuras são as eleições municipais. A base começa em zero.">
    <${ColunasDestacadas} itens=${lista.map(e => ({ n: e.ano.slice(2), v: e.aptos, rotulo: mil(e.aptos), escuro: e.tipo === 'municipal' }))}
      descricao=${`Eleitores aptos: ${lista.map(e => `${e.ano}, ${nf.format(e.aptos)}`).join('; ')}`} /><//>`;
}

export function AbstencaoAoLongoDoTempo({ eleicoes }) {
  const validas = useMemo(() => eleicoes.filter(e => e.aptos > 0), [eleicoes]);
  if (validas.length < 2) return null;
  return html`<${Bloco} id="b-abstencao" titulo="Abstenção ao longo do tempo" colunas="dois-tercos"
      lede="Série temporal com eixo proporcional: as eleições municipais e as gerais se alternam a cada dois anos e cada uma tem a sua linha.">
    <${SerieDeAbstencao} eleicoes=${validas} /><${ColunasDeAptos} eleicoes=${validas} /><//>`;
}
