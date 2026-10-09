// Monta, numa pasta temporária, duas eleições de Bayeux com os mesmos formatos do TSE:
// 2024 com o CSV por seção (votos por local e bairro) e 2026 só com a API (sem bairros).
// Os .zip ficam em tmp/, onde os geradores procuram antes de baixar, então nada sai para a rede.
import { mkdtemp, mkdir, writeFile, copyFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zipSync } from 'fflate';

const API = 'https://resultados.tse.jus.br/oficial';
const BAYEUX = '19372';

const csv = linhas => linhas.map(campos => campos.map(c => `"${c}"`).join(';')).join('\r\n') + '\r\n';
const windows1252 = texto => new Uint8Array(Buffer.from(texto, 'latin1'));
const zipComCsv = (nome, linhas) => zipSync({ [nome]: windows1252(csv(linhas)) });

const local = (turno, mun, secao, nr, nome, endereco, bairro, lat, lon, eleitores) =>
  ['PB', mun, turno, '61', secao, nr, nome, endereco, bairro, lat, lon, eleitores];
const LOCAIS_VOTACAO_2024 = [
  ['SG_UF', 'CD_MUNICIPIO', 'NR_TURNO', 'NR_ZONA', 'NR_SECAO', 'NR_LOCAL_VOTACAO', 'NM_LOCAL_VOTACAO', 'DS_ENDERECO',
    'NM_BAIRRO', 'NR_LATITUDE', 'NR_LONGITUDE', 'QT_ELEITOR_SECAO'],
  local('1', BAYEUX, '100', '1490', 'EEEF GETÚLIO VARGAS', 'RUA A, 1', 'CENTRO', '-7.1234', '-34.9266', '300'),
  local('1', BAYEUX, '101', '1490', 'EEEF GETÚLIO VARGAS', 'RUA A, 1', 'Centro', '-7.1234', '-34.9266', '200'),
  local('1', BAYEUX, '102', '1490', 'EEEF GETÚLIO VARGAS', 'RUA A, 1', 'CENTRO', '-7.1234', '-34.9266', '100'),
  local('1', BAYEUX, '200', '1500', 'ESCOLA SÃO BENTO', 'RUA B', 'São Bento', '-7,1300', '-34,9400', '250'),
  local('1', BAYEUX, '300', '1510', 'ESCOLA LONGE', '', 'SAO BENTO', '-8.5', '-34.9', '150'),
  local('1', BAYEUX, '400', '1520', 'ESCOLA SEM BAIRRO', 'RUA C', '', '-7.10', '-34.92', '50'),
  local('2', BAYEUX, '100', '1490', 'EEEF GETÚLIO VARGAS', 'RUA A, 1', 'OUTRO TURNO', '-7.1234', '-34.9266', '999'),
  local('1', '19003', '100', '1', 'OUTRA CIDADE', 'RUA', 'CENTRO', '-7.0', '-35.0', '999'),
];

const voto = (secao, cargo, nr, nome, votos, nrLocal = '') =>
  ['2024', '1', 'PB', BAYEUX, '61', secao, cargo, cargo === '13' ? 'Vereador' : 'Prefeito', nr, nome, votos, nrLocal];
const SECAO_2024 = [
  ['ANO_ELEICAO', 'NR_TURNO', 'SG_UF', 'CD_MUNICIPIO', 'NR_ZONA', 'NR_SECAO', 'CD_CARGO', 'DS_CARGO', 'NR_VOTAVEL',
    'NM_VOTAVEL', 'QT_VOTOS', 'NR_LOCAL_VOTACAO'],
  voto('100', '13', '12345', 'MARIA DE BAYEUX', '40'),
  voto('101', '13', '12345', 'MARIA DE BAYEUX', '10'),
  voto('200', '13', '12345', 'MARIA DE BAYEUX', '30'),
  voto('400', '13', '12345', 'MARIA DE BAYEUX', '5'),
  voto('100', '13', '45678', 'JOSÉ DA SILVA', '20'),
  voto('300', '13', '45678', 'JOSÉ DA SILVA', '15'),
  voto('999', '13', '45678', 'JOSÉ DA SILVA', '6', '1500'),
  voto('998', '13', '45678', 'JOSÉ DA SILVA', '4', '9999'),
  voto('100', '13', '12', 'PARTIDO DOZE', '7'),
  voto('100', '13', '95', 'VOTO BRANCO', '8'),
  voto('100', '13', '96', 'VOTO NULO', '9'),
  voto('100', '11', '12', 'FULANO PREFEITO', '999'),
  ['2024', '1', 'PB', '19003', '61', '100', '13', 'Vereador', '12345', 'OUTRA CIDADE', '999', ''],
];

const resultado = (and, dg, nmn, cand) => ({ and, dg, hg: '21:00:00', carg: [{ nmn, agr: [{ par: [{ sg: 'PART', cand }] }] }] });
const urlApi = (eleicao, cargo) => `${API}/ele2026/${eleicao}/dados/pb/pb${BAYEUX}-c${cargo.padStart(4, '0')}-e000${eleicao}-u.json`;
const API_FALSA = {
  [`${API}/comum/config/ele-c.json`]: { pl: [{ c: 'ele2026', e: [{ tp: '1', cd: '700', cdt2: '701', abr: [{ cp: [{ cd: '3' }, { cd: '7' }, { cd: '11' }] }] }] }] },
  [urlApi('700', '3')]: resultado('f', '04/10/2026', 'Governador', [
    { n: '11', nm: 'FULANO GOVERNADOR', nmu: 'FULANO', sqcand: '1', vap: '500', st: '2º turno' },
    { n: '22', nm: 'SEM VOTOS', nmu: 'ZERO', sqcand: '2', vap: '0', st: '' },
  ]),
  [urlApi('700', '7')]: resultado('f', '04/10/2026', 'Deputado Estadual', [
    { n: '12345', nm: 'MARIA DE BAYEUX', nmu: 'MARIA', sqcand: '3', vap: '77', st: 'Eleito' },
  ]),
  [urlApi('701', '3')]: resultado('p', '25/10/2026', 'Governador', [
    { n: '11', nm: 'FULANO GOVERNADOR', nmu: 'FULANO', sqcand: '1', vap: '600', st: '' },
  ]),
};

// scripts/ entra como link porque o gerador chama `node scripts/gerar-secoes.mjs` a partir da pasta atual.
export async function montarCenario(raizDoRepo) {
  const pasta = await mkdtemp(join(tmpdir(), 'mapa-bayeux-'));
  await mkdir(join(pasta, 'tmp'));
  await mkdir(join(pasta, 'public/data'), { recursive: true });
  await symlink(join(raizDoRepo, 'scripts'), join(pasta, 'scripts'), 'junction');   // junction: no Windows não exige permissão de administrador
  await copyFile(join(raizDoRepo, 'public/data/bayeux.geo.json'), join(pasta, 'public/data/bayeux.geo.json'));
  await writeFile(join(pasta, 'tmp/local-votacao-2024.zip'), zipComCsv('eleitorado_local_votacao_2024.csv', LOCAIS_VOTACAO_2024));
  await writeFile(join(pasta, 'tmp/secao-2024-PB.zip'), zipComCsv('votacao_secao_2024_PB.csv', SECAO_2024));
  await writeFile(join(pasta, 'api-falsa.json'), JSON.stringify(API_FALSA));
  return pasta;
}
