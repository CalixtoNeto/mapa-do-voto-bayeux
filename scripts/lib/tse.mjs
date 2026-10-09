// Utilitários para falar com o TSE sem sobrecarregar os servidores:
// retentativa com espera e cache em disco dos arquivos grandes.
import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { dirname } from 'node:path';
import { Unzip, UnzipInflate } from 'fflate';

export const API = 'https://resultados.tse.jus.br/oficial';
export const CDN = 'https://cdn.tse.jus.br/estatistica/sead/odsele';
const UA = 'mapa-do-voto/1.0 (coleta em workflow do GitHub Actions; github.com/CalixtoNeto)';
const dormir = ms => new Promise(r => setTimeout(r, ms));

// GET em JSON. Devolve null quando o arquivo não existe (404); tenta de novo em erro de rede, 429 e 5xx.
export async function getJson(url, { tentativas = 4, esperaMs = 1500 } = {}) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
      if (r.status === 404) return null;
      if (r.ok) return await r.json();
      if (r.status !== 429 && r.status < 500) throw new Error(`HTTP ${r.status}`);
      if (i >= tentativas) throw new Error(`HTTP ${r.status} após ${tentativas} tentativas`);
    } catch (e) {
      if (i >= tentativas) throw new Error(`${e.message} em ${url}`);
    }
    await dormir(esperaMs * i);
  }
}

// Baixa um arquivo grande para o disco (reaproveita o que já foi baixado). Devolve false se o TSE responder 404.
export async function baixar(url, destino) {
  if (existsSync(destino)) return true;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (r.status === 404) return false;
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  await mkdir(dirname(destino), { recursive: true });
  await pipeline(Readable.fromWeb(r.body), createWriteStream(destino + '.parcial'));
  const { rename } = await import('node:fs/promises');
  await rename(destino + '.parcial', destino);
  return true;
}

// Lê, em streaming e numa só passada, os CSVs de dentro de um .zip (os do TSE vêm em Windows-1252).
// alvos: [{ padrao: /_PB\.csv$/, aoLinha(linha, ehCabecalho) }]. Cada arquivo tem o seu próprio cabeçalho.
// Devolve, para cada alvo, se algum arquivo do .zip correspondeu a ele.
export async function lerCsvsDoZip(zip, alvos, { codificacao = 'windows-1252' } = {}) {
  const encontrados = new Set();
  const descompactador = new Unzip();
  descompactador.register(UnzipInflate);
  descompactador.onfile = arquivo => {
    const alvo = alvos.find(a => a.padrao.test(arquivo.name.split('/').pop()));
    if (!alvo) return;
    encontrados.add(alvo);
    arquivo.ondata = juntarEmLinhas(alvo.aoLinha, codificacao);
    arquivo.start();
  };
  for await (const pedaco of createReadStream(zip)) descompactador.push(new Uint8Array(pedaco), false);
  descompactador.push(new Uint8Array(0), true);
  return alvos.map(a => encontrados.has(a));
}

// Os pedaços descompactados cortam linhas ao meio; o que sobra depois do último \n espera o próximo pedaço.
function juntarEmLinhas(aoLinha, codificacao) {
  const decodificador = new TextDecoder(codificacao);
  const entregar = entregadorDeLinhas(aoLinha);
  let resto = '';
  return (erro, pedaco, fim) => {
    if (erro) throw erro;
    resto += pedaco?.length ? decodificador.decode(pedaco, { stream: !fim }) : (fim ? decodificador.decode() : '');
    const linhas = resto.split('\n');
    resto = fim ? '' : linhas.pop();
    linhas.forEach(entregar);
  };
}

function entregadorDeLinhas(aoLinha) {
  let ehCabecalho = true;
  return linha => {
    if (linha.endsWith('\r')) linha = linha.slice(0, -1);
    if (!linha) return;
    aoLinha(linha, ehCabecalho);
    ehCabecalho = false;
  };
}

export const pad = (n, d) => String(n).padStart(d, '0');

// Caso comum: um único CSV, que tem de existir.
export async function lerCsvDoZip(zip, padrao, aoLinha) {
  const [achou] = await lerCsvsDoZip(zip, [{ padrao, aoLinha }]);
  if (!achou) throw new Error(`Nenhum arquivo ${padrao} dentro de ${zip}`);
}
