// Diagrama de fluxo (Sankey): a espessura de cada faixa é o valor que passa de um nó ao seguinte. Nós pequenos ficam sem texto
// (o título e a lista para leitor de tela dizem todos os valores). Em tela estreita o desenho rola na horizontal.
import { sankey } from './calculos-sankey.mjs';
import { coresDosNos, nosComRotulo, Faixa, Rotulo } from './sankey-pecas.mjs';
import { usarLargura } from './medidas.mjs';
const { html } = window.htmPreact;

const LARGURA_MINIMA = 340, ALTURA_POR_NO = 24, TOPO = 30;
const somaDe = (nos, coluna) => nos.filter(n => n.coluna === coluna).reduce((s, n) => s + n.v, 0);

function medir(grafo, medida, altura) {
  const largura = Math.max(medida, LARGURA_MINIMA), margem = Math.min(170, Math.max(88, Math.round(largura * 0.25)));
  const alto = Math.max(altura, ALTURA_POR_NO * Math.max(...grafo.colunas.map(c => c.length)));
  return { largura, margem, alto, desenho: sankey(grafo, largura - 2 * margem - 14, alto) };
}

// grafo: { colunas: [[{ id, n, alerta? }]], fluxos: [{ de, para, v }] }; formato(v) escreve o valor.
export function Sankey({ grafo, formato, descricao, altura = 360 }) {
  const [ref, medida] = usarLargura(), { largura, margem, alto, desenho } = medir(grafo, medida, altura);
  const { nos, fluxos } = desenho, ultima = grafo.colunas.length - 1, nome = new Map(nos.map(n => [n.id, n]));
  const cores = coresDosNos(nos, ultima), visiveis = nosComRotulo(nos), limite = Math.floor((margem - 10) / 6.4), comPct = margem >= 120;
  return html`<div class="sankey" ref=${ref}><div class="sankey-rolagem"><svg width=${largura} height=${alto + TOPO + 4} role="img" aria-label=${descricao}>
    <g transform=${`translate(${margem + 7} ${TOPO})`}>
      ${fluxos.map(f => html`<${Faixa} f=${f} de=${nome.get(f.de)} para=${nome.get(f.para)} formato=${formato} cor=${cores.get(nome.get(f.de).coluna === 0 ? f.de : f.para)} />`)}
      ${nos.map(n => html`<rect class="no" x=${n.x} y=${n.y} width=${n.w} height=${Math.max(1, n.h)} style=${`fill:${cores.get(n.id)}`}><title>${`${n.n}: ${formato(n.v)}`}</title></rect>`)}
      ${nos.filter(n => visiveis.has(n.id)).map(n => html`<${Rotulo} no=${n} ultima=${ultima} formato=${formato} limite=${limite}
        total=${comPct && (n.coluna === 0 || n.coluna === ultima) ? somaDe(nos, n.coluna) : 0} />`)}
    </g></svg></div>
    <ul class="so-leitor">${fluxos.map(f => html`<li>${nome.get(f.de).n} para ${nome.get(f.para).n}: ${formato(f.v)}</li>`)}</ul></div>`;
}
