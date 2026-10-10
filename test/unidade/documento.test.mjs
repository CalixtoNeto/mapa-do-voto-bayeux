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

test('nome de credor sem o CPF que o TCE-PB cola no fim (e sem o CNPJ do MEI na frente)', async () => {
  const { nomeSemDocumento } = await import('../../scripts/lib/documento.mjs');
  assert.equal(nomeSemDocumento('DAVID DA COSTA SILVA 03481481438'), 'DAVID DA COSTA SILVA');
  assert.equal(nomeSemDocumento('59.690.138 MICHELI AMORIM FIGUEIREDO'), 'MICHELI AMORIM FIGUEIREDO');
  assert.equal(nomeSemDocumento('83TELECOM SERVICOS LTDA'), '83TELECOM SERVICOS LTDA');
  assert.equal(nomeSemDocumento('FULANO 034.814.814-38'), 'FULANO');
});
