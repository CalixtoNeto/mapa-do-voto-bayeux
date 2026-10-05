// Gera os dados do site a partir do TSE.
//   node scripts/gerar-dados.mjs historico [ano ...] [--forcar]   → public/data/historico/ANO-tTURNO.json (commitado, nunca mais muda)
//   node scripts/gerar-dados.mjs atual                            → public/data/atual/ANO-tTURNO.json (gerado pelo workflow, não commitado)
// Os bairros precisam de votos por seção eleitoral, e a API do TSE só entrega votos por município.
// Por isso a ordem aqui é: CSV por seção dos Dados Abertos (com bairros); se o TSE ainda não o publicou,
// usa a API e mostra só o total da cidade (semBairros) até o CSV sair.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { API, CDN, getJson, baixar, splitLine, lerCsvDoZip, pad } from './lib/tse.mjs';

const UF = 'PB', COD_TSE = '19372';
const ANOS_HISTORICO = ['2012', '2014', '2016', '2018', '2020', '2022', '2024'];
// cargos lidos e dígitos do número de um candidato (menos que isso é voto de legenda)
const MIN_DIG = { '3': 2, '5': 3, '6': 4, '7': 5, '13': 5 };
const CARGOS_API = ['1', '3', '5', '6', '7', '13'];
const COM_2_TURNO = ['1', '3'];

const [modo, ...resto] = process.argv.slice(2);
const forcar = resto.includes('--forcar');
const anosArg = resto.filter(a => /^\d{4}$/.test(a));
const tabelaDe = ano => `public/data/secoes-${ano}.json`;

// Tabela seção → local de votação → bairro (TSE, "Eleitorado por local de votação"); gera se faltar.
async function tabela(ano) {
  if (!existsSync(tabelaDe(ano))) {
    console.log(`  gerando a tabela de locais de votação de ${ano}…`);
    try { execFileSync(process.execPath, ['scripts/gerar-secoes.mjs', ano], { stdio: 'inherit' }); } catch (e) { return null; }
  }
  return existsSync(tabelaDe(ano)) ? JSON.parse(await readFile(tabelaDe(ano), 'utf8')) : null;
}

