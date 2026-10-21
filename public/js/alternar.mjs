// Dois jeitos de ver o mesmo dado no mesmo cartão (ex.: treemap e fluxo): botões no topo e só a visão escolhida na tela.
import { Abas } from './estrutura.mjs';
const { html, useState } = window.htmPreact;

// visoes: [{ id, rotulo, corpo }]; o primeiro é o padrão.
export function Alternar({ visoes, rotulo = 'Forma de ver o gráfico' }) {
  const [id, setId] = useState(visoes[0].id), atual = visoes.find(v => v.id === id) || visoes[0];
  return html`<div class="alternar"><${Abas} itens=${visoes.map(v => [v.id, v.rotulo])} valor=${atual.id} aoMudar=${setId} rotulo=${rotulo} estilo="pilula" />${atual.corpo}</div>`;
}
