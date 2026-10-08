// Comparecimento, abstenção, brancos e nulos por local de votação (TSE, detalhe da votação por seção).
// Cada seção soma seus números no local onde funciona, como os votos; o site agrupa os locais em bairros.
import { CDN, baixar, lerCsvsDoZip } from '../lib/tse.mjs';
import { porRegistro, campo } from '../lib/csv.mjs';
import { numerosDoComparecimento, somarComparecimento, exigirColunasDoComparecimento } from '../analises/comparecimento.mjs';
import { UF, MUNICIPIO_TSE, DIGITOS_DO_CANDIDATO, PASTA_DOWNLOADS } from '../eleicao/config.mjs';

// O TSE já publicou este arquivo por UF e num .zip nacional; tenta o menor primeiro.
const ENDERECOS = ano => [
  [`${CDN}/detalhe_votacao_secao/detalhe_votacao_secao_${ano}_${UF}.zip`, `detalhe-secao-${ano}-${UF}.zip`],
  [`${CDN}/detalhe_votacao_secao/detalhe_votacao_secao_${ano}.zip`, `detalhe-secao-${ano}.zip`],
];

export async function comparecimentoViaCsv(ano, localDaSecao) {
  for (const [url, arquivo] of ENDERECOS(ano)) {
    const zip = `${PASTA_DOWNLOADS}/${arquivo}`;
    if (!await baixar(url, zip)) continue;
    const porTurno = {};
    const aoLinha = leitorDeComparecimento({ ano, localDaSecao, porTurno });
    await lerCsvsDoZip(zip, [{ padrao: new RegExp(`_${UF}\\.csv$`, 'i'), aoLinha }]);
    return Object.keys(porTurno).length ? porTurno : null;
  }
  return null;
}

export function leitorDeComparecimento({ ano, localDaSecao, porTurno }) {
  return porRegistro({
    descartarRapido: linha => !linha.includes(MUNICIPIO_TSE),
    aoCabecalho: colunas => exigirColunasDoComparecimento(colunas, ano),
    aoRegistro: (campos, colunas) => {
      const valor = nome => campo(campos, colunas, nome), cargo = valor('CD_CARGO');
      if (valor('SG_UF') !== UF || valor('CD_MUNICIPIO') !== MUNICIPIO_TSE || valor('ANO_ELEICAO') !== ano) return;
      if (DIGITOS_DO_CANDIDATO[cargo] == null) return;
      const lugar = localDaSecao(campos, colunas);
      if (lugar != null) somarComparecimento(porTurno, { turno: valor('NR_TURNO'), cargo, lugar }, numerosDoComparecimento(campos, colunas));
    },
  });
}
