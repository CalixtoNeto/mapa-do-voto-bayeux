// A árvore de barras como os cartões do panorama e da ficha a usam: legenda da hierarquia, nomes de candidato que levam à ficha
// e o ramo "Ver a ficha" no fim de cada candidato. Os ramos vêm de calculos-arvores-*.mjs.
import { titleCase } from './formato.mjs';
import { nomeDe } from './componentes.mjs';
import { ArvoreDeBarras } from './arvore.mjs';
import { parcelaDe } from './calculos-arvores-dinheiro.mjs';
const { html } = window.htmPreact;

const botaoDaFicha = (cand, onPick, texto, classe) => onPick
  ? html`<button type="button" class=${'link ' + classe} onClick=${() => onPick(cand)}>${texto}</button>` : texto;

// Nome de ramo: texto, { cand } (nome que abre a ficha) ou { ficha } (a linha "Ver a ficha de…").
export const rotuloDaArvore = onPick => nome => {
  if (typeof nome === 'string') return nome;
  if (nome.ficha) return botaoDaFicha(nome.ficha, onPick, `Ver a ficha de ${nomeDe(nome.ficha)} ›`, 'ver-ficha');
  return botaoDaFicha(nome.cand, onPick, nomeDe(nome.cand), 'nome-cand');
};

// Opções de arvoreDeCandidatos e arvoreDeLugares: o lugar do mapa (bairro ou município) escrito como o site o chama.
export const opcoesDosLugares = (cfg, ds, extra = {}) => ({
  votosDe: cfg.votosDe, nomeDoLugar: k => titleCase(cfg.nomeDoLugar(k, ds)), nomeDe, parcela: parcelaDe, ficha: true, ...extra,
});

export function ArvoreDoCargo({ arvore, legenda, formato, onPick, ordenar = false, escala = 'maior', ativo }) {
  return html`<div class="arvore-cargo"><p class="arvore-legenda">${legenda}</p>
    <${ArvoreDeBarras} arvore=${arvore} formato=${v => v ? formato(v) : ''} escala=${escala} ordenarRaiz=${ordenar} mostrarTotal=${false}
      rotulo=${rotuloDaArvore(onPick)} ativo=${ativo} /></div>`;
}
