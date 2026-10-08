// Cálculos da ficha do candidato (public/js/calculos-candidato.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  quocienteEleitoral, puxadorDeVotos, forcaPorLugar, eleitoradoDosVotos, redeDoCandidato, ritmoDaArrecadacao,
  evolucaoPatrimonial, dividaDeCampanha, dependencia,
} from '../../public/js/calculos.mjs';

const c = (key, partido, total, eleito = false) => ({ key, partido, total, eleito });
const eleito = x => x.eleito;
const cands = [c('a', 'X', 600, true), c('b', 'X', 300), c('d', 'Y', 400, true), c('e', 'Y', 50)];

test('quociente eleitoral: válidos (nominais e legenda) divididos pelas vagas, que são os eleitos', () => {
  assert.deepEqual(quocienteEleitoral(cands, eleito, 250), { vagas: 2, quociente: 800, comLegenda: true });
  assert.equal(quocienteEleitoral(cands.map(x => ({ ...x, eleito: false })), eleito), null);
});

test('puxador de votos: parcela e posição no partido, eleito com menos votos e não eleito com mais', () => {
  assert.deepEqual(puxadorDeVotos(cands[1], cands, eleito), {
    parcelaNoPartido: 300 / 900, posicaoNoPartido: 2, noPartido: 2, ultimoEleito: 400, primeiroNaoEleito: 300,
  });
});

test('onde é mais forte: parcela no lugar dividida pela parcela geral, só acima de 1 e com votos suficientes', () => {
  const votos = { p: 50, q: 10, r: 1 }, tot = { p: 100, q: 100, r: 1 };
  const forca = forcaPorLugar(votos, tot, { minimo: 5 });
  assert.deepEqual(forca.map(f => [f.lugar, f.parcela, +f.indice.toFixed(3)]), [['p', 0.5, 1.648]]);
});

test('eleitorado dos votos: média ponderada pelos votos, comparada com a de todos os eleitores', () => {
  const eleitorado = { p: [100, 60, 10, 20, 30, 10], q: [100, 40, 30, 10, 10, 50] };
  const [mulheres] = eleitoradoDosVotos({ p: 30, q: 10 }, eleitorado);
  assert.deepEqual([mulheres.id, mulheres.dosVotos, mulheres.geral], ['mulheres', 0.55, 0.5]);
});

test('rede: com quem o candidato divide doadores ou fornecedores', () => {
  const global = [{ n: 'D', v: 30, c: [['k1', 20], ['k2', 10]] }];
  const porChave = new Map([['k1', { key: 'a' }], ['k2', { key: 'b' }]]);
  assert.deepEqual(redeDoCandidato([['D', 'pf', 20, 0], ['SO', 'pf', 5]], global, 'k1', porChave),
    [{ n: 'D', v: 20, outros: [{ cand: { key: 'b' }, v: 10 }] }]);
});

test('ritmo: acumulado por semana e a semana em que chegou metade do dinheiro', () => {
  const r = ritmoDaArrecadacao([['2022-08-15', 100], ['2022-08-22', 300], ['2022-08-29', 100]]);
  assert.deepEqual(r.semanas.map(s => s.acumulado), [0.2, 0.8, 1]);
  assert.equal(r.metade, '2022-08-22');
});

test('evolução patrimonial: variação entre declarações, no total e ao ano', () => {
  const e = evolucaoPatrimonial([['2022', 400], ['2018', 100]]);
  assert.deepEqual(e.pontos.map(p => [p.ano, p.v, p.variacao]), [['2018', 100, null], ['2022', 400, 3]]);
  assert.equal(e.total, 3);
  assert.equal(+e.aoAno.toFixed(4), +(Math.pow(4, 1 / 4) - 1).toFixed(4));
});

test('dívida de campanha só quando há despesas pagas no arquivo', () => {
  assert.equal(dividaDeCampanha({ d: 1000, pg: 600 }), 400);
  assert.equal(dividaDeCampanha({ d: 1000 }), null);
});

test('dependência: maior doador e recursos próprios em relação ao recebido e aos bens', () => {
  assert.deepEqual(dependencia({ r: { prop: 50, pf: 150 }, doa: [['A', 'pf', 100]] }, { b: 500 }, 200),
    { maiorDoador: 0.5, proprios: 0.25, propriosSobreBens: 0.1 });
});
