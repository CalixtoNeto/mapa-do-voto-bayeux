// Cálculos do dinheiro de campanha e do perfil dos candidatos (reexportados por calculos.mjs).
import { ehEleito, ehMulher, ehNegro } from './regras.mjs';

// Origens do dinheiro, agrupadas em quatro para caber num gráfico; o detalhe fica no texto.
export const GRUPOS_DE_ORIGEM = [
  { id: 'fefc', nome: 'Fundo eleitoral', origens: ['fefc'] },
  { id: 'partido', nome: 'Fundo partidário e partido', origens: ['fp', 'part'] },
  { id: 'doacoes', nome: 'Doações', origens: ['pf', 'pj'] },
  { id: 'outros', nome: 'Próprios, outros candidatos e outros', origens: ['prop', 'cand', 'out'] },
];

export function resumoFinanceiro(f) {
  const r = f?.r || {}, soma = origens => origens.reduce((s, o) => s + (r[o] || 0), 0);
  const grupos = GRUPOS_DE_ORIGEM.map(g => ({ ...g, v: soma(g.origens) }));
  return { recebido: grupos.reduce((s, g) => s + g.v, 0), grupos, gasto: f?.d || 0, repasses: f?.rep || 0,
    categorias: f?.dc || [], fefc: r.fefc || 0, proprios: r.prop || 0, deCandidatos: r.cand || 0 };
}

export const custoPorVoto = (gasto, votos) => votos > 0 && gasto > 0 ? gasto / votos : null;

export function linhasFinanceiras(candidatos, financas, chaveDe) {
  return candidatos.map(cand => {
    const resumo = resumoFinanceiro(financas?.c?.[chaveDe(cand)]);
    return { cand, recebido: resumo.recebido, fefc: resumo.fefc, gasto: resumo.gasto, custo: custoPorVoto(resumo.gasto, cand.total) };
  });
}

// A regra dos 30% do fundo eleitoral para mulheres vale para o total nacional de cada partido;
// a parcela na UF ou no município só indica como o partido distribuiu o dinheiro ali.
export function cotaPorPartido(candidatos, financas, perfis, chaveDe) {
  const porPartido = new Map();
  for (const cand of candidatos) {
    const perfil = perfis?.c?.[chaveDe(cand)] || {}, fefc = financas?.c?.[chaveDe(cand)]?.r?.fefc || 0;
    const partido = perfil.p || cand.partido || '?';
    const p = porPartido.get(partido) || { partido, candidatos: 0, mulheres: 0, fefc: 0, fefcMulheres: 0, fefcNegros: 0 };
    p.candidatos++; p.fefc += fefc;
    if (ehMulher(perfil.g)) { p.mulheres++; p.fefcMulheres += fefc; }
    if (ehNegro(perfil.r)) p.fefcNegros += fefc;
    porPartido.set(partido, p);
  }
  return [...porPartido.values()].sort((a, b) => b.fefc - a.fefc || a.partido.localeCompare(b.partido));
}

export function perfilDoGrupo(candidatos, perfis, chaveDe, campo) {
  const porValor = new Map();
  for (const cand of candidatos) {
    const perfil = perfis?.c?.[chaveDe(cand)];
    if (!perfil?.[campo]) continue;
    const linha = porValor.get(perfil[campo]) || { valor: perfil[campo], candidatos: 0, eleitos: 0 };
    linha.candidatos++;
    if (ehEleito(cand.sit || perfil.s)) linha.eleitos++;
    porValor.set(perfil[campo], linha);
  }
  return [...porValor.values()].sort((a, b) => b.candidatos - a.candidatos);
}
