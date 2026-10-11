import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nomeDoCredor, chaveNaEleicao, credoresDasCampanhas } from '../../scripts/perfis/cruzamentos.mjs';
import { campanhasDaEleicao, eleicaoDoMandato, eleitoNaEleicao } from '../../scripts/perfis/campanhas.mjs';

test('nome do credor sem o CNPJ do MEI na frente nem o CPF no fim', () => {
  assert.equal(nomeDoCredor('58.909.863 GEANCELIO DO NASCIMENTO ANDRADE'), 'GEANCELIO DO NASCIMENTO ANDRADE');
  assert.equal(nomeDoCredor('FABIO GOMES CORREIA 02534171470'), 'FABIO GOMES CORREIA');
  assert.equal(nomeDoCredor('José da Silva'), 'JOSE DA SILVA');
});

const T1 = { ano: '2024', cands: [
  { cargo: '11', nr: '40', nome: 'TARCYANNA MACEDO MOTA LEITÃO', total: 28090 },
  { cargo: '13', nr: '40123', nome: 'ADRIANO DA SILVA NASCIMENTO', total: 1582 },
  { cargo: '6', nr: '4000', nome: 'ADRIANO DA SILVA NASCIMENTO', total: 3 },
] };

test('vereador do SAPL ligado ao candidato do TSE pelo nome completo, só nos cargos pedidos', () => {
  assert.equal(chaveNaEleicao(T1.cands, 'Adriano da Silva Nascimento', ['13']), '13|40123');
  assert.equal(chaveNaEleicao(T1.cands, 'Fulano de Tal', ['13']), null);
});

test('quem foi eleito prefeito e em que eleição começa cada mandato', () => {
  const perfis = { c: { '11|40': { s: 'ELEITO' }, '11|15': { s: 'NÃO ELEITO' } } };
  assert.deepEqual(eleitoNaEleicao(T1, perfis, '11'), { nome: 'TARCYANNA MACEDO MOTA LEITÃO', chave: '11|40', ano: '2024', votos: 28090 });
  assert.equal(eleicaoDoMandato(2025), '2024');
  assert.equal(eleicaoDoMandato(2024), '2020');
  assert.equal(eleicaoDoMandato(2017), '2016');
});

test('credores ligados a campanhas pelo documento: empresa pelo CNPJ, pessoa física pelos dígitos centrais do CPF e o nome', () => {
  const financas = { c: {
    '11|40': { doa: [['ERIKA ACIOLI GOMES PIMENTA', 'pf', 20000, 3], ['JOSE DA SILVA', 'pf', 700]], doaK: ['cpf:406724', 'cpf:111111'],
      fo: [['GRAFICA BOA LTDA', 1500], ['MUNICIPIO DE BAYEUX', 300]], foK: ['cnpj:58909863000166', 'cnpj:08928517000157'] },
    '13|40123': { doa: [['ERIKA ACIOLI GOMES PIMENTA', 'pf', 500]], doaK: ['cpf:406724'] },
    '6|4000': { doa: [['ERIKA ACIOLI GOMES PIMENTA', 'pf', 1]], doaK: ['cpf:406724'] },
  } };
  const campanhas = campanhasDaEleicao('2024', financas, ['11', '13'], { '11|40': 'TARCYANNA', '13|40123': 'ADRIANO' });
  const credores = [
    ['58.909.863 GRAFICA BOA', '58909863000166', 5200, 1],
    ['ERIKA ACIOLI GOMES PIMENTA', '***.406.724-**', 9000, 2],
    ['JOSE DA SILVA', '***.222.222-**', 800, 1],
    ['MUNICIPIO DE BAYEUX', '08928517000157', 1e8, 9],
  ];
  assert.deepEqual(credoresDasCampanhas(credores, campanhas), [
    ['ERIKA ACIOLI GOMES PIMENTA', 9000, [['2024', '11|40', 20000, 'doou', 'TARCYANNA'], ['2024', '13|40123', 500, 'doou', 'ADRIANO']]],
    ['58.909.863 GRAFICA BOA', 5200, [['2024', '11|40', 1500, 'recebeu', 'TARCYANNA']]],
  ], 'o homônimo com outro CPF e o próprio município ficam de fora; a empresa entra pelo CNPJ mesmo com outro nome');
});

test('sem documento de um dos lados não há ligação, mesmo com o nome igual', () => {
  const campanhas = [{ ano: '2024', chave: '13|40123', nome: 'ADRIANO', doadores: [['JOSE DA SILVA SANTOS', 300, null]], fornecedores: [] }];
  assert.deepEqual(credoresDasCampanhas([['JOSE DA SILVA SANTOS', '***.406.724-**', 800, 1]], campanhas), []);
  const comDoc = [{ ...campanhas[0], doadores: [['JOSE DA SILVA SANTOS', 300, 'cpf:406724']] }];
  assert.deepEqual(credoresDasCampanhas([['JOSE DA SILVA SANTOS', '', 800, 1]], comDoc), []);
});

test('bancos, Correios e concessionárias de serviço público e ligações de valor zero não entram', () => {
  const campanhas = [{ ano: '2022', chave: '7', nome: 'FULANA', doadores: [], fornecedores: [
    ['BANCO DO BRASIL SA DIRECAO GERAL', 38, 'cnpj:00000000000191'], ['ENERGISA PARAIBA', 10, 'cnpj:09095183000140'],
    ['GRAFICA BOA LTDA', 0, 'cnpj:58909863000166'], ['GRAFICA OUTRA LTDA', 900, 'cnpj:11111111000111']] }];
  const credores = [['BANCO DO BRASIL SA DIRECAO GERAL', '00000000000191', 7e7, 9], ['ENERGISA PARAIBA', '09095183000140', 5e6, 9],
    ['GRAFICA BOA LTDA', '58909863000166', 100, 1], ['GRAFICA OUTRA LTDA', '11111111000111', 200, 1]];
  assert.deepEqual(credoresDasCampanhas(credores, campanhas).map(c => c[0]), ['GRAFICA OUTRA LTDA']);
});
