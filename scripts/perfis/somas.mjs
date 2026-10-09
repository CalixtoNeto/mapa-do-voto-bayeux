// Somas por chave e listas ordenadas, comuns aos resumos dos perfis.
export const centavos = v => Math.round(v * 100) / 100;

export function somar(mapa, chave, valor) {
  mapa[chave] = (mapa[chave] || 0) + valor;
}

// { chave: valor } → [[chave, valor]] do maior para o menor.
export const ordenado = (mapa, limite = Infinity) => Object.entries(mapa)
  .map(([chave, v]) => [chave, centavos(v)]).sort((a, b) => b[1] - a[1]).slice(0, limite);

// Quem recebeu (credor, fornecedor): nome, CPF ou CNPJ, valor e quantas vezes.
export function somarRecebedor(mapa, nome, doc, valor) {
  const chave = doc || nome;
  const r = (mapa[chave] ||= { nome, doc, v: 0, n: 0 });
  r.v += valor; r.n += 1;
}

export const recebedoresOrdenados = (mapa, limite) => Object.values(mapa)
  .sort((a, b) => b.v - a.v).slice(0, limite).map(r => [r.nome, r.doc, centavos(r.v), r.n]);
