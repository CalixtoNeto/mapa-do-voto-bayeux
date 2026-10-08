import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paralelo } from '../../scripts/lib/paralelo.mjs';

test('paralelo devolve os resultados na ordem dos itens', async () => {
  const esperar = ms => new Promise(r => setTimeout(r, ms));
  const saida = await paralelo([30, 10, 20], 2, async (ms, i) => { await esperar(ms); return i; });
  assert.deepEqual(saida, [0, 1, 2]);
});

test('paralelo não passa do limite de chamadas simultâneas', async () => {
  let ativas = 0, maximo = 0;
  await paralelo([1, 2, 3, 4, 5], 2, async () => {
    maximo = Math.max(maximo, ++ativas);
    await new Promise(r => setTimeout(r, 1));
    ativas--;
  });
  assert.equal(maximo, 2);
});

test('paralelo com lista vazia devolve lista vazia', async () => {
  assert.deepEqual(await paralelo([], 3, async () => 1), []);
});
