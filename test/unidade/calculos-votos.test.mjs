// Contas do panorama de votos (public/js/calculos-votos.mjs): colocados, composição do eleitorado, ranking e distribuição.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { doisPrimeiros, composicaoDoEleitorado, rankingComMarca, cortesDaDistribuicao, candidatosAbaixoDe } from '../../public/js/calculos-votos.mjs';

const cand = (key, total, eleito = false) => ({ key, total, eleito });

test('dois primeiros: parcela de cada um sobre os votos válidos de todos os candidatos', () => {
  const r = doisPrimeiros([cand('b', 30), cand('a', 50), cand('c', 20)]);
  assert.equal(r.validos, 100);
  assert.deepEqual(r.colocados.map(c => [c.cand.key, c.parcela]), [['a', 0.5], ['b', 0.3]]);
});

test('dois primeiros: com um candidato só devolve um colocado, sem votos devolve vazio', () => {
  assert.equal(doisPrimeiros([cand('a', 10)]).colocados.length, 1);
  assert.deepEqual(doisPrimeiros([]), { validos: 0, colocados: [] });
});

test('composição do eleitorado: válidos, brancos e nulos e abstenção somam os aptos', () => {
  const r = composicaoDoEleitorado({ aptos: 75831, comparecimento: 64682, brancos: 2558, nulos: 4166 });
  assert.deepEqual(r, { aptos: 75831, validos: 57958, brancosENulos: 6724, abstencao: 11149 });
});

test('ranking: os mais votados, com marca de eleito e o primeiro não eleito em destaque', () => {
  const lista = [cand('a', 90, true), cand('b', 80, true), cand('c', 70), cand('d', 60, true), cand('e', 50)];
  const r = rankingComMarca(lista, c => c.eleito, 4);
  assert.deepEqual(r.itens.map(i => [i.cand.key, i.posicao, i.eleito, i.destaque]),
    [['a', 1, true, false], ['b', 2, true, false], ['c', 3, false, true], ['d', 4, true, false]]);
  assert.equal(r.temEleitos, true);
});

test('ranking: o primeiro não eleito fora dos dez primeiros entra no fim, com a posição real', () => {
  const lista = [cand('a', 90, true), cand('b', 80, true), cand('c', 70, true), cand('d', 60)];
  const r = rankingComMarca(lista, c => c.eleito, 2);
  assert.deepEqual(r.itens.map(i => [i.cand.key, i.posicao, i.destaque]), [['a', 1, false], ['b', 2, false], ['d', 4, true]]);
});

test('ranking: sem nenhum eleito (eleição em andamento) não há marca nem destaque', () => {
  const r = rankingComMarca([cand('a', 9), cand('b', 8)], () => false, 5);
  assert.equal(r.temEleitos, false);
  assert.deepEqual(r.itens.map(i => i.destaque), [false, false]);
});

test('cortes da distribuição: acompanham a ordem de grandeza do candidato mais votado', () => {
  assert.deepEqual(cortesDaDistribuicao(1842), [10, 50, 100, 300, 600, 1000]);
  assert.deepEqual(cortesDaDistribuicao(25000), [100, 500, 1000, 3000, 6000, 10000]);
  assert.deepEqual(cortesDaDistribuicao(120), [10, 50, 100, 300, 600, 1000]);
});

test('quantos candidatos ficaram abaixo de um limite de votos', () => {
  assert.equal(candidatosAbaixoDe([5, 99, 100, 250], 100), 2);
});
