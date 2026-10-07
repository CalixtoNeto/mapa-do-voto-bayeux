// Apuração de um turno. Os nomes curtos dos campos são o formato dos JSON que o site lê:
// cands (candidatos, com votos por local em `loc`), tot (total do cargo por local) e esp (branco, nulo e legenda).
import { VOTO_BRANCO, VOTO_NULO } from './config.mjs';

export const novaApuracao = () => ({ cands: new Map(), tot: {}, esp: {} });

export const chaveDoCargo = (ano, turno, cargo) => `${ano}|${turno}|${cargo}`;

export function somarVotoNoLocal(apuracao, candidato, local, votos) {
  if (!apuracao.cands.has(candidato.key)) apuracao.cands.set(candidato.key, { ...candidato, total: 0, loc: {} });
  const registrado = apuracao.cands.get(candidato.key);
  registrado.loc[local] = (registrado.loc[local] || 0) + votos;
  registrado.total += votos;
  const totalDoCargo = apuracao.tot[chaveDoCargo(candidato.ano, candidato.turno, candidato.cargo)] ||= {};
  totalDoCargo[local] = (totalDoCargo[local] || 0) + votos;
}

export function somarVotoEspecial(apuracao, chaveDoCargo, numero, votos) {
  const especiais = apuracao.esp[chaveDoCargo] ||= { branco: 0, nulo: 0, legenda: 0 };
  especiais[tipoDeVotoEspecial(numero)] += votos;
}

const tipoDeVotoEspecial = numero => numero === VOTO_BRANCO ? 'branco' : numero === VOTO_NULO ? 'nulo' : 'legenda';

export const ehBrancoOuNulo = numero => numero === VOTO_BRANCO || numero === VOTO_NULO;
