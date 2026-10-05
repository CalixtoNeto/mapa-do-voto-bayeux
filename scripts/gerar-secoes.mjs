// Gera public/data/secoes-ANO.json: para cada seção eleitoral de Bayeux, o local de votação,
// o bairro e as coordenadas (TSE, "Eleitorado por local de votação").
// Uso: npm run secoes [ano ...]   (padrão: eleições municipais e gerais de 2012 a 2024)
import { createReadStream, existsSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { Unzip, UnzipInflate } from 'fflate';

const UF = 'PB', COD_TSE = '19372';
const ANOS = process.argv.slice(2).length ? process.argv.slice(2) : ['2012', '2014', '2016', '2018', '2020', '2022', '2024'];
const url = ano => `https://cdn.tse.jus.br/estatistica/sead/odsele/eleitorado_locais_votacao/eleitorado_local_votacao_${ano}.zip`;

const NORM = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();

function splitLine(s) {
  const out = []; let i = 0; const n = s.length;
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

async function baixar(ano) {
  const arq = `tmp/local-votacao-${ano}.zip`;
  if (!existsSync(arq)) {
    console.log(`Baixando ${url(ano)}`);
    const r = await fetch(url(ano));
    if (!r.ok) throw new Error(`TSE respondeu ${r.status} para ${ano}`);
    await writeFile(arq, Buffer.from(await r.arrayBuffer()));
  }
  return arq;
}

// Lê o CSV dentro do zip em streaming e devolve só as linhas de Bayeux.
async function linhasDeBayeux(arq) {
  const linhas = []; let header = null, ix = null;
  const dec = new TextDecoder('windows-1252'); let buf = '';
  const tratar = l => {
    if (l.endsWith('\r')) l = l.slice(0, -1);
    if (!l) return;
    if (!header) { header = splitLine(l).map(x => x.trim().toUpperCase()); ix = Object.fromEntries(header.map((k, i) => [k, i])); return; }
    if (l.indexOf(`"${COD_TSE}"`) < 0) return;
    const c = splitLine(l);
    if (c[ix.SG_UF] === UF && c[ix.CD_MUNICIPIO] === COD_TSE) linhas.push(c);
  };
  const feed = (chunk, final) => {
    buf += chunk && chunk.length ? dec.decode(chunk, { stream: !final }) : (final ? dec.decode() : '');
    let ini = 0, nl;
    while ((nl = buf.indexOf('\n', ini)) >= 0) { tratar(buf.slice(ini, nl)); ini = nl + 1; }
    buf = buf.slice(ini);
    if (final && buf) { tratar(buf); buf = ''; }
  };
  const uz = new Unzip(); uz.register(UnzipInflate);
  let achou = false;
  uz.onfile = f => {
    if (!/\.csv$/i.test(f.name)) return;
    achou = true; f.ondata = (err, chunk, final) => { if (err) throw err; feed(chunk, final); }; f.start();
  };
  for await (const chunk of createReadStream(arq)) uz.push(new Uint8Array(chunk), false);
  uz.push(new Uint8Array(0), true);
  if (!achou) throw new Error(`Sem CSV dentro de ${arq}`);
  return { linhas, ix };
}

const contorno = JSON.parse(await readFile('public/data/bayeux.geo.json', 'utf8'));
const pts = contorno.features[0].geometry.coordinates.flat(contorno.features[0].geometry.type === 'Polygon' ? 1 : 2);
const M = 0.02;
const BB = [Math.min(...pts.map(p => p[0])) - M, Math.min(...pts.map(p => p[1])) - M, Math.max(...pts.map(p => p[0])) + M, Math.max(...pts.map(p => p[1])) + M];
const dentro = (lon, lat) => lon >= BB[0] && lon <= BB[2] && lat >= BB[1] && lat <= BB[3];

await mkdir('tmp', { recursive: true });
await mkdir('public/data', { recursive: true });

for (const ano of ANOS) {
  const { linhas, ix } = await linhasDeBayeux(await baixar(ano));
  const falta = ['NR_ZONA', 'NR_SECAO', 'NR_LOCAL_VOTACAO', 'NM_LOCAL_VOTACAO', 'NM_BAIRRO'].filter(k => ix[k] == null);
  if (falta.length) throw new Error(`${ano}: colunas ausentes ${falta.join(', ')}`);
  const turno1 = linhas.filter(c => ix.NR_TURNO == null || c[ix.NR_TURNO] === '1');

  // Grafia mais frequente de cada bairro (as variações de acento e caixa se juntam)
  const freq = new Map();
  for (const c of turno1) { const raw = c[ix.NM_BAIRRO].trim(), k = NORM(raw); if (!k) continue; const m = freq.get(k) || new Map(); m.set(raw, (m.get(raw) || 0) + 1); freq.set(k, m); }
  const canon = new Map([...freq].map(([k, m]) => [k, [...m].sort((a, b) => b[1] - a[1])[0][0]]));

  const locais = [], porLocal = new Map(), secoes = {}; let semBairro = 0, semCoord = 0;
  for (const c of turno1) {
    const zona = c[ix.NR_ZONA], secao = c[ix.NR_SECAO], nr = c[ix.NR_LOCAL_VOTACAO], lk = zona + '|' + nr;
    if (!porLocal.has(lk)) {
      const bairro = canon.get(NORM(c[ix.NM_BAIRRO])) || '';
      const lat = parseFloat(c[ix.NR_LATITUDE]), lon = parseFloat(c[ix.NR_LONGITUDE]);
      const ok = Number.isFinite(lat) && Number.isFinite(lon) && dentro(lon, lat);
      if (!bairro) semBairro++; if (!ok) semCoord++;
      porLocal.set(lk, locais.length);
      locais.push({ zona: +zona, nr: +nr, nome: c[ix.NM_LOCAL_VOTACAO].trim(), endereco: (c[ix.DS_ENDERECO] || '').trim(), bairro,
        lat: ok ? lat : null, lon: ok ? lon : null, eleitores: 0 });
    }
    const i = porLocal.get(lk);
    locais[i].eleitores += parseInt(c[ix.QT_ELEITOR_SECAO], 10) || 0;
    secoes[zona + '|' + secao] = i;
  }
  const bairros = new Set(locais.map(l => l.bairro).filter(Boolean));
  await writeFile(`public/data/secoes-${ano}.json`, JSON.stringify({ ano: +ano, municipio: COD_TSE, locais, secoes }));
  console.log(`${ano}: ${Object.keys(secoes).length} seções, ${locais.length} locais, ${bairros.size} bairros, ${semBairro} locais sem bairro, ${semCoord} sem coordenadas`);
}
