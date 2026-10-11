// Origem das emendas que entraram no caixa da Prefeitura num ano, em uma barra empilhada com legenda em texto.
import { dinheiro } from '../formato.mjs';
import { Pilha } from '../graficos.mjs';
import { participacao } from './formato-perfil.mjs';
const { html } = window.htmPreact;

const CORES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s0)'];

// origens: [[origem e tipo, valor]]
export function OrigemDasEmendas({ origens }) {
  const total = origens.reduce((s, o) => s + o[1], 0);
  const partes = origens.map(([nome, v], i) => ({ nome, v, cor: CORES[Math.min(i, CORES.length - 1)], rotulo: `${dinheiro(v)} · ${participacao(v, total)}` }));
  return html`<${Pilha} partes=${partes} descricao=${'Origem das emendas que entraram no caixa: ' + partes.map(p => `${p.nome} ${p.rotulo}`).join('; ')} />`;
}
