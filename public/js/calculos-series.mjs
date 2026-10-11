// Séries de várias eleições: abstenção, eleitores aptos e extremos. Cada eleição é { ano, tipo, aptos, comparecimento },
// com tipo 'municipal' (prefeito) ou 'geral' (governador). Sem DOM.
export const abstencaoDaEleicao = e => e.aptos > 0 ? (e.aptos - e.comparecimento) / e.aptos : null;

const porAno = (a, b) => a.ano - b.ano;
const doTipo = (eleicoes, tipo) => eleicoes.filter(e => e.tipo === tipo && e.aptos > 0).sort(porAno);

// pontos [ano, taxa] prontos para a linha do tempo, uma lista por tipo de eleição.
export function serieDeAbstencao(eleicoes) {
  const pontos = tipo => doTipo(eleicoes, tipo).map(e => [+e.ano, abstencaoDaEleicao(e)]);
  return { municipal: pontos('municipal'), geral: pontos('geral') };
}

export function menorAbstencao(eleicoes, tipo) {
  const taxas = doTipo(eleicoes, tipo).map(e => ({ ...e, taxa: abstencaoDaEleicao(e) }));
  return taxas.length ? taxas.reduce((menor, e) => e.taxa < menor.taxa ? e : menor) : null;
}

export function crescimentoDosAptos(eleicoes, tipo) {
  const lista = doTipo(eleicoes, tipo);
  if (lista.length < 2) return null;
  const de = lista[0], ate = lista[lista.length - 1];
  return { de, ate, variacao: ate.aptos / de.aptos - 1 };
}

// cargos: [{ cd }] da eleição, como o index.json os lista. Prefeito (11) só existe nas municipais.
export const tipoDaEleicao = cargos => cargos.some(c => c.cd === '11') ? 'municipal' : 'geral';
