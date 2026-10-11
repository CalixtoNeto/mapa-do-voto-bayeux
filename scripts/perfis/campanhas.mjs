// O que o perfil usa das eleições municipais já publicadas pelo site: quem se elegeu prefeito
// e quem doou ou prestou serviço a cada campanha (public/data/eleicoes/ANO-financas.json).
import { readFile } from 'node:fs/promises';
import { PASTA_ELEICOES } from '../eleicao/config.mjs';

// O mandato começa no ano seguinte à eleição municipal (2016, 2020, 2024…).
export const eleicaoDoMandato = ano => String(ano - 1 - ((ano - 1) % 4));

export function eleitoNaEleicao(t1, perfis, cargo) {
  const c = t1.cands.find(c => c.cargo === cargo && perfis?.c?.[`${c.cargo}|${c.nr}`]?.s === 'ELEITO');
  return c ? { nome: c.nome, chave: `${c.cargo}|${c.nr}`, ano: t1.ano, votos: c.total } : null;
}

// nomes: { chave: nome do candidato }, do arquivo de votação da mesma eleição. cargoDe(chave) diz o cargo: em Bayeux
// a chave é "cargo|número"; na Paraíba é o sequencial do TSE, e o cargo vem do arquivo de votação.
export function campanhasDaEleicao(ano, financas, cargos, nomes = {}, cargoDe = chave => chave.split('|')[0]) {
  return Object.entries(financas?.c || {}).filter(([chave]) => cargos.includes(cargoDe(chave)))
    .map(([chave, f]) => ({ ano, chave, nome: nomes[chave] || '',
      doadores: (f.doa || []).map(([nome, , valor], i) => [nome, valor, f.doaK?.[i] || null]),
      fornecedores: (f.fo || []).map(([nome, valor], i) => [nome, valor, f.foK?.[i] || null]) }));
}

export const nomesDosCandidatos = t1 => Object.fromEntries((t1?.cands || []).map(c => [`${c.cargo}|${c.nr}`, c.nome]));

export async function lerDaEleicao(ano, arquivo) {
  try { return JSON.parse(await readFile(`${PASTA_ELEICOES}/${ano}-${arquivo}.json`, 'utf8')); } catch { return null; }
}
