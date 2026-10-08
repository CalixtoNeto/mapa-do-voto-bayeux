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

test('aceita a quantidade de eleitores com outro nome de coluna, mas não as de biometria e deficiência', () => {
  const lugares = {}, aoLinha = leitorDoEleitorado({ ano: '2026', lugarDe: () => 'JP', lugares });
  aoLinha(linha(['SG_UF', 'QT_ELEITORES_BIOMETRIA', 'DS_GENERO', 'DS_FAIXA_ETARIA', 'DS_GRAU_ESCOLARIDADE', 'QT_ELEITORES']), true);
  aoLinha(linha(['PB', '9', 'FEMININO', '30 a 34 anos', 'SUPERIOR COMPLETO', '4']), false);
  assert.deepEqual(lugares, { JP: [4, 4, 0, 0, 4, 0] });
});

test('sem a coluna da quantidade, o erro diz quais colunas o arquivo tem', () => {
  const aoLinha = leitorDoEleitorado({ ano: '2026', lugarDe: () => 'JP', lugares: {} });
  assert.throws(() => aoLinha(linha(['SG_UF', 'DS_GENERO', 'DS_FAIXA_ETARIA', 'DS_GRAU_ESCOLARIDADE']), true), /colunas do arquivo: SG_UF, DS_GENERO/);
});
