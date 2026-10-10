// Árvore de decomposição em sanfona: cada ramo mostra o valor e uma barra com o peso no total; tocar abre os
// filhos logo abaixo, recuados e ligados ao pai por uma linha. Do maior para o menor em todos os níveis.
import { pct, dinheiro, sentence } from './formato.mjs';
const { html, useState } = window.htmPreact;

let proximoId = 0;
const emOrdem = filhos => [...(filhos || [])].sort((a, b) => b[1] - a[1]);

function Ramo({ ramo: [nome, v, filhos], total, nivel, rotulo }) {
  const [aberto, setAberto] = useState(false), [id] = useState(() => `ramo-${++proximoId}`);
  const conteudo = html`<span class="ln">${rotulo(nome, nivel)}</span><span class="lv">${dinheiro(v)}</span>
    <span class="bar" aria-hidden="true"><i style=${`width:${Math.max(0.5, v / total * 100).toFixed(1)}%`}></i></span>
    <small class="peso">${pct(v / total, v / total < 0.01 ? 1 : 0)} do total</small>`;
  if (!filhos?.length) return html`<li class=${'ramo folha nivel-' + nivel}><div class="abre"><span class="seta" aria-hidden="true"></span>${conteudo}</div></li>`;
  return html`<li class=${'ramo nivel-' + nivel + (aberto ? ' aberto' : '')}>
    <button type="button" class="abre" aria-expanded=${aberto} aria-controls=${id} onClick=${() => setAberto(a => !a)}>
      <span class="seta" aria-hidden="true">›</span>${conteudo}</button>
    ${aberto && html`<ul class="filhos" id=${id}>${emOrdem(filhos).map(f => html`<${Ramo} ramo=${f} total=${total} nivel=${nivel + 1} rotulo=${rotulo} />`)}</ul>`}
  </li>`;
}

// rotulo(nome, nivel) diz como escrever cada ramo (nível 0 é o primeiro abaixo do total).
export function ArvoreDeBarras({ arvore, rotulo = nome => sentence(nome) }) {
  return html`<p class="arvore-total">Total · <b>${dinheiro(arvore.v)}</b></p>
    <ul class="sanfona">${emOrdem(arvore.filhos).map(r => html`<${Ramo} ramo=${r} total=${arvore.v} nivel=${0} rotulo=${rotulo} />`)}</ul>`;
}
