// Gasto declarado × votos, um ponto por candidato, nas duas escalas logarítmicas (os valores vão de
// centenas a milhões). As diagonais marcam custos de R$ 1, 10 e 100 por voto: abaixo da diagonal de
// R$ 10, cada voto custou mais de R$ 10.
import { nf, titleCase, dinheiro, centavos } from './formato.mjs';
const { html, useState, useRef } = window.htmPreact;

const L = 46, R = 12, T = 12, B = 34, W = 360, H = 260;
const potenciasEntre = (min, max) => {
  const lista = [];
  for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) lista.push(10 ** e);
  return lista;
};
const curto = v => v >= 1e6 ? `${v / 1e6} mi` : v >= 1e3 ? `${v / 1e3} mil` : String(v);

function escalas(pontos) {
  const xs = pontos.map(p => p.gasto), ys = pontos.map(p => p.votos);
  const [x0, x1] = [Math.min(...xs) / 1.5, Math.max(...xs) * 1.5], [y0, y1] = [Math.min(...ys) / 1.5, Math.max(...ys) * 1.5];
  const lx = v => L + (Math.log10(v) - Math.log10(x0)) / (Math.log10(x1) - Math.log10(x0)) * (W - L - R);
  const ly = v => H - B - (Math.log10(v) - Math.log10(y0)) / (Math.log10(y1) - Math.log10(y0)) * (H - T - B);
  return { lx, ly, x0, x1, y0, y1 };
}

function Eixos({ e }) {
  const xt = potenciasEntre(e.x0, e.x1).filter(v => v >= e.x0 && v <= e.x1);
  const yt = potenciasEntre(e.y0, e.y1).filter(v => v >= e.y0 && v <= e.y1);
  return html`<g class="eixos">
    ${xt.map(v => html`<line x1=${e.lx(v)} x2=${e.lx(v)} y1=${T} y2=${H - B} /><text x=${e.lx(v)} y=${H - B + 16} text-anchor="middle">${curto(v)}</text>`)}
    ${yt.map(v => html`<line x1=${L} x2=${W - R} y1=${e.ly(v)} y2=${e.ly(v)} /><text x=${L - 6} y=${e.ly(v) + 4} text-anchor="end">${curto(v)}</text>`)}
    <text x=${(L + W - R) / 2} y=${H - 4} text-anchor="middle" class="titulo">Gasto declarado (R$)</text>
    <text x=${12} y=${(T + H - B) / 2} text-anchor="middle" class="titulo" transform=${`rotate(-90 12 ${(T + H - B) / 2})`}>Votos</text>
  </g>`;
}

// Diagonal de custo c: votos = gasto / c. Desenhada só dentro da área do gráfico.
function Diagonais({ e }) {
  return html`<g class="diag">${[1, 10, 100].map(c => {
    const g0 = Math.max(e.x0, e.y0 * c), g1 = Math.min(e.x1, e.y1 * c);
    if (g0 >= g1) return null;
    return html`<line x1=${e.lx(g0)} y1=${e.ly(g0 / c)} x2=${e.lx(g1)} y2=${e.ly(g1 / c)} />`;
  })}</g>`;
}

export function GraficoGastoVotos({ linhas, selecionado, onPick, eleito }) {
  const pontos = linhas.filter(l => l.gasto > 0 && l.cand.total > 0).map(l => ({ ...l, votos: l.cand.total, eleito: eleito(l.cand) }));
  const [foco, setFoco] = useState(null);
  const svg = useRef();
  if (pontos.length < 2) return null;
  const e = escalas(pontos);
  const xy = p => [e.lx(p.gasto), e.ly(p.votos)];
  const maisPerto = ev => {
    const r = svg.current.getBoundingClientRect(), x = (ev.clientX - r.left) * W / r.width, y = (ev.clientY - r.top) * H / r.height;
    let melhor = null, d = 14;
    for (const p of pontos) { const [px, py] = xy(p), dp = Math.hypot(px - x, py - y); if (dp < d) { d = dp; melhor = p; } }
    return melhor;
  };
  const ordem = [...pontos].sort((a, b) => a.eleito - b.eleito);
  const sel = pontos.find(p => p.cand.key === selecionado);
  return html`<figure class="grafico">
    <div class="grafico-area">
      <svg ref=${svg} viewBox=${`0 0 ${W} ${H}`} role="img" aria-label="Gráfico de gasto declarado por votos de cada candidato"
        onPointerMove=${ev => setFoco(maisPerto(ev))} onPointerLeave=${() => setFoco(null)}
        onClick=${ev => { const p = maisPerto(ev); if (p) onPick(p.cand.key); }}>
        <${Eixos} e=${e} /><${Diagonais} e=${e} />
        ${ordem.map(p => { const [x, y] = xy(p); return html`<circle class=${p.eleito ? 'eleito' : 'outro'} cx=${x} cy=${y} r="4" />`; })}
        ${sel && html`<circle class="sel" cx=${xy(sel)[0]} cy=${xy(sel)[1]} r="7" />`}
        ${foco && html`<circle class="foco" cx=${xy(foco)[0]} cy=${xy(foco)[1]} r="7" />`}
      </svg>
      ${foco && html`<div class="dica" style=${`left:${xy(foco)[0] / W * 100}%;top:${xy(foco)[1] / H * 100}%`}>
        <strong>${titleCase(foco.cand.urna || foco.cand.nome)}</strong> · ${foco.cand.partido || ''}<br />
        ${nf.format(foco.votos)} votos · ${dinheiro(foco.gasto)}<br />${centavos(foco.custo)} por voto</div>`}
    </div>
    <figcaption><ul class="leg"><li><i class="eleito"></i>Eleitos</li><li><i class="outro"></i>Não eleitos</li></ul>
      Diagonais, de cima para baixo: R$ 1, R$ 10 e R$ 100 por voto; quem fica abaixo de uma pagou mais que isso por voto. Toque num ponto para ver o candidato no mapa.</figcaption>
  </figure>`;
}
