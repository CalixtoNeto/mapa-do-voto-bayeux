// Posições do diagrama de fluxo (public/js/calculos-sankey.mjs): colunas de nós, faixas entre eles e o corte dos pequenos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sankey, agruparRestante } from '../../public/js/calculos-sankey.mjs';

const grafo = {
  colunas: [[{ id: 'a', n: 'A' }, { id: 'b', n: 'B' }], [{ id: 'm', n: 'Meio' }], [{ id: 'x', n: 'X' }, { id: 'y', n: 'Y' }, { id: 'z', n: 'Z' }]],
  fluxos: [{ de: 'a', para: 'm', v: 60 }, { de: 'b', para: 'm', v: 40 }, { de: 'm', para: 'x', v: 50 }, { de: 'm', para: 'y', v: 30 }, { de: 'm', para: 'z', v: 20 }],
};
const [W, H] = [600, 300];
const no = (r, id) => r.nos.find(n => n.id === id);

test('cada nó tem altura proporcional ao valor e as colunas usam a mesma escala', () => {
  const r = sankey(grafo, W, H);
  assert.equal(no(r, 'm').v, 100);
  assert.ok(Math.abs(no(r, 'a').h / no(r, 'b').h - 1.5) < 1e-9);
  assert.ok(Math.abs(no(r, 'm').h - (no(r, 'a').h + no(r, 'b').h)) < 1e-9);
  assert.ok(Math.abs(no(r, 'x').h + no(r, 'y').h + no(r, 'z').h - no(r, 'm').h) < 1e-9);
});

test('os nós ficam dentro da área, sem se sobrepor na mesma coluna', () => {
  const r = sankey(grafo, W, H);
  r.nos.forEach(n => assert.ok(n.y >= -1e-9 && n.y + n.h <= H + 1e-9 && n.x >= 0 && n.x + n.w <= W + 1e-9));
  const col = r.nos.filter(n => n.coluna === 2).sort((p, q) => p.y - q.y);
  col.slice(1).forEach((n, i) => assert.ok(n.y >= col[i].y + col[i].h - 1e-9));
});

test('as faixas saem e chegam dentro dos nós, com espessura igual ao valor na escala', () => {
  const r = sankey(grafo, W, H);
  assert.equal(r.fluxos.length, 5);
  for (const f of r.fluxos) {
    const [de, para] = [no(r, f.de), no(r, f.para)];
    assert.ok(f.y0 - f.h / 2 >= de.y - 1e-9 && f.y0 + f.h / 2 <= de.y + de.h + 1e-9);
    assert.ok(f.y1 - f.h / 2 >= para.y - 1e-9 && f.y1 + f.h / 2 <= para.y + para.h + 1e-9);
    assert.equal(f.x0, de.x + de.w); assert.equal(f.x1, para.x);
  }
  const das = r.fluxos.filter(f => f.de === 'm').reduce((s, f) => s + f.h, 0);
  assert.ok(Math.abs(das - no(r, 'm').h) < 1e-9);
});

test('faixas de um mesmo nó não se sobrepõem', () => {
  const r = sankey(grafo, W, H), saem = r.fluxos.filter(f => f.de === 'm').sort((p, q) => p.y0 - q.y0);
  saem.slice(1).forEach((f, i) => assert.ok(f.y0 - f.h / 2 >= saem[i].y0 + saem[i].h / 2 - 1e-9));
});

test('quando entra menos do que sai, o nó acompanha o maior lado', () => {
  const r = sankey({ colunas: [[{ id: 'a' }], [{ id: 'b' }]], fluxos: [{ de: 'a', para: 'b', v: 10 }, { de: 'b', para: 'b2', v: 0 }] }, W, H);
  assert.equal(no(r, 'a').v, 10);
});

test('fluxos zerados ou sem nó são ignorados e grafo vazio não gera nada', () => {
  assert.deepEqual(sankey({ colunas: [[{ id: 'a' }], [{ id: 'b' }]], fluxos: [{ de: 'a', para: 'b', v: 0 }, { de: 'q', para: 'b', v: 5 }] }, W, H), { nos: [], fluxos: [] });
  assert.deepEqual(sankey({ colunas: [], fluxos: [] }, W, H), { nos: [], fluxos: [] });
});

test('agruparRestante: mantém os maiores e soma o resto num item só', () => {
  const itens = [['a', 50], ['b', 30], ['c', 12], ['d', 5], ['e', 3]].map(([n, v]) => ({ n, v }));
  assert.deepEqual(agruparRestante(itens, 3, 'Outros'), [{ n: 'a', v: 50 }, { n: 'b', v: 30 }, { n: 'Outros (3)', v: 20 }]);
  assert.deepEqual(agruparRestante(itens, 5, 'Outros'), itens);
  assert.deepEqual(agruparRestante([{ n: 'z', v: 1 }, { n: 'y', v: 9 }], 4, 'Outros'), [{ n: 'y', v: 9 }, { n: 'z', v: 1 }]);
});
