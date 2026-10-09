import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leitorPorColuna } from '../../scripts/fontes/por-coluna.mjs';
import { novasEmendas, somarEmenda, somarConvenio, resumoDasEmendas } from '../../scripts/perfis/emendas.mjs';

// Linhas do Portal da Transparência (EmendasParlamentares.csv e _Convenios.csv), só com as colunas usadas.
const EMENDAS = '"Código da Emenda";"Ano da Emenda";"Tipo de Emenda";"Nome do Autor da Emenda";"Código Município IBGE";"UF";"Nome Função";"Valor Empenhado";"Valor Pago";"Valor Restos A Pagar Pagos"';
const CONVENIOS = '"Código da Emenda";"Nome Função";"Localidade do gasto";"Data Publicação Convênio";"Convenente";"Objeto Convênio";"Valor Convênio"';
const linha = campos => campos.map(c => `"${c}"`).join(';');

function ler(acumulador, cabecalho, linhas, somar) {
  const aoLinha = leitorPorColuna(ler => somar(acumulador, ler));
  aoLinha(cabecalho, true);
  linhas.forEach(l => aoLinha(linha(l), false));
}

test('emendas destinadas a Bayeux: por autor, ano e área, com o pago somando os restos a pagar', () => {
  const acc = novasEmendas();
  ler(acc, EMENDAS, [
    ['201838470016', '2018', 'Emenda Individual', 'ANDRE AMARAL', '2501807', 'PARAÍBA', 'Urbanismo', '1299999,72', '3500,00', '1020145,05'],
    ['201838470002', '2018', 'Emenda Individual', 'ANDRE AMARAL', '2501807', 'PARAÍBA', 'Saúde', '7200,00', '7200,00', '0,00'],
    ['201935300001', '2019', 'Emenda Individual', 'DAMIAO FELICIANO', '2501807', 'PARAÍBA', 'Educação', '249955,17', '0,00', '0,00'],
    ['201510480009', '2015', 'Emenda Individual', 'OUTRO', '3550308', 'SÃO PAULO', 'Saúde', '999,00', '999,00', '0,00'],
  ], somarEmenda);
  ler(acc, CONVENIOS, [
    ['201838470016', 'Urbanismo', 'BAYEUX - PB', '12/07/2018', 'MUNICIPIO DE BAYEUX', 'Pavimentacao e Drenagem no Municipio de Bayeux - PB', '1153598,82'],
    ['201510480009', 'Saúde', 'SÃO PAULO (UF)', '06/01/2016', 'FUNDACAO', 'Equipamento', '1450000,00'],
  ], somarConvenio);
  const r = resumoDasEmendas(acc);
  assert.deepEqual(r.porAutor, [['ANDRE AMARAL', 1307199.72, 1030845.05, 2, '2018', '2018'], ['DAMIAO FELICIANO', 249955.17, 0, 1, '2019', '2019']]);
  assert.deepEqual(r.porAno, [['2018', 1307199.72, 1030845.05], ['2019', 249955.17, 0]]);
  assert.deepEqual(r.porFuncao, [['Urbanismo', 1023645.05], ['Saúde', 7200], ['Educação', 0]]);
  assert.deepEqual(r.convenios, [['2018-07-12', 'ANDRE AMARAL', 'Pavimentacao e Drenagem no Municipio de Bayeux - PB', 1153598.82, 'Urbanismo']]);
});
