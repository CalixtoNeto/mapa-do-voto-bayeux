import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parteDoPai } from '../../public/js/perfil/arvores-ramos.mjs';
import { arvoreDasModalidades, arvoreDosCredores, arvoreDasLigacoes } from '../../public/js/perfil/arvores-prefeitura.mjs';
import { arvoreDosFavorecidos, arvoreDaExecucao } from '../../public/js/perfil/arvores-emendas.mjs';
import { arvoreDeConcordancia, arvoreDasMaterias, rotuloDaMateria, arvoreDaRemuneracao } from '../../public/js/perfil/arvores-camara.mjs';

test('parte do pai: cada filho ganha a nota com a fração do valor do pai', () => {
  assert.deepEqual(parteDoPai([['A', 75], ['B', 25, [['x', 25]]]], 100, 'da modalidade'),
    [['A', 75, undefined, '75% da modalidade'], ['B', 25, [['x', 25]], '25% da modalidade']]);
  assert.deepEqual(parteDoPai(undefined, 100, 'x'), []);
  assert.equal(parteDoPai([['A', 0.5]], 1000, 'do pai')[0][3], '0,1% do pai');
});

test('modalidades: processos na nota e vencedores abaixo quando o detalhe existe', () => {
  const modalidades = [['Pregão', 3, 80], ['Dispensa', 1, 20], ['Vazia', 0, 0]];
  const detalhe = { v: 100, filhos: [['Pregão', 80, [['Empresa A', 60], ['Empresa B', 20]]], ['Dispensa', 20, [['Empresa C', 20]]]] };
  const a = arvoreDasModalidades(modalidades, detalhe);
  assert.equal(a.v, 100);
  assert.deepEqual(a.filhos[0], ['Pregão', 80, [['Empresa A', 60, undefined, '75% da modalidade'], ['Empresa B', 20, undefined, '25% da modalidade']], '3 processos · 80%']);
  assert.equal(a.filhos[1][3], '1 processo · 20%');
  assert.equal(a.filhos.length, 2);
  assert.deepEqual(arvoreDasModalidades(modalidades, null).filhos[0][2], []);
});

test('credores: área e tipo de despesa de cada credor vêm da árvore por área; o valor do credor é o do arquivo', () => {
  const credores = [['Prefeitura Municipal de X', '1', 900, 5], ['Empresa A', '2', 100, 4], ['Empresa B', '3', 50, 1]];
  const area = { v: 150, filhos: [
    ['Saúde', 90, [['Material', 60, [['Empresa A', 60]]], ['Serviço', 30, [['Empresa A', 30], ['Empresa B', 0]]]]],
    ['Obras', 60, [['Obra', 60, [['Empresa A', 10], ['Empresa B', 50]]]]]] };
  const a = arvoreDosCredores(credores, area);
  assert.equal(a.v, 150);
  assert.deepEqual(a.filhos[0], ['Empresa A', 100, [['Saúde', 90, [['Material', 60, undefined, '67% de Saúde'], ['Serviço', 30, undefined, '33% de Saúde']], '90% do credor'],
    ['Obras', 10, [['Obra', 10, undefined, '100% de Obras']], '10% do credor']], '4 pagamentos · 67%']);
  assert.deepEqual(arvoreDosCredores(credores, null).filhos[1], ['Empresa B', 50, [], '1 pagamento · 33%']);
});

test('ligações: credor com o que o município pagou e, abaixo, cada campanha', () => {
  const grupos = [{ credor: 'EMPRESA', pago: 1000, anos: ['2023', '2024'], campanhas: [
    { papel: 'doou', valor: 300, quem: 'FULANO', eleicao: '2024' }, { papel: 'recebeu', valor: 500, eleicao: '2020' }] }];
  const a = arvoreDasLigacoes(grupos, true);
  assert.equal(a.v, 1000);
  assert.deepEqual(a.filhos, [['EMPRESA', 1000, [['FULANO', 300, null, 'doou à campanha · 2024'], ['Campanha de 2020', 500, null, 'recebeu da campanha · 2020']], 'pago em 2023–2024']]);
  assert.equal(arvoreDasLigacoes(grupos, false).filhos[0][2][0][0], 'Campanha de 2024');
});

