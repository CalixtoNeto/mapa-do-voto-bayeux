import { test } from 'node:test';
import assert from 'node:assert/strict';
import { novaArvore, somarNaArvore, arvorePodada } from '../../scripts/perfis/arvores.mjs';
import { origemDaEmenda } from '../../scripts/perfis/receitas.mjs';
import { novosAlertas, somarParaAlertas, alertasDoAno, limiteDeDispensa } from '../../scripts/perfis/alertas.mjs';

test('árvore: soma em cada nível e mostra os maiores, juntando o resto em "Outros"', () => {
  const raiz = novaArvore();
  somarNaArvore(raiz, ['Saúde', 'Material de consumo', 'FARMACIA A'], 100);
  somarNaArvore(raiz, ['Saúde', 'Material de consumo', 'FARMACIA B'], 50);
  somarNaArvore(raiz, ['Saúde', 'Material de consumo', 'FARMACIA C'], 10);
  somarNaArvore(raiz, ['Educação', '', 'ESCOLA'], 30);
  somarNaArvore(raiz, ['Educação', 'Zero', 'NINGUEM'], 0);
  assert.deepEqual(arvorePodada(raiz, 2), { v: 190, filhos: [
    ['Saúde', 160, [['Material de consumo', 160, [['FARMACIA A', 100], ['FARMACIA B', 50], ['Outros (1)', 10]]]]],
    ['Educação', 30, [['Não informado', 30, [['ESCOLA', 30]]]]],
  ] });
});

test('origem da emenda pela descrição do código de controle, pelo código ou pela transferência especial', () => {
  assert.equal(origemDaEmenda('Identificação das Transferências da União decorrentes de emendas parlamentares de bancada'), 'União · de bancada');
  assert.equal(origemDaEmenda('', '3130'), 'União · de comissão');
  assert.equal(origemDaEmenda('', '3210'), 'Estado · individuais');
  assert.equal(origemDaEmenda('Não Aplicável', '', 'Transferência Especial da União'), 'União · transferência especial');
  assert.equal(origemDaEmenda('Não Aplicável', '', 'Recursos não vinculados de Impostos'), null);
});

// ler(coluna) a partir de um objeto com as colunas que importam.
const linha = campos => nome => campos[nome] ?? '';
const despesa = (credor, sub, valor, mes, modalidade = 'Sem Licitação', elemento = 'Material de Consumo') =>
  ({ ler: linha({ NOME_CREDOR: credor, ELEMENTO_DESPESA: elemento, CODIGO_SUBELEMENTO_EXIBICAO: sub, MES: mes, MODALIDADE_LICITACAO: modalidade }), pago: valor });

function alertas(despesas, ano = '2025') {
  const acc = novosAlertas();
  despesas.forEach(d => somarParaAlertas(acc, d.ler, d.pago));
  return alertasDoAno(acc, ano);
}

test('limite de dispensa por valor da Lei 14.133 no ano (compras e obras); antes de 2024, sem limite comparável', () => {
  assert.deepEqual(limiteDeDispensa('2025', 'MATERIAL DE CONSUMO'), 62725.59);
  assert.deepEqual(limiteDeDispensa('2024', 'OBRAS E INSTALAÇÕES'), 119812.02);
  assert.equal(limiteDeDispensa('2026', 'MATERIAL DE CONSUMO'), 65492.11);
  assert.equal(limiteDeDispensa('2026', 'MANUTENÇÃO E CONSERVAÇÃO DE VEÍCULOS'), 130984.2);
  assert.equal(limiteDeDispensa('2022', 'MATERIAL DE CONSUMO'), null);
});

