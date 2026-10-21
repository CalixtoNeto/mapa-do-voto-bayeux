// Contas do diagrama de fluxo (sem DOM): colunas de nós com altura proporcional ao valor e faixas entre eles.
const soma = (lista, f) => lista.reduce((s, x) => s + f(x), 0);

// Cada nó vale o maior lado (o que entra ou o que sai); nó sem fluxo some.
function valorDosNos(colunas, fluxos) {
  const entra = new Map(), sai = new Map();
  for (const f of fluxos) { entra.set(f.para, (entra.get(f.para) || 0) + f.v); sai.set(f.de, (sai.get(f.de) || 0) + f.v); }
  return colunas.map((nos, coluna) => nos.map(n => ({ ...n, coluna, v: Math.max(entra.get(n.id) || 0, sai.get(n.id) || 0) })).filter(n => n.v > 0));
}

// Uma escala só para todas as colunas (a mais cheia manda); cada coluna fica centrada na altura.
function posicionarNos(colunas, largura, altura, larguraNo, folga) {
  const cheias = colunas.filter(c => c.length), vazio = c => folga * (c.length - 1);
  const escala = Math.min(...cheias.map(c => (altura - vazio(c)) / soma(c, n => n.v)));
  const passo = colunas.length > 1 ? (largura - larguraNo) / (colunas.length - 1) : 0;
  return { escala, nos: colunas.flatMap((nos, i) => {
    let y = (altura - soma(nos, n => n.v * escala) - (nos.length ? vazio(nos) : 0)) / 2;
    return nos.map(n => { const no = { ...n, x: i * passo, y, w: larguraNo, h: n.v * escala }; y += no.h + folga; return no; });
  }) };
}

// Em cada nó as faixas se empilham na ordem do vizinho de cima para baixo, para as curvas se cruzarem o menos possível.
function empilhar(faixas, lado, vizinho, ponta) {
  const usado = new Map();
  for (const f of [...faixas].sort((a, b) => a[vizinho].y - b[vizinho].y)) {
    const no = f[lado], antes = usado.get(no.id) || 0;
    f[ponta] = no.y + antes + f.h / 2; usado.set(no.id, antes + f.h);
  }
}

function colocarFaixas(nos, fluxos, escala) {
  const porId = new Map(nos.map(n => [n.id, n]));
  const faixas = fluxos.map(f => ({ ...f, h: f.v * escala, origem: porId.get(f.de), destino: porId.get(f.para) }));
  empilhar(faixas, 'origem', 'destino', 'y0'); empilhar(faixas, 'destino', 'origem', 'y1');
  return faixas.map(({ origem, destino, ...f }) => ({ ...f, x0: origem.x + origem.w, x1: destino.x }));
}

// colunas: [[{ id, n, ... }]]; fluxos: [{ de, para, v }]. Devolve { nos: [{ ..., x, y, w, h }], fluxos: [{ ..., x0, y0, x1, y1, h }] }:
// as faixas são traçadas pelo centro (y0 → y1) e h é a espessura.
export function sankey({ colunas, fluxos }, largura, altura, { larguraNo = 12, folga = 10 } = {}) {
  const ids = new Set(colunas.flat().map(n => n.id));
  const validos = fluxos.filter(f => f.v > 0 && ids.has(f.de) && ids.has(f.para));
  if (!validos.length) return { nos: [], fluxos: [] };
  const { escala, nos } = posicionarNos(valorDosNos(colunas, validos), largura, altura, larguraNo, folga);
  return { nos, fluxos: colocarFaixas(nos, validos, escala) };
}

// Mantém os maiores e soma o resto num item "Rótulo (n)"; sem excesso, só ordena.
export function agruparRestante(itens, limite, rotulo) {
  const ordenados = [...itens].sort((a, b) => b.v - a.v);
  if (ordenados.length <= limite) return ordenados;
  const resto = ordenados.slice(limite - 1);
  return [...ordenados.slice(0, limite - 1), { n: `${rotulo} (${resto.length})`, v: soma(resto, i => i.v) }];
}
