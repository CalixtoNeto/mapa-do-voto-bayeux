import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arvoreDeDoadores } from '../../public/js/calculos-arvores-ficha.mjs';

const bia = { key: 'B' }, caio = { key: 'C' };

test('quem doou: doador → outras campanhas que ele também financiou, com a parcela do recebido', () => {
  const doacoes = [['JOSE DA SILVA', 'pf', 600, 0], ['ACME LTDA', 'pj', 400, 1], ['MARIA', 'pf', 100]];
  const rede = [{ n: 'JOSE DA SILVA', v: 600, outros: [{ cand: bia, v: 50 }, { cand: caio, v: 20 }] }];
  const { v, filhos } = arvoreDeDoadores(doacoes, rede, 1500, {});
  assert.equal(v, 1100);
  assert.deepEqual(filhos[0].slice(0, 2), ['Jose da Silva', 600]);
  assert.equal(filhos[0][3], '40% do recebido');
  assert.deepEqual(filhos[0][2].map(f => [f[0].cand.key, f[1]]), [['B', 50], ['C', 20]]);
  assert.equal(filhos[1][0], 'Acme Ltda (empresa)');
  assert.equal(filhos[1][2], null);
});

test('quem doou: sem o total recebido, a nota diz só quantas campanhas', () => {
  const { filhos } = arvoreDeDoadores([['JOSE', 'pf', 10, 0]], [{ n: 'JOSE', v: 10, outros: [{ cand: bia, v: 5 }] }], 0, {});
  assert.equal(filhos[0][3], 'também doou a 1 outra campanha');
});
