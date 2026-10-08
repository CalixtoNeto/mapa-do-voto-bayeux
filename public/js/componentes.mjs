// Peças repetidas pelos painéis de análise.
import { pct, titleCase, dinheiro } from './formato.mjs';
const { html, useState } = window.htmPreact;

export const nomeDe = c => titleCase(c.urna || c.nome);
const NO_INICIO = 10;

// Listas longas mostram os dez primeiros; o resto aparece a pedido.
export function usarLimite(total) {
  const [todos, setTodos] = useState(false);
  const botao = total > NO_INICIO && html`<button type="button" class="link" onClick=${() => setTodos(t => !t)}>${todos ? 'Ver menos' : `Ver todos (${total})`}</button>`;
  return [todos ? total : NO_INICIO, botao];
}
export function BarraDeOrigens({ grupos, total }) {
  if (!total) return null;
  const visiveis = grupos.filter(g => g.v > 0);
  return html`<div class="origens">
    <div class="pilha" role="img" aria-label="Origem do dinheiro recebido">
      ${visiveis.map(g => html`<i class=${'o-' + g.id} style=${`flex-grow:${g.v}`} title=${`${g.nome}: ${dinheiro(g.v)}`}></i>`)}
    </div>
    <ul class="leg">${grupos.map(g => html`<li><i class=${'o-' + g.id}></i><span>${g.nome}</span>
      <b>${dinheiro(g.v)}</b><small>${pct(g.v / total, 0)}</small></li>`)}</ul>
  </div>`;
}

export function ListaDeBarras({ itens }) {
  const max = Math.max(1, ...itens.map(i => i.v));
  return html`<ul class="locais">${itens.map(i => html`<li><span class="ln">${i.n}</span><span class="lv">${i.rotulo}</span>
    <span class="bar" aria-hidden="true"><i style=${`width:${(i.v / max * 100).toFixed(1)}%`}></i></span></li>`)}</ul>`;
}
