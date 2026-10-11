// Árvore de barras dos perfis com a legenda da hierarquia ("Modalidade → vencedor · R$") logo acima.
import { ArvoreDeBarras } from '../arvore.mjs';
const { html } = window.htmPreact;

export const ArvoreComLegenda = ({ legenda, ...propriedades }) => html`<div class="arvore">
  <p class="hint legenda-arvore">${legenda}. Toque num item para abrir.</p><${ArvoreDeBarras} ...${propriedades} /></div>`;
