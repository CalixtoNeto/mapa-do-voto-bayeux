import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slug, taxa, resumoDaRemuneracao, extremosDaAfinidade, ligacoesDoCandidato, ligacoesDoAno, agruparLigacoes, vereadoresEmOrdem, serieAnual, mesAno }
  from '../../public/js/perfil/calculos-perfil.mjs';

test('endereço do perfil a partir do nome', () => {
  assert.equal(slug('Adriano do Táxi'), 'adriano-do-taxi');
  assert.equal(slug('  Berguinho  Impacto Som '), 'berguinho-impacto-som');
});

test('taxa e mês por extenso', () => {
  assert.equal(taxa([3, 4]), 0.75);
  assert.equal(taxa([0, 0]), null);
  assert.equal(mesAno('202502'), '02/2025');
});

test('remuneração: último mês, total e quantos meses', () => {
  const r = resumoDaRemuneracao([['202501', 9000, 'VEREADOR', 'Câmara'], ['202502', 9500, 'VEREADOR', 'Câmara']]);
  assert.deepEqual(r, { mes: '202502', valor: 9500, cargo: 'VEREADOR', total: 18500, meses: 2 });
  assert.equal(resumoDaRemuneracao([]), null);
});

test('afinidade: com quem mais e menos vota junto, sem repetir', () => {
  const af = [[1, 9, 10], [2, 8, 10], [3, 5, 10], [4, 2, 10]];
  assert.deepEqual(extremosDaAfinidade(af, 2), { mais: [[1, 9, 10], [2, 8, 10]], menos: [[4, 2, 10], [3, 5, 10]] });
  assert.deepEqual(extremosDaAfinidade(af.slice(0, 3), 2), { mais: [[1, 9, 10], [2, 8, 10]], menos: [[3, 5, 10]] });
});

test('credores da prefeitura ligados à campanha de um candidato, em todos os anos', () => {
  const anos = [
    { ano: '2025', campanhas: [['ERIKA PIMENTA', 9000, [['2024', '11|40', 20000, 'doou'], ['2024', '13|1', 50, 'doou']]]] },
    { ano: '2026', campanhas: [['GEANCELIO ANDRADE', 5200, [['2024', '11|40', 1500, 'recebeu']]], ['OUTRO', 1, [['2020', '13|9', 1, 'doou']]]] },
  ];
  assert.deepEqual(ligacoesDoCandidato(anos, '11|40', '2024'), [
    { ano: '2025', credor: 'ERIKA PIMENTA', pago: 9000, valor: 20000, papel: 'doou', eleicao: '2024' },
    { ano: '2026', credor: 'GEANCELIO ANDRADE', pago: 5200, valor: 1500, papel: 'recebeu', eleicao: '2024' },
  ]);
  assert.deepEqual(ligacoesDoCandidato(anos, '13|9', '2024'), []);
});

test('vereadores em exercício primeiro, depois por nome', () => {
  const v = [{ nome: 'Bia', emExercicio: false }, { nome: 'Caio', emExercicio: true }, { nome: 'Ana', emExercicio: true }];
  assert.deepEqual(vereadoresEmOrdem(v).map(x => x.nome), ['Ana', 'Caio', 'Bia']);
});

test('série anual a partir dos arquivos de cada ano', () => {
  const anos = [{ ano: '2026', despesas: { camara: { pago: 2 } } }, { ano: '2025', despesas: null }, { ano: '2024', despesas: { camara: { pago: 1 } } }];
  assert.deepEqual(serieAnual(anos, a => a.despesas?.camara.pago), [['2024', 1], ['2026', 2]]);
});

test('credores de um ano ligados a campanhas, com o nome do candidato', () => {
  const ano = { ano: '2025', campanhas: [['ERIKA', 9000, [['2024', '11|40', 20000, 'doou', 'TARCYANNA']]], ['GEO', 100, [['2020', '13|1', 50, 'recebeu', 'FULANO']]]] };
  assert.deepEqual(ligacoesDoAno(ano), [
    { ano: '2025', credor: 'ERIKA', pago: 9000, valor: 20000, papel: 'doou', quem: 'TARCYANNA', eleicao: '2024' },
    { ano: '2025', credor: 'GEO', pago: 100, valor: 50, papel: 'recebeu', quem: 'FULANO', eleicao: '2020' },
  ]);
});

test('ligações agrupadas por credor: pago somado entre anos, cada campanha uma vez', () => {
  const l = (ano, credor, pago, quem = 'TARCYANNA') => ({ ano, credor, pago, valor: 100, papel: 'doou', quem, eleicao: '2024' });
  assert.deepEqual(agruparLigacoes([l('2025', 'ZAPIER', 126), l('2024', 'ZAPIER', 50), l('2025', 'GILSON', 4), l('2025', 'ZAPIER', 126, 'FULANO')]), [
    { credor: 'ZAPIER', pago: 176, anos: ['2024', '2025'], campanhas: [{ papel: 'doou', valor: 100, quem: 'TARCYANNA', eleicao: '2024' }, { papel: 'doou', valor: 100, quem: 'FULANO', eleicao: '2024' }] },
    { credor: 'GILSON', pago: 4, anos: ['2025'], campanhas: [{ papel: 'doou', valor: 100, quem: 'TARCYANNA', eleicao: '2024' }] },
  ]);
});
