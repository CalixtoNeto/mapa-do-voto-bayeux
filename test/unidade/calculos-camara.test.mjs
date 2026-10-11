import { test } from 'node:test';
import assert from 'node:assert/strict';
import { presencaMedia, presencasEmOrdem, partidosEmExercicio, votosPorVereador, totalDeVotos, alinhamentos, presencaXAlinhamento, partesDosPartidos, serieDaCamara }
  from '../../public/js/perfil/calculos-camara.mjs';

const v = (nome, extra = {}) => ({ nome, emExercicio: true, partido: 'PSB', presenca: [8, 10],
  votacoes: { sim: 5, nao: 2, abstencao: 1, outros: 0, comMaioria: 6, comMaioriaDe: 8 }, ...extra });

test('presença média: soma das presenças sobre soma das sessões possíveis, só de quem está em exercício', () => {
  const lista = [v('A', { presenca: [5, 10] }), v('B', { presenca: [10, 10] }), v('C', { emExercicio: false, presenca: [0, 100] })];
  assert.equal(presencaMedia(lista), 0.75);
  assert.equal(presencaMedia([]), null);
});

test('presenças em ordem: da maior para a menor, sem quem não tinha sessão', () => {
  const lista = [v('A', { presenca: [5, 10] }), v('B', { presenca: [9, 10] }), v('C', { presenca: [0, 0] })];
  assert.deepEqual(presencasEmOrdem(lista).map(p => [p.nome, p.fracao, p.parte, p.total]), [['B', 0.9, 9, 10], ['A', 0.5, 5, 10]]);
});

test('partidos dos vereadores em exercício; sem partido vira "Não informado"', () => {
  const lista = [v('A'), v('B'), v('C', { partido: 'PV' }), v('D', { partido: '' }), v('E', { emExercicio: false })];
  assert.deepEqual(partidosEmExercicio(lista), [{ nome: 'PSB', v: 2 }, { nome: 'Não informado', v: 1 }, { nome: 'PV', v: 1 }]);
});

test('votos por vereador: o que falta para o total de votações é "sem voto registrado"', () => {
  const linhas = votosPorVereador([v('Zé'), v('Ana', { votacoes: { sim: 1, nao: 0, abstencao: 0, outros: 1, comMaioria: 1, comMaioriaDe: 1 } })], 10);
  assert.deepEqual(linhas.map(l => l.nome), ['Ana', 'Zé']);
  assert.deepEqual(linhas[0], { nome: 'Ana', sim: 1, nao: 0, abstencao: 0, outros: 1, semVoto: 8 });
  assert.equal(linhas[1].semVoto, 2);
});

test('total de votos soma todos os vereadores', () => {
  const linhas = votosPorVereador([v('A'), v('B')], 10);
  assert.deepEqual(totalDeVotos(linhas), { sim: 10, nao: 4, abstencao: 2, outros: 0, total: 16 });
});

test('alinhamento com a maioria: razão entre votos iguais e votações, do maior ao menor', () => {
  const lista = [v('A'), v('B', { votacoes: { sim: 1, nao: 0, abstencao: 0, outros: 0, comMaioria: 4, comMaioriaDe: 4 } }),
    v('C', { votacoes: { sim: 0, nao: 0, abstencao: 0, outros: 0, comMaioria: 0, comMaioriaDe: 0 } })];
  assert.deepEqual(alinhamentos(lista).map(a => [a.nome, a.fracao, a.com, a.de]), [['B', 1, 4, 4], ['A', 0.75, 6, 8]]);
});

test('pontos de presença × alinhamento, só de quem tem os dois', () => {
  const lista = [v('A'), v('B', { presenca: [0, 0] })];
  assert.deepEqual(presencaXAlinhamento(lista), [{ n: 'A', x: 0.8, y: 0.75 }]);
});

test('cores dos partidos: uma por partido, o excesso soma em "Outros" e "Não informado" fica neutro', () => {
  const partidos = [{ nome: 'A', v: 5 }, { nome: 'Não informado', v: 4 }, { nome: 'B', v: 3 }, { nome: 'C', v: 2 }, { nome: 'D', v: 1 }];
  assert.deepEqual(partesDosPartidos(partidos, ['c1', 'c2'], 'cinza'), [
    { nome: 'A', v: 5, cor: 'c1' }, { nome: 'B', v: 3, cor: 'c2' }, { nome: 'Não informado', v: 4, cor: 'cinza' }, { nome: 'Outros (2)', v: 3, cor: 'cinza' }]);
  assert.deepEqual(partesDosPartidos(partidos.slice(0, 4), ['c1', 'c2'], 'cinza').pop(), { nome: 'C', v: 2, cor: 'cinza' });
  assert.equal(partesDosPartidos(partidos.slice(0, 2), ['c1', 'c2'], 'cinza').length, 2);
});

test('série da Câmara: pago e folha por ano, com o ano em andamento marcado', () => {
  const ano = (a, pago, folha, meses) => ({ ano: a, despesas: { camara: { pago }, meses }, servidores: { orgaos: [['Prefeitura Municipal', 1, 9], ['Câmara Municipal de Bayeux', 5, folha]] } });
  const doze = Array.from({ length: 12 }, (_, i) => [String(i + 1).padStart(2, '0'), 1]);
  const serie = serieDaCamara([ano('2026', 4, 3, [['01', 1]]), ano('2025', 10, 6, doze), { ano: '2024', despesas: {} }]);
  assert.deepEqual(serie, [{ ano: '2025', pago: 10, folha: 6, parcial: false }, { ano: '2026', pago: 4, folha: 3, parcial: true }]);
});
