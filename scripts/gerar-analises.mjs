// Gera as análises de cada eleição (perfil e bens dos candidatos, dinheiro de campanha dos vereadores,
// comparecimento por local de votação), commitadas em public/data/eleicoes/ como os arquivos de votação.
//   node scripts/gerar-analises.mjs [ano ...] [--indice]
// Sem anos, refaz todos os do site. Cada fonte é independente: a que o TSE ainda não publicou fica de fora.
// A prestação de contas existe neste formato de 2018 em diante (nas municipais, de 2020).
import { ANOS_PADRAO, PASTA_ELEICOES } from './eleicao/config.mjs';
import { candidatosViaCsv } from './fontes/candidatos.mjs';
import { financasViaCsv } from './fontes/prestacao-contas.mjs';
import { comparecimentoViaCsv } from './fontes/comparecimento.mjs';
import { carregarTabelaDeSecoes, localizadorDeSecoes } from './fontes/tabela-secoes.mjs';
import { resumoDasFinancas } from './analises/financas.mjs';
import { escreverAnalises, indexarAnalises } from './saida/analises.mjs';

async function tentar(descricao, buscar) {
  try {
    const dados = await buscar();
    if (!dados) console.log(`  ${descricao}: não está no TSE (ainda não publicado, ou não existe para este ano)`);
    return dados;
  } catch (e) { console.warn(`  ${descricao} falhou (${e.message})`); return null; }
}

async function comparecimentoDoAno(ano) {
  const tabela = await carregarTabelaDeSecoes(ano);
  return tabela ? comparecimentoViaCsv(ano, localizadorDeSecoes(tabela)) : null;
}

async function gerarAno(ano) {
  console.log(`Análises de ${ano}:`);
  const perfis = await tentar('cadastro de candidatos', () => candidatosViaCsv(ano));
  const financas = await tentar('prestação de contas', () => financasViaCsv(ano));
  const comparecimento = await tentar('comparecimento', () => comparecimentoDoAno(ano));
  const resumo = financas && resumoDasFinancas(financas, ano, new Date());
  await escreverAnalises(PASTA_ELEICOES, ano, { perfis, financas: resumo, comparecimento });
}

const args = process.argv.slice(2);
const anosPedidos = args.filter(a => /^\d{4}$/.test(a));
if (!args.includes('--indice')) for (const ano of anosPedidos.length ? anosPedidos : ANOS_PADRAO) await gerarAno(ano);
await indexarAnalises(PASTA_ELEICOES);
