// Um arquivo por turno: ANO-tTURNO.json.
import { writeFile, mkdir } from 'node:fs/promises';
import { MUNICIPIO_TSE } from '../eleicao/config.mjs';
import { indexar } from './indice.mjs';

export async function escreverEleicao(pasta, ano, votacao) {
  await mkdir(pasta, { recursive: true });
  for (const [turno, apuracao] of Object.entries(votacao.porTurno)) {
    const resumo = resumoDoTurno(ano, turno, votacao, apuracao, new Date());
    await writeFile(`${pasta}/${ano}-t${turno}.json`, JSON.stringify(resumo));
    const detalhe = `fonte ${votacao.fonte}${votacao.semBairros ? ', sem bairros' : ''}`;
    console.log(`  → ${pasta}/${ano}-t${turno}.json (${resumo.cands.length} candidatos, ${detalhe})`);
  }
  await indexar(pasta);
}

export function resumoDoTurno(ano, turno, { fonte, semBairros, partidos }, apuracao, agora) {
  const cands = [...apuracao.cands.values()].sort((a, b) => a.cargo.localeCompare(b.cargo) || b.total - a.total);
  const cargos = [...new Map(cands.map(c => [c.cargo, c.cargoNome])).entries()].map(([cd, nome]) => ({ cd, nome }));
  const final = apuracao.final ?? true, atualizadoEm = apuracao.atualizadoEm || agora.toISOString();
  const { tot, esp } = apuracao, municipio = MUNICIPIO_TSE;
  return { ano, turno, municipio, fonte, semBairros, final, atualizadoEm, cargos, cands, tot, esp, partidos };
}
