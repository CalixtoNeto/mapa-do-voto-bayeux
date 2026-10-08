// Golden master do gerador de análises, no mesmo cenário de Bayeux do gerador de votação (2024).
// Para regravar depois de uma mudança intencional: ATUALIZAR_ESPERADO=1 npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { montarCenario } from './fixtures/cenario.mjs';
import { acrescentarAnalises } from './fixtures/cenario-analises.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const ESPERADO = join(RAIZ, 'test/fixtures/esperado/analises');
const ARQUIVOS_GERADOS = ['2024-candidatos.json', '2024-financas.json', '2024-t1-comparecimento.json', '2024-eleitorado.json',
  'analises.json', 'patrimonio.json', 'dinheiro.json'];

function semDataDeGeracao(json) {
  const dados = JSON.parse(json);
  if ('geradoEm' in dados) dados.geradoEm = '<data>';
  return JSON.stringify(dados, null, 1) + '\n';
}

function rodar(pasta, script) {
  execFileSync(process.execPath, ['--import', join(RAIZ, 'test/fixtures/fetch-falso.mjs'), script, '2024', '--forcar'],
    { cwd: pasta, env: { ...process.env, API_FALSA: join(pasta, 'api-falsa.json') }, stdio: 'pipe' });
}

test('o gerador de análises produz exatamente a saída gravada para 2024', async () => {
  const pasta = await montarCenario(RAIZ);
  try {
    await acrescentarAnalises(pasta);
    rodar(pasta, 'scripts/gerar-dados.mjs');
    rodar(pasta, 'scripts/gerar-analises.mjs');
    for (const arquivo of ARQUIVOS_GERADOS) {
      const gerado = semDataDeGeracao(await readFile(join(pasta, 'public/data/eleicoes', arquivo), 'utf8'));
      if (process.env.ATUALIZAR_ESPERADO) {
        await mkdir(ESPERADO, { recursive: true });
        await writeFile(join(ESPERADO, arquivo), gerado);
      }
      assert.equal(gerado, await readFile(join(ESPERADO, arquivo), 'utf8'), arquivo);
    }
  } finally {
    await rm(pasta, { recursive: true, force: true });
  }
});
