import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registrarPessoas, pessoasRecorrentes } from '../../scripts/saida/pessoas.mjs';
import { resumoDoTurno } from '../../scripts/saida/escrever.mjs';
import { novaApuracao, somarVotoNoLocal } from '../../scripts/eleicao/apuracao.mjs';
import { normalizarNome } from '../../scripts/lib/texto.mjs';

test('nomes iguais com e sem acento são a mesma pessoa', () => {
  assert.equal(normalizarNome('José da Silva-Júnior'), 'JOSE DA SILVA JUNIOR');
});

test('registra parcela e posição de cada candidato dentro do cargo', () => {
  const pessoas = {};
  registrarPessoas(pessoas, { ano: '2024', turno: '1', cands: [
    { cargo: '13', nr: '45678', nome: 'José', total: 25 },
    { cargo: '13', nr: '12345', nome: 'Maria', total: 75 },
  ] });
  assert.deepEqual(pessoas.MARIA, [['2024', '1', '13', '12345', 75, 0.75, 1]]);
  assert.deepEqual(pessoas.JOSE, [['2024', '1', '13', '45678', 25, 0.25, 2]]);
});

test('só quem disputou duas eleições ou mais entra em pessoas.json', () => {
  assert.deepEqual(Object.keys(pessoasRecorrentes({ A: [1, 2], B: [1] })), ['A']);
});

test('o resumo do CSV é final, usa a hora da geração e leva os partidos do ano', () => {
  const apuracao = novaApuracao();
  somarVotoNoLocal(apuracao, { key: 'a', ano: '2024', turno: '1', cargo: '13', cargoNome: 'Vereador', nr: '12345' }, 0, 9);
  const votacao = { fonte: 'csv', semBairros: false, partidos: { 2024: { 12: 'PARTIDO' } } };
  const resumo = resumoDoTurno('2024', '1', votacao, apuracao, new Date('2026-10-05T12:00:00Z'));
  assert.equal(resumo.final, true);
  assert.equal(resumo.atualizadoEm, '2026-10-05T12:00:00.000Z');
  assert.equal(resumo.municipio, '19372');
  assert.deepEqual(resumo.partidos, { 2024: { 12: 'PARTIDO' } });
  assert.deepEqual(resumo.cargos, [{ cd: '13', nome: 'Vereador' }]);
});
