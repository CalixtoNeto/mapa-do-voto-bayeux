import { test } from 'node:test';
import assert from 'node:assert/strict';
import { milhoes, participacao } from '../../public/js/perfil/formato-perfil.mjs';

test('milhões sem a unidade: uma casa acima de 1 mi, duas abaixo, traço para zero', () => {
  assert.equal(milhoes(35691571), '35,7');
  assert.equal(milhoes(50000), '0,05');
  assert.equal(milhoes(0), '—');
  assert.equal(milhoes(null), '—');
});

test('participação com uma casa, e traço quando o total é zero', () => {
  assert.equal(participacao(1, 4), '25,0%');
  assert.equal(participacao(0, 0), '—');
});
