// Contas dos gráficos de CSS puro (public/js/calculos-graficos.mjs): rosca, waffle, haltere e colunas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gruposDeAssentos, gradienteDaRosca, celulasDoWaffle, trechoDoHaltere, alturasDasColunas } from '../../public/js/calculos-graficos.mjs';

test('rosca: cada parte ocupa a sua fatia, em porcentagem acumulada', () => {
  assert.equal(gradienteDaRosca([{ v: 75, cor: 'a' }, { v: 15, cor: 'b' }, { v: 10, cor: 'c' }]),
    'conic-gradient(a 0% 75%, b 75% 90%, c 90% 100%)');
});

test('rosca: partes vazias somem e o total zero vira uma rosca neutra', () => {
  assert.equal(gradienteDaRosca([{ v: 0, cor: 'a' }, { v: 2, cor: 'b' }]), 'conic-gradient(b 0% 100%)');
  assert.equal(gradienteDaRosca([{ v: 0, cor: 'a' }], 'n'), 'conic-gradient(n 0% 100%)');
});

test('waffle: um quadrado por assento, na ordem dos grupos', () => {
  assert.deepEqual(celulasDoWaffle([{ id: 'x', n: 2 }, { id: 'y', n: 1 }, { id: 'z', n: 0 }]), ['x', 'x', 'y']);
});

test('haltere: o trecho vai do menor ao maior valor e diz se subiu ou caiu', () => {
  assert.deepEqual(trechoDoHaltere(30, 58, 100), { de: 30, ate: 58, esquerda: 30, largura: 28, sentido: 'subiu' });
  assert.deepEqual(trechoDoHaltere(45, 25, 100), { de: 45, ate: 25, esquerda: 25, largura: 20, sentido: 'caiu' });
  assert.equal(trechoDoHaltere(5, 5, 10).sentido, 'igual');
  assert.equal(trechoDoHaltere(1, 2, 0).esquerda, 0);
});

test('colunas: altura proporcional ao maior valor, com um mínimo visível para quem tem algo', () => {
  assert.deepEqual(alturasDasColunas([50, 100, 0, 1]), [50, 100, 0, 4]);
  assert.deepEqual(alturasDasColunas([0, 0]), [0, 0]);
});

test('assentos: os maiores partidos ganham uma cor cada e o resto vira "Outros"', () => {
  const partidos = [{ partido: 'A', eleitos: 1 }, { partido: 'B', eleitos: 5 }, { partido: 'C', eleitos: 3 }, { partido: 'D', eleitos: 0 }, { partido: 'E', eleitos: 2 }];
  assert.deepEqual(gruposDeAssentos(partidos, ['x', 'y'], 'o'), [
    { id: 'B', nome: 'B', n: 5, cor: 'x' }, { id: 'C', nome: 'C', n: 3, cor: 'y' }, { id: 'outros', nome: 'Outros (2 partidos)', n: 3, cor: 'o' }]);
  assert.deepEqual(gruposDeAssentos([{ partido: 'A', eleitos: 2 }], ['x'], 'o'), [{ id: 'A', nome: 'A', n: 2, cor: 'x' }]);
});
