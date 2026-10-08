// Cálculos do panorama do cargo (public/js/calculos-cargo.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eleitosENaoEleitos, porPartido, concentracaoDoFundo, reeleicao } from '../../public/js/calculos.mjs';

const linha = (key, partido, total, gasto, eleito, fefc = 0) => ({ cand: { key, partido, total, eleito }, gasto, fefc, custo: gasto && total ? gasto / total : null });
const eleito = c => c.eleito;
const linhas = [linha('a', 'X', 100, 1000, true, 800), linha('b', 'X', 50, 200, false, 100), linha('c', 'Y', 80, 600, true, 100),
  linha('d', 'Y', 10, 100, false)];

test('eleitos × não eleitos: gasto mediano e chance de se eleger por faixa de gasto', () => {
  const r = eleitosENaoEleitos(linhas, eleito);
  assert.deepEqual([r.eleitos.n, r.eleitos.gasto, r.naoEleitos.n, r.naoEleitos.gasto], [2, 800, 2, 150]);
  assert.deepEqual(r.faixas.map(f => [f.ate, f.candidatos, f.eleitos]), [[100, 1, 0], [200, 1, 0], [600, 1, 1], [1000, 1, 1]]);
});

test('partidos: votos, eleitos, gasto e custo por voto', () => {
  const [x] = porPartido(linhas, eleito);
  assert.deepEqual(x, { partido: 'X', candidatos: 2, votos: 150, eleitos: 1, gasto: 1200, fefc: 900, custo: 8 });
});

test('concentração do fundo: parcela dos 10% que mais receberam e índice de Gini', () => {
  const r = concentracaoDoFundo(linhas);
  assert.equal(r.recebedores, 3);
  assert.equal(r.topo, 0.8);
  assert.equal(+r.gini.toFixed(3), 0.467);
});

test('reeleição: quem tentou e quem conseguiu', () => {
  const cands = [{ key: 'a', eleito: true }, { key: 'b', eleito: false }, { key: 'c', eleito: true }];
  const perfis = { c: { a: { re: 1 }, b: { re: 1 }, c: {} } };
  assert.deepEqual(reeleicao(cands, perfis, c => c.key, eleito), { tentaram: 2, conseguiram: 1 });
});
