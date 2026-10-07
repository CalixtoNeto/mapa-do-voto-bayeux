// Pré-carregado com `node --import`: troca o fetch global por respostas lidas de um JSON (URL → corpo).
// URL fora do arquivo responde 404, que é como o TSE responde a um arquivo que ainda não existe.
import { readFileSync } from 'node:fs';

const respostas = JSON.parse(readFileSync(process.env.API_FALSA, 'utf8'));
globalThis.fetch = async url => {
  const corpo = respostas[String(url)];
  return corpo ? Response.json(corpo) : new Response('não encontrado', { status: 404 });
};
