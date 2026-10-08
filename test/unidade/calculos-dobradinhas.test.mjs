// Dobradinhas entre cargos (public/js/calculos-dobradinhas.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dobradinhasPorCargo, forcaDaCorrelacao } from '../../public/js/calculos.mjs';

const lugares = ['a', 'b', 'c'];
const cand = (key, cargo, v) => ({ key, cargo, total: v.reduce((s, x) => s + x, 0), v });
const parcela = (c, lugar) => c.v[lugares.indexOf(lugar)] / 100;
const alvo = cand('jo', '5', [60, 40, 20]);

test('agrupa por cargo, na ordem dada, sem o cargo do próprio candidato', () => {
  const federal = cand('f0', '6', [9, 5, 1]), cands = [federal, cand('f1', '6', [8, 6, 1]), cand('g1', '3', [70, 50, 30])];
  const grupos = dobradinhasPorCargo(federal, cands, { lugares, parcela, ordem: ['3', '6'] });
  assert.deepEqual(grupos.map(g => g.cargo), ['3']);
});

test('senador inclui os outros senadores: em anos de duas vagas, cada eleitor vota em dois', () => {
  const cands = [alvo, cand('s2', '5', [40, 60, 80]), cand('g1', '3', [70, 50, 30])];
  const grupos = dobradinhasPorCargo(alvo, cands, { lugares, parcela, ordem: ['3', '5'] });
  assert.deepEqual(grupos.map(g => [g.cargo, g.lista.map(p => p.cand.key)]), [['3', ['g1']], ['5', ['s2']]]);
});

test('força da correlação: fraca abaixo de 0,3, moderada até 0,6, forte acima', () => {
  assert.deepEqual([0.15, -0.45, 0.8].map(forcaDaCorrelacao), ['fraca', 'moderada', 'forte']);
});

test('cargo com poucos candidatos mostra todos, inclusive quem anda ao contrário', () => {
  const cands = [alvo, cand('g1', '3', [70, 50, 30]), cand('g2', '3', [20, 40, 60])];
  const [governador] = dobradinhasPorCargo(alvo, cands, { lugares, parcela, ordem: ['3'] });
  assert.equal(governador.todos, true);
  assert.deepEqual(governador.lista.map(p => [p.cand.key, Math.round(p.r)]), [['g1', 1], ['g2', -1]]);
});

test('cargo com muitos candidatos mostra os cinco mais parecidos, só com correlação acima de 0,1', () => {
  const parecidos = Array.from({ length: 6 }, (_, i) => cand(`p${i}`, '6', [30 + i, 20, 10]));
  const contrarios = Array.from({ length: 3 }, (_, i) => cand(`c${i}`, '6', [10, 20, 30 + i]));
  const [federal] = dobradinhasPorCargo(alvo, [alvo, ...parecidos, ...contrarios], { lugares, parcela, ordem: ['6'] });
  assert.equal(federal.todos, false);
  assert.equal(federal.lista.length, 5);
  assert.ok(federal.lista.every(p => p.r > 0.1));
});

test('ignora candidatos com menos de 0,5% dos votos do cargo', () => {
  const cands = [alvo, cand('g1', '3', [70, 50, 30]), cand('nanico', '3', [0, 0, 0.1])];
  const [governador] = dobradinhasPorCargo(alvo, cands, { lugares, parcela, ordem: ['3'] });
  assert.deepEqual(governador.lista.map(p => p.cand.key), ['g1']);
});
