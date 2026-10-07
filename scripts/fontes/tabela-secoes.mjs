// Tabela seção → local de votação → bairro, gerada por scripts/gerar-secoes.mjs.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { arquivoDaTabelaDeSecoes } from '../eleicao/config.mjs';

// Gera a tabela do ano se ela ainda não existir. Devolve null se não for possível.
export async function carregarTabelaDeSecoes(ano) {
  const arquivo = arquivoDaTabelaDeSecoes(ano);
  if (!existsSync(arquivo)) gerarTabela(ano);
  return existsSync(arquivo) ? JSON.parse(await readFile(arquivo, 'utf8')) : null;
}

function gerarTabela(ano) {
  console.log(`  gerando a tabela de locais de votação de ${ano}…`);
  try {
    execFileSync(process.execPath, ['scripts/gerar-secoes.mjs', ano], { stdio: 'inherit' });
  } catch { /* o erro já saiu no terminal; sem tabela, o ano cai para a API */ }
}

// Seção que não está na tabela (criada depois, por exemplo) é achada pelo número do local de votação.
export function localizadorDeSecoes(tabela) {
  const porNumeroDoLocal = new Map(tabela.locais.map((local, i) => [`${local.zona}|${local.nr}`, i]));
  return (campos, colunas) => {
    const zona = campos[colunas.NR_ZONA];
    const daSecao = tabela.secoes[`${zona}|${campos[colunas.NR_SECAO]}`];
    if (daSecao != null) return daSecao;
    const numeroDoLocal = colunas.NR_LOCAL_VOTACAO != null ? campos[colunas.NR_LOCAL_VOTACAO] : '';
    return porNumeroDoLocal.get(`${zona}|${parseInt(numeroDoLocal, 10)}`);
  };
}
