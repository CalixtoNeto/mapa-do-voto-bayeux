// Rede de doadores e fornecedores, ritmo da arrecadação e despesas pagas (scripts/analises/financas.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { novasFinancas, somarReceita, somarDespesa, somarDespesaPaga, resumoDasFinancas } from '../../scripts/analises/financas.mjs';

const agora = new Date('2026-10-08T12:00:00Z');
const resumo = financas => resumoDasFinancas(financas, '2022', agora);

test('a lista de doadores guarda os maiores e todos os que doaram a mais de um candidato', () => {
  const financas = novasFinancas();
  for (let i = 0; i < 160; i++) somarReceita(financas, `C${i}`, { origem: 'pf', valor: 1000 - i, doador: { id: `${i}`, nome: `D${i}`, tipo: 'pf' } });
  const ambos = { id: 'x', nome: 'AMBOS', tipo: 'pj' };
  somarReceita(financas, 'A', { origem: 'pj', valor: 1, doador: ambos });
  somarReceita(financas, 'B', { origem: 'pj', valor: 1, doador: ambos });
  const { doadores, c } = resumo(financas);
  assert.equal(doadores.length, 151);
  assert.deepEqual(doadores[150], { n: 'AMBOS', t: 'pj', v: 2, c: [['A', 1], ['B', 1]] });
  assert.deepEqual(c.A.doa, [['AMBOS', 'pj', 1, 150]]);
  assert.deepEqual(c.C155.doa, [['D155', 'pf', 845]]);
});

test('os fornecedores que atenderam mais de um candidato entram na lista do arquivo', () => {
  const financas = novasFinancas(), grafica = { id: '9', nome: 'GRAFICA' };
  somarDespesa(financas, 'A', { categoria: 'Impressos', valor: 300, fornecedor: grafica });
  somarDespesa(financas, 'B', { categoria: 'Impressos', valor: 100, fornecedor: grafica });
  assert.deepEqual(resumo(financas).fornecedores, [{ n: 'GRAFICA', v: 400, c: [['A', 300], ['B', 100]] }]);
});

test('o dinheiro recebido é somado por semana, a partir da segunda-feira', () => {
  const financas = novasFinancas();
  somarReceita(financas, 'A', { origem: 'fefc', valor: 100, data: '18/08/2022' });
  somarReceita(financas, 'A', { origem: 'pf', valor: 50, data: '21/08/2022' });
  somarReceita(financas, 'A', { origem: 'pf', valor: 10, data: '01/09/2022' });
  somarReceita(financas, 'A', { origem: 'pf', valor: 5, data: '#NULO#' });
  assert.deepEqual(resumo(financas).c.A.rs, [['2022-08-15', 150], ['2022-08-29', 10]]);
});

test('as despesas pagas somam à parte, para comparar com o contratado', () => {
  const financas = novasFinancas();
  somarDespesa(financas, 'A', { categoria: 'Impressos', valor: 1000 });
  somarDespesaPaga(financas, 'A', 600.4);
  assert.equal(resumo(financas).c.A.pg, 600);
});
