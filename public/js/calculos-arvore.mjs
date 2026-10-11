// Árvores de decomposição ({ v, filhos: [[nome, valor, filhos?], …] }): o total que se abre, nível a nível,
// até quem recebeu. Usadas no gasto da campanha e no perfil da Prefeitura.

// Ramo da árvore no caminho escolhido (lista de nomes a partir da raiz).
export function ramoDaArvore(arvore, caminho) {
  let filhos = arvore.filhos, valor = arvore.v;
  for (const nome of caminho) {
    const ramo = (filhos || []).find(f => f[0] === nome);
    if (!ramo) break;
    [, valor, filhos] = ramo;
  }
  return { valor, filhos: filhos || [] };
}

// Gasto da campanha: categoria de despesa → quem recebeu (dc do arquivo de finanças).
export const arvoreDoGasto = categorias => ({ v: categorias.reduce((s, c) => s + c[1], 0), filhos: categorias });

// Lugares do mapa (bairro ou município) como árvore: lugar → local de votação. Cada ramo é [nome, votos, filhos, nota, chave];
// a nota é a parcela dos votos nominais e a chave liga a linha ao lugar do mapa. Lugares sem voto ficam de fora.
const ORDENS = {
  votos: (a, b) => b.v - a.v || a.name.localeCompare(b.name, 'pt-BR'),
  pct: (a, b) => b.p - a.p || b.v - a.v,
  nome: (a, b) => a.name.localeCompare(b.name, 'pt-BR'),
};

const ramoDoLocal = (local, parcela) => [local.nome, local.v, null, local.t ? parcela(local.v / local.t) : ''];

export function arvoreDosLugares(lugares, { ordem = 'votos', parcela }) {
  const com = lugares.filter(l => l.v > 0).sort(ORDENS[ordem]);
  const filhos = com.map(l => [l.name, l.v, l.locais.filter(x => x.v > 0).map(x => ramoDoLocal(x, parcela)), parcela(l.p), l.key]);
  return { v: com.reduce((s, l) => s + l.v, 0), filhos };
}
