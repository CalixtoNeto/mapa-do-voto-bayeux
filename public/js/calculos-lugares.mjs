// Cálculos por lugar (município ou bairro): fragmentação do voto, margem de vitória e variação da abstenção.
const votosNoLugar = (cands, lugar, votosDe) => cands.map(cand => ({ cand, v: votosDe(cand)[lugar] || 0 })).filter(x => x.v > 0);

// Número efetivo de candidatos (inverso do índice de Herfindahl): 1 quando um só leva tudo.
export function fragmentacao(cands, lugares, votosDe) {
  return lugares.map(lugar => {
    const votos = votosNoLugar(cands, lugar, votosDe), total = votos.reduce((s, x) => s + x.v, 0);
    return total ? { lugar, efetivo: 1 / votos.reduce((s, x) => s + (x.v / total) ** 2, 0) } : null;
  }).filter(Boolean);
}

export function margens(cands, lugares, votosDe) {
  return lugares.map(lugar => {
    const votos = votosNoLugar(cands, lugar, votosDe).sort((a, b) => b.v - a.v), total = votos.reduce((s, x) => s + x.v, 0);
    if (votos.length < 2) return null;
    return { lugar, primeiro: votos[0].cand, segundo: votos[1].cand, margem: (votos[0].v - votos[1].v) / total };
  }).filter(Boolean);
}

// Números de comparecimento: [aptos, comparecimento, ...]. Diferença em pontos percentuais (0,1 = 10 p.p.).
export function variacaoDaAbstencao(atual, anterior) {
  const abstencao = ([aptos, comparecimento]) => aptos ? (aptos - comparecimento) / aptos : null;
  return Object.keys(atual || {}).filter(lugar => anterior?.[lugar] && abstencao(anterior[lugar]) != null && abstencao(atual[lugar]) != null)
    .map(lugar => {
      const antes = abstencao(anterior[lugar]), agora = abstencao(atual[lugar]);
      return { lugar, antes, agora, diferenca: agora - antes };
    });
}
