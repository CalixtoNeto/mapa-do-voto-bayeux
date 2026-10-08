// Posição do candidato entre os do cargo (public/js/calculos-dinheiro.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { posicoesNoCargo } from '../../public/js/calculos.mjs';

const linha = (key, recebido, gasto, fefc, custo) => ({ cand: { key }, recebido, gasto, fefc, custo });

test('posição no cargo: maior recebido, gasto e fundo eleitoral; menor custo por voto', () => {
  const linhas = [linha('a', 100, 50, 0, 5), linha('b', 300, 200, 80, 2), linha('c', 0, 0, 0, null)];
  const { mediana, ...posicoes } = posicoesNoCargo(linhas, { key: 'a' });
  assert.deepEqual(posicoes, {
    recebido: { posicao: 2, de: 2 }, gasto: { posicao: 2, de: 2 }, fefc: { posicao: 0, de: 1 }, custo: { posicao: 2, de: 2 },
  });
  assert.deepEqual(posicoesNoCargo(linhas, { key: 'b' }).custo, { posicao: 1, de: 2 });
});

test('mediana do cargo, contando só quem tem o valor', () => {
  const linhas = [linha('a', 100, 50, 0, 5), linha('b', 300, 200, 80, 2), linha('c', 500, 0, 0, null)];
  assert.deepEqual(posicoesNoCargo(linhas, { key: 'a' }).mediana, { recebido: 300, gasto: 125 });
});
