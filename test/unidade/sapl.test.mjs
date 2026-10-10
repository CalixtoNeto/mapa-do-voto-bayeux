import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerColecao, SAPL } from '../../scripts/fontes/sapl.mjs';
import { resumoDaCamara } from '../../scripts/perfis/camara.mjs';
import { votosPorVotacao, resumoDosVotos, afinidades } from '../../scripts/perfis/votacoes.mjs';

// Registros no formato da API do SAPL de Bayeux (sondada em outubro de 2026), só com os campos usados.
const camara = () => ({
  legislaturas: [{ id: 1, numero: 16, data_inicio: '2025-01-01', data_fim: '2028-12-31' }],
  parlamentares: [
    { id: 19, nome_parlamentar: 'Adriano do Táxi', nome_completo: 'Adriano da Silva Nascimento', fotografia: 'http://sapl/foto19.jpg' },
    { id: 2, nome_parlamentar: 'Adriano Martins', nome_completo: 'Adriano Martins de Souza' },
    { id: 12, nome_parlamentar: 'Berguinho Impacto Som', nome_completo: 'Berg Lima' },
  ],
  mandatos: [
    { parlamentar: 19, legislatura: 1, data_inicio_mandato: '2025-01-01', data_fim_mandato: '2028-12-31', votos_recebidos: 1582, titular: true, tipo_afastamento: null },
    { parlamentar: 2, legislatura: 1, data_inicio_mandato: '2025-01-01', data_fim_mandato: '2025-03-01', votos_recebidos: 946, titular: true, tipo_afastamento: 9 },
    { parlamentar: 12, legislatura: 1, data_inicio_mandato: '2025-01-01', data_fim_mandato: '2028-12-31', votos_recebidos: 1403, titular: true, tipo_afastamento: null },
  ],
  partidos: [{ id: 7, sigla: 'PSB' }, { id: 36, sigla: 'PL' }],
  filiacoes: [
    { parlamentar: 19, partido: 7, data: '2024-03-22', data_desfiliacao: null },
    { parlamentar: 19, partido: 36, data: '2020-04-02', data_desfiliacao: '2024-03-22' },
  ],
  sessoes: [{ id: 1, data_inicio: '2025-02-04' }, { id: 2, data_inicio: '2025-04-06' }, { id: 3, data_inicio: '2026-12-01' }],
  presencas: [
    { sessao_plenaria: 1, parlamentar: 19 }, { sessao_plenaria: 2, parlamentar: 19 },
    { sessao_plenaria: 1, parlamentar: 2 }, { sessao_plenaria: 1, parlamentar: 12 },
  ],
  votos: [],
  autores: [{ id: 46, object_id: 19, content_type: 2, nome: 'Adriano do Táxi' }, { id: 1, object_id: 19, content_type: 5, nome: 'ARQUIVO - ARQ' }],
  autorias: [{ autor: 46, materia: 30 }, { autor: 46, materia: 84 }, { autor: 1, materia: 83 }],
  materias: [
    { id: 30, tipo: 1, numero: 72, ano: 2025, data_apresentacao: '2025-05-02', ementa: 'Denomina rua' },
    { id: 84, tipo: 5, numero: 329, ano: 2025, data_apresentacao: '2025-09-10', ementa: 'Indica reforma de praça' },
    { id: 83, tipo: 5, numero: 18, ano: 2025, data_apresentacao: '2025-09-01', ementa: 'Não é do vereador' },
  ],
  tipos: [{ id: 1, sigla: 'PLO', descricao: 'PROJETO DE LEI ORDINÁRIA' }, { id: 5, sigla: 'IND', descricao: 'INDICAÇÃO' }],
});

test('lerColecao percorre as páginas da API até a última', async () => {
  const pedidos = [];
  const buscarJson = async url => {
    pedidos.push(url);
    const pagina = Number(new URL(url).searchParams.get('page'));
    return { pagination: { next_page: pagina < 2 ? pagina + 1 : null }, results: [{ id: pagina }] };
  };
  assert.deepEqual(await lerColecao(buscarJson, 'sessao/sessaoplenaria'), [{ id: 1 }, { id: 2 }]);
  assert.equal(pedidos[0], `${SAPL}/sessao/sessaoplenaria/?page=1&page_size=100`);
});

