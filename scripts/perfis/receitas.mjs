// Receitas do município (TCE-PB): o total lançado e o que chegou por emenda parlamentar.
// O código de controle (descricao_co) diz se a transferência veio de emenda e de que tipo.
import { reaisDoTce } from '../fontes/tce-pb.mjs';
import { somar, ordenado, centavos } from './somas.mjs';

export const novasReceitas = () => ({ total: 0, emendas: {} });

const EMENDA = /transfer[eê]ncias d[aoe]s? (uni[aã]o|estados?).*emendas parlamentares (individuais|de bancada|de comiss[aã]o)/i;

function origemDaEmenda(descricao) {
  const m = descricao.match(EMENDA);
  if (!m) return null;
  const origem = /uni/i.test(m[1]) ? 'União' : 'Estado';
  return `${origem} · ${m[2].toLowerCase().replace('comissao', 'comissão')}`;
}

export function somarReceita(r, ler) {
  if (/previs/i.test(ler('TIPO_ATUALIZACAO_RECEITA'))) return;
  const valor = reaisDoTce(ler('VALOR')), origem = origemDaEmenda(ler('DESCRICAO_CO'));
  r.total += valor;
  if (origem) somar(r.emendas, origem, valor);
}

export function resumoDasReceitas(r) {
  const emendas = Object.values(r.emendas).reduce((s, v) => s + v, 0);
  return { total: centavos(r.total), emendas: centavos(emendas), origensDasEmendas: ordenado(r.emendas) };
}
