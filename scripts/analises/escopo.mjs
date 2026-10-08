// O que entra nas análises deste site e como cada candidato é identificado nele.
// Em Bayeux a chave do candidato no site é cargo|número (o CSV por seção não traz o sequencial do TSE).
// SG_UE é o código do município nas eleições municipais e a UF nas gerais.
import { UF, MUNICIPIO_TSE, DIGITOS_DO_CANDIDATO } from '../eleicao/config.mjs';

const CARGOS_DO_SITE = Object.keys(DIGITOS_DO_CANDIDATO);

export const candidatoDoSite = ({ uf, ue, cargo }) =>
  CARGOS_DO_SITE.includes(cargo) && uf === UF && (ue === MUNICIPIO_TSE || ue === UF);

// Dinheiro de campanha só dos cargos municipais: a campanha de deputado ou senador é estadual
// e não faz sentido dividi-la pelos votos de Bayeux.
export const candidatoDasFinancas = candidato => candidatoDoSite(candidato) && candidato.ue === MUNICIPIO_TSE;

export const chaveDoCandidato = ({ cargo, nr }) => `${cargo}|${nr}`;

export const chaveNoSite = candidato => `${candidato.cargo}|${candidato.nr}`;

export const arquivosDaEleicao = (prefixo, ano) => [
  { padrao: new RegExp(`^${prefixo}_${ano}_${UF}\\.csv$`, 'i'), cargoAceito: () => true },
];
