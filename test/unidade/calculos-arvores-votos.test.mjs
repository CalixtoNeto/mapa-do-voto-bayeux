import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arvoreDeCandidatos, arvoreDeLugares, arvoreDosPartidos, linkParaFicha } from '../../public/js/calculos-arvores-votos.mjs';

const ana = { key: 'A', nr: '1', total: 100, partido: 'X' }, bia = { key: 'B', nr: '2', total: 60, partido: 'X' }, caio = { key: 'C', nr: '3', total: 40, partido: 'Y' };
const porLugar = { A: { alto: 70, baixo: 30, centro: 0 }, B: { alto: 10, baixo: 50 }, C: { centro: 40 } };
const op = { votosDe: c => porLugar[c.key], nomeDoLugar: k => k.toUpperCase(), nomeDe: c => `cand ${c.nr}`, parcela: f => `${Math.round(f * 100)}%`, ficha: true };

test('candidato → lugares onde teve voto, com a parcela como nota e o link para a ficha por último', () => {
  const { v, filhos } = arvoreDeCandidatos([{ cand: ana, nota: 'n1' }, { cand: caio, nota: 'n3' }], op);
  assert.equal(v, 140);
  assert.deepEqual(filhos[0], ['cand 1', 100, [['ALTO', 70, null, '70%'], ['BAIXO', 30, null, '30%'], linkParaFicha(ana)], 'n1', 'A']);
  assert.deepEqual(filhos[1][2], [['CENTRO', 40, null, '100%'], linkParaFicha(caio)]);
});

test('sem ficha, o ramo só tem os lugares; candidato sem voto fica de fora', () => {
  const { filhos } = arvoreDeCandidatos([{ cand: ana, nota: '' }, { cand: { ...bia, total: 0 }, nota: '' }], { ...op, ficha: false });
  assert.equal(filhos.length, 1);
  assert.equal(filhos[0][2].length, 2);
  assert.deepEqual(linkParaFicha(ana)[0], { ficha: ana });
});

test('lugar → candidatos mais votados nele e o resto em "Demais candidatos"', () => {
  const entradas = [{ lugar: 'alto', nota: 'margem 1' }, { lugar: 'sem', nota: '' }];
  const { filhos } = arvoreDeLugares(entradas, [ana, bia, caio], { ...op, limite: 1 });
  assert.equal(filhos.length, 1);
  assert.deepEqual(filhos[0], ['ALTO', 80, [[{ cand: ana }, 70, null, '88%'], ['Demais candidatos (1)', 10, null, '13%']], 'margem 1', 'alto']);
});

test('partido → candidato → lugares; a nota do partido e a do candidato vêm de fora', () => {
  const partidos = [{ partido: 'X', votos: 160, nota: 'nx' }, { partido: 'Y', votos: 40, nota: 'ny' }];
  const { v, filhos } = arvoreDosPartidos(partidos, [ana, bia, caio], { ...op, notaDoCandidato: (c, p) => `${Math.round(c.total / p.votos * 100)}%` });
  assert.equal(v, 200);
  assert.deepEqual(filhos.map(f => f[0]), ['X', 'Y']);
  assert.deepEqual(filhos[0][2].map(f => [f[0], f[1], f[3]]), [['cand 1', 100, '63%'], ['cand 2', 60, '38%']]);
  assert.equal(filhos[0][2][0][2].length, 3);
});

import { arvoreDosLugaresDoCandidato } from '../../public/js/calculos-arvores-votos.mjs';

test('onde o candidato vai melhor: lugar → locais de votação, quando o site sabe listá-los', () => {
  const forca = [{ lugar: 'alto', votos: 70, nota: 'n1' }, { lugar: 'baixo', votos: 30, nota: 'n2' }];
  const locaisDe = lugar => lugar === 'alto' ? [{ nome: 'Escola', v: 50 }, { nome: 'Creche', v: 20 }, { nome: 'Vazio', v: 0 }] : null;
  const { v, filhos } = arvoreDosLugaresDoCandidato(forca, { nomeDoLugar: k => k.toUpperCase(), locaisDe, parcela: f => `${Math.round(f * 100)}%` });
  assert.equal(v, 100);
  assert.deepEqual(filhos[0], ['ALTO', 70, [['Escola', 50, null, '71%'], ['Creche', 20, null, '29%']], 'n1', 'alto']);
  assert.equal(filhos[1][2], null);
});
