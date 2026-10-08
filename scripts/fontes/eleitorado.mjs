// Perfil do eleitorado por seção (TSE, perfil_eleitor_secao): gênero, idade e escolaridade de quem pode votar.
// Cada seção soma no lugar do site onde fica (município na Paraíba, local de votação em Bayeux); lugarDe decide.
import { CDN, baixar, lerCsvsDoZip } from '../lib/tse.mjs';
import { porRegistro, campo } from '../lib/csv.mjs';
import { numerosDoEleitor, somarEleitorado, exigirColunasDoEleitorado } from '../analises/eleitorado.mjs';
import { UF, PASTA_DOWNLOADS } from '../eleicao/config.mjs';

export async function eleitoradoViaCsv(ano, { lugarDe, descartarRapido }) {
  const zip = `${PASTA_DOWNLOADS}/perfil-eleitor-secao-${ano}-${UF}.zip`;
  if (!await baixar(`${CDN}/perfil_eleitor_secao/perfil_eleitor_secao_${ano}_${UF}.zip`, zip)) return null;
  const lugares = {};
  await lerCsvsDoZip(zip, [{ padrao: /\.csv$/i, aoLinha: leitorDoEleitorado({ ano, lugarDe, descartarRapido, lugares }) }]);
  return Object.keys(lugares).length ? lugares : null;
}

export function leitorDoEleitorado({ ano, lugarDe, descartarRapido, lugares }) {
  return porRegistro({
    descartarRapido,
    aoCabecalho: colunas => exigirColunasDoEleitorado(colunas, ano),
    aoRegistro: (campos, colunas) => {
      const anoDoArquivo = campo(campos, colunas, 'ANO_ELEICAO');
      if ((anoDoArquivo && anoDoArquivo !== ano) || campo(campos, colunas, 'SG_UF') !== UF) return;
      const lugar = lugarDe(campos, colunas);
      if (lugar != null) somarEleitorado(lugares, lugar, numerosDoEleitor(campos, colunas));
    },
  });
}
