// Grafo do eleitorado de uma eleição: aptos → compareceram ou abstenção → votos válidos, brancos e nulos.

// c: { aptos, comparecimento, brancos, nulos } do cargo (somaDoComparecimento).
export function grafoDoEleitorado({ aptos, comparecimento, brancos, nulos }) {
  if (!(aptos > 0)) return null;
  const validos = comparecimento - brancos - nulos, abstencao = aptos - comparecimento;
  return { colunas: [[{ id: 'aptos', n: 'Aptos' }], [{ id: 'comp', n: 'Compareceram' }, { id: 'abstencao', n: 'Abstenção' }],
      [{ id: 'validos', n: 'Votos válidos' }, { id: 'nulos', n: 'Nulos' }, { id: 'brancos', n: 'Brancos' }]],
    fluxos: [{ de: 'aptos', para: 'comp', v: comparecimento }, { de: 'aptos', para: 'abstencao', v: abstencao },
      { de: 'comp', para: 'validos', v: validos }, { de: 'comp', para: 'nulos', v: nulos }, { de: 'comp', para: 'brancos', v: brancos }] };
}
