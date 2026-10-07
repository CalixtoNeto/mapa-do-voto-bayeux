import { test } from 'node:test';
import assert from 'node:assert/strict';
import { novaApuracao, somarVotoNoLocal, somarVotoEspecial } from '../../scripts/eleicao/apuracao.mjs';

const maria = { key: '2024|1|13|12345', ano: '2024', turno: '1', cargo: '13', nr: '12345' };
const jose = { key: '2024|1|13|45678', ano: '2024', turno: '1', cargo: '13', nr: '45678' };

test('soma os votos do candidato por local de votação e no total', () => {
  const apuracao = novaApuracao();
  somarVotoNoLocal(apuracao, maria, 0, 40);
  somarVotoNoLocal(apuracao, maria, 0, 10);
  somarVotoNoLocal(apuracao, maria, 3, 5);
  assert.equal(apuracao.cands.get(maria.key).total, 55);
  assert.deepEqual(apuracao.cands.get(maria.key).loc, { 0: 50, 3: 5 });
});

test('o total do cargo em cada local soma todos os candidatos', () => {
  const apuracao = novaApuracao();
  somarVotoNoLocal(apuracao, maria, 0, 40);
  somarVotoNoLocal(apuracao, jose, 0, 20);
  assert.deepEqual(apuracao.tot['2024|1|13'], { 0: 60 });
});

test('95 é branco, 96 é nulo e o resto é voto de legenda', () => {
  const apuracao = novaApuracao();
  somarVotoEspecial(apuracao, '2024|1|13', '95', 8);
  somarVotoEspecial(apuracao, '2024|1|13', '96', 9);
  somarVotoEspecial(apuracao, '2024|1|13', '12', 7);
  somarVotoEspecial(apuracao, '2024|1|13', '12', 1);
  assert.deepEqual(apuracao.esp['2024|1|13'], { branco: 8, nulo: 9, legenda: 8 });
});
