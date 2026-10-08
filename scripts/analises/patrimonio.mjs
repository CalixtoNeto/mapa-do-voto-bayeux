// Evolução dos bens declarados de uma pessoa entre eleições. A ligação é pelo nome completo,
// a mesma de pessoas.json, para o site achar a pessoa do mesmo jeito.
import { normalizarNome } from '../lib/texto.mjs';
import { chaveNoSite } from './escopo.mjs';

export function registrarPatrimonio(patrimonio, ano, candidatosDoSite, perfis) {
  for (const candidato of candidatosDoSite) {
    const bens = perfis[chaveNoSite(candidato)]?.b, pessoa = normalizarNome(candidato.nome || candidato.urna);
    if (bens == null || !pessoa) continue;
    const declaracoes = patrimonio[pessoa] ||= [];
    if (!declaracoes.some(([anoJaVisto]) => anoJaVisto === ano)) declaracoes.push([ano, bens]);
  }
}

export const patrimonioRecorrente = patrimonio =>
  Object.fromEntries(Object.entries(patrimonio).filter(([, declaracoes]) => declaracoes.length >= 2));
