// Colunas sobrepostas (largura = valor reservado, estreita e escura = valor realizado) e barras 100% empilhadas por pessoa.
import { alturasDasColunas } from './calculos-graficos.mjs';
const { html } = window.htmPreact;

// itens: [{ n, a, b, rotuloB }]: a coluna larga e clara é `a` (empenhado); a estreita e escura é `b` (pago).
export function ColunasSobrepostas({ itens, descricao }) {
  const alturas = alturasDasColunas(itens.flatMap(i => [i.a, i.b])), a = k => alturas[2 * k], b = k => alturas[2 * k + 1];
  return html`<div class="colunas sobrepostas" role="img" aria-label=${descricao}>${itens.map((i, k) => html`<div>
    <span class="cv">${i.rotuloB || ''}</span><span class="par"><i class="larga" style=${`height:${a(k)}%`}></i><i class="estreita" style=${`height:${b(k)}%`}></i></span>
    <span class="cn">${i.n}</span></div>`)}</div>`;
}

// linhas: [{ nome, rotulo, partes: [{ nome, v, cor }] }]: todas as barras têm o mesmo comprimento; muda a proporção.
export function Pilhas100({ linhas, descricao }) {
  return html`<ul class="pilhas100" aria-label=${descricao}>${linhas.map(l => html`<li>
    <span class="cab"><span>${l.nome}</span><b>${l.rotulo}</b></span>
    <span class="pilha" role="img" aria-label=${l.partes.filter(p => p.v > 0).map(p => `${p.nome} ${p.texto || ''}`).join(', ')}>
      ${l.partes.filter(p => p.v > 0).map(p => html`<i style=${`flex-grow:${p.v};background:${p.cor}`} title=${`${p.nome}: ${p.texto || ''}`}></i>`)}</span></li>`)}</ul>`;
}
