// O site compara a votação de uma pessoa entre eleições; a ligação é feita pelo nome completo.
import { normalizarNome } from '../lib/texto.mjs';

// Cada participação: ano, turno, cargo, número, votos, parcela dos votos nominais do cargo, posição.
export function registrarPessoas(pessoas, eleicao) {
  for (const [cargo, candidatos] of Object.entries(agruparPorCargo(eleicao.cands))) {
    const votosDoCargo = candidatos.reduce((soma, c) => soma + c.total, 0);
    candidatos.sort((a, b) => b.total - a.total).forEach((c, i) => {
      const pessoa = normalizarNome(c.nome || c.urna);
      if (!pessoa) return;
      const participacao = [eleicao.ano, eleicao.turno, cargo, c.nr, c.total, parcela(c.total, votosDoCargo), i + 1];
      (pessoas[pessoa] ||= []).push(participacao);
    });
  }
}

function agruparPorCargo(candidatos) {
  const porCargo = {};
  for (const c of candidatos) (porCargo[c.cargo] ||= []).push(c);
  return porCargo;
}

const parcela = (votos, total) => total ? Math.round(votos / total * 1e5) / 1e5 : 0;

// Quem disputou uma eleição só não tem com o que comparar.
export function pessoasRecorrentes(pessoas) {
  return Object.fromEntries(Object.entries(pessoas).filter(([, participacoes]) => participacoes.length >= 2));
}
