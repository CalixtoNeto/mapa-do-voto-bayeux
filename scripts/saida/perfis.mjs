// Os perfis ficam em public/data/perfis/: camara.json, emendas.json, um prefeitura-ANO.json por ano
// e o index.json que diz ao site o que existe.
import { writeFile, mkdir, readdir } from 'node:fs/promises';

export const PASTA_PERFIS = 'public/data/perfis';

export async function escreverPerfil(nome, dados) {
  await mkdir(PASTA_PERFIS, { recursive: true });
  await writeFile(`${PASTA_PERFIS}/${nome}.json`, JSON.stringify(dados));
  console.log(`  → ${PASTA_PERFIS}/${nome}.json`);
}

export async function indexarPerfis(atualizadoEm) {
  const arquivos = await readdir(PASTA_PERFIS).catch(() => []);
  const anos = arquivos.map(a => a.match(/^prefeitura-(\d{4})\.json$/)?.[1]).filter(Boolean).sort().reverse();
  const indice = { atualizadoEm, anos, camara: arquivos.includes('camara.json'), emendas: arquivos.includes('emendas.json') };
  await escreverPerfil('index', indice);
}
