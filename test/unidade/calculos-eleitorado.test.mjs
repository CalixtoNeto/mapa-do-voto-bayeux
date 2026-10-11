// Eleitorado por lugar e ano (public/js/calculos-eleitorado.mjs): tabela do mapa de calor e variação 1ª → última eleição.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tabelaDeEleitores, mudouCadastro, variacaoDosEleitores } from '../../public/js/calculos-eleitorado.mjs';

const porAno = { 2012: { A: 100, B: 400, C: 50 }, 2016: { A: 130, B: 390, C: 20 }, 2020: { A: 180, B: 100, D: 5 } };

test('tabela: lugares do maior ao menor no último ano; ano sem o lugar vira vazio', () => {
  const t = tabelaDeEleitores(porAno, ['2012', '2016', '2020']);
  assert.deepEqual(t.lugares, ['A', 'B', 'D', 'C']);
  assert.deepEqual(t.valores[0], [100, 130, 180]);
  assert.deepEqual(t.valores[3], [50, 20, null]);
});

test('mudança de cadastro: queda ou salto grande de um ano para o outro', () => {
  assert.equal(mudouCadastro([400, 390, 100]), true);
  assert.equal(mudouCadastro([100, 130, 180], 0.4), false);
  assert.equal(mudouCadastro([100, null, 400]), false);
});

test('variação: ganho e perda da primeira à última eleição, com os suspeitos marcados', () => {
  const v = variacaoDosEleitores(tabelaDeEleitores(porAno, ['2012', '2016', '2020']));
  assert.deepEqual(v.map(l => [l.lugar, l.diferenca, l.suspeito]), [['A', 80, false], ['B', -300, true]]);
});