test('alerta quando um fornecedor recebe, sem licitação ou por dispensa, mais que o limite de dispensa no mesmo objeto', () => {
  const r = alertas([
    despesa('POSTO X', 'COMBUSTÍVEIS', 40000, '01-Janeiro'), despesa('POSTO X', 'COMBUSTÍVEIS', 30000, '02-Fevereiro', 'Dispensa'),
    despesa('POSTO X', 'COMBUSTÍVEIS', 10000, '03-Março'),
    despesa('ENERGISA', 'SERVIÇOS DE ENERGIA ELÉTRICA', 900000, '01-Janeiro', 'Sem Licitação', 'Outros Serviços de Terceiros - Pessoa Jurídica'),
    despesa('ENERGISA', 'SERVIÇOS DE ENERGIA ELÉTRICA', 900000, '02-Fevereiro', 'Sem Licitação', 'Outros Serviços de Terceiros - Pessoa Jurídica'),
    despesa('CAGEPA', 'OUTROS SERVIÇOS DE TERCEIROS, PESSOA JURÍDICA', 210000, '01-Janeiro', 'Sem Licitação', 'Outros Serviços de Terceiros - Pessoa Jurídica'),
    despesa('CAGEPA', 'OUTROS SERVIÇOS DE TERCEIROS, PESSOA JURÍDICA', 210000, '02-Fevereiro', 'Sem Licitação', 'Outros Serviços de Terceiros - Pessoa Jurídica'),
    despesa('ENERGISA', 'OUTROS SERVIÇOS DE TERCEIROS, PESSOA JURÍDICA', 140000, '01-Janeiro', 'Sem Licitação', 'Outros Serviços de Terceiros - Pessoa Jurídica'),
    despesa('EMPRESA PARAIBANA DE COMUNICAÇÃO S.A - EPC', 'OUTROS SERVIÇOS DE TERCEIROS, PESSOA JURÍDICA', 200000, '01-Janeiro', 'Sem Licitação', 'Outros Serviços de Terceiros - Pessoa Jurídica'),
    despesa('EMPRESA PARAIBANA DE COMUNICAÇÃO S.A - EPC', 'OUTROS SERVIÇOS DE TERCEIROS, PESSOA JURÍDICA', 200000, '02-Fevereiro', 'Sem Licitação', 'Outros Serviços de Terceiros - Pessoa Jurídica'),
    despesa('LOJA Y', 'MATERIAL DE EXPEDIENTE', 61000, '01-Janeiro'),
    despesa('LOJA Z', 'MATERIAL DE EXPEDIENTE', 90000, '01-Janeiro', 'Pregão'),
  ]);
  assert.deepEqual(r.filter(a => a[0] === 'fracionamento'), [['fracionamento', 'POSTO X', 'COMBUSTÍVEIS', 80000, 3, 62725.59]]);
});

test('alerta de pico: um mês com mais de 3 vezes a mediana mensal do mesmo tipo de despesa', () => {
  const meses = ['01', '02', '03', '04', '05', '06', '07'].map(m => despesa('GRAFICA', 'IMPRESSOS', 100000, `${m}-Mes`, 'Pregão'));
  meses.push(despesa('GRAFICA', 'IMPRESSOS', 400000, '08-Agosto', 'Pregão'));
  const picos = alertas(meses).filter(a => a[0] === 'pico');
  assert.deepEqual(picos, [['pico', 'Material de Consumo', '08', 400000, 100000]]);
});

test('alerta de concentração: um fornecedor com a maior parte de um tipo de despesa grande', () => {
  const r = alertas([despesa('LOCADORA', 'LOCAÇÃO', 1600000, '01-Janeiro', 'Pregão', 'Locação de Mão-de-Obra'),
    despesa('OUTRA', 'LOCAÇÃO', 400000, '02-Fevereiro', 'Pregão', 'Locação de Mão-de-Obra')]);
  assert.deepEqual(r.filter(a => a[0] === 'concentracao'), [['concentracao', 'Locação de Mão-de-Obra', 'LOCADORA', 1600000, 2000000]]);
});

test('despesas do ano: árvores por área, secretaria, fonte e emendas, e o gasto em compras por tipo', async () => {
  const { leitorDoTce } = await import('../../scripts/fontes/tce-pb.mjs');
  const { novasDespesas, somarDespesa, resumoDasDespesas, arvoresDasDespesas } = await import('../../scripts/perfis/despesas.mjs');
  const d = novasDespesas(), aoLinha = leitorDoTce(ler => somarDespesa(d, ler));
  aoLinha('descricao_unidade_gestora;descricao_unidade_orcamentaria;mes;cpf_cnpj;nome_credor;valor_empenhado;valor_pago;funcao;elemento_despesa;codigo_subelemento_exibicao;modalidade_licitacao;descricao_fonte_recurso;co;descricao_co', true);
  aoLinha('Prefeitura;FUNDO MUNICIPAL DE SAUDE;03-Março;1;FARMACIA A;100;100;Saúde;Material de Consumo;MEDICAMENTOS;Pregão;Transferências Fundo a Fundo SUS;3110;Identificação das Transferências da União decorrentes de emendas parlamentares individuais', false);
  aoLinha('Prefeitura;SECRETARIA DE EDUCACAO;03-Março;2;JOSE;50;50;Educação;Vencimentos e Vantagens Fixas;;Sem Licitação;Recursos do FUNDEB;;', false);
  const { arvores } = { arvores: arvoresDasDespesas(d) };
  assert.deepEqual(arvores.emendas, { v: 100, filhos: [['União · individuais', 100, [['Saúde', 100, [['Material de Consumo', 100, [['FARMACIA A', 100]]]]]]]] });
  assert.deepEqual(arvores.secretaria.filhos.map(([n, v]) => [n, v]), [['FUNDO MUNICIPAL DE SAUDE', 100], ['SECRETARIA DE EDUCACAO', 50]]);
  assert.deepEqual(arvores.fonte.filhos.map(([n]) => n), ['Transferências Fundo a Fundo SUS', 'Recursos do FUNDEB']);
  assert.deepEqual(arvores.area.filhos[0], ['Saúde', 100, [['Material de Consumo', 100, [['FARMACIA A', 100]]]]]);
  assert.deepEqual(resumoDasDespesas(d).comprasPorElemento, [['Material de Consumo', 100]]);
});
