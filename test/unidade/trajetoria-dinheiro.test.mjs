import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registrarDinheiro } from '../../scripts/analises/trajetoria-dinheiro.mjs';
import { patrimonioRecorrente } from '../../scripts/analises/patrimonio.mjs';
import { chaveNoSite } from '../../scripts/analises/escopo.mjs';

const cand = (sq, nome, total, cargo = '6') => ({ key: `2022|1|${cargo}|${sq}`, cargo, nr: sq, nome, total });
const porChave = (candidato, f) => ({ [chaveNoSite(candidato)]: f });

test('liga o dinheiro de cada eleição à pessoa pelo nome: cargo, recebido, gasto e votos', () => {
  const dinheiro = {};
  const joao2018 = cand('1', 'João da Silva', 1000, '7'), joao2022 = cand('7', 'JOÃO DA SILVA', 3000);
  registrarDinheiro(dinheiro, '2018', [joao2018], porChave(joao2018, { r: { fefc: 500, pf: 100 }, d: 550 }));
  registrarDinheiro(dinheiro, '2022', [joao2022, cand('8', 'Sem Contas', 10)], porChave(joao2022, { r: { fefc: 900 }, d: 800 }));
  assert.deepEqual(patrimonioRecorrente(dinheiro), { 'JOAO DA SILVA': [['2018', '7', 600, 550, 1000], ['2022', '6', 900, 800, 3000]] });
});
