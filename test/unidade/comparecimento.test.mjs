import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leitorDeComparecimento } from '../../scripts/fontes/comparecimento.mjs';

const linha = campos => campos.map(c => `"${c}"`).join(';');
const CABECALHO = ['ANO_ELEICAO', 'NR_TURNO', 'SG_UF', 'CD_MUNICIPIO', 'NR_ZONA', 'NR_SECAO', 'CD_CARGO', 'QT_APTOS',
  'QT_COMPARECIMENTO', 'QT_ABSTENCOES', 'QT_VOTOS_BRANCOS', 'QT_VOTOS_NULOS'];
const secao = (sec, { mun = '19372', cargo = '13', uf = 'PB' } = {}, ...n) => ['2024', '1', uf, mun, '61', sec, cargo, ...n];

function ler(linhas) {
  const porTurno = {}, localDaSecao = (campos, colunas) => ({ 100: 0, 101: 0, 200: 1 })[campos[colunas.NR_SECAO]];
  const aoLinha = leitorDeComparecimento({ ano: '2024', localDaSecao, porTurno });
  aoLinha(linha(CABECALHO), true);
  linhas.forEach(l => aoLinha(linha(l), false));
  return porTurno;
}

test('soma as seções no local de votação onde funcionam', () => {
  assert.deepEqual(ler([
    secao('100', {}, '300', '250', '50', '5', '8'), secao('101', {}, '200', '150', '50', '2', '4'),
    secao('200', {}, '100', '90', '10', '1', '1'),
  ]), { 1: { 13: { 0: [500, 400, 7, 12], 1: [100, 90, 1, 1] } } });
});

test('ignora outra cidade, cargo fora do site e seção sem local', () => {
  assert.deepEqual(ler([
    secao('100', { mun: '20516' }, '1', '1', '0', '0', '0'), secao('100', { cargo: '11' }, '1', '1', '0', '0', '0'),
    secao('999', {}, '1', '1', '0', '0', '0'),
  ]), {});
});
