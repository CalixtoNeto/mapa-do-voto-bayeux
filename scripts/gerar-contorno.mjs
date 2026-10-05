// Gera public/data/bayeux.geo.json a partir da malha municipal do IBGE.
// Uso: npm run contorno
import { writeFile, mkdir } from 'node:fs/promises';

const COD_IBGE = '2501807';
const API = 'https://servicodados.ibge.gov.br/api';

const info = await (await fetch(`${API}/v1/localidades/municipios/${COD_IBGE}`)).json();
if (info.nome !== 'Bayeux') throw new Error(`Código ${COD_IBGE} não é Bayeux (veio ${info.nome})`);

const url = `${API}/v3/malhas/municipios/${COD_IBGE}?formato=application/vnd.geo+json&qualidade=maxima`;
const geo = await (await fetch(url)).json();

const arred = c => Array.isArray(c[0]) ? c.map(arred) : c.map(n => Math.round(n * 1e5) / 1e5);
const f = geo.features[0];
const saida = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: { id: COD_IBGE, name: info.nome }, geometry: { type: f.geometry.type, coordinates: arred(f.geometry.coordinates) } }],
};

await mkdir('public/data', { recursive: true });
await writeFile('public/data/bayeux.geo.json', JSON.stringify(saida));
console.log(`Contorno de ${info.nome} gerado em public/data/bayeux.geo.json (${f.geometry.type})`);
