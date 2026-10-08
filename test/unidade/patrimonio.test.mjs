import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registrarPatrimonio, patrimonioRecorrente } from '../../scripts/analises/patrimonio.mjs';
import { entradaDasAnalises } from '../../scripts/saida/analises.mjs';

const cand = (cargo, nr, nome) => ({ key: `x|1|${cargo}|${nr}`, cargo, nr, nome });

test('liga os bens de cada eleição à pessoa pelo nome, com a chave cargo|número', () => {
  const patrimonio = {};
  registrarPatrimonio(patrimonio, '2020', [cand('13', '12345', 'Maria de Bayeux')], { '13|12345': { b: 1000 } });
  registrarPatrimonio(patrimonio, '2024', [cand('13', '12000', 'MARIA DE BAYEUX')], { '13|12000': { b: 3000 } });
  assert.deepEqual(patrimonioRecorrente(patrimonio), { 'MARIA DE BAYEUX': [['2020', 1000], ['2024', 3000]] });
});

test('o índice das análises diz o que existe de cada ano', () => {
  assert.deepEqual(entradaDasAnalises(['2024-candidatos.json', '2024-t1-comparecimento.json', '2024-t1.json']),
    { 2024: { candidatos: true, comparecimento: ['1'] } });
});
