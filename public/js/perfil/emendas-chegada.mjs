// Emendas: quanto chegou a Bayeux em cada ano, de onde veio no ano mais recente, quem mandou e quem recebeu.
import { dinheiro, pct } from '../formato.mjs';
import { Bloco } from '../estrutura.mjs';
import { Cartao } from '../cartao.mjs';
import { LinhaDoTempo } from '../linha-do-tempo.mjs';
import { Treemap } from '../treemap.mjs';
import { Sankey } from '../sankey.mjs';
import { Alternar } from '../alternar.mjs';
import { grafoDasEmendas } from './calculos-fluxo-perfil.mjs';
import { ArvoreComLegenda } from './arvore-legenda.mjs';
import { arvoreDosFavorecidos } from './arvores-emendas.mjs';
import { autorDoPico } from './calculos-emendas.mjs';
import { agruparPequenos, pontosDeDestaque, rotulosEspacados } from './calculos-fatias.mjs';
import { anoParcial } from './calculos-municipio.mjs';
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
  const itens = agruparPequenos(r.porAutor.map(([n, v]) => ({ n: nomeProprio(n), v })), 0.02), total = itens.reduce((s, i) => s + i.v, 0), grafo = grafoDasEmendas(r.arvore);
  const treemap = html`<${Treemap} itens=${itens} formato=${dinheiro} altura=${340} descricao="Valor recebido por autor da emenda" />`;
  return html`<${Cartao} tipo="Treemap · fluxo" titulo="Recebido por autor da emenda" sub=${`${dinheiro(total)} desde ${r.porAno[0][0]}. Em blocos, a área é proporcional ao valor; em fluxo, a faixa liga o autor a quem recebeu.`}
    nota="Autores abaixo de 2% do total ficam agrupados em “Outros” nos blocos; no fluxo aparecem os oito maiores de cada lado. Cor mais escura = valor maior.">
    ${grafo ? html`<${Alternar} rotulo="Forma de ver as emendas por autor" visoes=${[{ id: 'blocos', rotulo: 'Blocos', corpo: treemap },
      { id: 'fluxo', rotulo: 'Fluxo', corpo: html`<${Sankey} grafo=${grafo} formato=${dinheiro} altura=${380} descricao="Valor das emendas por autor e favorecido" />` }]} />` : treemap}<//>`;
}

function QuemRecebeu({ r }) {
  const arvore = arvoreDosFavorecidos(r.arvore, r.porFavorecido);
  return html`<${Cartao} tipo="Árvore expansível" titulo="Quem recebeu" sub=${`${dinheiro(arvore.v)} desde ${r.porAno[0][0]}.`}
    nota="A barra compara com o maior do mesmo nível. Pagamentos a pessoas físicas aparecem somados, sem os nomes.">
    <${ArvoreComLegenda} legenda="Favorecido → autor → ano · R$" arvore=${arvore} rotulo=${rotuloDoRecebido} escala="maior" /><//>`;
}

export function QuemMandou({ r }) {
  return html`<${Bloco} id="er" titulo="Quem mandou e quem recebeu" colunas="dois-tercos"
    lede="O treemap mostra o peso de cada autor; a árvore ao lado mostra para quem foi o dinheiro e quem mandou.">
    <${Autores} r=${r} /><${QuemRecebeu} r=${r} />
    ${r.arvore?.v > 0 && html`<${Cartao} classe="largo" tipo="Árvore expansível" titulo="Do autor até quem recebeu" sub="A mesma conta vista do lado de quem mandou."
      nota="Pagamentos a pessoas físicas aparecem somados, sem os nomes.">
      <${ArvoreComLegenda} legenda="Autor → favorecido → ano · R$" arvore=${r.arvore} rotulo=${rotuloDoRecebido} /><//>`}<//>`;
}
