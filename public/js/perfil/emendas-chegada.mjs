// Emendas: quanto chegou a Bayeux em cada ano, de onde veio no ano mais recente, quem mandou e quem recebeu.
import { dinheiro, pct } from '../formato.mjs';
import { Bloco } from '../estrutura.mjs';
import { Cartao } from '../cartao.mjs';
import { LinhaDoTempo } from '../linha-do-tempo.mjs';
import { Treemap } from '../treemap.mjs';
import { Ranking } from '../ranking.mjs';
import { ArvoreDeBarras } from '../arvore.mjs';
import { autorDoPico } from './calculos-emendas.mjs';
import { agruparPequenos, comParticipacao, pontosDeDestaque, rotulosEspacados } from './calculos-fatias.mjs';
import { anoParcial } from './calculos-municipio.mjs';
import { participacao } from './formato-perfil.mjs';
import { OrigemDasEmendas } from './origem-das-emendas.mjs';
import { nomeProprio } from './pecas.mjs';
const { html } = window.htmPreact;

function PorAno({ r, recente }) {
  const anos = r.porAno, pico = autorDoPico(r.arvore, anos), parcial = recente && anos[anos.length - 1][0] === recente.ano && anoParcial(recente);
  const serie = { nome: 'Recebido', cor: 'var(--r5)', parcial, formato: v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }), pontos: anos.map(([a, v]) => [Number(a), v / 1e6]) };
  serie.rotulos = pontosDeDestaque(serie.pontos);
  return html`<${Cartao} tipo="Série temporal · área" titulo=${`Emendas recebidas por ano, ${anos[0][0]} a ${anos[anos.length - 1][0]}`}
    sub=${`R$ milhões.${parcial ? ` Tracejado: ${recente.ano}, parcial.` : ''}`}
    nota=${pico && `O ponto mais alto é ${pico.ano} (${dinheiro(pico.valor)}): a maior origem naquele ano foi ${nomeProprio(pico.autor)}, com ${dinheiro(pico.v)} (${pct(pico.fracao, 0)}).`}>
    <${LinhaDoTempo} area series=${[serie]} rotulosX=${rotulosEspacados(anos.map(([a]) => [Number(a), a]))} descricao="Emendas recebidas em cada ano" /><//>`;
}

export function QuantoChegou({ r, recente }) {
  const origens = recente?.receitas?.origensDasEmendas || [];
  return html`<${Bloco} id="eq" titulo="Quanto chegou e quando" colunas="dois-tercos"
    lede="A série anual em área e, ao lado, a origem do que entrou no caixa no ano mais recente, em barra empilhada.">
    <${PorAno} r=${r} recente=${recente} />
    ${origens.length > 0 && html`<${Cartao} tipo="Barra empilhada · composição" titulo=${`Origem do que entrou em ${recente.ano}`} sub=${`${dinheiro(recente.receitas.emendas)}. Cada cor é uma origem.`}>
      <${OrigemDasEmendas} origens=${origens} /><//>`}<//>`;
}

const rotuloDoRecebido = (nome, nivel) => nivel < 2 ? nomeProprio(nome) : nome;

function Autores({ r }) {
  const itens = agruparPequenos(r.porAutor.map(([n, v]) => ({ n: nomeProprio(n), v })), 0.02), total = itens.reduce((s, i) => s + i.v, 0);
  return html`<${Cartao} tipo="Treemap · árvore de autores" titulo="Recebido por autor da emenda" sub=${`${dinheiro(total)} desde ${r.porAno[0][0]}. A área é proporcional ao valor.`}
    nota="Autores abaixo de 2% do total ficam agrupados em “Outros”. Cor mais escura = valor maior.">
    <${Treemap} itens=${itens} formato=${dinheiro} altura=${340} descricao="Valor recebido por autor da emenda" /><//>`;
}

function QuemRecebeu({ r }) {
  const lista = comParticipacao(r.porFavorecido.map(([nome, natureza, v]) => ({ n: nomeProprio(nome), natureza, v }))), total = lista.reduce((s, i) => s + i.v, 0);
  return html`<${Cartao} tipo="Barra horizontal · ranking" titulo="Quem recebeu" sub="Favorecidos, R$ milhões. A barra compara o valor.">
    <${Ranking} descricao="Quem recebeu as emendas" itens=${lista.map(i => ({ n: i.n, nota: i.natureza, v: i.v, rotulo: dinheiro(i.v), lado: participacao(i.v, total) }))} /><//>`;
}

export function QuemMandou({ r }) {
  return html`<${Bloco} id="er" titulo="Quem mandou e quem recebeu" colunas="dois-tercos"
    lede="O treemap mostra o peso de cada autor; o ranking ao lado mostra para quem foi o dinheiro.">
    <${Autores} r=${r} /><${QuemRecebeu} r=${r} />
    ${r.arvore?.v > 0 && html`<${Cartao} classe="largo" tipo="Árvore expansível" titulo="Do autor até quem recebeu" sub="Autor da emenda → quem recebeu → ano. Toque num item para abrir."
      nota="Pagamentos a pessoas físicas aparecem somados, sem os nomes.">
      <div class="arvore"><${ArvoreDeBarras} arvore=${r.arvore} rotulo=${rotuloDoRecebido} /></div><//>`}<//>`;
}
