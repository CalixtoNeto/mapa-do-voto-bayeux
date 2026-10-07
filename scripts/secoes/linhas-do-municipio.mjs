// Tabela "Eleitorado por local de votação" do TSE: um CSV nacional, do qual só interessam as linhas de Bayeux.
import { CDN, baixar, lerCsvDoZip } from '../lib/tse.mjs';
import { porRegistro } from '../lib/csv.mjs';
import { UF, MUNICIPIO_TSE, PASTA_DOWNLOADS } from '../eleicao/config.mjs';

export async function baixarLocaisDeVotacao(ano) {
  const zip = `${PASTA_DOWNLOADS}/local-votacao-${ano}.zip`;
  const url = `${CDN}/eleitorado_locais_votacao/eleitorado_local_votacao_${ano}.zip`;
  if (!await baixar(url, zip)) throw new Error(`TSE respondeu 404 para ${ano}`);
  return zip;
}

export async function linhasDoMunicipio(zip) {
  const linhas = [];
  let colunasDoArquivo = null;
  await lerCsvDoZip(zip, /\.csv$/i, porRegistro({
    descartarRapido: linha => !linha.includes(`"${MUNICIPIO_TSE}"`),
    aoCabecalho: colunas => { colunasDoArquivo = colunas; },
    aoRegistro: (campos, colunas) => {
      if (campos[colunas.SG_UF] === UF && campos[colunas.CD_MUNICIPIO] === MUNICIPIO_TSE) linhas.push(campos);
    },
  }));
  return { linhas, colunas: colunasDoArquivo };
}
