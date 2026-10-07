import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grafiasDosBairros } from '../../scripts/secoes/bairros.mjs';
import { lerCoordenada, caixaDoContorno, estaNaCaixa } from '../../scripts/secoes/coordenadas.mjs';
import { montarTabelaDeSecoes } from '../../scripts/secoes/tabela.mjs';
import { indiceDeColunas } from '../../scripts/lib/csv.mjs';

test('o bairro fica com a grafia mais frequente', () => {
  const grafias = grafiasDosBairros(['Centro', 'CENTRO', 'CENTRO ', 'São Bento', 'SAO BENTO', '']);
  assert.equal(grafias.get('CENTRO'), 'CENTRO');
  assert.equal(grafias.get('SAO BENTO'), 'São Bento', 'no empate, a primeira');
  assert.equal(grafias.size, 2);
});

test('coordenada com vírgula decimal (2026) é lida', () => {
  assert.equal(lerCoordenada('-7,13'), -7.13);
  assert.ok(Number.isNaN(lerCoordenada('')));
});

const quadrado = type => ({ features: [{ geometry: { type,
  coordinates: type === 'Polygon' ? [[[-35, -7], [-34.9, -7.1]]] : [[[[-35, -7], [-34.9, -7.1]]]] } }] });

test('a caixa do contorno tem folga e aceita Polygon e MultiPolygon', () => {
  for (const tipo of ['Polygon', 'MultiPolygon']) {
    const caixa = caixaDoContorno(quadrado(tipo));
    assert.equal(estaNaCaixa(caixa, -35.01, -7.11), true, tipo);
    assert.equal(estaNaCaixa(caixa, -34.9, -8.5), false, tipo);
    assert.equal(estaNaCaixa(caixa, NaN, -7), false, tipo);
  }
});

const colunas = indiceDeColunas('"NR_TURNO";"NR_ZONA";"NR_SECAO";"NR_LOCAL_VOTACAO";"NM_LOCAL_VOTACAO";"DS_ENDERECO";'
  + '"NM_BAIRRO";"NR_LATITUDE";"NR_LONGITUDE";"QT_ELEITOR_SECAO"');
const linha = (turno, secao, local, bairro, lat, eleitores) =>
  [turno, '61', secao, local, ` ESCOLA ${local} `, '', bairro, lat, '-34.95', eleitores];

test('seções do mesmo local somam eleitores e apontam para a mesma posição', () => {
  const linhas = [linha('1', '100', '1490', 'CENTRO', '-7.05', '300'), linha('1', '101', '1490', 'Centro', '-7.05', '200'),
    linha('1', '200', '1500', 'CENTRO', '-9', '50'), linha('2', '300', '1510', 'OUTRO', '-7.05', '9')];
  const { tabela, rejeitadas } = montarTabelaDeSecoes({ ano: '2024', municipio: '19372', linhas, colunas, caixa: caixaDoContorno(quadrado('Polygon')) });
  assert.deepEqual(tabela.secoes, { '61|100': 0, '61|101': 0, '61|200': 1 }, 'o 2º turno fica de fora');
  assert.deepEqual(tabela.locais.map(l => [l.nome, l.bairro, l.eleitores, l.lat]), [['ESCOLA 1490', 'CENTRO', 500, -7.05], ['ESCOLA 1500', 'CENTRO', 50, null]]);
  assert.deepEqual(rejeitadas, [{ lat: '-9', lon: '-34.95' }]);
});

test('tabela sem a coluna de bairro é recusada', () => {
  assert.throws(() => montarTabelaDeSecoes({ ano: '2024', linhas: [], colunas: { NR_ZONA: 0 } }), /2024: colunas ausentes NR_SECAO/);
});
