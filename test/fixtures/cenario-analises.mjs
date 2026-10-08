// Acrescenta ao cenário de Bayeux os arquivos das análises de 2024, nos formatos do TSE: cadastro de
// candidatos, bens, prestação de contas e detalhe da votação por seção. Os vereadores são os do cenário.
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { zipSync } from 'fflate';

const csv = linhas => linhas.map(campos => campos.map(c => `"${c}"`).join(';')).join('\r\n') + '\r\n';
const windows1252 = texto => new Uint8Array(Buffer.from(texto, 'latin1'));
const arquivos = porNome => zipSync(Object.fromEntries(Object.entries(porNome).map(([n, l]) => [n, windows1252(csv(l))])));

const ID = ['ANO_ELEICAO', 'NR_TURNO', 'SG_UF', 'SG_UE', 'CD_CARGO', 'SQ_CANDIDATO', 'NR_CANDIDATO'];
const CADASTRO = [...ID, 'SG_PARTIDO', 'DS_GENERO', 'DS_COR_RACA', 'DT_NASCIMENTO', 'DS_GRAU_INSTRUCAO', 'DS_OCUPACAO',
  'ST_REELEICAO', 'DS_SIT_TOT_TURNO', 'DS_SITUACAO_CANDIDATURA'];
const vereador = (sq, nr, ue = '19372') => ['2024', '1', 'PB', ue, '13', sq, nr];
const RECEITA = [...ID, 'DS_FONTE_RECEITA', 'DS_ORIGEM_RECEITA', 'NR_CPF_CNPJ_DOADOR', 'NM_DOADOR', 'NM_DOADOR_RFB', 'VR_RECEITA', 'DT_RECEITA'];
const PAGA = [...ID, 'DS_ORIGEM_DESPESA', 'VR_PAGTO_DESPESA'];
const DESPESA = [...ID, 'DS_ORIGEM_DESPESA', 'NR_CPF_CNPJ_FORNECEDOR', 'NM_FORNECEDOR', 'NM_FORNECEDOR_RFB', 'VR_DESPESA_CONTRATADA'];
const DETALHE = ['ANO_ELEICAO', 'NR_TURNO', 'SG_UF', 'CD_MUNICIPIO', 'NR_ZONA', 'NR_SECAO', 'CD_CARGO', 'QT_APTOS',
  'QT_COMPARECIMENTO', 'QT_ABSTENCOES', 'QT_VOTOS_BRANCOS', 'QT_VOTOS_NULOS', 'QT_VOTOS_LEGENDA_VALIDOS'];
const ELEITOR = ['ANO_ELEICAO', 'SG_UF', 'CD_MUNICIPIO', 'NR_ZONA', 'NR_SECAO', 'DS_GENERO', 'DS_FAIXA_ETARIA',
  'DS_GRAU_ESCOLARIDADE', 'QT_ELEITORES_PERFIL'];
const eleitor = (sec, mun, ...perfil) => ['2024', 'PB', mun, '61', sec, ...perfil];
const secao = (sec, mun, ...n) => ['2024', '1', 'PB', mun, '61', sec, '13', ...n];

const ZIPS = {
  'consulta-cand-2024.zip': { 'consulta_cand_2024_PB.csv': [CADASTRO,
    [...vereador('500', '12345'), 'PARTIDO DOZE', 'FEMININO', 'PARDA', '10/03/1985', 'SUPERIOR COMPLETO', 'PROFESSOR', 'S', 'ELEITO POR QP', 'APTO'],
    [...vereador('501', '45678'), 'PARTIDO 45', 'MASCULINO', 'BRANCA', '01/12/1970', 'ENSINO MÉDIO COMPLETO', 'COMERCIANTE', 'N', 'SUPLENTE', 'APTO'],
    [...vereador('502', '12345', '20516'), 'OUTRA', 'MASCULINO', 'BRANCA', '01/01/1980', 'X', 'X', 'N', 'ELEITO', 'APTO'],
  ] },
  'bem-candidato-2024.zip': { 'bem_candidato_2024_PB.csv': [['ANO_ELEICAO', 'SQ_CANDIDATO', 'DS_TIPO_BEM_CANDIDATO', 'VR_BEM_CANDIDATO'],
    ['2024', '500', 'Apartamento', '150000,00'], ['2024', '502', 'Casa', '9999999,00']] },
  'prestacao-contas-2024.zip': {
    'receitas_candidatos_2024_PB.csv': [RECEITA,
      [...vereador('500', '12345'), 'Fundo Especial', 'Recursos de partido político', '1', 'PARTIDO DOZE', '#NULO#', '20000,00', '10/09/2024'],
      [...vereador('501', '45678'), 'Outros Recursos', 'Recursos próprios', '9', 'JOSÉ', 'JOSÉ DA SILVA', '3000,00', '25/09/2024'],
      [...vereador('502', '12345', '20516'), 'Fundo Especial', 'Recursos de partido político', '1', 'P', 'P', '99999,00', '10/09/2024'],
    ],
    'despesas_pagas_candidatos_2024_PB.csv': [PAGA, [...vereador('500', '12345'), 'Publicidade por materiais impressos', '12000,00']],
    'despesas_contratadas_candidatos_2024_PB.csv': [DESPESA,
      [...vereador('500', '12345'), 'Publicidade por materiais impressos', '55', 'GRAFICA', 'GRAFICA DE BAYEUX LTDA', '17000,00'],
      [...vereador('501', '45678'), 'Combustíveis e lubrificantes', '66', 'POSTO', '#NULO#', '2500,00'],
    ],
  },
  'detalhe-secao-2024-PB.zip': { 'detalhe_votacao_secao_2024_PB.csv': [DETALHE,
    secao('100', '19372', '300', '250', '50', '4', '6', '10'), secao('101', '19372', '200', '170', '30', '2', '3', '5'),
    secao('200', '19372', '250', '200', '50', '5', '5', '8'), secao('100', '20516', '999', '999', '0', '0', '0', '0'),
  ] },
  'perfil-eleitor-secao-2024-PB.zip': { 'perfil_eleitor_secao_2024_PB.csv': [ELEITOR,
    eleitor('100', '19372', 'FEMININO', '18 anos', 'ENSINO MÉDIO COMPLETO', '200'),
    eleitor('101', '19372', 'MASCULINO', '65 a 69 anos', 'LÊ E ESCREVE', '200'),
    eleitor('200', '19372', 'FEMININO', '40 a 44 anos', 'SUPERIOR COMPLETO', '250'),
    eleitor('100', '20516', 'FEMININO', '40 a 44 anos', 'SUPERIOR COMPLETO', '999'),
  ] },
};

export async function acrescentarAnalises(pasta) {
  for (const [zip, porNome] of Object.entries(ZIPS)) await writeFile(join(pasta, 'tmp', zip), arquivos(porNome));
}
