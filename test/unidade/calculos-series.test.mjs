// Séries de várias eleições (public/js/calculos-series.mjs): abstenção, eleitores aptos e composição.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serieDeAbstencao, menorAbstencao, crescimentoDosAptos, abstencaoDaEleicao } from '../../public/js/calculos-series.mjs';

const e = (ano, tipo, aptos, comparecimento) => ({ ano, tipo, aptos, comparecimento });
const eleicoes = [e('2016', 'municipal', 1000, 940), e('2014', 'geral', 1000, 850), e('2012', 'municipal', 900, 760), e('2018', 'geral', 1100, 960)];

test('abstenção de uma eleição: aptos que não compareceram sobre os aptos', () => {
  assert.equal(abstencaoDaEleicao(e('2012', 'municipal', 900, 765)), 0.15);
  assert.equal(abstencaoDaEleicao(e('2012', 'municipal', 0, 0)), null);
});

test('série de abstenção: uma linha para as municipais e outra para as gerais, em ordem de ano', () => {
  const s = serieDeAbstencao(eleicoes);
  assert.deepEqual(s.municipal.map(p => p[0]), [2012, 2016]);
  assert.deepEqual(s.geral.map(p => p[0]), [2014, 2018]);
  assert.equal(+s.municipal[1][1].toFixed(3), 0.06);
});

test('menor abstenção entre as eleições de um tipo', () => {
  const m = menorAbstencao(eleicoes, 'municipal');
  assert.deepEqual([m.ano, +m.taxa.toFixed(2)], ['2016', 0.06]);
  assert.equal(menorAbstencao([], 'municipal'), null);
});

test('crescimento dos aptos entre a primeira e a última eleição do tipo', () => {
  const c = crescimentoDosAptos(eleicoes, 'municipal');
  assert.deepEqual([c.de.ano, c.ate.ano, +c.variacao.toFixed(3)], ['2012', '2016', 0.111]);
  assert.equal(crescimentoDosAptos([e('2012', 'municipal', 9, 8)], 'municipal'), null);
});
