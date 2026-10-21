import { test } from 'node:test';
import assert from 'node:assert/strict';
import { candidatoDoSite, candidatoDasFinancas, arquivosDaEleicao } from '../../scripts/analises/escopo.mjs';

test('presidente entra no site (é nacional) mas não nas finanças, que só dividem a campanha municipal pelos bairros', () => {
  const presidente = { uf: 'BR', ue: 'BR', cargo: '1' };
  assert.equal(candidatoDoSite(presidente), true);
  assert.equal(candidatoDasFinancas(presidente), false);
  assert.equal(candidatoDoSite({ uf: 'SP', ue: 'SP', cargo: '3' }), false, 'governador de outro estado');
});

test('o arquivo da UF deixa o presidente de fora e o nacional (_BRASIL.csv) só traz o presidente', () => {
  const [uf, nacional] = arquivosDaEleicao('consulta_cand', '2022');
  assert.ok(uf.padrao.test('consulta_cand_2022_PB.csv'));
  assert.ok(nacional.padrao.test('consulta_cand_2022_BRASIL.csv'));
  assert.deepEqual(['1', '3', '13'].map(uf.cargoAceito), [false, true, true]);
  assert.deepEqual(['1', '3', '13'].map(nacional.cargoAceito), [true, false, false]);
});

import { anoTemPresidente } from '../../scripts/eleicao/config.mjs';

test('presidente só disputa nas eleições gerais', () => {
  assert.deepEqual(['2012', '2014', '2016', '2018', '2020', '2022', '2024', '2026'].map(anoTemPresidente),
    [false, true, false, true, false, true, false, true]);
});
