// Comparecimento, abstenção, brancos e nulos por local de votação (TSE, detalhe da votação por seção).
// Cada seção soma seus números no local onde funciona, como os votos; o site agrupa os locais em bairros.
import { CDN, baixar, lerCsvsDoZip } from '../lib/tse.mjs';
import { porRegistro, campo } from '../lib/csv.mjs';
import { numerosDoComparecimento, somarComparecimento, exigirColunasDoComparecimento } from '../analises/comparecimento.mjs';
import { UF, MUNICIPIO_TSE, DIGITOS_DO_CANDIDATO, PASTA_DOWNLOADS, ehPresidente, anoTemPresidente } from '../eleicao/config.mjs';

// O TSE já publicou este arquivo por UF e num .zip nacional; tenta o menor primeiro.
const ENDERECOS = ano => [
  [`${CDN}/detalhe_votacao_secao/detalhe_votacao_secao_${ano}_${UF}.zip`, `detalhe-secao-${ano}-${UF}.zip`],
  [`${CDN}/detalhe_votacao_secao/detalhe_votacao_secao_${ano}.zip`, `detalhe-secao-${ano}.zip`],
];

export async function comparecimentoViaCsv(ano, localDaSecao) {
  for (const [url, arquivo] of ENDERECOS(ano)) {
    const zip = `${PASTA_DOWNLOADS}/${arquivo}`;
    if (!await baixar(url, zip)) continue;
    const porTurno = {}, leitor = cargoAceito => leitorDeComparecimento({ ano, localDaSecao, porTurno, cargoAceito });
    await lerCsvsDoZip(zip, [{ padrao: new RegExp(`_${UF}\\.csv$`, 'i'), aoLinha: leitor(cargo => !ehPresidente(cargo)) }]);
    if (anoTemPresidente(ano)) await lerPresidente(ano, leitor(ehPresidente));
    return Object.keys(porTurno).length ? porTurno : null;
  }
  return null;
}

// O presidente está no arquivo nacional (_BR.csv), publicado à parte ou dentro do .zip de todas as UFs; se nenhum existir,
// o comparecimento do cargo fica de fora e o site avisa.
async function lerPresidente(ano, aoLinha) {
  for (const [url, arquivo] of [[`${CDN}/detalhe_votacao_secao/detalhe_votacao_secao_${ano}_BR.zip`, `detalhe-secao-${ano}-BR.zip`], ENDERECOS(ano)[1]]) {
    try {
      const zip = `${PASTA_DOWNLOADS}/${arquivo}`;
      if (await baixar(url, zip) && (await lerCsvsDoZip(zip, [{ padrao: /_BR\.csv$/i, aoLinha }]))[0]) return;
    } catch (e) { console.warn(`  comparecimento do presidente ${ano}: ${e.message}`); }
  }
  console.warn(`  comparecimento do presidente ${ano}: arquivo nacional não encontrado`);
}

export function leitorDeComparecimento({ ano, localDaSecao, porTurno, cargoAceito = () => true }) {
  return porRegistro({
    descartarRapido: linha => !linha.includes(MUNICIPIO_TSE),
    aoCabecalho: colunas => exigirColunasDoComparecimento(colunas, ano),
    aoRegistro: (campos, colunas) => {
      const valor = nome => campo(campos, colunas, nome), cargo = valor('CD_CARGO');
      if (valor('SG_UF') !== UF || valor('CD_MUNICIPIO') !== MUNICIPIO_TSE || valor('ANO_ELEICAO') !== ano) return;
      if (DIGITOS_DO_CANDIDATO[cargo] == null || !cargoAceito(cargo)) return;
      const lugar = localDaSecao(campos, colunas);
      if (lugar != null) somarComparecimento(porTurno, { turno: valor('NR_TURNO'), cargo, lugar }, numerosDoComparecimento(campos, colunas));
    },
  });
}
