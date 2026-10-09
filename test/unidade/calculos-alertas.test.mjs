import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alertasDaCampanha } from '../../public/js/calculos-alertas.mjs';

// Seis candidatos ao mesmo cargo; o primeiro é o analisado.
const cands = ['A', 'B', 'C', 'D', 'E', 'F'].map((nr, i) => ({ nr, cargo: '13', total: i === 0 ? 100 : 1000 }));
const despesa = (combustivel, outros = 20000) => ({ r: { fefc: combustivel + outros }, d: combustivel + outros, pg: combustivel + outros,
  dc: [['Combustíveis e lubrificantes', combustivel], ['Publicidade por materiais impressos', outros]] });
function contexto(financasDoA, perfilDoA = {}) {
  const c = { A: financasDoA, B: despesa(2000), C: despesa(3000), D: despesa(2500), E: despesa(4000), F: despesa(1000) };
  return { cands, chaveDe: x => x.nr, financas: { c }, perfis: { c: { A: perfilDoA } } };
}
const tipos = alertas => alertas.map(a => a[0]);

test('gasto numa categoria muito acima dos outros candidatos do cargo', () => {
  const a = alertasDaCampanha(cands[0], contexto(despesa(100000)));
  assert.deepEqual(a.find(x => x[0] === 'categoria'), ['categoria', 'Combustíveis e lubrificantes', 100000, 2500, 5]);
  assert.ok(!a.some(x => x[0] === 'categoria' && x[1] === 'Publicidade por materiais impressos'), 'publicidade igual à dos outros não é alerta');
});

test('custo por voto muito acima da mediana do cargo', () => {
  const a = alertasDaCampanha(cands[0], contexto(despesa(100000)));
  assert.deepEqual(a.find(x => x[0] === 'custo'), ['custo', 1200, 22.5]);
});

test('recursos próprios acima dos bens declarados', () => {
  const f = { ...despesa(1000), r: { prop: 50000 } };
  assert.deepEqual(alertasDaCampanha(cands[0], contexto(f, { b: 20000 })).find(x => x[0] === 'proprios'), ['proprios', 50000, 20000]);
  assert.ok(!tipos(alertasDaCampanha(cands[0], contexto(f, { b: 90000 }))).includes('proprios'));
});

test('um só doador ou um só fornecedor com a maior parte, quem doou e recebeu, e o que ficou sem pagar', () => {
  const f = { ...despesa(1000), r: { pf: 40000 }, d: 40000, pg: 10000,
    doa: [['JOAO', 'pf', 30000], ['MARIA', 'pf', 10000]], fo: [['GRAFICA X', 30000], ['JOAO', 5000]] };
  const a = alertasDaCampanha(cands[0], contexto(f));
  assert.deepEqual(a.find(x => x[0] === 'doador'), ['doador', 'JOAO', 30000, 40000]);
  assert.deepEqual(a.find(x => x[0] === 'fornecedor'), ['fornecedor', 'GRAFICA X', 30000, 40000]);
  assert.deepEqual(a.find(x => x[0] === 'doadorFornecedor'), ['doadorFornecedor', 'JOAO', 30000, 5000]);
  assert.deepEqual(a.find(x => x[0] === 'naoPago'), ['naoPago', 30000, 40000]);
});

test('campanha pequena ou sem comparação suficiente não gera alerta', () => {
  assert.deepEqual(alertasDaCampanha(cands[0], contexto(despesa(500, 500))), []);
  assert.deepEqual(alertasDaCampanha(cands[0], { ...contexto(despesa(100000)), cands: cands.slice(0, 3) })
    .filter(a => a[0] === 'categoria' || a[0] === 'custo'), []);
});

test('no máximo cinco categorias, as que mais destoam primeiro', () => {
  const nomes = ['a', 'b', 'c', 'd', 'e', 'f'];
  const comTodas = (v, extra = {}) => ({ r: { fefc: 1 }, d: 1, dc: nomes.map((n, i) => [n, v * (extra[n] || 1) * (i + 1)]) });
  const c = { A: comTodas(10000, { f: 100 }), B: comTodas(100), C: comTodas(100), D: comTodas(100), E: comTodas(100), F: comTodas(100) };
  const a = alertasDaCampanha(cands[0], { cands, chaveDe: x => x.nr, financas: { c }, perfis: { c: {} } }).filter(x => x[0] === 'categoria');
  assert.deepEqual(a.map(x => x[1]), ['f', 'a', 'b', 'c', 'd']);
});
