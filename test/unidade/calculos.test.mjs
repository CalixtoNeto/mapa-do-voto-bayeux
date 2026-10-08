// Cálculos das análises que o site faz no navegador (public/js/calculos.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ehEleito, ehNegro, concentracao, correlacao, parceirosDeVoto, vencedores, resumoFinanceiro, custoPorVoto,
  linhasFinanceiras, cotaPorPartido, perfilDoGrupo, somaDoComparecimento, camadaDoComparecimento, coresDosVencedores,
} from '../../public/js/calculos.mjs';

test('eleito inclui "por QP" e "por média", mas não "não eleito" nem suplente', () => {
  assert.deepEqual(['ELEITO', 'Eleito por QP', 'ELEITO POR MÉDIA', 'NÃO ELEITO', 'SUPLENTE', '', undefined].map(ehEleito),
    [true, true, true, false, false, false, false]);
});

test('pessoas negras são as pretas e as pardas, como no IBGE', () => {
  assert.deepEqual(['PRETA', 'PARDA', 'BRANCA', 'INDÍGENA'].map(ehNegro), [true, true, false, false]);
});

test('concentração: lugares para chegar à metade dos votos e número efetivo de lugares', () => {
  assert.deepEqual(concentracao({ a: 50, b: 25, c: 25, d: 0 }), { lugares: 3, metade: 1, efetivo: 1 / (0.25 + 0.0625 * 2) });
  assert.deepEqual(concentracao({}), { lugares: 0, metade: 0, efetivo: 0 });
});

test('correlação de Pearson, e zero quando um dos lados não varia', () => {
  assert.equal(correlacao([1, 2, 3], [2, 4, 6]), 1);
  assert.equal(correlacao([1, 2, 3], [3, 2, 1]), -1);
  assert.equal(correlacao([1, 1, 1], [1, 2, 3]), 0);
});

test('parceiros de voto: quem cresce e cai nos mesmos lugares, entre os que têm votos suficientes', () => {
  const lugares = ['a', 'b', 'c'], tot = { a: 100, b: 100, c: 100 };
  const alvo = { key: 'X', v: { a: 50, b: 10, c: 5 } };
  const outros = [
    { key: 'igual', total: 130, v: { a: 100, b: 20, c: 10 } },
    { key: 'oposto', total: 130, v: { a: 10, b: 20, c: 100 } },
    { key: 'nanico', total: 3, v: { a: 3 } },
  ];
  const parceiros = parceirosDeVoto(alvo, outros, { lugares, parcela: (c, l) => (c.v[l] || 0) / tot[l], quantos: 2, minimo: 10 });
  assert.deepEqual(parceiros.map(p => p.cand.key), ['igual', 'oposto']);
  assert.ok(parceiros[0].r > 0.99);
});

test('vencedor de cada lugar e quantos lugares cada um venceu', () => {
  const cands = [{ key: 'A', v: { x: 10, y: 1 } }, { key: 'B', v: { x: 5, y: 9, z: 2 } }];
  assert.deepEqual(vencedores(cands, c => c.v), { porLugar: { x: 'A', y: 'B', z: 'B' }, contagem: [['B', 2], ['A', 1]] });
});

test('resumo financeiro agrupa as origens e calcula o custo por voto', () => {
  const r = resumoFinanceiro({ r: { fefc: 100, fp: 10, part: 5, pf: 20, prop: 3, cand: 2 }, d: 90, rep: 7, dc: [['X', 90]] });
  assert.equal(r.recebido, 140);
  assert.deepEqual(r.grupos.map(g => [g.id, g.v]), [['fefc', 100], ['partido', 15], ['doacoes', 20], ['outros', 5]]);
  assert.equal(r.gasto, 90);
  assert.equal(custoPorVoto(90, 30), 3);
  assert.equal(custoPorVoto(90, 0), null);
  assert.equal(custoPorVoto(0, 30), null);
});

test('linhas financeiras ligam cada candidato à sua prestação pela chave', () => {
  const financas = { c: { 1: { r: { fefc: 1000 }, d: 500 } } };
  const linhas = linhasFinanceiras([{ key: 'a|1', total: 100 }, { key: 'a|2', total: 50 }], financas, c => c.key.split('|')[1]);
  assert.deepEqual(linhas.map(l => [l.cand.key, l.recebido, l.fefc, l.gasto, l.custo]), [['a|1', 1000, 1000, 500, 5], ['a|2', 0, 0, 0, null]]);
});

test('cota por partido: parcela do fundo eleitoral para mulheres e pessoas negras', () => {
  const chave = c => c.key;
  const cands = [{ key: '1', partido: 'A' }, { key: '2', partido: 'A' }, { key: '3', partido: 'B' }];
  const perfis = { c: { 1: { g: 'FEMININO', r: 'PARDA', p: 'A' }, 2: { g: 'MASCULINO', r: 'BRANCA', p: 'A' }, 3: { g: 'MASCULINO', r: 'PRETA' } } };
  const financas = { c: { 1: { r: { fefc: 30 } }, 2: { r: { fefc: 70, cand: 5 } }, 3: { r: { fefc: 10 } } } };
  assert.deepEqual(cotaPorPartido(cands, financas, perfis, chave), [
    { partido: 'A', candidatos: 2, mulheres: 1, fefc: 100, fefcMulheres: 30, fefcNegros: 30 },
    { partido: 'B', candidatos: 1, mulheres: 0, fefc: 10, fefcMulheres: 0, fefcNegros: 10 },
  ]);
});

test('perfil do grupo conta candidatos e eleitos por valor', () => {
  const cands = [{ key: '1', sit: 'ELEITO' }, { key: '2', sit: 'NÃO ELEITO' }, { key: '3' }];
  const perfis = { c: { 1: { g: 'FEMININO' }, 2: { g: 'FEMININO' }, 3: { g: 'MASCULINO', s: 'ELEITO POR QP' } } };
  assert.deepEqual(perfilDoGrupo(cands, perfis, c => c.key, 'g'), [
    { valor: 'FEMININO', candidatos: 2, eleitos: 1 }, { valor: 'MASCULINO', candidatos: 1, eleitos: 1 },
  ]);
});

test('soma do comparecimento com abstenção', () => {
  assert.deepEqual(somaDoComparecimento({ a: [100, 80, 5, 3], b: [50, 30, 2, 1] }),
    { aptos: 150, comparecimento: 110, abstencao: 40, brancos: 7, nulos: 4 });
});

test('camadas do comparecimento: abstenção sobre os aptos, brancos e nulos sobre quem compareceu', () => {
  const porLugar = { a: [100, 80, 5, 3] };
  assert.deepEqual(camadaDoComparecimento('abstencao', porLugar), { a: [20, 100] });
  assert.deepEqual(camadaDoComparecimento('brancos', porLugar), { a: [5, 80] });
  assert.deepEqual(camadaDoComparecimento('nulos', porLugar), { a: [3, 80] });
});

test('os três que mais venceram ganham cor própria; os demais ficam em "outros"', () => {
  const contagem = [['A', 9], ['B', 5], ['C', 2], ['D', 1]];
  assert.deepEqual(coresDosVencedores(contagem), { A: 1, B: 2, C: 3, D: 0 });
});
