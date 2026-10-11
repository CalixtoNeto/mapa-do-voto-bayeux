// Série no tempo em SVG desenhado na largura real: linhas (e área sob a primeira), valor em cada ponto, nome da série
// na ponta e o trecho em andamento tracejado.
import { marcasDoEixo, escalaLinear, caminhoDaLinha, pontosDaArea, separarRotulos } from './calculos-svg.mjs';
import { usarLargura } from './medidas.mjs';
const { html } = window.htmPreact;

const E = 40, D = 70, T = 24, B = 28;
function Serie({ s, x, y, area, rotular }) {
  const pts = s.pontos.map(p => p && [x(p[0]), y(p[1])]), reais = pts.filter(Boolean);
  const corpo = s.parcial ? pts.slice(0, -1) : pts, ponta = s.parcial ? pts.slice(-2) : [];
  return html`<g class="serie" style=${`--cor:${s.cor}`}>
    ${area && html`<path class="area" d=${pontosDaArea(reais, y(0))} />`}
    <path class="linha" d=${caminhoDaLinha(corpo)} />${ponta.length > 0 && html`<path class="linha tracejada" d=${caminhoDaLinha(ponta)} />`}
    ${s.pontos.map((p, k) => p && html`<circle cx=${pts[k][0]} cy=${pts[k][1]} r="2.6" class=${s.parcial && k === s.pontos.length - 1 ? 'vazado' : ''} />`)}
    ${rotular.map(k => s.pontos[k] && html`<text class="valor" x=${pts[k][0]} y=${pts[k][1] - 8} text-anchor="middle">${s.formato(s.pontos[k][1])}</text>`)}
  </g>`;
}

// series: [{ nome, cor, pontos: [[x, y] | null], formato(y), parcial? }]; rotulosX: [[x, texto]].
export function LinhaDoTempo({ series, rotulosX, formatoEixo = String, descricao, altura = 240, area = false }) {
  const [ref, w] = usarLargura();
  const maximo = Math.max(1e-9, ...series.flatMap(s => s.pontos.filter(Boolean).map(p => p[1])));
  const marcas = marcasDoEixo(maximo, 4), xs = rotulosX.map(r => r[0]);
  const x = escalaLinear([Math.min(...xs), Math.max(...xs)], [E, w - D]), y = escalaLinear([0, marcas[marcas.length - 1]], [altura - B, T]);
  const poucos = series.every(s => s.pontos.length <= 10);
  const pontas = series.map(s => s.pontos.length - 1 - [...s.pontos].reverse().findIndex(Boolean));
  const ys = separarRotulos(series.map((s, i) => y(s.pontos[pontas[i]][1])));
  return html`<div class="linha-tempo" ref=${ref}><svg width=${w} height=${altura} viewBox=${`0 0 ${w} ${altura}`} role="img" aria-label=${descricao}>
    ${marcas.map(m => html`<g class="malha"><line x1=${E} x2=${w - D} y1=${y(m)} y2=${y(m)} /><text x=${E - 8} y=${y(m) + 3.5} text-anchor="end">${formatoEixo(m)}</text></g>`)}
    ${rotulosX.map(([v, t]) => html`<text class="eixo-x" x=${x(v)} y=${altura - 8} text-anchor="middle">${t}</text>`)}
    ${series.map((s, i) => html`<${Serie} s=${s} x=${x} y=${y} area=${area && i === 0} rotular=${poucos ? s.pontos.map((_, k) => k) : [pontas[i]]} />`)}
    ${series.map((s, i) => html`<text class="nome-serie" style=${`fill:${s.cor}`} x=${x(s.pontos[pontas[i]][0]) + 10} y=${ys[i] + 4}>${s.nome}</text>`)}
  </svg>
  <ul class="so-leitor">${series.map(s => html`<li>${s.nome}: ${s.pontos.filter(Boolean).map(p => `${p[0]}, ${s.formato(p[1])}`).join('; ')}</li>`)}</ul></div>`;
}
