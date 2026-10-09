// Receitas do município (TCE-PB): o total lançado e o que chegou por emenda parlamentar.
// O código de controle (descricao_co) diz se a transferência veio de emenda e de que tipo.
import { reaisDoTce } from '../fontes/tce-pb.mjs';
import { somar, ordenado, centavos } from './somas.mjs';

export const novasReceitas = () => ({ total: 0, emendas: {} });

const EMENDA = /transfer[eê]ncias d[aoe]s? (uni[aã]o|estados?).*emendas parlamentares (individuais|de bancada|de comiss[aã]o)/i;

// O código de controle da emenda tem a origem no 2º dígito (1 União, 2 Estado) e o tipo no 3º
// (1 individual, 2 de bancada, 3 de comissão): 3110, 3130, 3210… As despesas às vezes trazem só o código.
const ORIGEM = { 1: 'União', 2: 'Estado' }, TIPO = { 1: 'individuais', 2: 'de bancada', 3: 'de comissão' };
// "Transferência especial" é a emenda paga direto ao município, sem convênio (a "emenda Pix").
const ESPECIAL = /transfer[eê]ncia especial d[aoe]s? (uni[aã]o|estados?)/i;

export function origemDaEmenda(descricao = '', codigo = '', fonte = '') {
  const m = descricao.match(EMENDA);
  if (m) return `${/uni/i.test(m[1]) ? 'União' : 'Estado'} · ${m[2].toLowerCase().replace('comissao', 'comissão')}`;
  const c = String(codigo).match(/^3([12])([123])\d$/);
  if (c) return `${ORIGEM[c[1]]} · ${TIPO[c[2]]}`;
  const e = fonte.match(ESPECIAL);
  return e ? `${/uni/i.test(e[1]) ? 'União' : 'Estado'} · transferência especial` : null;
}

export function somarReceita(r, ler) {
  if (/previs/i.test(ler('TIPO_ATUALIZACAO_RECEITA'))) return;
  const valor = reaisDoTce(ler('VALOR')), origem = origemDaEmenda(ler('DESCRICAO_CO'), ler('CO'));
  r.total += valor;
  if (origem) somar(r.emendas, origem, valor);
}

export function resumoDasReceitas(r) {
  const emendas = Object.values(r.emendas).reduce((s, v) => s + v, 0);
  return { total: centavos(r.total), emendas: centavos(emendas), origensDasEmendas: ordenado(r.emendas) };
}
