// Arquivos das análises, ao lado dos de votação: ANO-candidatos.json (perfil e bens), ANO-financas.json
// (dinheiro de campanha) e ANO-tTURNO-comparecimento.json. analises.json diz o que existe de cada ano e
// patrimonio.json liga os bens da mesma pessoa entre eleições.
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { registrarPatrimonio, patrimonioRecorrente } from '../analises/patrimonio.mjs';

const escreverJson = (arquivo, dados) => writeFile(arquivo, JSON.stringify(dados));

export async function escreverAnalises(pasta, ano, { perfis, financas, comparecimento }) {
  await mkdir(pasta, { recursive: true });
  if (perfis) await escreverJson(`${pasta}/${ano}-candidatos.json`, { ano, c: perfis });
  if (financas) await escreverJson(`${pasta}/${ano}-financas.json`, financas);
  for (const [turno, cargos] of Object.entries(comparecimento || {})) {
    await escreverJson(`${pasta}/${ano}-t${turno}-comparecimento.json`, { ano, turno, cargos });
  }
  const feitos = [perfis && 'candidatos', financas && 'finanças', comparecimento && 'comparecimento'].filter(Boolean);
  console.log(`  → análises de ${ano}: ${feitos.join(', ') || 'nada'}`);
}

const ARQUIVO_DE_ANALISE = /^(\d{4})-(?:(candidatos|financas)|t(\d)-comparecimento)\.json$/;

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
  const anos = entradaDasAnalises(await readdir(pasta)), patrimonio = {};
  for (const ano of Object.keys(anos).filter(a => anos[a].candidatos)) {
    if (!existsSync(`${pasta}/${ano}-t1.json`)) continue;
    const { cands } = JSON.parse(await readFile(`${pasta}/${ano}-t1.json`, 'utf8'));
    const { c: perfis } = JSON.parse(await readFile(`${pasta}/${ano}-candidatos.json`, 'utf8'));
    registrarPatrimonio(patrimonio, ano, cands, perfis);
  }
  await escreverJson(`${pasta}/patrimonio.json`, patrimonioRecorrente(patrimonio));
  await escreverJson(`${pasta}/analises.json`, { geradoEm: new Date().toISOString(), anos });
}
