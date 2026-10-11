import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reaisDoTce, leitorDoTce } from '../../scripts/fontes/tce-pb.mjs';
import { novasDespesas, somarDespesa, resumoDasDespesas } from '../../scripts/perfis/despesas.mjs';
import { novaFolha, somarServidor, resumoDaFolha, remuneracaoDe, arvoreDaFolha } from '../../scripts/perfis/folha.mjs';
import { novasReceitas, somarReceita, resumoDasReceitas } from '../../scripts/perfis/receitas.mjs';
import { novasLicitacoes, somarProposta, resumoDasLicitacoes, arvoreDasLicitacoes } from '../../scripts/perfis/licitacoes.mjs';

// Cabeçalhos e linhas como vêm nos arquivos do Sagres (sondados em outubro de 2026), só com as colunas usadas.
const DESPESAS = 'municipio;descricao_unidade_gestora;mes;cpf_cnpj;nome_credor;valor_empenhado;valor_pago;funcao;elemento_despesa;modalidade_licitacao';
const SERVIDORES = 'nome_municipio;descricao_unidade_gestora;cpf_cnpj;nome_servidor;tipo_cargo;descricao_cargo;valor_vantagem;ano_mes';
const RECEITAS = 'municipio;descricao_unidade_gestora;mes_ano;descricao_receita;tipo_atualizacao_receita;valor;descricao_co';
const LICITACOES = 'nome_municipio;descricao_unidade_gestora;numero_licitacao;modalidade;objeto_licitacao;nome_proponente;cpf_cnpj_proponente;valor_ofertado;situacao_proposta';

function ler(cabecalho, linhas, acumulador, somar) {
  const aoLinha = leitorDoTce(registro => somar(acumulador, registro));
  aoLinha('﻿' + cabecalho, true);
  linhas.forEach(l => aoLinha(l, false));
  return acumulador;
}

test('valores do TCE-PB: ponto é sempre milhar, vírgula é decimal', () => {
  assert.equal(reaisDoTce('2.100'), 2100);
  assert.equal(reaisDoTce('1.130.654,4'), 1130654.4);
  assert.equal(reaisDoTce('5,8'), 5.8);
  assert.equal(reaisDoTce(''), 0);
});

test('despesas: por órgão, área, mês, credor e quanto das compras foi sem licitação', () => {
  const despesas = ler(DESPESAS, [
    'Bayeux;Câmara Municipal de Bayeux;01-Janeiro;50320908000150;NATHALI ROLIM SOCIEDADE INDIVIDUAL DE ADVOCACIA;8.000;8.000;Legislativa;Serviços de Consultoria;Sem Licitação',
    'Bayeux;Prefeitura Municipal de Bayeux;02-Fevereiro;07553129000176;PUBLIC SOFTWARE INFORMATICA LTDA - ME;10.000;6.000,5;Administração;Locação;Pregão',
    'Bayeux;Prefeitura Municipal de Bayeux;02-Fevereiro;07553129000176;PUBLIC SOFTWARE INFORMATICA LTDA - ME;1.000;1.000;Administração;Locação;Pregão',
    'Bayeux;Câmara Municipal de Bayeux;02-Fevereiro;00000000000191;INSS;500;500;Legislativa;Obrigações Patronais;Sem Licitação',
  ], novasDespesas(), somarDespesa);
  const r = resumoDasDespesas(despesas);
  assert.deepEqual(r.orgaos, [['Câmara Municipal de Bayeux', 8500, 8500], ['Prefeitura Municipal de Bayeux', 11000, 7000.5]]);
  assert.deepEqual(r.funcoes, [['Legislativa', 8500], ['Administração', 7000.5]]);
  assert.deepEqual(r.meses, [['01', 8000], ['02', 7500.5]]);
  assert.deepEqual(r.credores[0], ['NATHALI ROLIM SOCIEDADE INDIVIDUAL DE ADVOCACIA', '50320908000150', 8000, 1]);
  assert.deepEqual(r.credores[1], ['PUBLIC SOFTWARE INFORMATICA LTDA - ME', '07553129000176', 7000.5, 2]);
  assert.equal(r.compras, 15000.5);
  assert.equal(r.semLicitacao, 8000, 'a contribuição patronal não é compra e não entra no sem licitação');
  assert.deepEqual(r.camara, { pago: 8500, compras: 8000, semLicitacao: 8000,
    credores: [['NATHALI ROLIM SOCIEDADE INDIVIDUAL DE ADVOCACIA', '50320908000150', 8000, 1], ['INSS', '00000000000191', 500, 1]],
    elementos: [['Serviços de Consultoria', 8000], ['Obrigações Patronais', 500]],
    arvore: { v: 8500, filhos: [['Serviços de Consultoria', 8000, [['NATHALI ROLIM SOCIEDADE INDIVIDUAL DE ADVOCACIA', 8000]]], ['Obrigações Patronais', 500, [['INSS', 500]]]] } });
});

