// Eleitorado por lugar (bairro, no site de Bayeux) ao longo dos anos: tabela do mapa de calor e variação. Sem DOM.

// porAno: { ano: { lugar: eleitores } }; devolve os lugares do maior ao menor no último ano e valores[linha][coluna].
export function tabelaDeEleitores(porAno, anos) {
  const lugares = [...new Set(anos.flatMap(a => Object.keys(porAno[a] || {})))];
  const valorEm = (lugar, ano) => porAno[ano]?.[lugar] ?? null;
  const ultimo = lugar => valorEm(lugar, anos[anos.length - 1]) ?? -1;
  const ordenados = lugares.sort((a, b) => ultimo(b) - ultimo(a));
  return { anos, lugares: ordenados, valores: ordenados.map(l => anos.map(a => valorEm(l, a))) };
}

// O cadastro de locais de votação muda de um ano para o outro e o eleitorado "pula": uma variação acima do limite entre
// duas eleições seguidas com dado não é, por si, mudança de moradores.
export function mudouCadastro(valores, limite = 0.4) {
  return valores.some((v, i) => i > 0 && v > 0 && valores[i - 1] > 0 && Math.abs(v / valores[i - 1] - 1) > limite);
}

export function variacaoDosEleitores(tabela) {
  return tabela.lugares.map((lugar, i) => {
    const v = tabela.valores[i], de = v[0], ate = v[v.length - 1];
    return de != null && ate != null ? { lugar, de, ate, diferenca: ate - de, suspeito: mudouCadastro(v) } : null;
  }).filter(Boolean).sort((a, b) => b.diferenca - a.diferenca);
}
