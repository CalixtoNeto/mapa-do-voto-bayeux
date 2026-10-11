import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anosCompletos, maiorOrigem, totalRecebido, autorDoPico, funcoesComValor }
  from '../../public/js/perfil/calculos-emendas.mjs';

test('anos de emendas: preenche os anos sem emenda com zero, do primeiro ao último', () => {
  assert.deepEqual(anosCompletos([['2014', 10, 5], ['2017', 20, 20]]), [
    { ano: '2014', empenhado: 10, pago: 5 }, { ano: '2015', empenhado: 0, pago: 0 },
    { ano: '2016', empenhado: 0, pago: 0 }, { ano: '2017', empenhado: 20, pago: 20 }]);
  assert.deepEqual(anosCompletos([]), []);
});

test('maior origem: nome, valor e fração do total recebido', () => {
  assert.deepEqual(maiorOrigem([['RELATOR', 40, 2], ['OUTRO', 60, 1]]), { nome: 'OUTRO', v: 60, fracao: 0.6 });
  assert.equal(maiorOrigem([]), null);
});

test('total recebido soma os anos', () => {
  assert.equal(totalRecebido({ porAno: [['2020', 5], ['2021', 7]] }), 12);
  assert.equal(totalRecebido(undefined), 0);
});

test('autor do pico: quem mais mandou no ano em que mais entrou dinheiro', () => {
  const arvore = { v: 100, filhos: [['RELATOR', 60, [['Pessoas físicas', 60, [['2020', 50], ['2021', 10]]]]],
    ['BANCADA', 40, [['Município', 40, [['2020', 5], ['2022', 35]]]]]] };
  const r = autorDoPico(arvore, [['2020', 55], ['2021', 10], ['2022', 35]]);
  assert.deepEqual(r, { ano: '2020', valor: 55, autor: 'RELATOR', v: 50, fracao: 50 / 55 });
  assert.equal(autorDoPico(undefined, [['2020', 1]]), null);
});

test('funções com valor: tira as zeradas', () => {
  assert.deepEqual(funcoesComValor([['Saúde', 5], ['Educação', 0]]), [{ n: 'Saúde', v: 5 }]);
});
