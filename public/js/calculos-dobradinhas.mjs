// Dobradinhas entre cargos: para cada outro cargo da eleição, os candidatos cujas parcelas de voto sobem e descem
// nos mesmos lugares que as do candidato (correlação). Cargo com poucos candidatos (governador, senador, prefeito)
// mostra todos, inclusive quem anda ao contrário; nos outros, só os mais parecidos.
import { correlacao } from './calculos.mjs';

const POUCOS = 6;
const MOSTRADOS = 5;
const PARCELA_MINIMA = 0.005;
const CORRELACAO_MINIMA = 0.1;
// Em anos de duas vagas no Senado, cada eleitor vota em dois senadores: a dupla é uma dobradinha do mesmo cargo.
const SENADOR = '5';

export function dobradinhasPorCargo(alvo, cands, { lugares, parcela, ordem }) {
  const doAlvo = lugares.map(l => parcela(alvo, l));
  return ordem.filter(cargo => cargo !== alvo.cargo || cargo === SENADOR).map(cargo => {
    const doCargo = cands.filter(c => c.cargo === cargo), total = doCargo.reduce((s, c) => s + c.total, 0);
    const relevantes = doCargo.filter(c => c.key !== alvo.key && c.total >= total * PARCELA_MINIMA)
      .map(cand => ({ cand, r: correlacao(doAlvo, lugares.map(l => parcela(cand, l))) })).sort((a, b) => b.r - a.r);
    const todos = relevantes.length <= POUCOS;
    return { cargo, todos, lista: todos ? relevantes : relevantes.filter(p => p.r > CORRELACAO_MINIMA).slice(0, MOSTRADOS) };
  }).filter(g => g.lista.length);
}

export const forcaDaCorrelacao = r => Math.abs(r) < 0.3 ? 'fraca' : Math.abs(r) <= 0.6 ? 'moderada' : 'forte';
