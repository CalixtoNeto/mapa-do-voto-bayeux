// Golden master dos geradores: roda o script inteiro num cenário fixo e compara a saída com o que está
// gravado em test/fixtures/esperado/. Para regravar depois de uma mudança intencional:
//   ATUALIZAR_ESPERADO=1 npm test
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { montarCenario } from './fixtures/cenario.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const ESPERADO = join(RAIZ, 'test/fixtures/esperado');
const ARQUIVOS_GERADOS = ['secoes-2024.json', 'eleicoes/2024-t1.json', 'eleicoes/2026-t1.json', 'eleicoes/2026-t2.json',
  'eleicoes/index.json', 'eleicoes/pessoas.json'];

// Datas de geração mudam a cada execução; o resto da saída tem de ser idêntico.
function semDatasDeGeracao(json) {
  const dados = JSON.parse(json);
  if ('geradoEm' in dados) dados.geradoEm = '<data>';
  for (const item of [dados, ...(dados.eleicoes || [])]) if (item.fonte === 'csv') item.atualizadoEm = '<data>';
  return JSON.stringify(dados, null, 1) + '\n';
}

function rodarGerador(pasta) {
  execFileSync(process.execPath, [
    '--import', pathToFileURL(join(RAIZ, 'test/fixtures/fetch-falso.mjs')).href, 'scripts/gerar-dados.mjs', '2024', '2026', '--forcar',
  ], { cwd: pasta, env: { ...process.env, API_FALSA: join(pasta, 'api-falsa.json') }, stdio: 'pipe' });
}

test('os geradores produzem exatamente a saída gravada para 2024 (CSV) e 2026 (API)', async () => {
  const pasta = await montarCenario(RAIZ);
  try {
    rodarGerador(pasta);
    for (const arquivo of ARQUIVOS_GERADOS) {
      const gerado = semDatasDeGeracao(await readFile(join(pasta, 'public/data', arquivo), 'utf8'));
      const esperado = join(ESPERADO, arquivo.replace('/', '-'));
      if (process.env.ATUALIZAR_ESPERADO) {
        await mkdir(ESPERADO, { recursive: true });
        await writeFile(esperado, gerado);
      }
      assert.equal(gerado, await readFile(esperado, 'utf8'), arquivo);
    }
  } finally {
    await rm(pasta, { recursive: true, force: true });
  }
});
