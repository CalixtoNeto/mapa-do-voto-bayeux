import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arvoreDosGastosDoCargo, arvoreDosCandidatosPeloDinheiro, arvoreDoFundo, arvoreDeParticipantes, parcelaDe } from '../../public/js/calculos-arvores-dinheiro.mjs';

const ana = { key: 'A', partido: 'X', total: 100 }, bia = { key: 'B', partido: 'X', total: 50 }, caio = { key: 'C', partido: 'Y', total: 10 };
const chaveDe = c => c.key, nomeDe = c => 'cand ' + c.key;
const financas = { c: {
  A: { d: 300, r: { fefc: 200 }, dc: [['Impressos', 200, [['GRAFICA', 150], ['Outros (2)', 50]]], ['Pessoal', 100]] },
  B: { d: 100, r: { fefc: 50 }, dc: [['Impressos', 100, [['GRAFICA', 60], ['Outros (3)', 40]]]] },
  C: { d: 0, r: {}, dc: [] } } };

test('gasto do cargo: categoria → fornecedor → candidato que contratou, somando os candidatos', () => {
  const { v, filhos } = arvoreDosGastosDoCargo([ana, bia, caio], financas, chaveDe, { nomeDe });
  assert.equal(v, 400);
  assert.deepEqual(filhos.map(f => [f[0], f[1]]), [['Impressos', 300], ['Pessoal', 100]]);
  const fornecedores = filhos[0][2];
  assert.deepEqual(fornecedores.map(f => [f[0], f[1]]), [['Grafica', 210], ['Outros fornecedores (5)', 90]]);
  assert.deepEqual(fornecedores[0][2].map(f => [f[0].cand.key, f[1]]), [['A', 150], ['B', 60]]);
  assert.equal(filhos[1][2], null);
});

test('candidato por candidato em reais por voto: as categorias dividem pelos votos; a nota guarda o valor em reais', () => {
  const linhas = [{ cand: ana, gasto: 300 }, { cand: bia, gasto: 100 }];
  const { filhos } = arvoreDosCandidatosPeloDinheiro(linhas, financas, chaveDe, { nomeDe, valorDe: l => l.gasto / l.cand.total, porVoto: true, nota: l => 'n' + l.cand.key, ficha: true });
  assert.deepEqual(filhos[0].slice(0, 2), ['cand A', 3]);
  assert.equal(filhos[0][3], 'nA');
  assert.deepEqual(filhos[0][2].map(f => [f[0], f[1]]), [['Impressos', 2], ['Pessoal', 1], [{ ficha: ana }, 0]]);
  assert.match(filhos[0][2][0][3], /67%/);
});

test('candidato por candidato em reais: categorias em reais, sem ficha quando não pedida', () => {
  const { filhos } = arvoreDosCandidatosPeloDinheiro([{ cand: bia, gasto: 100 }], financas, chaveDe, { nomeDe, valorDe: l => l.gasto, porVoto: false, nota: () => '' });
  assert.deepEqual(filhos[0][2].map(f => [f[0], f[1]]), [['Impressos', 100]]);
});

test('fundo eleitoral: partido → candidatos com fundo, com a parcela do partido', () => {
  const partidos = [{ partido: 'X', fefc: 250 }, { partido: 'Y', fefc: 0 }];
  const { v, filhos } = arvoreDoFundo(partidos, [ana, bia, caio], financas, chaveDe, { nomeDe, nota: p => 'meta ' + p.partido });
  assert.equal(v, 250);
  assert.equal(filhos.length, 1);
  assert.deepEqual(filhos[0].slice(0, 2), ['X', 250]);
  assert.equal(filhos[0][3], 'meta X');
  assert.deepEqual(filhos[0][2].map(f => [f[0].cand.key, f[1], f[3]]), [['A', 200, '80% do partido'], ['B', 50, '20% do partido']]);
});

test('doador ou fornecedor → candidatos que receberam, com a parcela dele', () => {
  const lista = [{ n: 'JOSE DA SILVA', v: 100, para: [{ cand: ana, v: 70 }, { cand: bia, v: 30 }] }, { n: 'SEM', v: 5, para: [] }];
  const { v, filhos } = arvoreDeParticipantes(lista, { nota: item => `${item.para.length} candidatos`, de: 'do total' });
  assert.equal(v, 100);
  assert.equal(filhos.length, 1);
  assert.deepEqual(filhos[0].slice(0, 2), ['Jose da Silva', 100]);
  assert.equal(filhos[0][3], '2 candidatos');
  assert.deepEqual(filhos[0][2].map(f => [f[0].cand.key, f[1], f[3]]), [['A', 70, '70% do total'], ['B', 30, '30% do total']]);
});

test('parcela: sem casas, e uma casa quando é menos de 1%', () => {
  assert.equal(parcelaDe(0.666), '67%');
  assert.equal(parcelaDe(0.004), '0,4%');
});
