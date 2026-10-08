// Dinheiro de campanha por candidato (receitas por origem, gasto, repasses e maiores categorias de despesa)
// e os maiores doadores. Os nomes curtos (c, r, d, rep, dc, n, t, v) são o formato que o site lê.
import { emReais } from '../lib/valores.mjs';

const CATEGORIAS_POR_CANDIDATO = 5;
const DOADORES_NO_ARQUIVO = 150;

export const novasFinancas = () => ({ candidatos: new Map(), doadores: new Map() });

function doCandidato(financas, chave) {
  if (!financas.candidatos.has(chave)) financas.candidatos.set(chave, { r: {}, d: 0, rep: 0, dc: new Map() });
  return financas.candidatos.get(chave);
}

export function somarReceita(financas, chave, { origem, valor, doador }) {
  const receitas = doCandidato(financas, chave).r;
  receitas[origem] = (receitas[origem] || 0) + valor;
  if (doador) somarDoacao(financas.doadores, doador, chave, valor);
}

function somarDoacao(doadores, { id, nome, tipo }, chave, valor) {
  if (!doadores.has(id)) doadores.set(id, { n: nome, t: tipo, v: 0, c: new Map() });
  const doador = doadores.get(id);
  doador.v += valor;
  doador.c.set(chave, (doador.c.get(chave) || 0) + valor);
}

export function somarDespesa(financas, chave, { categoria, valor, repasse }) {
  const candidato = doCandidato(financas, chave);
  if (repasse) { candidato.rep += valor; return; }
  candidato.d += valor;
  candidato.dc.set(categoria, (candidato.dc.get(categoria) || 0) + valor);
}

// A prestação final é entregue cerca de 30 dias depois da eleição; antes disso os números são parciais.
const ehFinal = (ano, agora) => agora >= new Date(`${ano}-12-01T00:00:00Z`);

export function resumoDasFinancas(financas, ano, agora) {
  const c = Object.fromEntries([...financas.candidatos].map(([chave, dados]) => [chave, resumoDoCandidato(dados)]));
  const doadores = [...financas.doadores.values()].sort((a, b) => b.v - a.v).slice(0, DOADORES_NO_ARQUIVO)
    .map(({ n, t, v, c: porCandidato }) => ({ n, t, v: emReais(v), c: maioresPrimeiro(porCandidato) }));
  return { ano, final: ehFinal(ano, agora), c, doadores };
}

function resumoDoCandidato({ r, d, rep, dc }) {
  const receitas = Object.fromEntries(Object.entries(r).map(([origem, v]) => [origem, emReais(v)]).filter(([, v]) => v));
  const resumo = { r: receitas, d: emReais(d) };
  if (rep) resumo.rep = emReais(rep);
  if (dc.size) resumo.dc = maioresPrimeiro(dc).slice(0, CATEGORIAS_POR_CANDIDATO);
  return resumo;
}

const maioresPrimeiro = mapa => [...mapa].sort((a, b) => b[1] - a[1]).map(([chave, v]) => [chave, emReais(v)]);