test('favorecidos: inverte autor → favorecido → ano em favorecido → autor → ano', () => {
  const arvore = { v: 100, filhos: [
    ['AUTOR 1', 70, [['FUNDO', 50, [['2024', 30], ['2025', 20]]], ['PESSOAS', 20, [['2024', 20]]]]],
    ['AUTOR 2', 30, [['FUNDO', 30, [['2025', 30]]]]]] };
  const a = arvoreDosFavorecidos(arvore, [['FUNDO', 'Fundo público', 80]]);
  assert.equal(a.v, 100);
  assert.deepEqual(a.filhos[0], ['FUNDO', 80, [['AUTOR 1', 50, [['2024', 30, undefined, '60% do autor'], ['2025', 20, undefined, '40% do autor']], '63% do favorecido'], ['AUTOR 2', 30, [['2025', 30, undefined, '100% do autor']], '38% do favorecido']], 'Fundo público · 80%']);
  assert.equal(a.filhos[1][3], '20%');
  assert.equal(arvoreDosFavorecidos(undefined, []).v, 0);
});

test('execução: pago e ainda não pago abaixo do valor empenhado de cada autor', () => {
  const a = arvoreDaExecucao([['A', 100, 40, 2, '2020', '2022'], ['B', 50, 50, 1, '2024', '2024'], ['C', 10, 12, 1, '2021', '2021'], ['D', 0, 0, 1, '2021', '2021']]);
  assert.equal(a.v, 160);
  assert.deepEqual(a.filhos[0], ['A', 100, [['Pago', 40, undefined, '40% do empenhado'], ['Ainda não pago', 60, undefined, '60% do empenhado']], '2 emendas · 2020–2022 · 40% pago']);
  assert.deepEqual(a.filhos[1], ['B', 50, [['Pago', 50, undefined, '100% do empenhado']], '1 emenda · 2024 · 100% pago']);
  assert.deepEqual(a.filhos[2][2], [['Pago', 12, undefined, '120% do empenhado']]);
  assert.equal(a.filhos.length, 3);
});

test('concordância: fração do vereador e, abaixo, votos iguais e diferentes em contagem', () => {
  const a = arvoreDeConcordancia([{ nome: 'Ana', parte: 3, total: 4 }, { nome: 'Beto', parte: 0, total: 2 }], ['Com a maioria', 'Contra a maioria']);
  assert.deepEqual(a.filhos[0], ['Ana', 0.75, [['Com a maioria', 0.75, null, '3 votações'], ['Contra a maioria', 0.25, null, '1 votação']], '4 votações']);
  assert.deepEqual(a.filhos[1][2], [['Contra a maioria', 1, null, '2 votações']]);
});

test('matérias: tipos com as mais recentes de cada um e o rótulo que liga ao SAPL', () => {
  const recentes = [[858, 'Requerimento', 342, 2026, 'Pede obra', '2026-10-05'], [7, 'Indicação', 1, 2025, 'Pede flor', '2025-02-01']];
  const a = arvoreDasMaterias([['Requerimento', 18], ['Indicação', 2], ['Projeto', 1]], recentes, 21);
  assert.equal(a.v, 21);
  assert.deepEqual(a.filhos[0], ['Requerimento', 18, [['Requerimento nº 342/2026', 1, null, '05/10/2026']], '86%']);
  assert.deepEqual(a.filhos[2][2], []);
  assert.equal(rotuloDaMateria(recentes[1]), 'Indicação nº 1/2025');
});

test('remuneração: ano com a soma e, abaixo, cada mês, do ano mais novo ao mais antigo', () => {
  const a = arvoreDaRemuneracao([['202412', 10, 'VEREADOR', 'Câmara'], ['202501', 12, 'PRESIDENTE', 'Câmara'], ['202502', 12, 'PRESIDENTE', 'Câmara']]);
  assert.equal(a.v, 34);
  assert.deepEqual(a.filhos.map(f => [f[0], f[1], f[3]]), [['2025', 24, '2 meses'], ['2024', 10, '1 mês']]);
  assert.deepEqual(a.filhos[0][2], [['01/2025', 12, null, 'Presidente'], ['02/2025', 12, null, 'Presidente']]);
});

test('credores: nomes repetidos somam num ramo só e o que não cabe no valor do credor fica sem filhos', () => {
  const area = { v: 100, filhos: [['SAUDE', 100, [['Serviços', 100, [['EMPRESA A', 60], ['EMPRESA B', 40]]]]]] };
  const a = arvoreDosCredores([['EMPRESA A', '1', 30, 2], ['EMPRESA A', '2', 30, 1], ['EMPRESA B', '3', 10, 4]], area);
  assert.deepEqual(a.filhos.map(f => [f[0], f[1], f[2].length]), [['EMPRESA A', 60, 1], ['EMPRESA B', 10, 0]]);
});
