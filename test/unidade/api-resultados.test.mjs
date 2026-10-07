import { test } from 'node:test';
import assert from 'node:assert/strict';
import { votacaoViaApi } from '../../scripts/fontes/api-resultados.mjs';
import { API } from '../../scripts/lib/tse.mjs';

const url = (eleicao, cargo) => `${API}/ele2026/${eleicao}/dados/pb/pb19372-c${cargo.padStart(4, '0')}-e000${eleicao}-u.json`;
const resultado = (and, cand) => ({ and, dg: '04/10/2026', hg: '21:00:00', carg: [{ nmn: 'Cargo', agr: [{ par: [{ sg: 'P', cand }] }] }] });
const RESPOSTAS = {
  [`${API}/comum/config/ele-c.json`]: { pl: [{ c: 'ele2026', e: [{ tp: '1', cd: '700', cdt2: '701', abr: [{ cp: [{ cd: '3' }, { cd: '7' }] }] }] }] },
  [url('700', '3')]: resultado('f', [{ n: '11', nm: 'FULANO', sqcand: '1', vap: '500' }, { n: '22', nm: 'ZERO', sqcand: '2', vap: '0' }]),
  [url('701', '3')]: resultado('p', [{ n: '11', nm: 'FULANO', sqcand: '1', vap: '600' }]),
};

function apiFalsa() {
  const pedidos = [];
  return { pedidos, buscarJson: async u => { pedidos.push(u); return RESPOSTAS[u] || null; } };
}

test('a votação pela API vem sem bairros e com o total da cidade', async () => {
  const votacao = await votacaoViaApi('2026', apiFalsa().buscarJson);
  assert.equal(votacao.semBairros, true);
  assert.deepEqual([...votacao.porTurno[1].cands.values()].map(c => [c.nr, c.total]), [['11', 500]]);
});

test('apuração parcial do 2º turno fica marcada como não final', async () => {
  const votacao = await votacaoViaApi('2026', apiFalsa().buscarJson);
  assert.equal(votacao.porTurno[1].final, true);
  assert.equal(votacao.porTurno[2].final, false);
});

test('deputado não tem 2º turno, então não é pedido', async () => {
  const { pedidos, buscarJson } = apiFalsa();
  await votacaoViaApi('2026', buscarJson);
  assert.ok(!pedidos.includes(url('701', '7')));
  assert.ok(pedidos.includes(url('700', '7')));
});

test('ano que a API não conhece não tem votação', async () => {
  assert.equal(await votacaoViaApi('2010', apiFalsa().buscarJson), null);
});
