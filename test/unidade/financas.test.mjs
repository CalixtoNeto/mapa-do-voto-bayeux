import { test } from 'node:test';
import assert from 'node:assert/strict';
import { novasFinancas, somarReceita, somarDespesa, resumoDasFinancas } from '../../scripts/analises/financas.mjs';

const agora = new Date('2026-10-08T12:00:00Z');

test('soma as receitas por origem e arredonda para reais', () => {
  const financas = novasFinancas();
  somarReceita(financas, 'A', { origem: 'fefc', valor: 1000.4 });
  somarReceita(financas, 'A', { origem: 'fefc', valor: 500.4 });
  somarReceita(financas, 'A', { origem: 'prop', valor: 99.6 });
  assert.deepEqual(resumoDasFinancas(financas, '2022', agora).c.A, { r: { fefc: 1501, prop: 100 }, d: 0 });
});

test('o gasto não conta repasses e guarda as maiores categorias', () => {
  const financas = novasFinancas();
  for (const [categoria, valor] of [['Impressos', 300], ['Pessoal', 500], ['Impressos', 300], ['Doações', 900]]) {
    somarDespesa(financas, 'A', { categoria, valor, repasse: categoria === 'Doações' });
  }
  assert.deepEqual(resumoDasFinancas(financas, '2022', agora).c.A, { r: {}, d: 1100, rep: 900, dc: [['Impressos', 600], ['Pessoal', 500]] });
});

test('os doadores somam o que deram e para quem, do maior para o menor', () => {
  const financas = novasFinancas();
  const fulano = { id: '1', nome: 'FULANO', tipo: 'pf' };
  somarReceita(financas, 'A', { origem: 'pf', valor: 100, doador: fulano });
  somarReceita(financas, 'B', { origem: 'pf', valor: 300, doador: fulano });
  somarReceita(financas, 'B', { origem: 'pf', valor: 50, doador: { id: '2', nome: 'BELTRANO', tipo: 'pf' } });
  assert.deepEqual(resumoDasFinancas(financas, '2022', agora).doadores, [
    { n: 'FULANO', t: 'pf', v: 400, c: [['B', 300], ['A', 100]] },
    { n: 'BELTRANO', t: 'pf', v: 50, c: [['B', 50]] },
  ]);
});

test('a prestação de contas só é final depois de novembro do ano da eleição', () => {
  const financas = novasFinancas();
  assert.equal(resumoDasFinancas(financas, '2026', agora).final, false);
  assert.equal(resumoDasFinancas(financas, '2022', agora).final, true);
});
