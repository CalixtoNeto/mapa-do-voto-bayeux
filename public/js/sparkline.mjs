// Sparkline: a direção de uma série curta, sem eixos nem grade; o número grande ao lado diz o valor atual.
import { escalaLinear, caminhoDaLinha } from './calculos-svg.mjs';
const { html } = window.htmPreact;

export function Sparkline({ valores, largura = 220, altura = 52, descricao }) {
  if (valores.length < 2) return null;
  const x = escalaLinear([0, valores.length - 1], [4, largura - 8]), y = escalaLinear([Math.min(...valores), Math.max(...valores)], [altura - 6, 6]);
  const pontos = valores.map((v, i) => [x(i), y(v)]), ultimo = pontos[pontos.length - 1];
  return html`<svg class="sparkline" width=${largura} height=${altura} viewBox=${`0 0 ${largura} ${altura}`} role="img" aria-label=${descricao}>
    <path d=${caminhoDaLinha(pontos)} /><circle cx=${ultimo[0]} cy=${ultimo[1]} r="3.4" /></svg>`;
}
