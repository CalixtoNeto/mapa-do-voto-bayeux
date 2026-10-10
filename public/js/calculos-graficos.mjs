// Contas dos gráficos feitos só de CSS (sem biblioteca): rosca, waffle, haltere e colunas.
const arredonda = v => Math.round(v * 100) / 100;

// "conic-gradient(cor 0% 75%, cor 75% 100%)": cada parte { v, cor } ocupa a fatia proporcional ao seu valor.
export function gradienteDaRosca(partes, corVazia = 'var(--line)') {
  const validas = partes.filter(p => p.v > 0), total = validas.reduce((s, p) => s + p.v, 0);
  if (!total) return `conic-gradient(${corVazia} 0% 100%)`;
  let acumulado = 0;
  const trechos = validas.map(p => {
    const de = acumulado; acumulado += p.v / total * 100;
    return `${p.cor} ${arredonda(de)}% ${arredonda(acumulado)}%`;
  });
  return `conic-gradient(${trechos.join(', ')})`;
}

// Um quadrado por assento: grupos [{ id, n }] viram a lista de ids, um por quadrado, na ordem dos grupos.
export const celulasDoWaffle = grupos => grupos.flatMap(g => Array(Math.max(0, g.n)).fill(g.id));

// Posição, em % da régua de 0 a `max`, do trecho entre o valor de antes e o de depois.
export function trechoDoHaltere(antes, depois, max) {
  const pos = v => max > 0 ? arredonda(v / max * 100) : 0, de = pos(antes), ate = pos(depois);
  const esquerda = Math.min(de, ate), largura = arredonda(Math.abs(ate - de));
  return { de, ate, esquerda, largura, sentido: depois > antes ? 'subiu' : depois < antes ? 'caiu' : 'igual' };
}

// Altura (%) de cada coluna em relação à maior; quem tem algo nunca fica menor que um pedaço visível.
export function alturasDasColunas(valores, minimo = 4) {
  const max = Math.max(0, ...valores);
  return valores.map(v => v > 0 && max > 0 ? Math.max(minimo, arredonda(v / max * 100)) : 0);
}

// Grupos do waffle de uma eleição: os partidos com mais eleitos levam uma cor cada; os demais somam em "Outros".
export function gruposDeAssentos(partidos, cores, corOutros) {
  const eleitos = partidos.filter(p => p.eleitos > 0).sort((a, b) => b.eleitos - a.eleitos);
  const grupos = eleitos.slice(0, cores.length).map((p, i) => ({ id: p.partido, nome: p.partido, n: p.eleitos, cor: cores[i] }));
  const resto = eleitos.slice(cores.length);
  if (resto.length) grupos.push({ id: 'outros', nome: `Outros (${resto.length} ${resto.length === 1 ? 'partido' : 'partidos'})`, n: resto.reduce((s, p) => s + p.eleitos, 0), cor: corOutros });
  return grupos;
}
