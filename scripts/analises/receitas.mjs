// Classificação do dinheiro de campanha pelas colunas de fonte e origem da prestação de contas do TSE.
// O fundo eleitoral (FEFC) e o fundo partidário chegam como "recursos de partido político"; o que os
// distingue é a fonte. Dinheiro vindo de outro candidato fica à parte para não ser contado duas vezes.
import { normalizarNome } from '../lib/texto.mjs';

export const ORIGENS = ['fefc', 'fp', 'part', 'pf', 'pj', 'prop', 'cand', 'out'];

const REGRAS_DE_ORIGEM = [
  ['pf', /PESSOAS FISICAS|FINANCIAMENTO COLETIVO|INTERNET/],
  ['pj', /PESSOAS JURIDICAS/],
  ['prop', /PROPRIOS/],
  ['part', /PARTIDO/],
];

export function origemDaReceita(fonte, origem) {
  const deOnde = normalizarNome(origem), qual = normalizarNome(fonte);
  if (/OUTROS CANDIDATOS/.test(deOnde)) return 'cand';
  if (/FUNDO ESPECIAL/.test(qual)) return 'fefc';
  if (/FUNDO PARTIDARIO/.test(qual)) return 'fp';
  return REGRAS_DE_ORIGEM.find(([, regra]) => regra.test(deOnde))?.[0] || 'out';
}

// Doar ou transferir para outra campanha aparece como despesa, mas o dinheiro é gasto por quem recebe.
export const ehRepasse = origemDaDespesa => /^(DOACO|DOACA|TRANSFERENCIA)/.test(normalizarNome(origemDaDespesa));
