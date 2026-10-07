// Gera os dados do site (public/data/eleicoes/ANO-tTURNO.json),
// que são commitados e servidos como arquivos estáticos.
//   node scripts/gerar-dados.mjs [ano ...] [--forcar] [--indice]
// Sem anos, gera os que ainda não existem. Com --forcar, refaz os anos informados. Com --indice, só refaz o índice.
// Os bairros precisam de votos por seção eleitoral, e a API do TSE só entrega votos por município.
// Por isso a ordem é: CSV por seção dos Dados Abertos (com bairros); se o TSE ainda não o publicou,
// usa a API e o site mostra só o total da cidade (semBairros) até o CSV sair.
import { existsSync } from 'node:fs';
import { ANOS_PADRAO, PASTA_ELEICOES } from './eleicao/config.mjs';
import { votacaoViaCsv } from './fontes/csv-secao.mjs';
import { votacaoViaApi } from './fontes/api-resultados.mjs';
import { escreverEleicao } from './saida/escrever.mjs';
import { indexar } from './saida/indice.mjs';

async function gerarAno(ano) {
  console.log(`Ciclo ${ano}:`);
  const votacao = await votacaoDoAno(ano);
  if (!votacao) { console.warn(`  sem dados para ${ano}`); return false; }
  await escreverEleicao(PASTA_ELEICOES, ano, votacao);
  return true;
}

async function votacaoDoAno(ano) {
  try {
    const votacao = await votacaoViaCsv(ano);
    if (votacao) return votacao;
    console.log('  CSV por seção ainda não publicado; tentando a API (só total do município)');
  } catch (e) { console.warn(`  CSV falhou (${e.message}); tentando a API`); }
  try { return await votacaoViaApi(ano); } catch (e) { console.warn(`  API falhou (${e.message})`); return null; }
}

async function gerarAnos(anos, forcar) {
  for (const ano of anos) {
    if (!forcar && existsSync(`${PASTA_ELEICOES}/${ano}-t1.json`)) {
      console.log(`Eleição ${ano}: já existe (use --forcar para refazer)`);
    } else if (!await gerarAno(ano)) process.exitCode = 1;
  }
}

const args = process.argv.slice(2);
const anosPedidos = args.filter(a => /^\d{4}$/.test(a));
if (args.includes('--indice')) await indexar(PASTA_ELEICOES);
else await gerarAnos(anosPedidos.length ? anosPedidos : ANOS_PADRAO, args.includes('--forcar'));
