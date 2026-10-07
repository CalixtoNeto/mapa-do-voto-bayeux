// API de resultados do TSE: só traz o total do município, sem seções. É a reserva enquanto o CSV
// por seção não sai; o site então mostra só o total da cidade (semBairros).
import { API, getJson, pad } from '../lib/tse.mjs';
import { inteiro } from '../lib/csv.mjs';
import { novaApuracao, chaveDoCargo } from '../eleicao/apuracao.mjs';
import { UF, MUNICIPIO_TSE, CARGOS_DA_API, CARGOS_COM_2_TURNO } from '../eleicao/config.mjs';

const TIPOS_DE_ELEICAO_DO_SITE = ['1', '3', '8'];
const uf = UF.toLowerCase();

export async function votacaoViaApi(ano, buscarJson = getJson) {
  const porTurno = {};
  for (const pedido of pedidosDoAno(await eleicoesDoAno(ano, buscarJson))) {
    await somarCargo({ ano, ...pedido, porTurno, buscarJson });
  }
  return Object.keys(porTurno).length ? { fonte: 'api', semBairros: true, partidos: {}, porTurno } : null;
}

async function eleicoesDoAno(ano, buscarJson) {
  const config = await buscarJson(`${API}/comum/config/ele-c.json`);
  return (config?.pl || []).filter(p => p.c === `ele${ano}`).flatMap(p => p.e)
    .filter(e => TIPOS_DE_ELEICAO_DO_SITE.includes(e.tp));
}

function* pedidosDoAno(eleicoes) {
  for (const eleicao of eleicoes) {
    const cargos = (eleicao.abr?.[0]?.cp || []).map(c => c.cd).filter(c => CARGOS_DA_API.includes(c));
    for (const [turno, codigoEleicao] of [['1', eleicao.cd], ['2', eleicao.cdt2]]) {
      if (!codigoEleicao) continue;
      const temTurno = cargo => turno === '1' || CARGOS_COM_2_TURNO.includes(cargo);
      for (const cargo of cargos.filter(temTurno)) yield { turno, cargo, codigoEleicao };
    }
  }
}

function urlDoResultado(ano, codigoEleicao, cargo) {
  const arquivo = `${uf}${MUNICIPIO_TSE}-c${pad(cargo, 4)}-e${pad(codigoEleicao, 6)}-u.json`;
  return `${API}/ele${ano}/${codigoEleicao}/dados/${uf}/${arquivo}`;
}

async function somarCargo({ ano, turno, cargo, codigoEleicao, porTurno, buscarJson }) {
  const resposta = await buscarJson(urlDoResultado(ano, codigoEleicao, cargo));
  const resultado = resposta?.carg?.[0];
  if (!resultado) return;                          // ainda não existe (por exemplo, 2º turno que não aconteceu)
  const apuracao = porTurno[turno] ||= { ...novaApuracao(), final: true, atualizadoEm: null };
  apuracao.final &&= resposta.and === 'f';
  apuracao.atualizadoEm = `${resposta.dg?.split('/').reverse().join('-')}T${resposta.hg}`;
  registrarCandidatos(apuracao, { ano, turno, cargo }, resultado);
  console.log(`  API ${ano} t${turno} cargo ${cargo}: ok`);
}

function registrarCandidatos(apuracao, { ano, turno, cargo }, resultado) {
  for (const agremiacao of resultado.agr || []) for (const partido of agremiacao.par || []) {
    for (const c of partido.cand || []) {
      const votos = inteiro(c.vap);
      if (!votos) continue;
      const key = `${chaveDoCargo(ano, turno, cargo)}|${c.sqcand}`;
      apuracao.cands.set(key, { key, ano, turno, cargo, cargoNome: resultado.nmn, nr: c.n, nome: c.nm, urna: c.nmu,
        partido: partido.sg || '', sit: c.st || '', total: votos, loc: {} });
    }
  }
}
