// Contas do panorama de votos: os dois primeiros de uma eleição, a composição do eleitorado, o ranking com marca de eleito
// e a escala da distribuição de votos. Sem DOM.
const soma = (lista, f) => lista.reduce((s, x) => s + f(x), 0);

// Parcela sobre os votos válidos de todos os candidatos do cargo (nominais, mais a legenda quando houver).
export function doisPrimeiros(cands, legenda = 0) {
  const validos = soma(cands, c => c.total) + legenda;
  const colocados = [...cands].sort((a, b) => b.total - a.total).slice(0, 2).map(cand => ({ cand, parcela: cand.total / validos }));
  return { validos, colocados };
}

export function composicaoDoEleitorado({ aptos, comparecimento, brancos, nulos }) {
  return { aptos, validos: comparecimento - brancos - nulos, brancosENulos: brancos + nulos, abstencao: aptos - comparecimento };
}

// O primeiro não eleito (o mais votado entre os que ficaram de fora) é o destaque; se não couber entre os `quantos`, entra no fim.
export function rankingComMarca(cands, eleito, quantos = 10) {
  const ordem = [...cands].sort((a, b) => b.total - a.total);
  const temEleitos = ordem.some(eleito), primeiroFora = temEleitos ? ordem.findIndex(c => !eleito(c)) : -1;
  const item = (cand, i) => ({ cand, posicao: i + 1, eleito: temEleitos && eleito(cand), destaque: i === primeiroFora });
  const itens = ordem.slice(0, quantos).map(item);
  if (primeiroFora >= quantos) itens.push(item(ordem[primeiroFora], primeiroFora));
  return { itens, temEleitos };
}

// 10, 50, 100, 300, 600 e 1.000 votos, multiplicados por 10 a cada ordem de grandeza acima de 1.000 votos do mais votado.
export function cortesDaDistribuicao(maximo) {
  const escala = 10 ** Math.max(0, Math.floor(Math.log10(Math.max(1, maximo) / 1000)));
  return [10, 50, 100, 300, 600, 1000].map(c => c * escala);
}

export const candidatosAbaixoDe = (votos, limite) => votos.filter(v => v < limite).length;
