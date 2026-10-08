// Dinheiro de campanha de uma pessoa em cada eleição: cargo, recebido, gasto e votos (do 1º turno).
// A ligação entre eleições é pelo nome completo, como em patrimonio.json e pessoas.json.
import { normalizarNome } from '../lib/texto.mjs';
import { chaveNoSite } from './escopo.mjs';

export function registrarDinheiro(dinheiro, ano, candidatosDoSite, financasPorCandidato) {
  for (const candidato of candidatosDoSite) {
    const f = financasPorCandidato[chaveNoSite(candidato)], pessoa = normalizarNome(candidato.nome || candidato.urna);
    if (!f || !pessoa) continue;
    const campanhas = dinheiro[pessoa] ||= [];
    if (campanhas.some(([anoJaVisto]) => anoJaVisto === ano)) continue;
    const recebido = Object.values(f.r || {}).reduce((s, v) => s + v, 0);
    campanhas.push([ano, candidato.cargo, recebido, f.d || 0, candidato.total || 0]);
  }
}
