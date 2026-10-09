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

export function campanhasDaEleicao(ano, financas, cargos) {
  return Object.entries(financas?.c || {}).filter(([chave]) => cargos.includes(chave.split('|')[0]))
    .map(([chave, f]) => ({ ano, chave,
      doadores: (f.doa || []).map(([nome, , valor]) => [nome, valor]),
      fornecedores: (f.fo || []).map(([nome, valor]) => [nome, valor]) }));
}

export async function lerDaEleicao(ano, arquivo) {
  try { return JSON.parse(await readFile(`${PASTA_ELEICOES}/${ano}-${arquivo}.json`, 'utf8')); } catch { return null; }
}