// ---------- CSV por seção (votação por seção eleitoral) ----------
async function viaCsv(ano) {
  if (process.env.TSE_SEM_CSV) return null;       // só para testar a reserva pela API
  const zip = `tmp/secao-${ano}-${UF}.zip`;
  if (!await baixar(`${CDN}/votacao_secao/votacao_secao_${ano}_${UF}.zip`, zip)) return null;
  const tab = await tabela(ano); if (!tab) return null;
  const idxLocal = new Map(tab.locais.map((l, k) => [l.zona + '|' + l.nr, k]));
  const REQ = ['ANO_ELEICAO', 'NR_TURNO', 'SG_UF', 'CD_MUNICIPIO', 'NR_ZONA', 'NR_SECAO', 'CD_CARGO', 'DS_CARGO', 'NR_VOTAVEL', 'NM_VOTAVEL', 'QT_VOTOS'];
  const porTurno = {}, partidos = {}, semLocal = new Set(); let ix = null;
  await lerCsvDoZip(zip, new RegExp(`_${UF}\\.csv$`, 'i'), (l, cab) => {
    if (cab) {
      const h = splitLine(l).map(x => x.trim().toUpperCase()); ix = Object.fromEntries(h.map((k, i) => [k, i]));
      const falta = REQ.filter(k => ix[k] == null); if (falta.length) throw new Error(`Colunas ausentes no CSV de ${ano}: ${falta.join(', ')}`);
      return;
    }
    if (l.indexOf(COD_TSE) < 0) return;
    const c = splitLine(l), cargo = c[ix.CD_CARGO], min = MIN_DIG[cargo];
    if (c[ix.SG_UF] !== UF || !min || c[ix.CD_MUNICIPIO] !== COD_TSE || c[ix.ANO_ELEICAO] !== ano) return;
    const turno = c[ix.NR_TURNO], tk = `${ano}|${turno}|${cargo}`, nr = c[ix.NR_VOTAVEL], v = parseInt(c[ix.QT_VOTOS], 10) || 0;
    const ds = porTurno[turno] ||= { cands: new Map(), tot: {}, esp: {} };
    if (nr.length < min || nr === '95' || nr === '96') {
      // 95 = branco, 96 = nulo, números curtos = voto de legenda (o nome é o do partido)
      const e = ds.esp[tk] ||= { branco: 0, nulo: 0, legenda: 0 };
      if (nr === '95') e.branco += v; else if (nr === '96') e.nulo += v; else e.legenda += v;
      if (nr.length === 2 && nr !== '95' && nr !== '96' && cargo !== '3') (partidos[nr] ||= c[ix.NM_VOTAVEL]);
      return;
    }
    const loc = tab.secoes[c[ix.NR_ZONA] + '|' + c[ix.NR_SECAO]] ?? idxLocal.get(c[ix.NR_ZONA] + '|' + parseInt(ix.NR_LOCAL_VOTACAO != null ? c[ix.NR_LOCAL_VOTACAO] : '', 10));
    if (loc == null) { semLocal.add(c[ix.NR_ZONA] + '|' + c[ix.NR_SECAO]); return; }
    const key = `${tk}|${nr}`;
    let k = ds.cands.get(key);
    if (!k) { k = { key, ano, turno, cargo, cargoNome: c[ix.DS_CARGO], nr, nome: c[ix.NM_VOTAVEL], total: 0, loc: {} }; ds.cands.set(key, k); }
    k.loc[loc] = (k.loc[loc] || 0) + v; k.total += v;
    (ds.tot[tk] ||= {})[loc] = (ds.tot[tk][loc] || 0) + v;
  });
  if (semLocal.size) console.warn(`  CSV ${ano}: ${semLocal.size} seções sem local na tabela`);
  if (!Object.keys(porTurno).length) return null;
  return { fonte: 'csv', semBairros: false, partidos: { [ano]: partidos }, porTurno };
}

// ---------- API de resultados (só por município: sem bairros) ----------
async function viaApi(ano) {
  const cfg = await getJson(`${API}/comum/config/ele-c.json`);
  const elei = (cfg?.pl || []).filter(p => p.c === `ele${ano}`).flatMap(p => p.e).filter(e => ['1', '3', '8'].includes(e.tp));
  const porTurno = {};
  for (const e of elei) {
    const cargos = (e.abr?.[0]?.cp || []).map(c => c.cd).filter(c => CARGOS_API.includes(c));
    for (const [turno, ele] of [['1', e.cd], ['2', e.cdt2]]) {
      if (!ele) continue;
      for (const cargo of cargos.filter(c => turno === '1' || COM_2_TURNO.includes(c))) {
        const j = await getJson(`${API}/ele${ano}/${ele}/dados/${UF.toLowerCase()}/${UF.toLowerCase()}${COD_TSE}-c${pad(cargo, 4)}-e${pad(ele, 6)}-u.json`);
        const car = j?.carg?.[0]; if (!car) continue;
        const ds = porTurno[turno] ||= { cands: new Map(), tot: {}, esp: {}, final: true, atualizadoEm: null };
        ds.final &&= j.and === 'f'; ds.atualizadoEm = `${j.dg?.split('/').reverse().join('-')}T${j.hg}`;
        const tk = `${ano}|${turno}|${cargo}`;
        for (const agr of car.agr || []) for (const par of agr.par || []) for (const c of par.cand || []) {
          const v = parseInt(c.vap, 10) || 0; if (!v) continue;
          const key = `${tk}|${c.sqcand}`;
          ds.cands.set(key, { key, ano, turno, cargo, cargoNome: car.nmn, nr: c.n, nome: c.nm, urna: c.nmu, partido: par.sg || '', sit: c.st || '', total: v, loc: {} });
        }
        console.log(`  API ${ano} t${turno} cargo ${cargo}: ok`);
      }
    }
  }
  return Object.keys(porTurno).length ? { fonte: 'api', semBairros: true, partidos: {}, porTurno } : null;
}

