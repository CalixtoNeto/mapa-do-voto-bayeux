// Árvore de decomposição do gasto: começa no total e, a cada clique, abre o ramo escolhido
// (área → tipo de despesa → fornecedor, por exemplo), como as árvores dos painéis de BI.
import { pct, dinheiro, sentence } from '../formato.mjs';
import { ramoDaArvore } from './calculos-perfil.mjs';
import { nomeProprio } from './pecas.mjs';
const { html, useState } = window.htmPreact;

export const VISOES = [
  ['area', 'Por área', 'Área → tipo de despesa → fornecedor'],
  ['secretaria', 'Por secretaria ou fundo', 'Secretaria ou fundo → tipo de despesa → fornecedor'],
  ['fonte', 'Pela origem do dinheiro', 'Fonte do recurso → área → fornecedor'],
  ['emendas', 'Dinheiro de emendas', 'Origem da emenda → área → tipo de despesa → fornecedor'],
];
// O último nível é sempre quem recebeu: nome de pessoa ou empresa.
const rotulo = (nome, nivel, profundidade) => nivel === profundidade - 1 && !/^Outros \(/.test(nome) ? nomeProprio(nome) : sentence(nome);

function Trilha({ caminho, setCaminho, total }) {
  return html`<nav class="trilha" aria-label="Caminho na árvore">
    <button type="button" class="link" onClick=${() => setCaminho([])}>Total · ${dinheiro(total)}</button>
    ${caminho.map((nome, i) => html`<span aria-hidden="true">›</span><button type="button" class="link" aria-current=${i === caminho.length - 1 ? 'true' : null}
      onClick=${() => setCaminho(caminho.slice(0, i + 1))}>${sentence(nome)}</button>`)}
  </nav>`;
}

function Ramos({ ramo, caminho, setCaminho, profundidade }) {
  const max = Math.max(1, ...ramo.filhos.map(f => f[1]));
  return html`<ul class="locais ramos">${ramo.filhos.map(([nome, v, filhos]) => {
    const conteudo = html`<span class="ln">${rotulo(nome, caminho.length, profundidade)}</span><span class="lv">${dinheiro(v)}<small> ${pct(v / ramo.valor, 0)}</small></span>
      <span class="bar" aria-hidden="true"><i style=${`width:${(v / max * 100).toFixed(1)}%`}></i></span>`;
    return html`<li>${filhos ? html`<button type="button" class="abre" onClick=${() => setCaminho([...caminho, nome])}>${conteudo}</button>` : html`<div class="abre">${conteudo}</div>`}</li>`;
  })}</ul>`;
}

export function ArvoreDeGastos({ arvores, ano }) {
  const disponiveis = VISOES.filter(([id]) => arvores?.[id]?.v > 0);
  const [visao, setVisao] = useState('area'), [caminho, setCaminho] = useState([]);
  if (!disponiveis.length) return html`<p class="hint">Carregando o detalhamento de ${ano}…</p>`;
  const [id, , descricao] = disponiveis.find(v => v[0] === visao) || disponiveis[0];
  const arvore = arvores[id], ramo = ramoDaArvore(arvore, caminho), profundidade = id === 'secretaria' || id === 'fonte' || id === 'area' ? 3 : 4;
  return html`<div class="arvore">
    <div class="chips" role="radiogroup" aria-label="Como dividir o gasto">${disponiveis.map(([v, nome]) =>
      html`<button type="button" role="radio" aria-checked=${v === id} onClick=${() => { setVisao(v); setCaminho([]); }}>${nome}</button>`)}</div>
    <p class="hint">${descricao}. Toque num item para abrir.</p>
    <${Trilha} caminho=${caminho} setCaminho=${setCaminho} total=${arvore.v} />
    <${Ramos} ramo=${ramo} caminho=${caminho} setCaminho=${setCaminho} profundidade=${profundidade} />
  </div>`;
}
