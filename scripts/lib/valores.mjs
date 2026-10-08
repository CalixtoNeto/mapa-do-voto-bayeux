// Valores em reais como o TSE publica: vírgula decimal, às vezes com ponto de milhar ("1.234,56").
// Alguns arquivos usam ponto decimal ("250.75").
export function reais(texto) {
  const limpo = String(texto || '').trim();
  const numero = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  return parseFloat(numero) || 0;
}

export const emReais = valor => Math.round(valor);
