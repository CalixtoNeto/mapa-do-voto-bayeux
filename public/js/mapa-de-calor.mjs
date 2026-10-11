// Mapa de calor: tabela de linhas × colunas em que a cor (e o número) mostra a quantidade. É uma <table>, então leitor de tela
// e teclado funcionam sem nada extra.
import { classeDoCalor } from './calculos-svg.mjs';
const { html } = window.htmPreact;

// linhas: [rótulo]; colunas: [rótulo]; valores[i][j]: número ou null (sem dado).
export function MapaDeCalor({ linhas, colunas, valores, formato, legenda }) {
  const todos = valores.flat().filter(v => v != null), [minimo, maximo] = [Math.min(...todos), Math.max(...todos)];
  return html`<div class="calor-rolagem" tabindex="0" role="region" aria-label=${legenda}><table class="calor">
    <caption class="so-leitor">${legenda}</caption>
    <thead><tr><td></td>${colunas.map(c => html`<th scope="col">${c}</th>`)}</tr></thead>
    <tbody>${linhas.map((l, i) => html`<tr><th scope="row">${l}</th>${valores[i].map(v => {
      const c = classeDoCalor(v, minimo, maximo, 6);
      return html`<td class=${c < 0 ? 'vazio' : 'c' + c}>${v == null ? '—' : formato(v)}</td>`; })}</tr>`)}</tbody></table></div>`;
}
