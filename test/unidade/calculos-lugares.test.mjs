// Cálculos por lugar (public/js/calculos-lugares.mjs): fragmentação, margem de vitória e abstenção.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fragmentacao, margens, variacaoDaAbstencao } from '../../public/js/calculos.mjs';

const votosDe = c => c.v;
const cands = [{ key: 'a', v: { p: 50, q: 10 } }, { key: 'b', v: { p: 50, q: 80 } }, { key: 'c', v: { q: 10 } }];

test('fragmentação: número efetivo de candidatos em cada lugar', () => {
  assert.deepEqual(fragmentacao(cands, ['p', 'q'], votosDe).map(f => [f.lugar, +f.efetivo.toFixed(3)]), [['p', 2], ['q', 1.515]]);
});

test('margem de vitória: diferença entre o primeiro e o segundo, sobre os votos do lugar', () => {
  assert.deepEqual(margens(cands, ['p', 'q'], votosDe).map(m => [m.lugar, m.primeiro.key, m.segundo.key, m.margem]),
    [['p', 'a', 'b', 0], ['q', 'b', 'a', 0.7]]);
});

test('variação da abstenção, em pontos percentuais, entre duas eleições', () => {
  const r = variacaoDaAbstencao({ p: [100, 70, 0, 0], q: [100, 80, 0, 0] }, { p: [100, 80, 0, 0] });
  assert.deepEqual(r.map(v => [v.lugar, +v.antes.toFixed(2), +v.agora.toFixed(2), +v.diferenca.toFixed(2)]), [['p', 0.2, 0.3, 0.1]]);
});
