// Árvores da Prefeitura (sem DOM): licitações por modalidade, maiores credores e credores ligados a campanhas.
import { maioresCredores } from './calculos-municipio.mjs';
import { parteDoPai, parteTexto, soma, plural, periodo } from './arvores-ramos.mjs';

// modalidades: [[nome, processos, valor]]; detalhe: árvore modalidade → vencedor (pode faltar enquanto carrega).
export function arvoreDasModalidades(modalidades, detalhe) {
  const total = soma(modalidades.map(([, , v]) => [0, v])), vencedores = new Map((detalhe?.filhos || []).map(f => [f[0], f[2]]));
  const filhos = modalidades.filter(m => m[2] > 0).map(([nome, processos, v]) =>
    [nome, v, parteDoPai(vencedores.get(nome), v, 'da modalidade'), `${plural(processos, 'processo', 'processos')} · ${parteTexto(v, total)}`]);
  return { v: soma(filhos), filhos };
}

// fornecedor → { área → { tipo → valor } }, a partir da árvore área → tipo de despesa → fornecedor.
function porFornecedor(arvoreArea) {
  const indice = new Map();
  for (const [area, , tipos] of arvoreArea?.filhos || []) for (const [tipo, , fornecedores] of tipos || []) for (const [nome, v] of fornecedores || []) {
    if (!(v > 0)) continue;
    const areas = indice.get(nome) || new Map(), tipos2 = areas.get(area) || new Map();
    indice.set(nome, areas.set(area, tipos2.set(tipo, (tipos2.get(tipo) || 0) + v)));
  }
  return indice;
}

const ramoDaArea = (area, tipos, doCredor) => {
  const filhos = [...tipos].map(([t, v]) => [t, v]), v = soma(filhos);
  return [area, v, parteDoPai(filhos, v, `de ${area}`), `${parteTexto(v, doCredor)} do credor`];
};

// Um credor pode vir em mais de uma linha (um documento por linha); a árvore por área só conhece o nome, então somam-se as linhas do mesmo nome.
function somaPorNome(credores) {
  const nomes = new Map();
  for (const [n, doc, v, vezes] of credores) { const c = nomes.get(n); nomes.set(n, c ? [n, doc, c[2] + v, c[3] + vezes] : [n, doc, v, vezes]); }
  return [...nomes.values()];
}

const FOLGA = 1.005;

// credores: [nome, documento, pago, vezes]. O valor do credor é o do arquivo; o que há abaixo vem do detalhe do ano e só entra se couber nele
// (o detalhe pode juntar homônimos ou pagamentos que a lista de credores não traz).
export function arvoreDosCredores(credores, arvoreArea, quantos = 40) {
  const indice = porFornecedor(arvoreArea), lista = maioresCredores(somaPorNome(credores), quantos), total = soma(lista.map(c => [0, c.v]));
  const filhos = lista.map(c => {
    const areas = [...(indice.get(c.n) || [])].map(([area, tipos]) => ramoDaArea(area, tipos, c.v));
    return [c.n, c.v, soma(areas) <= c.v * FOLGA ? areas : [], `${plural(c.vezes, 'pagamento', 'pagamentos')} · ${parteTexto(c.v, total)}`];
  });
  return { v: soma(filhos), filhos };
}

const rotuloDaCampanha = (c, comCandidato) => comCandidato && c.quem ? c.quem : `Campanha de ${c.eleicao}`;
const papelDaCampanha = c => `${c.papel === 'doou' ? 'doou à' : 'recebeu da'} campanha · ${c.eleicao}`;

// grupos: resultado de agruparLigacoes ({ credor, pago, anos, campanhas }); o valor do credor é o que o município pagou.
export function arvoreDasLigacoes(grupos, comCandidato) {
  const filhos = grupos.map(g => [g.credor, g.pago, g.campanhas.map(c => [rotuloDaCampanha(c, comCandidato), c.valor, null, papelDaCampanha(c)]),
    `pago em ${periodo(g.anos[0], g.anos[g.anos.length - 1])}`]);
  return { v: soma(filhos), filhos };
}
