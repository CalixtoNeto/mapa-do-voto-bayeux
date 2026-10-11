import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pagoDoAno, ultimoMesComDado, anoParcial, serieAnualDoMunicipio, mesesDoAno, maioresCredores, extremosCompletos }
  from '../../public/js/perfil/calculos-municipio.mjs';
import { comParticipacao, agruparPequenos, nomeDaFuncao, pontosDeDestaque, rotulosEspacados } from '../../public/js/perfil/calculos-fatias.mjs';

const ano = (a, meses, orgaos = [['Prefeitura', 100, 80], ['Câmara', 20, 20]], receitas = 150) =>
  ({ ano: a, despesas: { orgaos, meses }, receitas: { total: receitas } });
const doze = valor => Array.from({ length: 12 }, (_, i) => [String(i + 1).padStart(2, '0'), valor]);

test('pago do ano soma a coluna paga de todos os órgãos', () => {
  assert.equal(pagoDoAno(ano('2024', doze(1))), 100);
  assert.equal(pagoDoAno({ ano: '2024' }), 0);
});

test('último mês com dado ignora meses zerados e o ano parcial é o que não chega a dezembro', () => {
  const parcial = ano('2026', [['01', 30], ['02', 31], ['03', 0]]);
  assert.equal(ultimoMesComDado(parcial), 2);
  assert.equal(anoParcial(parcial), true);
  assert.equal(anoParcial(ano('2025', doze(5))), false);
});

test('série anual: do ano mais antigo ao mais novo, com pago, receitas e o parcial marcado', () => {
  const serie = serieAnualDoMunicipio([ano('2026', [['01', 9]], [['P', 1, 10]], 12), ano('2025', doze(1), [['P', 1, 20]], 25), { ano: '2024' }]);
  assert.deepEqual(serie, [{ ano: '2025', pago: 20, receitas: 25, parcial: false }, { ano: '2026', pago: 10, receitas: 12, parcial: true }]);
});

test('meses do ano: doze posições, sem dado vira null e os dois últimos meses muito baixos são parciais', () => {
  const meses = mesesDoAno(ano('2026', [['01', 30], ['02', 32], ['03', 28], ['04', 31], ['05', 12], ['06', 0]]));
  assert.equal(meses.length, 12);
  assert.deepEqual(meses.slice(0, 2).map(m => [m.mes, m.v, m.parcial]), [['jan', 30, false], ['fev', 32, false]]);
  assert.deepEqual(meses[4], { mes: 'mai', v: 12, parcial: true });
  assert.deepEqual(meses[5], { mes: 'jun', v: null, parcial: false });
  assert.equal(meses[11].v, null);
});

test('ano completo nunca tem mês parcial, mesmo com dezembro baixo', () => {
  const meses = mesesDoAno(ano('2020', [...doze(20).slice(0, 11), ['12', 3]]));
  assert.equal(meses.some(m => m.parcial), false);
});

test('maiores credores: sem a própria Prefeitura nem a Câmara, do maior ao menor', () => {
  const credores = [['Prefeitura Municipal de Bayeux', '1', 90, 5], ['IPAM', '2', 60, 3], ['Câmara Municipal de Bayeux', '3', 50, 2], ['M Construções', '4', 70, 1]];
  assert.deepEqual(maioresCredores(credores, 5), [{ n: 'M Construções', v: 70, vezes: 1 }, { n: 'IPAM', v: 60, vezes: 3 }]);
  assert.equal(maioresCredores(credores, 1).length, 1);
});

test('participação de cada item no total, em ordem decrescente', () => {
  const r = comParticipacao([{ n: 'a', v: 25 }, { n: 'b', v: 75 }]);
  assert.deepEqual(r.map(i => [i.n, i.p]), [['b', 0.75], ['a', 0.25]]);
  assert.deepEqual(comParticipacao([]), []);
});

test('itens abaixo do mínimo viram "Outros (n)"; um item pequeno sozinho continua com o próprio nome', () => {
  const itens = [{ n: 'a', v: 90 }, { n: 'b', v: 5 }, { n: 'c', v: 1 }, { n: 'd', v: 1 }, { n: 'e', v: 3 }];
  assert.deepEqual(agruparPequenos(itens, 0.04), [{ n: 'a', v: 90 }, { n: 'b', v: 5 }, { n: 'Outros (3)', v: 5 }]);
  assert.deepEqual(agruparPequenos([{ n: 'a', v: 99 }, { n: 'b', v: 1 }], 0.02), [{ n: 'a', v: 99 }, { n: 'b', v: 1 }]);
});

test('nome da função corrige o erro de grafia do TCE-PB', () => {
  assert.equal(nomeDaFuncao('Assistêncial Social'), 'Assistência social');
  assert.equal(nomeDaFuncao('Saúde'), 'Saúde');
});

test('extremos da série: primeiro e último anos completos, sem o ano em andamento', () => {
  const serie = [{ ano: '2017', pago: 1, parcial: false }, { ano: '2018', pago: 2, parcial: false }, { ano: '2019', pago: 0.5, parcial: true }];
  assert.deepEqual(extremosCompletos(serie), { de: serie[0], ate: serie[1] });
  assert.equal(extremosCompletos([serie[0]]), null);
});

test('pontos de destaque: primeiro, mais alto e último, sem repetir nem contar pontos vazios', () => {
  assert.deepEqual(pontosDeDestaque([[1, 5], [2, 9], [3, 7], [4, 6]]), [0, 1, 3]);
  assert.deepEqual(pontosDeDestaque([null, [1, 9], [2, 3]]), [1, 2]);
  assert.deepEqual(pontosDeDestaque([]), []);
});

test('rótulos espaçados: mantém o último e esvazia os intermediários, sem tirar a posição', () => {
  const r = rotulosEspacados([[1, 'a'], [2, 'b'], [3, 'c'], [4, 'd']]);
  assert.deepEqual(r, [[1, ''], [2, 'b'], [3, ''], [4, 'd']]);
});
