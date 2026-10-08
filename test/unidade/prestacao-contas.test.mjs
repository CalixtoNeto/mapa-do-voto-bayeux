import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leitorDeReceitas, leitorDeDespesas, leitorDeDespesasPagas } from '../../scripts/fontes/prestacao-contas.mjs';
import { novasFinancas, resumoDasFinancas } from '../../scripts/analises/financas.mjs';

const ID = ['ANO_ELEICAO', 'SG_UF', 'SG_UE', 'CD_CARGO', 'SQ_CANDIDATO', 'NR_CANDIDATO'];
const RECEITA = [...ID, 'DS_FONTE_RECEITA', 'DS_ORIGEM_RECEITA', 'NR_CPF_CNPJ_DOADOR', 'NM_DOADOR', 'NM_DOADOR_RFB', 'VR_RECEITA'];
const DESPESA = [...ID, 'DS_ORIGEM_DESPESA', 'NR_CPF_CNPJ_FORNECEDOR', 'NM_FORNECEDOR', 'NM_FORNECEDOR_RFB', 'VR_DESPESA_CONTRATADA'];
const linha = campos => campos.map(c => `"${c}"`).join(';');
const vereador = (ue = '19372') => ['2024', 'PB', ue, '13', '150', '12345'];
const ID_DO_TESTE = vereador(), CHAVE_DO_TESTE = '13|12345';

function ler(leitor, cabecalho, linhas) {
  const financas = novasFinancas(), aoLinha = leitor({ ano: '2024', financas });
  aoLinha(linha(cabecalho), true);
  linhas.forEach(l => aoLinha(linha(l), false));
  return resumoDasFinancas(financas, '2024', new Date('2026-01-01'));
}

test('receitas do vereador de Bayeux, identificado por cargo e número', () => {
  const r = ler(leitorDeReceitas, RECEITA, [
    [...vereador(), 'Fundo Especial', 'Recursos de partido político', '11', 'PARTIDO X', '#NULO#', '5000,00'],
    [...vereador(), 'Outros Recursos', 'Recursos de pessoas físicas', '222', 'ZE', 'JOSE DA SILVA', '300,00'],
  ]);
  assert.deepEqual(r.c['13|12345'].r, { fefc: 5000, pf: 300 });
  assert.deepEqual(r.doadores, [{ n: 'JOSE DA SILVA', t: 'pf', v: 300, c: [['13|12345', 300]] }]);
});

test('fica de fora quem é de outro município e quem disputa cargo estadual', () => {
  const r = ler(leitorDeReceitas, RECEITA, [
    [...vereador('20516'), 'Fundo Especial', 'Recursos de partido político', '1', 'P', 'P', '10,00'],
    ['2022', 'PB', 'PB', '6', '9', '1234', 'Fundo Especial', 'Recursos de partido político', '1', 'P', 'P', '10,00'],
  ]);
  assert.deepEqual(r.c, {});
});

test('despesas contratadas, separando os repasses', () => {
  const r = ler(leitorDeDespesas, DESPESA, [
    [...vereador(), 'Publicidade por materiais impressos', '33', 'GRAF', 'GRAFICA LTDA', '700,00'],
    [...vereador(), 'Doações financeiras a outros candidatos/partidos', '44', 'FULANO', '#NULO#', '300,00'],
  ]);
  assert.deepEqual(r.c['13|12345'], { r: {}, d: 700, rep: 300, dc: [['Publicidade por materiais impressos', 700]], fo: [['GRAFICA LTDA', 700, 0]], nf: 1 });
});

test('despesas pagas, sem os repasses a outras campanhas', () => {
  const PAGA = [...ID, 'DS_ORIGEM_DESPESA', 'VR_PAGTO_DESPESA'];
  const r = ler(leitorDeDespesasPagas, PAGA, [
    [...ID_DO_TESTE, 'Publicidade por materiais impressos', '650,00'],
    [...ID_DO_TESTE, 'Doações financeiras a outros candidatos/partidos', '300,00'],
  ]);
  assert.equal(r.c[CHAVE_DO_TESTE].pg, 650);
});

test('a data da receita entra no ritmo da arrecadação', () => {
  const r = ler(leitorDeReceitas, [...RECEITA, 'DT_RECEITA'], [
    [...ID_DO_TESTE, 'Fundo Especial', 'Recursos de partido político', '11', 'P', '#NULO#', '500,00', '20/09/2024'],
  ]);
  assert.deepEqual(r.c[CHAVE_DO_TESTE].rs, [['2024-09-16', 500]]);
});
