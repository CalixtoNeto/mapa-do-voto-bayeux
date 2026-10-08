import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leitorDeCandidatos, novosCandidatos, perfisComBens } from '../../scripts/fontes/candidatos.mjs';
import { leitorDeBens } from '../../scripts/fontes/bens.mjs';

const CABECALHO = ['ANO_ELEICAO', 'NR_TURNO', 'SG_UF', 'SG_UE', 'CD_CARGO', 'SQ_CANDIDATO', 'NR_CANDIDATO', 'SG_PARTIDO',
  'DS_GENERO', 'DS_COR_RACA', 'DT_NASCIMENTO', 'DS_GRAU_INSTRUCAO', 'DS_OCUPACAO', 'ST_REELEICAO', 'DS_SIT_TOT_TURNO',
  'DS_SITUACAO_CANDIDATURA'];
const linha = campos => campos.map(c => `"${c}"`).join(';');
const candidata = ({ sq = '150', ue = '19372', cargo = '13', apta = 'APTO', sit = 'ELEITO POR QP' } = {}) =>
  ['2024', '1', 'PB', ue, cargo, sq, '12345', 'PART', 'FEMININO', 'PRETA', '15/11/1990', 'ENSINO MÉDIO COMPLETO',
    'COMERCIANTE', 'N', sit, apta];

function lerCandidatos(linhas) {
  const candidatos = novosCandidatos(), aoLinha = leitorDeCandidatos({ ano: '2024', candidatos, cargoAceito: () => true });
  aoLinha(linha(CABECALHO), true);
  linhas.forEach(l => aoLinha(linha(l), false));
  return candidatos;
}

test('perfil do vereador de Bayeux, com a idade pela data de nascimento', () => {
  assert.deepEqual(perfisComBens(lerCandidatos([candidata()]), new Map())['13|12345'], {
    g: 'FEMININO', r: 'PRETA', i: 33, e: 'ENSINO MÉDIO COMPLETO', o: 'COMERCIANTE', s: 'ELEITO POR QP', p: 'PART' });
});

test('deputados entram pela UF e o prefeito pelo município; vereadores de outra cidade ficam de fora', () => {
  const perfis = perfisComBens(lerCandidatos([candidata({ ue: 'PB', cargo: '6' }), candidata({ ue: '20516' }),
    candidata({ cargo: '11' })]), new Map());
  assert.deepEqual(Object.keys(perfis), ['6|12345', '11|12345']);
});

test('com o mesmo número, fica o candidato apto a receber votos (o substituto)', () => {
  const perfis = perfisComBens(lerCandidatos([candidata({ sq: '1', apta: 'INAPTO', sit: '#NULO#' }), candidata({ sq: '2' })]), new Map());
  assert.equal(perfis['13|12345'].s, 'ELEITO POR QP');
});

test('os bens chegam pelo sequencial do candidato escolhido', () => {
  const bens = new Map(), aoLinha = leitorDeBens({ ano: '2024', bens });
  aoLinha(linha(['ANO_ELEICAO', 'SQ_CANDIDATO', 'VR_BEM_CANDIDATO']), true);
  aoLinha(linha(['2024', '2', '40.000,00']), false);
  aoLinha(linha(['2024', '1', '999,00']), false);
  const perfis = perfisComBens(lerCandidatos([candidata({ sq: '1', apta: 'INAPTO' }), candidata({ sq: '2' })]), bens);
  assert.equal(perfis['13|12345'].b, 40000);
});

test('os bens também somam por tipo, do maior para o menor', () => {
  const bens = new Map(), tipos = new Map(), aoLinha = leitorDeBens({ ano: '2024', bens, tipos });
  aoLinha(linha(['ANO_ELEICAO', 'SQ_CANDIDATO', 'DS_TIPO_BEM_CANDIDATO', 'VR_BEM_CANDIDATO']), true);
  for (const [tipo, v] of [['Casa', '300000,00'], ['Veículo automotor terrestre', '50000,00'], ['Casa', '100000,00'], ['#NULO#', '10,00']]) {
    aoLinha(linha(['2024', '150', tipo, v]), false);
  }
  const perfil = perfisComBens(lerCandidatos([candidata()]), bens, tipos)['13|12345'];
  assert.deepEqual([perfil.b, perfil.bt], [450010, [['Casa', 400000], ['Veículo automotor terrestre', 50000], ['Outros', 10]]]);
});
