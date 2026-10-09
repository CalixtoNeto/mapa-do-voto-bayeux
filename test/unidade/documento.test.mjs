import { test } from 'node:test';
import assert from 'node:assert/strict';
import { documentoParaCruzar, chaveDeCruzamento } from '../../scripts/lib/documento.mjs';

test('CNPJ inteiro; CPF só com os 6 dígitos centrais, venha completo (TSE) ou mascarado (TCE-PB)', () => {
  assert.equal(documentoParaCruzar('58.909.863/0001-66'), 'cnpj:58909863000166');
  assert.equal(documentoParaCruzar('12340672401'), 'cpf:406724');
  assert.equal(documentoParaCruzar('***.406.724-**'), 'cpf:406724');
  assert.equal(documentoParaCruzar(''), null);
  assert.equal(documentoParaCruzar('#NULO#'), null);
  assert.equal(documentoParaCruzar('1234'), null);
});

test('chave: empresa pelo CNPJ; pessoa física pelos dígitos centrais do CPF e o nome completo', () => {
  assert.equal(chaveDeCruzamento('cnpj:58909863000166', 'Qualquer Nome Ltda'), 'cnpj:58909863000166');
  assert.equal(chaveDeCruzamento('cpf:406724', 'Ana Paula Borges da Silva'), 'cpf:406724|ANA PAULA BORGES DA SILVA');
  assert.equal(chaveDeCruzamento(null, 'Ana Paula'), null);
});
