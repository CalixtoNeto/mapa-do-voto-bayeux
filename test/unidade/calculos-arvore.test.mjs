import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ramoDaArvore, arvoreDoGasto } from '../../public/js/calculos-arvore.mjs';

test('ramo da árvore no caminho escolhido; caminho que não existe para no último ramo achado', () => {
  const arvore = { v: 190, filhos: [['Saúde', 160, [['Material', 160, [['FARMACIA', 160]]]]], ['Educação', 30]] };
  assert.deepEqual(ramoDaArvore(arvore, []), { valor: 190, filhos: arvore.filhos });
  assert.deepEqual(ramoDaArvore(arvore, ['Saúde', 'Material']), { valor: 160, filhos: [['FARMACIA', 160]] });
  assert.deepEqual(ramoDaArvore(arvore, ['Educação']), { valor: 30, filhos: [] });
});

test('gasto da campanha como árvore: categoria e quem recebeu nela', () => {
  const dc = [['Impressos', 700, [['GRAFICA', 500], ['Outros (2)', 200]]], ['Pessoal', 300]];
  const arvore = arvoreDoGasto(dc);
  assert.equal(arvore.v, 1000);
  assert.deepEqual(ramoDaArvore(arvore, ['Impressos']), { valor: 700, filhos: [['GRAFICA', 500], ['Outros (2)', 200]] });
});

import { arvoreDosLugares } from '../../public/js/calculos-arvore.mjs';

const lugares = [
  { key: 'A', name: 'Alto', v: 30, t: 200, p: 0.15, locais: [{ nome: 'Escola 1', v: 20, t: 120 }, { nome: 'Escola 2', v: 10, t: 80 }, { nome: 'Escola 3', v: 0, t: 50 }] },
  { key: 'B', name: 'Baixo', v: 50, t: 100, p: 0.5, locais: [{ nome: 'Creche', v: 50, t: 100 }] },
  { key: 'C', name: 'Centro', v: 0, t: 90, p: 0, locais: [{ nome: 'Praça', v: 0, t: 90 }] },
];
const parcela = f => `${Math.round(f * 100)}%`;

test('lugares como árvore: lugar → local de votação, com a parcela como nota e a chave do lugar', () => {
  const { v, filhos } = arvoreDosLugares(lugares, { ordem: 'votos', parcela });
  assert.equal(v, 80);
  assert.deepEqual(filhos.map(f => f[0]), ['Baixo', 'Alto']);
  assert.deepEqual(filhos[1], ['Alto', 30, [['Escola 1', 20, null, '17%'], ['Escola 2', 10, null, '13%']], '15%', 'A']);
});

test('lugares como árvore: lugar sem voto fica de fora; ordem por parcela ou por nome', () => {
  assert.deepEqual(arvoreDosLugares(lugares, { ordem: 'pct', parcela }).filhos.map(f => f[0]), ['Baixo', 'Alto']);
  assert.deepEqual(arvoreDosLugares(lugares, { ordem: 'nome', parcela }).filhos.map(f => f[0]), ['Alto', 'Baixo']);
  assert.equal(arvoreDosLugares(lugares, { ordem: 'votos', parcela }).filhos.some(f => f[0] === 'Centro'), false);
});
