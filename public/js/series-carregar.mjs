// Carrega os arquivos de cada eleição para as séries do panorama (abstenção, 1º e 2º colocados, eleitorado por lugar).
// Eleição sem o arquivo fica de fora da série. cfg.base é a pasta dos dados; cfg.carregarAno(ano) prepara a tabela de lugares de um ano.
import { titleCase } from './formato.mjs';
import { lerJson } from './dados-analises.mjs';
import { somaDoComparecimento } from './calculos.mjs';
import { doisPrimeiros } from './calculos-votos.mjs';

export const CARGO_DO_TIPO = { municipal: '11', geral: '3' };

async function primeirosTurnos(base) {
  const indice = await lerJson(`${base}/index.json`);
  return (indice?.eleicoes || []).filter(e => e.turno === '1');
}

export async function carregarComparecimentos(cfg) {
  const lista = [];
  for (const e of await primeirosTurnos(cfg.base)) {
    const arquivo = await lerJson(`${cfg.base}/${e.ano}-t1-comparecimento.json`);
    for (const [tipo, cargo] of Object.entries(CARGO_DO_TIPO)) {
      if (arquivo?.cargos?.[cargo]) lista.push({ ano: e.ano, tipo, cargo, ...somaDoComparecimento(arquivo.cargos[cargo]) });
    }
  }
  return lista;
}

export async function carregarColocados(cfg) {
  const lista = [];
  for (const e of (await primeirosTurnos(cfg.base)).filter(x => x.cargos.some(c => c.cd === CARGO_DO_TIPO.municipal))) {
    const dados = await lerJson(`${cfg.base}/${e.ano}-t1.json`);
    const cands = (dados?.cands || []).filter(c => c.cargo === CARGO_DO_TIPO.municipal);
    if (cands.length) lista.push({ ano: e.ano, ...doisPrimeiros(cands) });
  }
  return lista;
}

// { porAno: { ano: { lugar: eleitores } }, nomes: { lugar: nome } }; o nome vem do ano mais recente em que o lugar existe.
export async function carregarEleitoradoPorLugar(cfg) {
  const porAno = {}, nomes = {};
  for (const e of await primeirosTurnos(cfg.base)) {
    const arquivo = await lerJson(`${cfg.base}/${e.ano}-eleitorado.json`);
    if (!arquivo) continue;
    await cfg.carregarAno(e.ano);
    const lugares = cfg.agrupar(e.ano, arquivo.lugares);
    porAno[e.ano] = Object.fromEntries(Object.entries(lugares).map(([k, n]) => [k, n[0]]));
    for (const k of Object.keys(lugares)) nomes[k] = titleCase(cfg.nomeDoLugar(k, { ano: e.ano }));
  }
  return { porAno, nomes };
}
