export const UF = 'PB';
export const MUNICIPIO_TSE = '19372';
export const ANOS_PADRAO = ['2012', '2014', '2016', '2018', '2020', '2022', '2024', '2026'];

export const CARGOS = {
  PRESIDENTE: '1', GOVERNADOR: '3', SENADOR: '5', DEPUTADO_FEDERAL: '6', DEPUTADO_ESTADUAL: '7', VEREADOR: '13',
};
export const CARGOS_DA_API = Object.values(CARGOS);
export const CARGOS_COM_2_TURNO = [CARGOS.PRESIDENTE, CARGOS.GOVERNADOR];

// Cargos lidos do CSV por seção (o da UF não traz o presidente). Com menos dígitos que isto,
// o número votado é de partido (voto de legenda), não de candidato.
export const DIGITOS_DO_CANDIDATO = { '3': 2, '5': 3, '6': 4, '7': 5, '13': 5 };
export const VOTO_BRANCO = '95';
export const VOTO_NULO = '96';

export const PASTA_ELEICOES = 'public/data/eleicoes';
export const PASTA_DOWNLOADS = 'tmp';
export const CONTORNO = 'public/data/bayeux.geo.json';
export const arquivoDaTabelaDeSecoes = ano => `public/data/secoes-${ano}.json`;
