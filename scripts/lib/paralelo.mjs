// Executa fn sobre os itens com no máximo `limite` chamadas simultâneas.
export async function paralelo(itens, limite, fn) {
  const saida = new Array(itens.length); let prox = 0;
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, async () => {
    while (prox < itens.length) { const i = prox++; saida[i] = await fn(itens[i], i); }
  }));
  return saida;
}
