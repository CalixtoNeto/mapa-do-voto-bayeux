// Treemap: a área de cada bloco é proporcional ao valor; quanto mais escuro, maior. Blocos pequenos ficam sem texto
// (o título e a lista para leitor de tela dizem todos os valores).
import { treemap, classeDoCalor } from './calculos-svg.mjs';
import { pct } from './formato.mjs';
import { usarLargura } from './medidas.mjs';
const { html } = window.htmPreact;

// itens: [{ n, v }]; formato(v) escreve o valor.
export function Treemap({ itens, formato, descricao, altura = 280 }) {
  const [ref, largura] = usarLargura();
  const blocos = treemap(itens, largura, altura), total = blocos.reduce((s, b) => s + b.v, 0);
  const raiz = blocos.map(b => Math.sqrt(b.v)), [menor, maior] = [Math.min(...raiz), Math.max(...raiz)];
  return html`<div class="treemap" ref=${ref} style=${`height:${altura}px`} role="img" aria-label=${descricao}>
      ${blocos.map((b, i) => html`<div class=${'bloco-tm c' + classeDoCalor(raiz[i], menor, maior, 6)} title=${`${b.n}: ${formato(b.v)} (${pct(b.v / total, 1)})`}
        style=${`left:${b.x}px;top:${b.y}px;width:${Math.max(0, b.w - 2)}px;height:${Math.max(0, b.h - 2)}px`}>
        ${b.w > 84 && b.h > 46 && html`<b>${b.n}</b><span>${formato(b.v)}</span><small>${pct(b.v / total, 1)}</small>`}</div>`)}
    </div>
    <ul class="so-leitor">${blocos.map(b => html`<li>${b.n}: ${formato(b.v)}, ${pct(b.v / total, 1)}</li>`)}</ul>`;
}
