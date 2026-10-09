// Para onde foi o dinheiro do município: a mesma árvore da ficha do candidato, em quatro visões.
import { sentence } from '../formato.mjs';
import { ArvoreDeBarras } from '../arvore.mjs';
import { nomeProprio } from './pecas.mjs';
const { html, useState } = window.htmPreact;

export const VISOES = [
  ['area', 'Por área', 'Área → tipo de despesa → fornecedor', 2],
  ['secretaria', 'Por secretaria ou fundo', 'Secretaria ou fundo → tipo de despesa → fornecedor', 2],
  ['fonte', 'Pela origem do dinheiro', 'Fonte do recurso → área → fornecedor', 2],
  ['emendas', 'Dinheiro de emendas', 'Origem da emenda → área → tipo de despesa → fornecedor', 3],
];
// O último nível é sempre quem recebeu: nome de pessoa ou empresa.
const rotuloAte = ultimo => (nome, nivel) => nivel === ultimo && !/^Outros \(/.test(nome) ? nomeProprio(nome) : sentence(nome);

export function ArvoreDeGastos({ arvores, ano }) {
  const disponiveis = VISOES.filter(([id]) => arvores?.[id]?.v > 0);
  const [visao, setVisao] = useState('area');
  if (!disponiveis.length) return html`<p class="hint">Carregando o detalhamento de ${ano}…</p>`;
  const [id, , descricao, ultimo] = disponiveis.find(v => v[0] === visao) || disponiveis[0];
  return html`<div class="arvore">
    <div class="chips" role="radiogroup" aria-label="Como dividir o gasto">${disponiveis.map(([v, nome]) =>
      html`<button type="button" role="radio" aria-checked=${v === id} onClick=${() => setVisao(v)}>${nome}</button>`)}</div>
    <p class="hint">${descricao}. Toque num item para abrir.</p>
    <${ArvoreDeBarras} key=${id} arvore=${arvores[id]} rotulo=${rotuloAte(ultimo)} />
  </div>`;
}
