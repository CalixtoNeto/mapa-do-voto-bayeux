// Folha de pessoal (TCE-PB, servidores): uma linha por pessoa e mês. O CPF vem mascarado,
// então a remuneração de um político é achada pelo nome.
import { reaisDoTce } from '../fontes/tce-pb.mjs';
import { normalizarNome } from '../lib/texto.mjs';
import { centavos } from './somas.mjs';

export const novaFolha = () => ({ linhas: [], porNome: {} });

export function somarServidor(folha, ler) {
  const linha = { orgao: ler('DESCRICAO_UNIDADE_GESTORA'), tipo: ler('TIPO_CARGO'), mes: ler('ANO_MES'),
    nome: normalizarNome(ler('NOME_SERVIDOR')), cargo: ler('DESCRICAO_CARGO').replace(/^\d+\s*-\s*/, ''), v: reaisDoTce(ler('VALOR_VANTAGEM')) };
  folha.linhas.push(linha);
  (folha.porNome[linha.nome] ||= []).push(linha);
}

// Por grupo (órgão ou tipo de cargo): pessoas no último mês do arquivo e total pago no ano.
function porGrupo(linhas, grupoDe, ultimoMes) {
  const grupos = {};
  for (const l of linhas) {
    const g = (grupos[grupoDe(l)] ||= { pessoas: new Set(), total: 0 });
    g.total += l.v;
    if (l.mes === ultimoMes) g.pessoas.add(l.nome);
  }
  return Object.entries(grupos).map(([nome, g]) => [nome, g.pessoas.size, centavos(g.total)]).sort((a, b) => b[2] - a[2]);
}

function porMes(linhas) {
  const meses = {};
  for (const l of linhas) {
    const m = (meses[l.mes] ||= { pessoas: new Set(), total: 0 });
    m.pessoas.add(l.nome); m.total += l.v;
  }
  return Object.entries(meses).sort().map(([mes, m]) => [mes, m.pessoas.size, centavos(m.total)]);
}

export function resumoDaFolha({ linhas }) {
  const ultimoMes = linhas.reduce((max, l) => l.mes > max ? l.mes : max, '');
  return { orgaos: porGrupo(linhas, l => l.orgao, ultimoMes), tipos: porGrupo(linhas, l => l.tipo, ultimoMes), meses: porMes(linhas) };
}

// [[anoMes, valor, cargo, órgão]], somando as linhas do mesmo mês e órgão.
export function remuneracaoDe(folha, nome) {
  const meses = {};
  for (const l of folha.porNome[normalizarNome(nome)] || []) {
    const m = (meses[`${l.mes}|${l.orgao}`] ||= [l.mes, 0, l.cargo, l.orgao]);
    m[1] = centavos(m[1] + l.v);
  }
  return Object.values(meses).sort((a, b) => a[0].localeCompare(b[0]));
}