// ---------- Saída ----------
async function escrever(dir, ano, res) {
  await mkdir(dir, { recursive: true });
  for (const [turno, ds] of Object.entries(res.porTurno)) {
    const cands = [...ds.cands.values()].sort((a, b) => a.cargo.localeCompare(b.cargo) || b.total - a.total);
    const cargos = [...new Map(cands.map(c => [c.cargo, c.cargoNome])).entries()].map(([cd, nome]) => ({ cd, nome }));
    const doc = { ano, turno, municipio: COD_TSE, fonte: res.fonte, semBairros: res.semBairros, final: ds.final ?? true,
      atualizadoEm: ds.atualizadoEm || new Date().toISOString(), cargos, cands, tot: ds.tot, esp: ds.esp, partidos: res.partidos };
    await writeFile(`${dir}/${ano}-t${turno}.json`, JSON.stringify(doc));
    console.log(`  → ${dir}/${ano}-t${turno}.json (${cands.length} candidatos, fonte ${res.fonte}${res.semBairros ? ', sem bairros' : ''})`);
  }
  await indexar(dir);
}

// Índice que o site lê para listar as eleições disponíveis.
async function indexar(dir) {
  const eleicoes = [];
  for (const f of (await readdir(dir)).filter(f => /^\d{4}-t\d\.json$/.test(f)).sort()) {
    const d = JSON.parse(await readFile(`${dir}/${f}`, 'utf8'));
    eleicoes.push({ ano: d.ano, turno: d.turno, arquivo: f, cargos: d.cargos, fonte: d.fonte, semBairros: d.semBairros, final: d.final, atualizadoEm: d.atualizadoEm });
  }
  await writeFile(`${dir}/index.json`, JSON.stringify({ geradoEm: new Date().toISOString(), eleicoes }));
}

async function gerarCiclo(ano, dir) {
  console.log(`Ciclo ${ano}:`);
  let res = null;
  try { res = await viaCsv(ano); if (!res) console.log('  CSV por seção ainda não publicado; tentando a API (só total do município)'); }
  catch (e) { console.warn(`  CSV falhou (${e.message}); tentando a API`); }
  try { res ||= await viaApi(ano); } catch (e) { console.warn(`  API falhou (${e.message})`); }
  if (!res) { console.warn(`  sem dados para ${ano}`); return false; }
  await escrever(dir, ano, res);
  return true;
}

async function atual() {
  const dir = 'public/data/atual';
  const cfg = await getJson(`${API}/comum/config/ele-c.json`);
  const ciclo = [...new Set((cfg?.pl || []).map(p => p.c))].sort().pop()?.replace('ele', '');
  if (!ciclo) return console.warn('Não foi possível descobrir o ciclo atual; mantendo os dados em cache.');
  if (existsSync(`public/data/historico/${ciclo}-t1.json`)) return console.log(`Ciclo ${ciclo} já está no histórico; nada a fazer.`);
  // dados finais e já com bairros (cache do workflow) não precisam ser buscados de novo
  const idx = existsSync(`${dir}/index.json`) ? JSON.parse(await readFile(`${dir}/index.json`, 'utf8')) : null;
  const doCiclo = idx?.eleicoes?.filter(e => e.ano === ciclo) || [];
  if (doCiclo.length && doCiclo.every(e => e.final && !e.semBairros)) return console.log(`Ciclo ${ciclo}: dados finais já em cache.`);
  await gerarCiclo(ciclo, dir);
}

if (modo === 'historico') {
  const dir = 'public/data/historico';
  for (const ano of anosArg.length ? anosArg : ANOS_HISTORICO) {
    if (!forcar && existsSync(`${dir}/${ano}-t1.json`)) { console.log(`Ciclo ${ano}: já existe no histórico (use --forcar para refazer)`); continue; }
    await gerarCiclo(ano, dir);
  }
} else if (modo === 'atual') {
  await atual();
} else {
  console.error('Uso: node scripts/gerar-dados.mjs historico [ano ...] [--forcar]  |  node scripts/gerar-dados.mjs atual');
  process.exitCode = 1;
}
