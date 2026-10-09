// Árvore de decomposição clicável: mostra os ramos do nível atual em barras; tocar num ramo abre o próximo
// nível, e a trilha no alto volta a qualquer nível anterior.
import { pct, dinheiro, sentence } from './formato.mjs';
import { ramoDaArvore } from './calculos-arvore.mjs';
const { html, useState } = window.htmPreact;

function Trilha({ caminho, setCaminho, total }) {
  return html`<nav class="trilha" aria-label="Caminho na árvore">
    <button type="button" class="link" onClick=${() => setCaminho([])}>Total · ${dinheiro(total)}</button>
    ${caminho.map((nome, i) => html`<span aria-hidden="true">›</span><button type="button" class="link" aria-current=${i === caminho.length - 1 ? 'true' : null}
      onClick=${() => setCaminho(caminho.slice(0, i + 1))}>${sentence(nome)}</button>`)}
  </nav>`;
}

// rotulo(nome, nivel) diz como escrever cada ramo (nível 0 é o primeiro abaixo do total).
export function ArvoreDeBarras({ arvore, rotulo = nome => sentence(nome) }) {
  const [caminho, setCaminho] = useState([]);
  const ramo = ramoDaArvore(arvore, caminho), max = Math.max(1, ...ramo.filhos.map(f => f[1]));
  return html`<${Trilha} caminho=${caminho} setCaminho=${setCaminho} total=${arvore.v} />
    <ul class="locais ramos">${ramo.filhos.map(([nome, v, filhos]) => {
      const conteudo = html`<span class="ln">${rotulo(nome, caminho.length)}</span><span class="lv">${dinheiro(v)}<small> ${pct(v / ramo.valor, 0)}</small></span>
        <span class="bar" aria-hidden="true"><i style=${`width:${(v / max * 100).toFixed(1)}%`}></i></span>`;
      return html`<li>${filhos ? html`<button type="button" class="abre" onClick=${() => setCaminho([...caminho, nome])}>${conteudo}</button>` : html`<div class="abre">${conteudo}</div>`}</li>`;
    })}</ul>`;
}
