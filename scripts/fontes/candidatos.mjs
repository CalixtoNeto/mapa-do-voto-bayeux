// Cadastro de candidatos do TSE (consulta_cand): perfil de quem disputou, com os bens declarados.
import { CDN, baixar, lerCsvsDoZip } from '../lib/tse.mjs';
import { porRegistro, campo } from '../lib/csv.mjs';
import { emReais } from '../lib/valores.mjs';
import { identificacao, ehDoAno } from '../analises/identificacao.mjs';
import { candidatoDoSite, chaveDoCandidato, arquivosDaEleicao } from '../analises/escopo.mjs';
import { perfilDoRegistro } from '../analises/perfil.mjs';
import { PASTA_DOWNLOADS } from '../eleicao/config.mjs';
import { bensViaCsv } from './bens.mjs';

export const novosCandidatos = () => ({ perfis: new Map(), escolhidos: new Map() });

export async function candidatosViaCsv(ano) {
  const zip = `${PASTA_DOWNLOADS}/consulta-cand-${ano}.zip`;
  if (!await baixar(`${CDN}/consulta_cand/consulta_cand_${ano}.zip`, zip)) return null;
  const candidatos = novosCandidatos();
  const alvos = arquivosDaEleicao('consulta_cand', ano).map(({ padrao, cargoAceito }) =>
    ({ padrao, aoLinha: leitorDeCandidatos({ ano, candidatos, cargoAceito }) }));
  if (!(await lerCsvsDoZip(zip, alvos))[0]) throw new Error(`o .zip não tem o arquivo da UF (${alvos[0].padrao})`);
  return perfisComBens(candidatos, await bensViaCsv(ano, cargoDoSequencial(candidatos)));
}

export function leitorDeCandidatos({ ano, candidatos, cargoAceito }) {
  return porRegistro({
    aoRegistro: (campos, colunas) => {
      const candidato = identificacao(campos, colunas);
      if (!ehDoAno(candidato, ano) || !cargoAceito(candidato.cargo) || !candidatoDoSite(candidato)) return;
      const turno = +campo(campos, colunas, 'NR_TURNO') || 1;
      const apto = /^APTO/i.test(campo(campos, colunas, 'DS_SITUACAO_CANDIDATURA'));
      registrar(candidatos, chaveDoCandidato(candidato), { ...candidato, turno, apto }, perfilDoRegistro(campos, colunas, +ano));
    },
  });
}

// O candidato aparece uma vez por turno; a situação final é a do último. Se dois sequenciais disputam a
// mesma chave (um substituto com o mesmo número), fica o que estava apto a receber votos.
function registrar({ perfis, escolhidos }, chave, candidato, perfil) {
  const anterior = escolhidos.get(chave);
  if (anterior && anterior.sq === candidato.sq) {
    if (candidato.turno > anterior.turno && perfil.s) { perfis.get(chave).s = perfil.s; anterior.turno = candidato.turno; }
    return;
  }
  if (anterior && (anterior.apto || !candidato.apto)) return;
  perfis.set(chave, perfil);
  escolhidos.set(chave, candidato);
}

const cargoDoSequencial = ({ escolhidos }) => new Map([...escolhidos.values()].map(c => [c.sq, c.cargo]));

export function perfisComBens({ perfis, escolhidos }, bensPorSequencial) {
  return Object.fromEntries([...perfis].map(([chave, perfil]) => {
    const bens = bensPorSequencial?.get(escolhidos.get(chave).sq);
    return [chave, bens ? { ...perfil, b: emReais(bens) } : perfil];
  }));
}
