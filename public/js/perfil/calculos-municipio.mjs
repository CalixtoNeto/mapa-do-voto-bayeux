// Cálculos do perfil da Prefeitura (sem DOM): pago e receitas por ano, meses do ano e maiores credores.
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const mediana = valores => { const o = [...valores].sort((a, b) => a - b), m = o.length >> 1; return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2; };

export const pagoDoAno = a => (a?.despesas?.orgaos || []).reduce((s, o) => s + o[2], 0);

// Número do último mês (1 a 12) com pagamento; o TCE-PB já lista o mês seguinte zerado.
export const ultimoMesComDado = a => Math.max(0, ...(a?.despesas?.meses || []).filter(m => m[1] > 0).map(m => Number(m[0])));
export const anoParcial = a => ultimoMesComDado(a) < 12;

// [{ ano, pago, receitas, parcial }] do ano mais antigo ao mais novo, só dos anos com despesas.
export const serieAnualDoMunicipio = anos => anos.filter(a => a.despesas)
  .map(a => ({ ano: a.ano, pago: pagoDoAno(a), receitas: a.receitas?.total ?? null, parcial: anoParcial(a) }))
  .sort((x, y) => x.ano.localeCompare(y.ano));

// Os dois últimos meses de um ano em andamento ainda estão sendo lançados: abaixo da metade da mediana dos anteriores, são parciais.
function indicesParciais(a, valores) {
  if (!anoParcial(a)) return new Set();
  const com = valores.map((v, i) => [i, v]).filter(([, v]) => v), ultimos = com.slice(-2), antes = com.slice(0, -2).map(([, v]) => v);
  const corte = antes.length ? mediana(antes) / 2 : 0;
  return new Set(ultimos.filter(([, v]) => v < corte).map(([i]) => i));
}

// Doze posições: { mes, v, parcial }; v é null quando o mês não tem pagamento.
export function mesesDoAno(a) {
  const valores = MESES.map((_, i) => (a.despesas?.meses || []).find(m => Number(m[0]) === i + 1)?.[1] || null);
  const parciais = indicesParciais(a, valores);
  return MESES.map((mes, i) => ({ mes, v: valores[i], parcial: parciais.has(i) }));
}

const PROPRIO = /^(prefeitura|c[aâ]mara) municipal de/i;
// credores: [nome, documento, pago, vezes]; fora a Prefeitura e a Câmara pagando a si mesmas.
export const maioresCredores = (credores, quantos = 10) => credores.filter(c => !PROPRIO.test(c[0]))
  .sort((a, b) => b[2] - a[2]).slice(0, quantos).map(([n, , v, vezes]) => ({ n, v, vezes }));

// Primeiro e último anos completos da série, para comparar sem contar o ano em andamento.
export function extremosCompletos(serie) {
  const completos = serie.filter(s => !s.parcial);
  return completos.length > 1 ? { de: completos[0], ate: completos[completos.length - 1] } : null;
}