test('lerColecao aceita outro SAPL e filtros (a Assembleia Legislativa filtra por legislatura, ano e autor)', async () => {
  const pedidos = [];
  const buscarJson = async url => { pedidos.push(url); return { pagination: { next_page: null }, results: [] }; };
  await lerColecao(buscarJson, 'parlamentares/mandato', { base: 'https://sapl.al.pb.leg.br/api', filtros: { legislatura: 20 } });
  assert.equal(pedidos[0], 'https://sapl.al.pb.leg.br/api/parlamentares/mandato/?legislatura=20&page=1&page_size=100');
});

test('vereador: partido atual e anteriores, votos na eleição, presença nas sessões do mandato e matérias de autoria', () => {
  const r = resumoDaCamara(camara(), '2026-10-09');
  assert.deepEqual(r.legislatura, { numero: 16, inicio: '2025-01-01', fim: '2028-12-31' });
  const adriano = r.vereadores.find(v => v.id === 19);
  assert.equal(adriano.nome, 'Adriano do Táxi');
  assert.equal(adriano.foto, 'http://sapl/foto19.jpg');
  assert.equal(adriano.partido, 'PSB');
  assert.deepEqual(adriano.partidos, [['PL', '2020-04-02', '2024-03-22'], ['PSB', '2024-03-22', null]]);
  assert.equal(adriano.eleicao, 1582);
  assert.equal(adriano.emExercicio, true);
  assert.deepEqual(adriano.presenca, [2, 2]);
  assert.deepEqual(adriano.materias.porTipo, [['Indicação', 1], ['Projeto de lei ordinária', 1]]);
  assert.deepEqual(adriano.materias.recentes[0], [84, 'Indicação', 329, 2025, 'Indica reforma de praça', '2025-09-10']);
});

test('quem saiu do mandato conta só as sessões até a saída', () => {
  const r = resumoDaCamara(camara(), '2026-10-09');
  const martins = r.vereadores.find(v => v.id === 2), berg = r.vereadores.find(v => v.id === 12);
  assert.equal(martins.emExercicio, false);
  assert.deepEqual(martins.presenca, [1, 1]);
  assert.deepEqual(berg.presenca, [1, 2]);
  assert.equal(berg.partido, null);
});

const votacao = (id, votos) => Object.entries(votos).map(([parlamentar, voto]) => ({ votacao: id, parlamentar: Number(parlamentar), voto }));

test('votos nominais: contagem, quantas vezes votou com a maioria e com quem mais concorda', () => {
  const porVotacao = votosPorVotacao([
    ...votacao(1, { 19: 'Sim', 2: 'Sim', 12: 'Não' }),
    ...votacao(2, { 19: 'Não', 2: 'Sim', 12: 'Sim' }),
    ...votacao(3, { 19: 'Abstenção', 2: 'Sim', 12: 'Sim' }),
  ]);
  assert.deepEqual(resumoDosVotos(19, porVotacao), { sim: 1, nao: 1, abstencao: 1, outros: 0, comMaioria: 1, comMaioriaDe: 2 });
  assert.deepEqual(afinidades(2, porVotacao, 1), [[12, 2, 3], [19, 1, 2]]);
  assert.deepEqual(afinidades(2, porVotacao, 3), [[12, 2, 3]]);
});

test('afastamento registrado não tira do exercício quem esteve nas últimas sessões', () => {
  const d = camara();
  d.mandatos[2].tipo_afastamento = 3;
  const r = resumoDaCamara(d, '2026-10-09');
  assert.equal(r.vereadores.find(v => v.id === 12).emExercicio, true);
  d.presencas = d.presencas.filter(p => p.parlamentar !== 12);
  assert.equal(resumoDaCamara(d, '2026-10-09').vereadores.find(v => v.id === 12).emExercicio, false);
});

test('quem votou numa sessão conta como presente nela, mesmo sem presença registrada ("Não votou" não conta)', () => {
  const d = camara();
  d.votos = [{ votacao: 50, parlamentar: 12, voto: 'Sim', data_hora: '2025-04-06T10:15:54-03:00' },
    { votacao: 50, parlamentar: 2, voto: 'Não Votou', data_hora: '2025-04-06T10:15:54-03:00' }];
  const r = resumoDaCamara(d, '2026-10-09');
  assert.deepEqual(r.vereadores.find(v => v.id === 12).presenca, [2, 2], 'sessão 1 registrada e sessão 2 pelo voto');
  assert.deepEqual(r.vereadores.find(v => v.id === 2).presenca, [1, 1]);
});
