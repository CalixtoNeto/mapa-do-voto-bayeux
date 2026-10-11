// Cálculos do perfil de Emendas (sem DOM): anos, maior origem, o pico da série e as funções.
const soma = lista => lista.reduce((s, x) => s + x, 0);

// porAno: [[ano, empenhado, pago]] → um item por ano, do primeiro ao último, com zero nos anos sem emenda.
export function anosCompletos(porAno) {
  if (!porAno.length) return [];
  const dados = new Map(porAno.map(([ano, empenhado, pago]) => [Number(ano), { empenhado, pago }])), anos = [...dados.keys()];
  const [de, ate] = [Math.min(...anos), Math.max(...anos)];
  return Array.from({ length: ate - de + 1 }, (_, i) => ({ ano: String(de + i), empenhado: 0, pago: 0, ...dados.get(de + i) }));
}

// porAutor: [[autor, valor, emendas]]
export function maiorOrigem(porAutor) {
  if (!porAutor.length) return null;
  const [nome, v] = [...porAutor].sort((a, b) => b[1] - a[1])[0];
  return { nome, v, fracao: v / soma(porAutor.map(a => a[1])) };
}

export const totalRecebido = recebido => soma((recebido?.porAno || []).map(a => a[1]));

// Árvore autor → quem recebeu → ano: quanto cada autor mandou num ano.
const doAutorNoAno = (autor, ano) => soma(autor[2].flatMap(favorecido => (favorecido[2] || []).filter(a => a[0] === ano).map(a => a[1])));

// O ano em que mais dinheiro entrou e o autor que mais mandou nele.
export function autorDoPico(arvore, porAno) {
  if (!arvore?.filhos?.length || !porAno.length) return null;
  const [ano, valor] = [...porAno].sort((a, b) => b[1] - a[1])[0];
  const [autor, v] = arvore.filhos.map(f => [f[0], doAutorNoAno(f, ano)]).sort((a, b) => b[1] - a[1])[0];
  return { ano, valor, autor, v, fracao: v / valor };
}

export const funcoesComValor = porFuncao => porFuncao.filter(f => f[1] > 0).map(([n, v]) => ({ n, v }));
