// Contas dos gráficos desenhados em SVG (public/js/calculos-svg.mjs): treemap, séries no tempo e faixas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { treemap, marcasDoEixo, caminhoDaLinha, escalaLinear, contarPorFaixa, classeDoCalor, pontosDaArea, separarRotulos } from '../../public/js/calculos-svg.mjs';

const area = r => r.w * r.h;
const soma = (lista, f) => lista.reduce((s, x) => s + f(x), 0);

test('treemap: cada bloco tem área proporcional ao valor e os blocos preenchem o retângulo sem sair dele', () => {
  const blocos = treemap([{ n: 'a', v: 60 }, { n: 'b', v: 30 }, { n: 'c', v: 10 }, { n: 'zero', v: 0 }], 200, 100);
  assert.deepEqual(blocos.map(b => b.n), ['a', 'b', 'c']);
  assert.ok(Math.abs(soma(blocos, area) - 20000) < 1e-6);
  blocos.forEach(b => assert.ok(Math.abs(area(b) / 20000 - b.v / 100) < 1e-9));
  blocos.forEach(b => assert.ok(b.x >= -1e-9 && b.y >= -1e-9 && b.x + b.w <= 200 + 1e-9 && b.y + b.h <= 100 + 1e-9));
});

test('treemap: valores fora de ordem saem do maior ao menor, um só item ocupa tudo e lista vazia não gera blocos', () => {
  assert.deepEqual(treemap([{ n: 'p', v: 1 }, { n: 'g', v: 5 }], 10, 10).map(b => b.n), ['g', 'p']);
  assert.deepEqual(treemap([{ n: 'x', v: 7 }], 30, 20), [{ n: 'x', v: 7, x: 0, y: 0, w: 30, h: 20 }]);
  assert.deepEqual(treemap([], 10, 10), []);
});

test('treemap: os blocos não se sobrepõem', () => {
  const blocos = treemap([40, 25, 15, 10, 6, 4].map((v, i) => ({ n: String(i), v })), 320, 200);
  for (const [i, a] of blocos.entries()) for (const b of blocos.slice(i + 1)) {
    const dx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    assert.ok(dx <= 1e-6 || dy <= 1e-6, `${a.n} e ${b.n} se sobrepõem`);
  }
});

test('eixo: marcas redondas de zero até cobrir o maior valor', () => {
  assert.deepEqual(marcasDoEixo(386.3, 4), [0, 100, 200, 300, 400]);
  assert.deepEqual(marcasDoEixo(60, 3), [0, 20, 40, 60]);
  assert.deepEqual(marcasDoEixo(0), [0, 1]);
  assert.deepEqual(marcasDoEixo(0.047, 4), [0, 0.02, 0.04, 0.06]);
});

test('escala linear leva o domínio ao intervalo, inclusive invertido', () => {
  assert.equal(escalaLinear([0, 10], [0, 100])(5), 50);
  assert.equal(escalaLinear([0, 10], [100, 0])(2.5), 75);
  assert.equal(escalaLinear([3, 3], [0, 100])(3), 0, 'domínio sem largura não divide por zero');
});

test('linha: pontos ausentes abrem uma quebra em vez de ligar o que veio antes ao que veio depois', () => {
  assert.equal(caminhoDaLinha([[0, 1], [2, 3], null, [6, 7], [8, 9]]), 'M0,1L2,3M6,7L8,9');
  assert.equal(caminhoDaLinha([null, [1, 1]]), 'M1,1');
  assert.equal(caminhoDaLinha([]), '');
});

test('área: fecha o contorno até a linha de base', () => {
  assert.equal(pontosDaArea([[0, 4], [10, 2]], 10), 'M0,10L0,4L10,2L10,10Z');
  assert.equal(pontosDaArea([], 10), '');
});

test('faixas: conta quantos valores caem em cada intervalo, com rótulos legíveis', () => {
  const r = contarPorFaixa([0, 5, 12, 49, 50, 99, 1500, 2000], [10, 50, 100]);
  assert.deepEqual(r, [{ rotulo: '0–9', n: 2 }, { rotulo: '10–49', n: 2 }, { rotulo: '50–99', n: 2 }, { rotulo: '100+', n: 2 }]);
  assert.equal(contarPorFaixa([], [10])[1].rotulo, '10+');
  assert.equal(contarPorFaixa([1], [1000])[1].rotulo, '1.000+');
});

test('mapa de calor: a classe cresce com o valor entre o menor e o maior e vazio fica de fora', () => {
  assert.equal(classeDoCalor(100, 100, 600, 6), 0);
  assert.equal(classeDoCalor(600, 100, 600, 6), 5);
  assert.equal(classeDoCalor(350, 100, 600, 6), 3);
  assert.equal(classeDoCalor(null, 100, 600, 6), -1);
  assert.equal(classeDoCalor(5, 5, 5, 6), 5, 'todos iguais: a classe mais escura');
});

test('rótulos nas pontas das linhas: nunca ficam a menos de 13px um do outro e mantêm a ordem de entrada', () => {
  assert.deepEqual(separarRotulos([100, 104, 200]), [100, 113, 200]);
  assert.deepEqual(separarRotulos([104, 100]), [113, 100], 'quem estava acima continua acima');
  assert.deepEqual(separarRotulos([50]), [50]);
  assert.deepEqual(separarRotulos([10, 11, 12]), [10, 23, 36]);
});
