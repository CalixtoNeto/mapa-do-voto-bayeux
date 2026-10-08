// Cálculos do panorama do cargo: o dinheiro elege?, partidos, concentração do fundo eleitoral e reeleição.
// `linhas` são as de linhasFinanceiras (cand, recebido, fefc, gasto, custo).
import { mediana } from './calculos-dinheiro.mjs';

const resumoDoGrupo = linhas => ({ n: linhas.length, gasto: mediana(linhas.map(l => l.gasto)),
  custo: mediana(linhas.map(l => l.custo || 0)), recebido: mediana(linhas.map(l => l.recebido || 0)) });

// Faixas de gasto com o mesmo número de candidatos (quartis) e quantos se elegeram em cada uma.
export function eleitosENaoEleitos(linhas, eleito, numeroDeFaixas = 4) {
  const comGasto = linhas.filter(l => l.gasto > 0).sort((a, b) => a.gasto - b.gasto);
  const tamanho = Math.ceil(comGasto.length / numeroDeFaixas);
  const faixas = [];
  for (let i = 0; i < comGasto.length; i += tamanho) {
    const faixa = comGasto.slice(i, i + tamanho);
    faixas.push({ de: faixa[0].gasto, ate: faixa[faixa.length - 1].gasto, candidatos: faixa.length, eleitos: faixa.filter(l => eleito(l.cand)).length });
  }
  return { eleitos: resumoDoGrupo(linhas.filter(l => eleito(l.cand))), naoEleitos: resumoDoGrupo(linhas.filter(l => !eleito(l.cand))), faixas };
}

export function porPartido(linhas, eleito) {
  const partidos = new Map();
  for (const { cand, gasto = 0, fefc = 0 } of linhas) {
    const partido = cand.partido || '?';
    const p = partidos.get(partido) || { partido, candidatos: 0, votos: 0, eleitos: 0, gasto: 0, fefc: 0 };
    p.candidatos++; p.votos += cand.total; p.gasto += gasto; p.fefc += fefc;
    if (eleito(cand)) p.eleitos++;
    partidos.set(partido, p);
  }
  return [...partidos.values()].map(p => ({ ...p, custo: p.votos && p.gasto ? p.gasto / p.votos : null }))
    .sort((a, b) => b.votos - a.votos);
}

// Gini: 0 quando todos recebem o mesmo, perto de 1 quando um só recebe quase tudo.
export function concentracaoDoFundo(linhas) {
  const valores = linhas.map(l => l.fefc).filter(v => v > 0).sort((a, b) => b - a);
  const total = valores.reduce((s, v) => s + v, 0), n = valores.length;
  if (!total) return null;
  const topo = valores.slice(0, Math.max(1, Math.ceil(n / 10))).reduce((s, v) => s + v, 0) / total;
  const crescente = [...valores].reverse();
  const gini = crescente.reduce((s, v, i) => s + (2 * (i + 1) - n - 1) * v, 0) / (n * total);
  return { recebedores: n, total, topo, gini };
}

export function reeleicao(cands, perfis, chaveDe, eleito) {
  const tentaram = cands.filter(c => perfis?.c?.[chaveDe(c)]?.re);
  return { tentaram: tentaram.length, conseguiram: tentaram.filter(eleito).length };
}
