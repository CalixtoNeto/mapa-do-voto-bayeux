// Dinheiro de campanha somado por cargo: origem das receitas, categorias de gasto, composição de cada campanha e custo por voto.
// `financas` é o arquivo ANO-financas.json; só entram os candidatos do cargo (cands) que têm prestação de contas.
import { resumoFinanceiro, GRUPOS_DE_ORIGEM } from './calculos-dinheiro.mjs';

const comContas = (cands, financas, chaveDe) => cands.filter(c => financas?.c?.[chaveDe(c)])
  .map(cand => ({ cand, resumo: resumoFinanceiro(financas.c[chaveDe(cand)]) }));

export function somarCampanhas(cands, financas, chaveDe) {
  const lista = comContas(cands, financas, chaveDe);
  const grupos = GRUPOS_DE_ORIGEM.map(g => ({ id: g.id, nome: g.nome, v: lista.reduce((s, x) => s + x.resumo.grupos.find(y => y.id === g.id).v, 0) }));
  const maior = lista.reduce((m, x) => !m || x.resumo.gasto > m.gasto ? { cand: x.cand, gasto: x.resumo.gasto } : m, null);
  return { candidaturas: lista.length, grupos, recebido: grupos.reduce((s, g) => s + g.v, 0),
    gasto: lista.reduce((s, x) => s + x.resumo.gasto, 0), maiorGasto: maior };
}

// As maiores categorias de despesa do cargo; "demais" é o que a despesa total declarada tem além delas.
export function categoriasDeGasto(cands, financas, chaveDe, quantas = 8) {
  const somas = new Map();
  for (const { resumo } of comContas(cands, financas, chaveDe)) {
    for (const [nome, v] of resumo.categorias) somas.set(nome, (somas.get(nome) || 0) + v);
  }
  const itens = [...somas].map(([nome, v]) => ({ nome, v })).sort((a, b) => b.v - a.v).slice(0, quantas);
  const total = somarCampanhas(cands, financas, chaveDe).gasto;
  return { itens, total, demais: Math.max(0, total - itens.reduce((s, i) => s + i.v, 0)) };
}

export function composicaoDasCampanhas(cands, financas, chaveDe) {
  return comContas(cands, financas, chaveDe).filter(x => x.resumo.recebido > 0)
    .map(({ cand, resumo }) => ({ cand, recebido: resumo.recebido, partes: resumo.grupos.map(({ id, nome, v }) => ({ id, nome, v })) }));
}

export const custoPorVotoEmOrdem = linhas => linhas.filter(l => l.custo != null).sort((a, b) => a.custo - b.custo);

// Quanto gastaram os eleitos (menor e maior gasto) e se quem mais gastou no cargo se elegeu.
export function gastoDosEleitos(linhas, eleito) {
  const comGasto = linhas.filter(l => l.gasto > 0), eleitos = comGasto.filter(l => eleito(l.cand)).map(l => l.gasto);
  const maior = comGasto.reduce((m, l) => !m || l.gasto > m.gasto ? l : m, null);
  return { eleitos: eleitos.length, minimo: Math.min(...eleitos), maximo: Math.max(...eleitos),
    maior: maior && { gasto: maior.gasto, eleito: !!eleito(maior.cand) } };
}
