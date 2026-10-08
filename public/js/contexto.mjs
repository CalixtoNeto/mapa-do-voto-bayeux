// Tudo o que as análises de um cargo precisam, montado uma vez por eleição e cargo.
// cfg.agrupar(ano, porLocal) leva números por local de votação ao lugar do site (identidade na Paraíba,
// bairro em Bayeux); cfg.chaveDe liga o candidato do site aos arquivos das análises.
import { ehEleito } from './regras.mjs';

export function contextoDasAnalises(cfg, { ds, cands, cargo, an, indice }) {
  if (!ds) return null;
  const agrupar = (ano, porLocal) => porLocal ? cfg.agrupar(ano, porLocal) : null;
  return {
    ds, cands, cargo, financas: an.financas, perfis: an.perfis, chaveDe: cfg.chaveDe,
    eleito: c => ehEleito(c.sit || an.perfis?.c?.[cfg.chaveDe(c)]?.s),
    comparecimento: agrupar(ds.ano, an.comparecimento?.cargos?.[cargo]),
    comparecimentoAnterior: agrupar(an.anoAnterior, an.comparecimentoAnterior?.cargos?.[cargo]),
    eleitorado: agrupar(ds.ano, an.eleitorado?.lugares),
    patrimonio: indice.patrimonio || {}, dinheiro: indice.dinheiro || {},
    candPorChave: new Map(ds.cands.map(c => [cfg.chaveDe(c), c])),
  };
}

// Votos de legenda do cargo: o quinto número do comparecimento, quando o arquivo do TSE traz.
export const legendaDoCargo = comparecimento => Object.values(comparecimento || {}).reduce((s, n) => s + (n[4] || 0), 0);
