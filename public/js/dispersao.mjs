// Dispersão simples (eixos lineares): um ponto por pessoa, com o nome ao passar o cursor e em lista para leitor de tela.
import { marcasDoEixo, escalaLinear } from './calculos-svg.mjs';
import { usarLargura } from './medidas.mjs';
const { html } = window.htmPreact;

const E = 44, D = 12, T = 12, B = 34;
// pontos: [{ n, x, y }]; eixos: { x: { titulo, formato }, y: { titulo, formato } }; os dois eixos começam em zero.
export function Dispersao({ pontos, eixos, descricao, altura = 240 }) {
  const [ref, w] = usarLargura();
  const mx = marcasDoEixo(Math.max(...pontos.map(p => p.x)), 4), my = marcasDoEixo(Math.max(...pontos.map(p => p.y)), 4);
  const x = escalaLinear([0, mx[mx.length - 1]], [E, w - D]), y = escalaLinear([0, my[my.length - 1]], [altura - B, T]);
  return html`<div class="dispersao" ref=${ref}><svg width=${w} height=${altura} viewBox=${`0 0 ${w} ${altura}`} role="img" aria-label=${descricao}>
    ${my.map(m => html`<g class="malha"><line x1=${E} x2=${w - D} y1=${y(m)} y2=${y(m)} /><text x=${E - 6} y=${y(m) + 3.5} text-anchor="end">${eixos.y.formato(m)}</text></g>`)}
    ${mx.map(m => html`<text class="eixo-x" x=${x(m)} y=${altura - B + 15} text-anchor="middle">${eixos.x.formato(m)}</text>`)}
    <text class="titulo-eixo" x=${(E + w - D) / 2} y=${altura - 4} text-anchor="middle">${eixos.x.titulo}</text>
    ${pontos.map(p => html`<circle cx=${x(p.x)} cy=${y(p.y)} r="4.5"><title>${p.n}: ${eixos.x.formato(p.x)} · ${eixos.y.formato(p.y)}</title></circle>`)}</svg>
    <ul class="so-leitor">${pontos.map(p => html`<li>${p.n}: ${eixos.x.titulo} ${eixos.x.formato(p.x)}; ${eixos.y.titulo} ${eixos.y.formato(p.y)}</li>`)}</ul></div>`;
}
