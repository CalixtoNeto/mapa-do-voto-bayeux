import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ramoDaArvore, arvoreDoGasto } from '../../public/js/calculos-arvore.mjs';

test('ramo da árvore no caminho escolhido; caminho que não existe para no último ramo achado', () => {
  const arvore = { v: 190, filhos: [['Saúde', 160, [['Material', 160, [['FARMACIA', 160]]]]], ['Educação', 30]] };
  assert.deepEqual(ramoDaArvore(arvore, []), { valor: 190, filhos: arvore.filhos });
  assert.deepEqual(ramoDaArvore(arvore, ['Saúde', 'Material']), { valor: 160, filhos: [['FARMACIA', 160]] });
  assert.deepEqual(ramoDaArvore(arvore, ['Educação']), { valor: 30, filhos: [] });
});

test('gasto da campanha como árvore: categoria e quem recebeu nela', () => {
  const dc = [['Impressos', 700, [['GRAFICA', 500], ['Outros (2)', 200]]], ['Pessoal', 300]];
  const arvore = arvoreDoGasto(dc);
  assert.equal(arvore.v, 1000);
  assert.deepEqual(ramoDaArvore(arvore, ['Impressos']), { valor: 700, filhos: [['GRAFICA', 500], ['Outros (2)', 200]] });
});
