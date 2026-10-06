// Utilitários para falar com o TSE sem sobrecarregar os servidores:
// poucas requisições em paralelo, retentativa com espera e cache em disco dos arquivos grandes.
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

// Executa fn sobre os itens com no máximo `limite` chamadas simultâneas.
export async function paralelo(itens, limite, fn) {
  const saida = new Array(itens.length); let prox = 0;
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, async () => {
    while (prox < itens.length) { const i = prox++; saida[i] = await fn(itens[i], i); }
  }));
  return saida;
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

// Linha de CSV do TSE (campos entre aspas, separados por ponto e vírgula).
export function splitLine(s) {
  const out = []; const n = s.length; let i = 0;
  while (i <= n) {
    if (s.charCodeAt(i) === 34) {
      let j = i + 1, val = '';
      for (;;) {
        const q = s.indexOf('"', j);
        if (q < 0) { val += s.slice(j); j = n; break; }
        val += s.slice(j, q);
        if (s.charCodeAt(q + 1) === 34) { val += '"'; j = q + 2; } else { j = q + 1; break; }
      }
      out.push(val); i = j + 1;
    } else {
      let q = s.indexOf(';', i); if (q < 0) q = n;
      out.push(s.slice(i, q)); i = q + 1;
    }
  }
  return out;
}

// Lê, em streaming e numa só passada, os CSVs de dentro de um .zip.
// alvos: [{ padrao: /_PB\.csv$/, aoLinha(linha, cabecalho) }]. Cada arquivo tem o seu próprio cabeçalho.
export async function lerCsvsDoZip(zip, alvos) {
  const dec = new TextDecoder('windows-1252');
  const achou = new Set();
  const uz = new Unzip(); uz.register(UnzipInflate);
  uz.onfile = f => {
    const alvo = alvos.find(a => a.padrao.test(f.name.split('/').pop()));
    if (!alvo) return;
    achou.add(alvo); let buf = '', primeira = true;
    const tratar = l => { if (l.endsWith('\r')) l = l.slice(0, -1); if (!l) return; alvo.aoLinha(l, primeira); primeira = false; };
    f.ondata = (err, chunk, fim) => {
      if (err) throw err;
      buf += chunk && chunk.length ? dec.decode(chunk, { stream: !fim }) : (fim ? dec.decode() : '');
      let ini = 0, nl;
      while ((nl = buf.indexOf('\n', ini)) >= 0) { tratar(buf.slice(ini, nl)); ini = nl + 1; }
      buf = buf.slice(ini);
      if (fim && buf) { tratar(buf); buf = ''; }
    };
    f.start();
  };
  for await (const chunk of createReadStream(zip)) uz.push(new Uint8Array(chunk), false);
  uz.push(new Uint8Array(0), true);
  return alvos.map(a => achou.has(a));        // quais arquivos foram encontrados
}

// Caso comum: um único CSV.
export async function lerCsvDoZip(zip, padrao, aoLinha) {
  const [achou] = await lerCsvsDoZip(zip, [{ padrao, aoLinha }]);
  if (!achou) throw new Error(`Nenhum arquivo ${padrao} dentro de ${zip}`);
}

export const pad = (n, d) => String(n).padStart(d, '0');