test('folha: pessoas no último mês e total do ano por órgão e tipo de cargo; remuneração de uma pessoa pelo nome', () => {
  const folha = ler(SERVIDORES, [
    'Bayeux;Câmara Municipal de Bayeux;***.406.724-**;ANA PAULA BORGES DA SILVA;Cargo Comissionado;00001002 - ASSESSOR TECNICO PARLAMENTAR;2.000;202501',
    'Bayeux;Câmara Municipal de Bayeux;***.406.724-**;ANA PAULA BORGES DA SILVA;Cargo Comissionado;00001002 - ASSESSOR TECNICO PARLAMENTAR;2.000;202502',
    'Bayeux;Câmara Municipal de Bayeux;***.375.574-**;CLAUDIA MARIA JUSTINO DE ARAUJO;Efetivos;00000001 - AUXILIAR ADMINISTRATIVO;3.822,35;202502',
    'Bayeux;Prefeitura Municipal de Bayeux;***.111.111-**;JOSÉ DA SILVA;Efetivos;00000002 - PROFESSOR;3.000;202502',
  ], novaFolha(), somarServidor);
  const r = resumoDaFolha(folha);
  assert.deepEqual(r.orgaos, [['Câmara Municipal de Bayeux', 2, 7822.35], ['Prefeitura Municipal de Bayeux', 1, 3000]]);
  assert.deepEqual(r.tipos, [['Efetivos', 2, 6822.35], ['Cargo Comissionado', 1, 4000]]);
  assert.deepEqual(r.meses, [['202501', 1, 2000], ['202502', 3, 8822.35]]);
  assert.deepEqual(r.tiposPorMes, { 'Cargo Comissionado': [['202501', 1], ['202502', 1]], Efetivos: [['202502', 2]] });
  assert.deepEqual(remuneracaoDe(folha, 'Ana Paula Borges da Silva'),
    [['202501', 2000, 'ASSESSOR TECNICO PARLAMENTAR', 'Câmara Municipal de Bayeux'], ['202502', 2000, 'ASSESSOR TECNICO PARLAMENTAR', 'Câmara Municipal de Bayeux']]);
  assert.deepEqual(remuneracaoDe(folha, 'Ninguém'), []);
  assert.deepEqual(arvoreDaFolha(folha), { v: 10822.35, filhos: [
    ['Efetivos', 6822.35, [['Câmara Municipal de Bayeux', 3822.35], ['Prefeitura Municipal de Bayeux', 3000]]],
    ['Cargo Comissionado', 4000, [['Câmara Municipal de Bayeux', 4000]]]] }, 'tipo de cargo → órgão');
});

test('receitas: total lançado e o que veio de emendas parlamentares, por origem', () => {
  const receitas = ler(RECEITAS, [
    'Bayeux;Prefeitura Municipal de Bayeux;072025;Outras Transferências dos Estados;Lançamento de Receita;850.000;Identificação das Transferências dos Estados decorrentes de emendas parlamentares individuais',
    'Bayeux;Prefeitura Municipal de Bayeux;122025;Bloco de Estruturação;Lançamento de Receita;479.851;Identificação das Transferências da União decorrentes de emendas parlamentares de comissão',
    'Bayeux;Prefeitura Municipal de Bayeux;122025;Outras Receitas;Lançamento de Receita;3.703,97;Não Aplicável',
    'Bayeux;Prefeitura Municipal de Bayeux;122025;Outras Receitas;Previsão Inicial da Receita;99.999;Não Aplicável',
  ], novasReceitas(), somarReceita);
  assert.deepEqual(resumoDasReceitas(receitas), { total: 1333554.97, emendas: 1329851,
    origensDasEmendas: [['Estado · individuais', 850000], ['União · de comissão', 479851]] });
});

test('licitações: quantas por modalidade, valor das vencedoras e quem mais ganhou', () => {
  const licitacoes = ler(LICITACOES, [
    'Bayeux;Prefeitura Municipal de Bayeux;00003/2025;Credenciamento (Lei Nº 14.133/2021);PASSAGENS;Condor Turismo;02964393000189;133.333,33;Vencedora',
    'Bayeux;Prefeitura Municipal de Bayeux;00003/2025;Credenciamento (Lei Nº 14.133/2021);PASSAGENS;HP VIAGENS;07297097000195;133.333,33;Vencedora',
    'Bayeux;Prefeitura Municipal de Bayeux;00019/2025;Pregão (Lei Nº 14.133/2021);AMBULÂNCIAS;FIORI VEICULO LTDA;35715234000876;308.382,9;Vencedora',
    'Bayeux;Prefeitura Municipal de Bayeux;00019/2025;Pregão (Lei Nº 14.133/2021);AMBULÂNCIAS;OUTRA LTDA;11111111000111;350.000;Desclassificada',
  ], novasLicitacoes(), somarProposta);
  const r = resumoDasLicitacoes(licitacoes);
  assert.deepEqual(r.modalidades, [['Pregão', 1, 308382.9], ['Credenciamento', 1, 266666.66]]);
  assert.deepEqual(r.vencedores[0], ['FIORI VEICULO LTDA', '35715234000876', 308382.9, 1]);
  assert.deepEqual(arvoreDasLicitacoes(licitacoes), { v: 575049.56, filhos: [
    ['Pregão', 308382.9, [['FIORI VEICULO LTDA', 308382.9]]],
    ['Credenciamento', 266666.66, [['Condor Turismo', 133333.33], ['HP VIAGENS', 133333.33]]]] }, 'modalidade → vencedor');
});
