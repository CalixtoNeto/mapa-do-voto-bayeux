// Cálculos da ficha do candidato além do dinheiro: quociente e puxador de votos, onde é mais forte, eleitorado
// de onde vêm os votos, rede de doadores e fornecedores, ritmo da arrecadação, dívida e evolução do patrimônio.
const soma = valores => valores.reduce((s, v) => s + v, 0);

// Quociente eleitoral = votos válidos (nominais e de legenda) ÷ vagas; as vagas são os eleitos do cargo.
export function quocienteEleitoral(cands, eleito, legenda = 0) {
  const vagas = cands.filter(eleito).length;
  if (!vagas) return null;
  return { vagas, quociente: (soma(cands.map(c => c.total)) + legenda) / vagas, comLegenda: legenda > 0 };
}

export function puxadorDeVotos(cand, cands, eleito) {
  const doPartido = cands.filter(c => c.partido === cand.partido).sort((a, b) => b.total - a.total);
  const totais = grupo => cands.filter(grupo).map(c => c.total);
  return {
    parcelaNoPartido: cand.total / soma(doPartido.map(c => c.total)),
    posicaoNoPartido: doPartido.findIndex(c => c.key === cand.key) + 1, noPartido: doPartido.length,
    ultimoEleito: Math.min(...totais(eleito)), primeiroNaoEleito: Math.max(...totais(c => !eleito(c))),
  };
}

// Índice de localização: parcela dos votos do lugar que foi para o candidato, dividida pela parcela dele no
// total. Acima de 1, ele vai melhor ali do que no conjunto. `minimo` evita lugares com meia dúzia de votos.
export function forcaPorLugar(votos, tot, { minimo = 1, quantos = 8 } = {}) {
  const geral = soma(Object.values(votos)) / soma(Object.values(tot));
  return Object.entries(votos).filter(([lugar, v]) => v >= minimo && tot[lugar] > 0)
    .map(([lugar, v]) => ({ lugar, votos: v, parcela: v / tot[lugar], indice: v / tot[lugar] / geral }))
    .filter(f => f.indice > 1).sort((a, b) => b.indice - a.indice).slice(0, quantos);
}

// Posições em ANO-eleitorado.json: [eleitores, mulheres, jovens, idosos, superior completo, pouco estudo].
export const INDICADORES_DO_ELEITORADO = [
  ['mulheres', 1, 'Mulheres'], ['jovens', 2, 'Jovens (16 a 24 anos)'], ['idosos', 3, '60 anos ou mais'],
  ['superior', 4, 'Superior completo'], ['poucoEstudo', 5, 'Até o fundamental incompleto'],
];

// Perfil médio dos lugares de onde vêm os votos (ponderado pelos votos), contra o de todos os eleitores.
export function eleitoradoDosVotos(votos, eleitorado) {
  const lugares = Object.keys(votos).filter(l => eleitorado[l]?.[0] > 0);
  const totalDeVotos = soma(lugares.map(l => votos[l])), todos = Object.values(eleitorado);
  if (!totalDeVotos) return [];
  return INDICADORES_DO_ELEITORADO.map(([id, i, nome]) => ({ id, nome,
    dosVotos: soma(lugares.map(l => votos[l] * eleitorado[l][i] / eleitorado[l][0])) / totalDeVotos,
    geral: soma(todos.map(e => e[i])) / soma(todos.map(e => e[0])) }));
}

// doa ([nome, tipo, valor, índice?]) ou fo ([nome, valor, índice?]): o índice aponta para a lista do arquivo,
// que diz o que o mesmo doador ou fornecedor teve com os outros candidatos.
export function redeDoCandidato(itens, lista, chave, candPorChave) {
  return (itens || []).map(item => {
    const tamanho = typeof item[1] === 'string' ? 4 : 3, i = item.length === tamanho ? item[tamanho - 1] : null;
    const outros = i == null ? [] : (lista?.[i]?.c || []).filter(([k]) => k !== chave && candPorChave.has(k))
      .map(([k, v]) => ({ cand: candPorChave.get(k), v })).sort((a, b) => b.v - a.v);
    return { n: item[0], v: item[tamanho - 2], outros };
  }).filter(r => r.outros.length);
}

export function ritmoDaArrecadacao(semanas) {
  const total = soma((semanas || []).map(([, v]) => v));
  let acumulado = 0;
  const lista = (semanas || []).map(([semana, v]) => ({ semana, v, acumulado: (acumulado += v) / total }));
  return { semanas: lista, metade: lista.find(s => s.acumulado >= 0.5)?.semana || null };
}

export function evolucaoPatrimonial(declaracoes) {
  const ordem = [...declaracoes].sort((a, b) => a[0] - b[0]);
  const pontos = ordem.map(([ano, v], i) => ({ ano, v, variacao: i && ordem[i - 1][1] ? v / ordem[i - 1][1] - 1 : null }));
  const [anoA, a] = ordem[0] || [], [anoB, b] = ordem[ordem.length - 1] || [];
  const anos = anoB - anoA;
  return { pontos, total: a ? b / a - 1 : null, aoAno: a && anos > 0 ? Math.pow(b / a, 1 / anos) - 1 : null };
}

// Despesa contratada e não paga até a prestação de contas. Sem pg no arquivo, não dá para saber.
export const dividaDeCampanha = f => f?.pg != null ? Math.max(0, (f.d || 0) - f.pg) : null;

export function dependencia(f, perfil, recebido) {
  const proprios = f?.r?.prop || 0;
  return { maiorDoador: recebido && f?.doa?.[0] ? f.doa[0][2] / recebido : null, proprios: recebido ? proprios / recebido : null,
    propriosSobreBens: perfil?.b ? proprios / perfil.b : null };
}
