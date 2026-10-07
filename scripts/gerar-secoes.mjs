// Gera public/data/secoes-ANO.json: para cada seção eleitoral de Bayeux, o local de votação,
// o bairro e as coordenadas (TSE, "Eleitorado por local de votação").
// Uso: npm run secoes [ano ...]   (padrão: todas as eleições do site)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { ANOS_PADRAO, MUNICIPIO_TSE, CONTORNO, PASTA_DOWNLOADS, arquivoDaTabelaDeSecoes } from './eleicao/config.mjs';
import { caixaDoContorno } from './secoes/coordenadas.mjs';
import { baixarLocaisDeVotacao, linhasDoMunicipio } from './secoes/linhas-do-municipio.mjs';
import { montarTabelaDeSecoes } from './secoes/tabela.mjs';

async function gerarTabela(ano, caixa) {
  const { linhas, colunas } = await linhasDoMunicipio(await baixarLocaisDeVotacao(ano));
  const { tabela, rejeitadas } = montarTabelaDeSecoes({ ano, municipio: MUNICIPIO_TSE, linhas, colunas, caixa });
  const [exemplo] = rejeitadas;
  if (exemplo) console.log(`${ano}: coordenada rejeitada, ex.: lat="${exemplo.lat}" lon="${exemplo.lon}"`);
  await writeFile(arquivoDaTabelaDeSecoes(ano), JSON.stringify(tabela));
  console.log(`${ano}: ${resumo(tabela, rejeitadas)}`);
}

function resumo({ locais, secoes }, rejeitadas) {
  const bairros = new Set(locais.map(l => l.bairro).filter(Boolean));
  const semBairro = locais.filter(l => !l.bairro).length;
  return `${Object.keys(secoes).length} seções, ${locais.length} locais, ${bairros.size} bairros, `
    + `${semBairro} locais sem bairro, ${rejeitadas.length} sem coordenadas`;
}

const anos = process.argv.slice(2).length ? process.argv.slice(2) : ANOS_PADRAO;
const caixa = caixaDoContorno(JSON.parse(await readFile(CONTORNO, 'utf8')));
await mkdir(PASTA_DOWNLOADS, { recursive: true });
await mkdir('public/data', { recursive: true });
for (const ano of anos) await gerarTabela(ano, caixa);
