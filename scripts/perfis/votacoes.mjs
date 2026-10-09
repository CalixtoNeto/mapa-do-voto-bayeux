// Votos nominais da Câmara (SAPL): como cada vereador votou, se acompanhou a maioria e com quem mais concorda.
// Só Sim e Não entram na maioria e na concordância; abstenção e ausência não dizem para que lado foi.
const SENTIDO = { SIM: 'S', 'NÃO': 'N', NAO: 'N', 'ABSTENÇÃO': 'A', ABSTENCAO: 'A' };
const sentido = voto => SENTIDO[String(voto || '').trim().toUpperCase()] || 'O';

// Map votação → Map vereador → 'S' | 'N' | 'A' | 'O' (outro: não votou, presidente…)
export function votosPorVotacao(votos) {
  const porVotacao = new Map();
  for (const v of votos) {
    if (!porVotacao.has(v.votacao)) porVotacao.set(v.votacao, new Map());
    porVotacao.get(v.votacao).set(v.parlamentar, sentido(v.voto));
  }
  return porVotacao;
}

function maioria(votos) {
  let sim = 0, nao = 0;
  for (const s of votos.values()) { if (s === 'S') sim++; else if (s === 'N') nao++; }
  return sim === nao ? null : sim > nao ? 'S' : 'N';
}

export function resumoDosVotos(id, porVotacao) {
  const r = { sim: 0, nao: 0, abstencao: 0, outros: 0, comMaioria: 0, comMaioriaDe: 0 };
  const campo = { S: 'sim', N: 'nao', A: 'abstencao', O: 'outros' };
  for (const votos of porVotacao.values()) {
    const s = votos.get(id);
    if (!s) continue;
    r[campo[s]]++;
    const lado = maioria(votos);
    if ((s === 'S' || s === 'N') && lado) { r.comMaioriaDe++; if (s === lado) r.comMaioria++; }
  }
  return r;
}

// [[outro vereador, votos iguais, votações em que os dois votaram Sim ou Não]], do mais parecido ao menos.
export function afinidades(id, porVotacao, minimo = 5) {
  const pares = new Map();
  for (const votos of porVotacao.values()) {
    const meu = votos.get(id);
    if (meu !== 'S' && meu !== 'N') continue;
    for (const [outro, s] of votos) {
      if (outro === id || (s !== 'S' && s !== 'N')) continue;
      const par = pares.get(outro) || [outro, 0, 0];
      par[1] += s === meu ? 1 : 0; par[2]++;
      pares.set(outro, par);
    }
  }
  return [...pares.values()].filter(p => p[2] >= minimo).sort((a, b) => b[1] / b[2] - a[1] / a[2] || b[2] - a[2]);
}
