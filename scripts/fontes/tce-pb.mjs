// Dados abertos do Tribunal de Contas da Paraíba (Sagres): um .zip por município, conjunto e ano
// (despesas, servidores, receitas, licitacoes). CSV em UTF-8 com BOM, separado por ponto e vírgula.
import { baixar, lerCsvsDoZip } from '../lib/tse.mjs';
import { leitorPorColuna } from './por-coluna.mjs';
import { PASTA_DOWNLOADS } from '../eleicao/config.mjs';

export const MUNICIPIO_TCE = '025';
const BASE = 'https://download.tce.pb.gov.br/dados-abertos/dados-por-municipio';

// Diferente do TSE, o Sagres escreve milhar sem decimais com ponto ("2.100" é dois mil e cem).
export const reaisDoTce = texto => parseFloat(String(texto || '').trim().replace(/\./g, '').replace(',', '.')) || 0;

export const leitorDoTce = leitorPorColuna;

export async function lerConjuntoDoTce(conjunto, ano, aoRegistro) {
  const zip = `${PASTA_DOWNLOADS}/tce-${MUNICIPIO_TCE}-${conjunto}-${ano}.zip`;
  if (!await baixar(`${BASE}/${MUNICIPIO_TCE}/${conjunto}/${conjunto}-${ano}.zip`, zip)) return false;
  const alvo = { padrao: /\.csv$/i, aoLinha: leitorDoTce(aoRegistro) };
  const [achou] = await lerCsvsDoZip(zip, [alvo], { codificacao: 'utf-8' });
  return achou;
}
