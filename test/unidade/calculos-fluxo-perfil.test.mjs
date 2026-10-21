// Grafos de fluxo prontos para a campanha, a Prefeitura e as emendas (public/js/calculos-fluxo-campanha.mjs e perfil/calculos-fluxo-perfil.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grafoDaCampanha } from '../../public/js/calculos-fluxo-campanha.mjs';
import { grafoDoEleitorado } from '../../public/js/calculos-fluxo-eleitorado.mjs';
import { grafoDaPrefeitura, grafoDasEmendas } from '../../public/js/perfil/calculos-fluxo-perfil.mjs';

const nomes = coluna => coluna.map(n => n.n);

test('campanha: grupos de origem → campanha → categorias de gasto', () => {
  const resumo = { grupos: [{ nome: 'Fundo eleitoral', v: 600 }, { nome: 'Doações', v: 0 }, { nome: 'Próprios', v: 100 }],
    categorias: [['PUBLICIDADE POR CARROS DE SOM', 300, []], ['SERVIÇOS ADVOCATÍCIOS', 100, []]] };
  const g = grafoDaCampanha(resumo);
  assert.deepEqual(g.colunas.map(nomes), [['Fundo eleitoral', 'Próprios'], ['Campanha'], ['Publicidade por carros de som', 'Serviços advocatícios']]);
});

test('campanha: sem recebido ou sem despesas por categoria não há o que desenhar', () => {
  assert.equal(grafoDaCampanha({ grupos: [{ nome: 'x', v: 5 }], categorias: [] }), null);
  assert.equal(grafoDaCampanha({ grupos: [], categorias: [['a', 1, []]] }), null);
});

test('prefeitura: órgãos → pago → funções, com os nomes enxutos e a função do TCE-PB corrigida', () => {
  const a = { despesas: { orgaos: [['Prefeitura Municipal de Bayeux', 300, 200], ['Câmara Municipal de Bayeux', 10, 10]],
    funcoes: [['Educação', 120], ['Assistêncial Social', 90]] } };
  const g = grafoDaPrefeitura(a);
  assert.deepEqual(g.colunas.map(nomes), [['Prefeitura', 'Câmara'], ['Pago'], ['Educação', 'Assistência social']]);
});

test('prefeitura: ano sem despesas não gera grafo', () => {
  assert.equal(grafoDaPrefeitura({ despesas: null }), null);
});

test('emendas: autor → favorecido somando os anos', () => {
  const arvore = { v: 30, filhos: [['MERSINHO LUCENA', 20, [['FUNDO MUNICIPAL DE SAUDE', 15, [['2024', 15]]], ['ASSOCIACAO X', 5, [['2024', 5]]]]],
    ['RELATOR GERAL', 10, [['FUNDO MUNICIPAL DE SAUDE', 10, [['2020', 10]]]]]] };
  const g = grafoDasEmendas(arvore);
  assert.deepEqual(g.colunas.map(nomes), [['Mersinho Lucena', 'Relator Geral'], ['Fundo Municipal de Saude', 'Associacao X']]);
  assert.equal(g.fluxos.reduce((s, f) => s + f.v, 0), 30);
  assert.equal(grafoDasEmendas(null), null);
});

test('eleitorado: aptos → compareceram ou abstenção → válidos, brancos e nulos', () => {
  const g = grafoDoEleitorado({ aptos: 100, comparecimento: 80, brancos: 5, nulos: 7 });
  assert.deepEqual(g.colunas.map(nomes), [['Aptos'], ['Compareceram', 'Abstenção'], ['Votos válidos', 'Nulos', 'Brancos']]);
  assert.equal(g.fluxos.find(f => f.para === 'validos').v, 68);
  assert.equal(g.fluxos.find(f => f.para === 'abstencao').v, 20);
  assert.equal(grafoDoEleitorado({ aptos: 0, comparecimento: 0, brancos: 0, nulos: 0 }), null);
});
