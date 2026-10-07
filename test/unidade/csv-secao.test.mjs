import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ehVotoNominal, leitorDeVotosPorSecao } from '../../scripts/fontes/csv-secao.mjs';
import { localizadorDeSecoes } from '../../scripts/fontes/tabela-secoes.mjs';

test('voto nominal precisa do número de dígitos do cargo e não pode ser branco ou nulo', () => {
  assert.equal(ehVotoNominal('13', '12345'), true);
  assert.equal(ehVotoNominal('13', '12'), false, 'voto de legenda');
  assert.equal(ehVotoNominal('3', '95'), false, 'branco');
  assert.equal(ehVotoNominal('3', '96'), false, 'nulo');
  assert.equal(ehVotoNominal('3', '40'), true);
});

const CABECALHO = '"ANO_ELEICAO";"NR_TURNO";"SG_UF";"CD_MUNICIPIO";"NR_ZONA";"NR_SECAO";"CD_CARGO";"DS_CARGO";'
  + '"NR_VOTAVEL";"NM_VOTAVEL";"QT_VOTOS";"NR_LOCAL_VOTACAO"';
const voto = ({ secao = '100', cargo = '13', nr = '12345', nome = 'MARIA', votos = '1', local = '', mun = '19372' } = {}) =>
  `"2024";"1";"PB";"${mun}";"61";"${secao}";"${cargo}";"Cargo";"${nr}";"${nome}";"${votos}";"${local}"`;
const TABELA = { locais: [{ zona: 61, nr: 1490 }, { zona: 61, nr: 1500 }], secoes: { '61|100': 0 } };

function ler(linhas, cabecalho = CABECALHO) {
  const porTurno = {}, partidos = {}, semLocal = new Set();
  const aoLinha = leitorDeVotosPorSecao({ ano: '2024', localDaSecao: localizadorDeSecoes(TABELA), porTurno, partidos, semLocal });
  aoLinha(cabecalho, true);
  for (const l of linhas) aoLinha(l, false);
  return { apuracao: porTurno[1], partidos, semLocal };
}

test('soma o voto no local da seção', () => {
  const { apuracao } = ler([voto({ votos: '3' }), voto({ votos: '4' })]);
  assert.deepEqual(apuracao.cands.get('2024|1|13|12345').loc, { 0: 7 });
});

test('seção fora da tabela é achada pelo número do local de votação', () => {
  const { apuracao } = ler([voto({ secao: '999', local: '1500' })]);
  assert.deepEqual(apuracao.cands.get('2024|1|13|12345').loc, { 1: 1 });
});

test('seção sem local nenhum é anotada e não somada', () => {
  const { apuracao, semLocal } = ler([voto({ secao: '998', local: '9999' })]);
  assert.equal(apuracao.cands.size, 0);
  assert.deepEqual([...semLocal], ['61|998']);
});

test('voto de legenda guarda o nome do partido, mas não para governador', () => {
  const { partidos, apuracao } = ler([voto({ nr: '12', nome: 'PARTIDO DOZE' }), voto({ cargo: '3', nr: '9', nome: 'X' })]);
  assert.deepEqual(partidos, { 12: 'PARTIDO DOZE' });
  assert.equal(apuracao.esp['2024|1|13'].legenda, 1);
});

test('ignora outro município e cargo que o site não mostra (prefeito)', () => {
  assert.deepEqual(ler([voto({ mun: '19003' }), voto({ cargo: '11', nr: '12' })]).apuracao, undefined);
});

test('falha com a lista de colunas ausentes', () => {
  assert.throws(() => ler([], '"ANO_ELEICAO";"SG_UF"'), /Colunas ausentes no CSV de 2024: NR_TURNO, CD_MUNICIPIO/);
});
