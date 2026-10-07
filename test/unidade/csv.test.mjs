import { test } from 'node:test';
import assert from 'node:assert/strict';
import { camposDaLinha, indiceDeColunas, inteiro, porRegistro } from '../../scripts/lib/csv.mjs';

test('divide campos entre aspas separados por ponto e vírgula', () => {
  assert.deepEqual(camposDaLinha('"2022";"PB";"JOÃO"'), ['2022', 'PB', 'JOÃO']);
});

test('aceita ponto e vírgula e aspas duplicadas dentro do campo', () => {
  assert.deepEqual(camposDaLinha('"ESCOLA; ANEXO";"O ""LYCEU"""'), ['ESCOLA; ANEXO', 'O "LYCEU"']);
});

test('mantém campos vazios e campos sem aspas', () => {
  assert.deepEqual(camposDaLinha('1;;"x";'), ['1', '', 'x', '']);
});

test('campo com aspas não fechadas vai até o fim da linha', () => {
  assert.deepEqual(camposDaLinha('"a";"sem fim'), ['a', 'sem fim']);
});

test('o índice de colunas ignora espaços e caixa', () => {
  assert.deepEqual(indiceDeColunas('" sg_uf ";"NR_TURNO"'), { SG_UF: 0, NR_TURNO: 1 });
});

test('número inválido vira zero', () => {
  assert.equal(inteiro('42'), 42);
  assert.equal(inteiro('#NULO#'), 0);
});

test('porRegistro entrega o cabeçalho uma vez e depois cada registro dividido', () => {
  const recebidos = [];
  const aoLinha = porRegistro({
    aoCabecalho: colunas => recebidos.push(colunas),
    aoRegistro: (campos, colunas) => recebidos.push(campos[colunas.B]),
    descartarRapido: linha => linha.includes('pular'),
  });
  aoLinha('"A";"B"', true);
  aoLinha('"1";"2"', false);
  aoLinha('"pular";"3"', false);
  assert.deepEqual(recebidos, [{ A: 0, B: 1 }, '2']);
});
