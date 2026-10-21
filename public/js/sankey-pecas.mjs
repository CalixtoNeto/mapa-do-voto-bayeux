// Peças do diagrama de fluxo: cor dos nós, escolha dos rótulos que cabem e a faixa curva entre dois nós.
import { classeDoCalor } from './calculos-svg.mjs';
import { pct } from './formato.mjs';
const { html } = window.htmPreact;

export const curta = (texto, limite) => texto.length > limite ? texto.slice(0, limite - 1).trimEnd() + '…' : texto;

// Pontas em azul (mais escuro = mais valor), nós do meio em tinta e o que for alerta em vermelho.
export function coresDosNos(nos, ultima) {
  const raizes = nos.map(n => Math.sqrt(n.v)), [menor, maior] = [Math.min(...raizes), Math.max(...raizes)];
  return new Map(nos.map((n, i) => [n.id, n.alerta ? 'var(--down)' : n.coluna > 0 && n.coluna < ultima ? 'var(--ink)' : `var(--r${2 + classeDoCalor(raizes[i], menor, maior, 4)})`]));
}

// Em cada coluna, quem ficar a menos de 13px do rótulo de cima perde o texto.
export function nosComRotulo(nos) {
  let ultimo = -99;
  const porColuna = [...nos].sort((a, b) => a.coluna - b.coluna || a.y - b.y);
  return new Set(porColuna.filter((n, i) => {
    const centro = n.y + n.h / 2, novaColuna = i && porColuna[i - 1].coluna !== n.coluna;
    if (!novaColuna && centro - ultimo < 13) return false;
    ultimo = centro; return true;
  }).map(n => n.id));
}

export function Faixa({ f, de, para, cor, formato }) {
  const meio = (f.x0 + f.x1) / 2;
  return html`<path class="faixa" d=${`M${f.x0},${f.y0}C${meio},${f.y0} ${meio},${f.y1} ${f.x1},${f.y1}`} stroke-width=${Math.max(1, f.h)} style=${`stroke:${cor}`}>
    <title>${`${de.n} → ${para.n}: ${formato(f.v)}`}</title></path>`;
}

// Pontas: texto fora do desenho; meio: texto acima do nó. Duas linhas (nome e valor) quando há altura.
export function Rotulo({ no, ultima, formato, total, limite }) {
  const meio = no.coluna > 0 && no.coluna < ultima, duas = no.h >= 28 || meio;
  const [x, ancora] = meio ? [no.x + no.w / 2, 'middle'] : no.coluna === 0 ? [no.x - 7, 'end'] : [no.x + no.w + 7, 'start'];
  const y = meio ? no.y - 20 : no.y + no.h / 2 + (duas ? -3 : 4);
  return html`<text class="no-texto" x=${x} y=${y} text-anchor=${ancora}><tspan class="no-nome">${curta(no.n, limite)}</tspan>
    ${duas && html`<tspan class="no-valor" x=${x} dy="15">${formato(no.v)}${total ? ` · ${pct(no.v / total, 0)}` : ''}</tspan>`}</text>`;
}
