import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reais } from '../../scripts/lib/valores.mjs';
import { origemDaReceita, ehRepasse } from '../../scripts/analises/receitas.mjs';

test('valores em reais aceitam vírgula decimal, ponto de milhar e ponto decimal', () => {
  assert.equal(reais('1500,50'), 1500.5);
  assert.equal(reais('1.234.567,89'), 1234567.89);
  assert.equal(reais('250.75'), 250.75);
  assert.equal(reais('#NULO#'), 0);
});

test('a fonte do recurso decide o fundo, mesmo vindo do partido', () => {
  assert.equal(origemDaReceita('Fundo Especial', 'Recursos de partido político'), 'fefc');
  assert.equal(origemDaReceita('FUNDO ESPECIAL', 'RECURSOS DE PARTIDO POLITICO'), 'fefc');
  assert.equal(origemDaReceita('Fundo Partidário', 'Recursos de partido político'), 'fp');
  assert.equal(origemDaReceita('Outros Recursos', 'Recursos de partido político'), 'part');
});

test('dinheiro de outro candidato fica separado, qualquer que seja a fonte', () => {
  assert.equal(origemDaReceita('Fundo Especial', 'Recursos de outros candidatos'), 'cand');
});

test('doações de pessoas, recursos próprios e o resto', () => {
  assert.equal(origemDaReceita('Outros Recursos', 'Recursos de pessoas físicas'), 'pf');
  assert.equal(origemDaReceita('Outros Recursos', 'Recursos de Financiamento Coletivo'), 'pf');
  assert.equal(origemDaReceita('Outros Recursos', 'Doações pela Internet'), 'pf');
  assert.equal(origemDaReceita('Outros Recursos', 'Recursos de pessoas jurídicas'), 'pj');
  assert.equal(origemDaReceita('Outros Recursos', 'Recursos próprios'), 'prop');
  assert.equal(origemDaReceita('Outros Recursos', 'Rendimentos de aplicações financeiras'), 'out');
});

test('doação a outro candidato ou partido é repasse, não gasto de campanha', () => {
  assert.equal(ehRepasse('Doações financeiras a outros candidatos/partidos'), true);
  assert.equal(ehRepasse('Transferência de recursos para outros candidatos'), true);
  assert.equal(ehRepasse('Publicidade por materiais impressos'), false);
});
