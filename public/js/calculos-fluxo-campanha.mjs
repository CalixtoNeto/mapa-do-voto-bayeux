// Grafo do dinheiro de uma campanha: de onde veio (grupos de origem) → campanha → em que foi gasto (categorias de despesa).
import { sentence } from './formato.mjs';
import { grafoComMeio } from './calculos-fluxo.mjs';

// resumo: o de resumoFinanceiro; sem recebido ou sem gasto por categoria não há fluxo a mostrar.
export function grafoDaCampanha(resumo) {
  const origens = resumo.grupos.filter(g => g.v > 0).map(g => ({ n: g.nome, v: g.v }));
  const destinos = resumo.categorias.filter(c => c[1] > 0).map(c => ({ n: sentence(c[0]), v: c[1] }));
  return origens.length && destinos.length ? grafoComMeio({ origens, meio: 'Campanha', destinos, limite: 7, rotulo: 'Outras categorias' }) : null;
}
