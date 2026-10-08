// Arquivos das análises, ao lado dos de votação: ANO-candidatos.json (perfil e bens), ANO-financas.json
// (dinheiro de campanha), ANO-tTURNO-comparecimento.json e ANO-eleitorado.json (perfil do eleitorado por lugar).
// analises.json diz o que existe de cada ano; patrimonio.json e dinheiro.json ligam os bens e o dinheiro de
// campanha da mesma pessoa entre eleições.
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { registrarPatrimonio, patrimonioRecorrente } from '../analises/patrimonio.mjs';
import { registrarDinheiro } from '../analises/trajetoria-dinheiro.mjs';

const escreverJson = (arquivo, dados) => writeFile(arquivo, JSON.stringify(dados));

export async function escreverAnalises(pasta, ano, { perfis, financas, comparecimento, eleitorado }) {
  await mkdir(pasta, { recursive: true });
  if (perfis) await escreverJson(`${pasta}/${ano}-candidatos.json`, { ano, c: perfis });
  if (financas) await escreverJson(`${pasta}/${ano}-financas.json`, financas);
  if (eleitorado) await escreverJson(`${pasta}/${ano}-eleitorado.json`, { ano, lugares: eleitorado });
  for (const [turno, cargos] of Object.entries(comparecimento || {})) {
    await escreverJson(`${pasta}/${ano}-t${turno}-comparecimento.json`, { ano, turno, cargos });
  }
  const feitos = [perfis && 'candidatos', financas && 'finanças', comparecimento && 'comparecimento', eleitorado && 'eleitorado']
    .filter(Boolean);
  console.log(`  → análises de ${ano}: ${feitos.join(', ') || 'nada'}`);
}

const ARQUIVO_DE_ANALISE = /^(\d{4})-(?:(candidatos|financas|eleitorado)|t(\d)-comparecimento)\.json$/;

export function entradaDasAnalises(arquivos) {
  const anos = {};
  for (const [, ano, tipo, turno] of arquivos.sort().map(a => a.match(ARQUIVO_DE_ANALISE)).filter(Boolean)) {
    const doAno = anos[ano] ||= {};
    if (tipo) doAno[tipo] = true;
    else (doAno.comparecimento ||= []).push(turno);
  }
  return anos;
}

export async function indexarAnalises(pasta) {
  const anos = entradaDasAnalises(await readdir(pasta)), patrimonio = {}, dinheiro = {};
  const lerAno = arquivo => readFile(`${pasta}/${arquivo}`, 'utf8').then(JSON.parse);
  for (const ano of Object.keys(anos).filter(a => existsSync(`${pasta}/${a}-t1.json`))) {
    const { cands } = await lerAno(`${ano}-t1.json`);
    if (anos[ano].candidatos) registrarPatrimonio(patrimonio, ano, cands, (await lerAno(`${ano}-candidatos.json`)).c);
    if (anos[ano].financas) registrarDinheiro(dinheiro, ano, cands, (await lerAno(`${ano}-financas.json`)).c);
  }
  await escreverJson(`${pasta}/patrimonio.json`, patrimonioRecorrente(patrimonio));
  await escreverJson(`${pasta}/dinheiro.json`, patrimonioRecorrente(dinheiro));
  await escreverJson(`${pasta}/analises.json`, { geradoEm: new Date().toISOString(), anos });
}
