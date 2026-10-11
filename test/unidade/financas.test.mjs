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

test('cada candidato guarda os dez maiores doadores e quantos doaram ao todo', () => {
  const financas = novasFinancas();
  for (let i = 1; i <= 12; i++) somarReceita(financas, 'A', { origem: 'pf', valor: i * 10, doador: { id: `${i}`, nome: `D${i}`, tipo: 'pf' } });
  somarReceita(financas, 'B', { origem: 'pj', valor: 5, doador: { id: '1', nome: 'D1', tipo: 'pf' } });
  const { c } = resumoDasFinancas(financas, '2022', agora);
  assert.deepEqual(c.A.doa.slice(0, 2), [['D12', 'pf', 120, 0], ['D11', 'pf', 110, 1]]);
  assert.equal(c.A.doa.length, 10);
  assert.equal(c.A.nd, 12);
  assert.deepEqual([c.B.doa, c.B.nd], [[['D1', 'pf', 5, 11]], 1]);
});

test('doadores e fornecedores levam, em lista paralela, só o documento para cruzar (CNPJ ou dígitos centrais do CPF)', () => {
  const financas = novasFinancas();
  somarReceita(financas, 'A', { origem: 'pf', valor: 50, doador: { id: '12340672401', nome: 'ANA', tipo: 'pf' } });
  somarReceita(financas, 'A', { origem: 'pf', valor: 10, doador: { id: 'SEM DOC', nome: 'SEM DOC', tipo: 'pf' } });
  somarDespesa(financas, 'A', { categoria: 'Impressos', valor: 300, fornecedor: { id: '58909863000166', nome: 'GRAFICA' } });
  const { c } = resumoDasFinancas(financas, '2022', agora);
  assert.deepEqual(c.A.doaK, ['cpf:406724', null]);
  assert.deepEqual(c.A.foK, ['cnpj:58909863000166']);
});

test('cada candidato guarda os fornecedores mais pagos, sem contar os repasses', () => {
  const financas = novasFinancas();
  const grafica = { id: '9', nome: 'GRAFICA' }, posto = { id: '8', nome: 'POSTO' };
  somarDespesa(financas, 'A', { categoria: 'Impressos', valor: 300, fornecedor: grafica });
  somarDespesa(financas, 'A', { categoria: 'Impressos', valor: 200, fornecedor: grafica });
  somarDespesa(financas, 'A', { categoria: 'Combustíveis', valor: 100, fornecedor: posto });
  somarDespesa(financas, 'A', { categoria: 'Doações', valor: 900, repasse: true, fornecedor: { id: '7', nome: 'OUTRO' } });
  const { c } = resumoDasFinancas(financas, '2022', agora);
  assert.deepEqual([c.A.fo, c.A.nf], [[['GRAFICA', 500, 0], ['POSTO', 100, 1]], 2]);
});

test('guarda todas as categorias de despesa, não só as maiores', () => {
  const financas = novasFinancas();
  for (let i = 1; i <= 8; i++) somarDespesa(financas, 'A', { categoria: `C${i}`, valor: i });
  assert.equal(resumoDasFinancas(financas, '2022', agora).c.A.dc.length, 8);
});

test('cada categoria de gasto guarda todos os que receberam, do maior para o menor', () => {
  const financas = novasFinancas();
  const pagar = (categoria, nome, valor) => somarDespesa(financas, 'A', { categoria, valor, fornecedor: { id: nome, nome } });
  ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'].forEach((g, i) => pagar('Impressos', g, 100 - i));
  pagar('Impressos', 'G1', 50);
  pagar('Combustíveis', 'POSTO', 80);
  somarDespesa(financas, 'A', { categoria: 'Combustíveis', valor: 20 });
  assert.deepEqual(resumoDasFinancas(financas, '2022', agora).c.A.dc, [
    ['Impressos', 729, [['G1', 150], ['G2', 99], ['G3', 98], ['G4', 97], ['G5', 96], ['G6', 95], ['G7', 94]]],
    ['Combustíveis', 100, [['POSTO', 80], ['Sem fornecedor informado', 20]]],
  ]);
});
