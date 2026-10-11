// Dinheiro de campanha somado por cargo (public/js/calculos-campanha.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { somarCampanhas, composicaoDasCampanhas, custoPorVotoEmOrdem, gastoDosEleitos } from '../../public/js/calculos-campanha.mjs';
import { tipoDaEleicao } from '../../public/js/calculos-series.mjs';

const cands = [{ key: 'a', total: 100 }, { key: 'b', total: 10 }, { key: 'c', total: 5 }];
const financas = { c: {
  a: { r: { fefc: 600, prop: 100 }, d: 700, dc: [['Impressos', 400], ['Pessoal', 200]] },
  b: { r: { fefc: 100, pf: 100 }, d: 150, dc: [['Impressos', 100], ['Pessoal', 50]] },
  z: { r: { fefc: 999 }, d: 999, dc: [['Outra', 999]] } } };
const chaveDe = c => c.key;

test('soma do cargo: receitas por origem, despesas e maior gasto, só dos candidatos do cargo', () => {
  const s = somarCampanhas(cands, financas, chaveDe);
  assert.equal(s.candidaturas, 2);
  assert.equal(s.recebido, 900);
  assert.equal(s.gasto, 850);
  assert.deepEqual(s.grupos.map(g => [g.id, g.v]), [['fefc', 700], ['partido', 0], ['doacoes', 100], ['outros', 100]]);
  assert.deepEqual([s.maiorGasto.cand.key, s.maiorGasto.gasto], ['a', 700]);
});

test('composição das campanhas: partes de cada origem, só de quem recebeu', () => {
  const l = composicaoDasCampanhas(cands, financas, chaveDe);
  assert.deepEqual(l.map(x => [x.cand.key, x.recebido]), [['a', 700], ['b', 200]]);
  assert.deepEqual(l[1].partes.filter(p => p.v > 0).map(p => p.id), ['fefc', 'doacoes']);
});

test('custo por voto: do menor ao maior, sem quem não gastou ou não teve voto', () => {
  const linhas = [{ cand: { key: 'a' }, custo: 7 }, { cand: { key: 'b' }, custo: 15 }, { cand: { key: 'c' }, custo: null }];
  assert.deepEqual(custoPorVotoEmOrdem(linhas).map(l => l.cand.key), ['a', 'b']);
});

test('gasto dos eleitos: menor e maior gasto de quem se elegeu e se o maior gasto do cargo elegeu', () => {
  const linhas = [{ cand: { key: 'a', e: true }, gasto: 500 }, { cand: { key: 'b', e: true }, gasto: 22000 },
    { cand: { key: 'c', e: false }, gasto: 35000 }, { cand: { key: 'd', e: false }, gasto: 0 }];
  const r = gastoDosEleitos(linhas, c => c.e);
  assert.deepEqual([r.eleitos, r.minimo, r.maximo, r.maior.gasto, r.maior.eleito], [2, 500, 22000, 35000, false]);
  assert.equal(gastoDosEleitos([{ cand: { e: false }, gasto: 5 }], c => c.e).eleitos, 0);
});

test('tipo da eleição: municipal quando há prefeito, geral nas demais', () => {
  assert.equal(tipoDaEleicao([{ cd: '11' }, { cd: '13' }]), 'municipal');
  assert.equal(tipoDaEleicao([{ cd: '3' }, { cd: '5' }]), 'geral');
});
