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
