// Formato do arquivo de finanças que o site lê. Por candidato (c): r receitas por origem, d gasto, rep repasses,
// pg pago, dc categorias, rs recebido por semana, doa/nd maiores doadores e quantos, fo/nf maiores fornecedores
// e quantos. Doadores e fornecedores trazem o índice (último número) na lista do arquivo, quando estão nela:
// doadores e fornecedores têm n nome, t tipo, v valor e c quanto foi para cada candidato.
import { emReais } from '../lib/valores.mjs';

const POR_CANDIDATO = 10;
const MAIORES_NO_ARQUIVO = 150;
const LIMITE_DO_ARQUIVO = 1500;

// A prestação final é entregue cerca de 30 dias depois da eleição; antes disso os números são parciais.
const ehFinal = (ano, agora) => agora >= new Date(`${ano}-12-01T00:00:00Z`);

export function resumoDasFinancas(financas, ano, agora) {
  const doadores = listaDoArquivo(financas.doadores), fornecedores = listaDoArquivo(financas.fornecedores);
  const doacoes = porCandidato(financas.doadores, doadores.indice), pagamentos = porCandidato(financas.fornecedores, fornecedores.indice);
  const c = Object.fromEntries([...financas.candidatos].map(([chave, dados]) =>
    [chave, resumoDoCandidato(dados, doacoes.get(chave) || [], pagamentos.get(chave) || [])]));
  return { ano, final: ehFinal(ano, agora), c, doadores: doadores.lista.map(semId), fornecedores: fornecedores.lista.map(semId).map(({ t, ...f }) => f) };
}

// Os maiores e quem deu a (ou recebeu de) mais de um candidato: é o que mostra a rede de uma campanha.
function listaDoArquivo(participantes) {
  const lista = [...participantes].map(([id, p]) => ({ id, ...p })).sort((a, b) => b.v - a.v)
    .filter((p, i) => i < MAIORES_NO_ARQUIVO || p.c.size > 1).slice(0, LIMITE_DO_ARQUIVO);
  return { lista, indice: new Map(lista.map((p, i) => [p.id, i])) };
}

const semId = ({ n, t, v, c }) => ({ n, t, v: emReais(v), c: maioresPrimeiro(c) });

function porCandidato(participantes, indice) {
  const separados = new Map();
  for (const [id, { n, t, c }] of participantes) {
    for (const [chave, v] of c) {
      if (!separados.has(chave)) separados.set(chave, []);
      separados.get(chave).push({ n, t, v, i: indice.get(id) });
    }
  }
  return separados;
}

function resumoDoCandidato({ r, d, rep, pg, dc, rs }, doacoes, pagamentos) {
  const receitas = Object.fromEntries(Object.entries(r).map(([origem, v]) => [origem, emReais(v)]).filter(([, v]) => v));
  const resumo = { r: receitas, d: emReais(d) };
  if (rep) resumo.rep = emReais(rep);
  if (pg) resumo.pg = emReais(pg);
  if (dc.size) resumo.dc = maioresPrimeiro(dc);
  if (rs.size) resumo.rs = [...rs].sort(([a], [b]) => a.localeCompare(b)).map(([semana, v]) => [semana, emReais(v)]);
  if (doacoes.length) Object.assign(resumo, { doa: maiores(doacoes, ({ n, t, v }) => [n, t, emReais(v)]), nd: doacoes.length });
  if (pagamentos.length) Object.assign(resumo, { fo: maiores(pagamentos, ({ n, v }) => [n, emReais(v)]), nf: pagamentos.length });
  return resumo;
}

const maiores = (lista, formato) => [...lista].sort((a, b) => b.v - a.v).slice(0, POR_CANDIDATO)
  .map(p => p.i == null ? formato(p) : [...formato(p), p.i]);

const maioresPrimeiro = mapa => [...mapa].sort((a, b) => b[1] - a[1]).map(([chave, v]) => [chave, emReais(v)]);
