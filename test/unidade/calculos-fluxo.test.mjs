// Grafos do diagrama de fluxo (public/js/calculos-fluxo.mjs): de onde vem, por onde passa e para onde vai.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grafoComMeio, grafoEmPares } from '../../public/js/calculos-fluxo.mjs';

const nomes = coluna => coluna.map(n => n.n);
const soma = (fluxos, f) => fluxos.filter(f).reduce((s, x) => s + x.v, 0);

test('grafo com meio: origens e destinos ligados a um nó central, do maior ao menor', () => {
  const g = grafoComMeio({ origens: [{ n: 'A', v: 10 }, { n: 'B', v: 30 }], meio: 'Pago', destinos: [{ n: 'X', v: 5 }, { n: 'Y', v: 35 }] });
  assert.deepEqual(g.colunas.map(nomes), [['B', 'A'], ['Pago'], ['Y', 'X']]);
  assert.equal(soma(g.fluxos, f => f.para === 'meio'), 40);
  assert.equal(soma(g.fluxos, f => f.de === 'meio'), 40);
});

test('grafo com meio: passando do limite, o resto vira "Outros (n)" e a soma não muda', () => {
  const destinos = [50, 20, 10, 5, 3, 2].map((v, i) => ({ n: 'd' + i, v }));
  const g = grafoComMeio({ origens: [{ n: 'A', v: 90 }], meio: 'M', destinos, limite: 4 });
  assert.deepEqual(nomes(g.colunas[2]), ['d0', 'd1', 'd2', 'Outros (3)']);
  assert.equal(soma(g.fluxos, f => f.de === 'meio'), 90);
});

test('grafo com meio: valores zerados ou negativos não entram e o alerta de uma origem é mantido', () => {
  const g = grafoComMeio({ origens: [{ n: 'A', v: 0 }, { n: 'B', v: 4, alerta: true }], meio: 'M', destinos: [{ n: 'X', v: 4 }, { n: 'Z', v: -1 }] });
  assert.deepEqual(g.colunas.map(nomes), [['B'], ['M'], ['X']]);
  assert.equal(g.colunas[0][0].alerta, true);
});

test('grafo em pares: soma os pares repetidos e liga as duas colunas', () => {
  const g = grafoEmPares({ pares: [['a', 'x', 5], ['a', 'x', 5], ['a', 'y', 3], ['b', 'x', 2]] });
  assert.deepEqual(g.colunas.map(nomes), [['a', 'b'], ['x', 'y']]);
  assert.equal(g.fluxos.length, 3);
  assert.equal(soma(g.fluxos, f => f.de === 'e0' && f.para === 's0'), 10);
});

test('grafo em pares: cada lado respeita o seu limite e o total se conserva', () => {
  const pares = [['a', 'x', 40], ['b', 'x', 30], ['c', 'y', 20], ['d', 'z', 6], ['e', 'w', 4]];
  const g = grafoEmPares({ pares, limiteDe: 3, limitePara: 2 });
  assert.deepEqual(nomes(g.colunas[0]), ['a', 'b', 'Outros (3)']);
  assert.deepEqual(nomes(g.colunas[1]), ['x', 'Outros (3)']);
  assert.equal(soma(g.fluxos, () => true), 100);
});

test('grafo em pares: sem pares válidos não há colunas com nós', () => {
  assert.deepEqual(grafoEmPares({ pares: [['a', 'b', 0]] }).fluxos, []);
});

test('grafo com meio: o resto das origens e o dos destinos têm rótulos próprios', () => {
  const lista = prefixo => [9, 8, 7, 6].map((v, i) => ({ n: prefixo + i, v }));
  const g = grafoComMeio({ origens: lista('o'), meio: 'M', destinos: lista('d'), limite: 3, rotulo: 'Outras funções', rotuloOrigens: 'Outros órgãos' });
  assert.equal(g.colunas[0][2].n, 'Outros órgãos (2)');
  assert.equal(g.colunas[2][2].n, 'Outras funções (2)');
});
