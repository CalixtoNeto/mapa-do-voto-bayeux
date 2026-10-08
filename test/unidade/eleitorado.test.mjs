import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leitorDoEleitorado } from '../../scripts/fontes/eleitorado.mjs';

const linha = campos => campos.map(c => `"${c}"`).join(';');
const CABECALHO = ['ANO_ELEICAO', 'SG_UF', 'CD_MUNICIPIO', 'NR_ZONA', 'NR_SECAO', 'DS_GENERO', 'DS_FAIXA_ETARIA',
  'DS_GRAU_ESCOLARIDADE', 'QT_ELEITORES_PERFIL'];

function ler(linhas) {
  const lugares = {}, lugarDe = (campos, colunas) => campos[colunas.CD_MUNICIPIO] === '20516' ? 'JP' : null;
  const aoLinha = leitorDoEleitorado({ ano: '2022', lugarDe, lugares });
  aoLinha(linha(CABECALHO), true);
  linhas.forEach(l => aoLinha(linha(l), false));
  return lugares;
}

test('soma por lugar: eleitores, mulheres, jovens (até 24), idosos (60+), superior completo e até fundamental incompleto', () => {
  const lugares = ler([
    ['2022', 'PB', '20516', '1', '10', 'FEMININO', '21 a 24 anos', 'SUPERIOR COMPLETO', '10'],
    ['2022', 'PB', '20516', '1', '10', 'MASCULINO', '60 a 64 anos', 'ANALFABETO', '5'],
    ['2022', 'PB', '20516', '1', '11', 'MASCULINO', '35 a 39 anos', 'ENSINO FUNDAMENTAL INCOMPLETO', '3'],
    ['2022', 'PB', '20516', '1', '11', 'FEMININO', '16 anos', 'LÊ E ESCREVE', '2'],
    ['2022', 'PB', '99999', '1', '11', 'FEMININO', '16 anos', 'LÊ E ESCREVE', '99'],
    ['2018', 'PB', '20516', '1', '11', 'FEMININO', '16 anos', 'LÊ E ESCREVE', '99'],
  ]);
  assert.deepEqual(lugares, { JP: [20, 12, 12, 5, 10, 10] });
});
