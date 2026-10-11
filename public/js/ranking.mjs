// Ranking em barra horizontal: posição, nome, valor e uma barra de 8px que compara o valor com o maior da lista.
import { usarLimite } from './componentes.mjs';
const { html } = window.htmPreact;

// itens: [{ n, nota?, v, rotulo, lado? }]: `lado` é o número pequeno à direita (participação, "23 de 23"). Dez linhas, o resto a pedido.
export function Ranking({ itens, descricao }) {
  const [limite, botao] = usarLimite(itens.length), max = Math.max(1e-9, ...itens.map(i => i.v));
  return html`<ol class="rank" aria-label=${descricao}>${itens.slice(0, limite).map((i, k) => html`<li>
    <span class="pos">${k + 1}</span><span class="nm">${i.n}${i.nota && html` <small>${i.nota}</small>`}</span>
    <b class="vl">${i.rotulo}</b><span class="lado">${i.lado || ''}</span>
    <span class="trilho" aria-hidden="true"><i style=${`width:${Math.max(0, i.v / max * 100).toFixed(1)}%`}></i></span></li>`)}</ol>${botao}`;
}
