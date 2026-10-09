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

test('credores da prefeitura que doaram ou prestaram serviço a campanhas municipais', () => {
  const financas = { c: {
    '11|40': { doa: [['ERIKA ACIOLI GOMES PIMENTA', 'pf', 20000, 3]], fo: [['GEANCELIO DO NASCIMENTO ANDRADE', 1500], ['MUNICIPIO DE BAYEUX', 300]] },
    '13|40123': { doa: [['ERIKA ACIOLI GOMES PIMENTA', 'pf', 500]] },
    '6|4000': { doa: [['ERIKA ACIOLI GOMES PIMENTA', 'pf', 1]] },
  } };
  const campanhas = campanhasDaEleicao('2024', financas, ['11', '13'], { '11|40': 'TARCYANNA', '13|40123': 'ADRIANO' });
  const credores = [
    ['58.909.863 GEANCELIO DO NASCIMENTO ANDRADE', '58909863000166', 5200, 1],
    ['ERIKA ACIOLI GOMES PIMENTA', '12345678901', 9000, 2],
    ['BANCO DO BRASIL', '00000000000191', 100, 3],
    ['MUNICIPIO DE BAYEUX', '08928517000157', 1e8, 9],
  ];
  assert.deepEqual(credoresDasCampanhas(credores, campanhas), [
    ['ERIKA ACIOLI GOMES PIMENTA', 9000, [['2024', '11|40', 20000, 'doou', 'TARCYANNA'], ['2024', '13|40123', 500, 'doou', 'ADRIANO']]],
    ['58.909.863 GEANCELIO DO NASCIMENTO ANDRADE', 5200, [['2024', '11|40', 1500, 'recebeu', 'TARCYANNA']]],
  ]);
});
