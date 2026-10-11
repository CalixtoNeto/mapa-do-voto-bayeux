// Fatias de um total (sem DOM): participação de cada item e agrupamento dos pequenos em "Outros".
const soma = itens => itens.reduce((s, i) => s + i.v, 0);

// itens: [{ n, v }] → os mesmos, do maior ao menor, com p = fração do total.
export function comParticipacao(itens) {
  const total = soma(itens);
  return [...itens].sort((a, b) => b.v - a.v).map(i => ({ ...i, p: total ? i.v / total : 0 }));
}

// Quem fica abaixo de `minimo` do total vira "Outros (n)", no fim; um pequeno sozinho mantém o nome.
export function agruparPequenos(itens, minimo = 0.02) {
  const total = soma(itens), ordenados = [...itens].sort((a, b) => b.v - a.v);
  const grandes = ordenados.filter(i => i.v >= total * minimo), pequenos = ordenados.filter(i => i.v < total * minimo);
  if (pequenos.length < 2) return ordenados;
  return [...grandes, { n: `Outros (${pequenos.length})`, v: soma(pequenos) }];
}

// O TCE-PB escreve "Assistêncial Social" na função 08.
export const nomeDaFuncao = nome => nome === 'Assistêncial Social' ? 'Assistência social' : nome;

// Posições que merecem o valor escrito numa série longa: a primeira, a mais alta e a última.
export function pontosDeDestaque(pontos) {
  const validos = pontos.map((p, i) => [i, p]).filter(([, p]) => p);
  if (!validos.length) return [];
  const maior = validos.reduce((m, x) => x[1][1] > m[1][1] ? x : m);
  return [...new Set([validos[0][0], maior[0], validos[validos.length - 1][0]])].sort((a, b) => a - b);
}

// Rótulos do eixo: o último e um a cada `passo` para trás; os outros ficam em branco, mas mantêm a posição.
export const rotulosEspacados = (rotulos, passo = 2) => rotulos.map(([x, texto], i) => [x, (rotulos.length - 1 - i) % passo === 0 ? texto : '']);
