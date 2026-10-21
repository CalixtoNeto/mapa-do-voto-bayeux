// Votação por seção eleitoral, dos Dados Abertos do TSE. É a única fonte que permite somar por bairro:
// cada seção soma seus votos no local de votação onde funciona.
import { CDN, baixar, lerCsvDoZip } from '../lib/tse.mjs';
import { porRegistro, inteiro } from '../lib/csv.mjs';
import { novaApuracao, chaveDoCargo, somarVotoNoLocal, somarVotoEspecial, ehBrancoOuNulo }
  from '../eleicao/apuracao.mjs';
import { UF, MUNICIPIO_TSE, DIGITOS_DO_CANDIDATO, PASTA_DOWNLOADS, ehPresidente, anoTemPresidente } from '../eleicao/config.mjs';
import { carregarTabelaDeSecoes, localizadorDeSecoes } from './tabela-secoes.mjs';

const COLUNAS_OBRIGATORIAS = ['ANO_ELEICAO', 'NR_TURNO', 'SG_UF', 'CD_MUNICIPIO', 'NR_ZONA', 'NR_SECAO', 'CD_CARGO',
  'DS_CARGO', 'NR_VOTAVEL', 'NM_VOTAVEL', 'QT_VOTOS'];

export async function votacaoViaCsv(ano) {
  if (process.env.TSE_SEM_CSV) return null;       // só para testar a reserva pela API
  const zip = `${PASTA_DOWNLOADS}/secao-${ano}-${UF}.zip`;
  if (!await baixar(`${CDN}/votacao_secao/votacao_secao_${ano}_${UF}.zip`, zip)) return null;
  const tabela = await carregarTabelaDeSecoes(ano);
  if (!tabela) return null;
  const porTurno = {}, partidos = {}, semLocal = new Set();
  const localDaSecao = localizadorDeSecoes(tabela);
  const leitor = cargoAceito => leitorDeVotosPorSecao({ ano, localDaSecao, porTurno, partidos, semLocal, cargoAceito });
  await lerCsvDoZip(zip, new RegExp(`_${UF}\\.csv$`, 'i'), leitor(cargo => !ehPresidente(cargo)));
  if (anoTemPresidente(ano)) await lerPresidente(ano, leitor(ehPresidente));
  if (semLocal.size) console.warn(`  CSV ${ano}: ${semLocal.size} seções sem local na tabela`);
  if (!Object.keys(porTurno).length) return null;
  return { fonte: 'csv', semBairros: false, partidos: { [ano]: partidos }, porTurno };
}

// O CSV da UF não traz o presidente: os votos dele por seção vêm num arquivo nacional separado, que pode não existir ainda.
async function lerPresidente(ano, aoLinha) {
  try {
    const zip = `${PASTA_DOWNLOADS}/secao-${ano}-BR.zip`;
    if (await baixar(`${CDN}/votacao_secao/votacao_secao_${ano}_BR.zip`, zip)) await lerCsvDoZip(zip, /_BR\.csv$/i, aoLinha);
    else console.warn(`  presidente ${ano}: arquivo nacional por seção ainda não publicado`);
  } catch (e) { console.warn(`  presidente ${ano}: arquivo nacional por seção indisponível (${e.message})`); }
}

// cargoAceito: cada arquivo só lê os cargos que lhe cabem (o da UF não tem o presidente; o nacional só tem o presidente).
export function leitorDeVotosPorSecao({ ano, localDaSecao, porTurno, partidos, semLocal, cargoAceito = () => true }) {
  return porRegistro({
    descartarRapido: linha => !linha.includes(MUNICIPIO_TSE),
    aoCabecalho: colunas => exigirColunas(colunas, ano),
    aoRegistro: (campos, colunas) => {
      if (!ehDaEleicao(campos, colunas, ano) || !cargoAceito(campos[colunas.CD_CARGO])) return;
      const turno = campos[colunas.NR_TURNO], cargo = campos[colunas.CD_CARGO], numero = campos[colunas.NR_VOTAVEL];
      const apuracao = porTurno[turno] ||= novaApuracao();
      const votos = inteiro(campos[colunas.QT_VOTOS]);
      if (!ehVotoNominal(cargo, numero)) {
        somarVotoEspecial(apuracao, chaveDoCargo(ano, turno, cargo), numero, votos);
        registrarPartido(partidos, cargo, numero, campos[colunas.NM_VOTAVEL]);
        return;
      }
      const local = localDaSecao(campos, colunas);
      if (local == null) { semLocal.add(`${campos[colunas.NR_ZONA]}|${campos[colunas.NR_SECAO]}`); return; }
      somarVotoNoLocal(apuracao, candidatoDoRegistro(campos, colunas, ano), local, votos);
    },
  });
}

function exigirColunas(colunas, ano) {
  const ausentes = COLUNAS_OBRIGATORIAS.filter(nome => colunas[nome] == null);
  if (ausentes.length) throw new Error(`Colunas ausentes no CSV de ${ano}: ${ausentes.join(', ')}`);
}

function ehDaEleicao(campos, colunas, ano) {
  return campos[colunas.SG_UF] === UF && campos[colunas.CD_MUNICIPIO] === MUNICIPIO_TSE
    && campos[colunas.ANO_ELEICAO] === ano && DIGITOS_DO_CANDIDATO[campos[colunas.CD_CARGO]] != null;
}

export function ehVotoNominal(cargo, numero) {
  return numero.length >= DIGITOS_DO_CANDIDATO[cargo] && !ehBrancoOuNulo(numero);
}

// No voto de legenda (número de 2 dígitos), o "nome votável" é o nome do partido. Em governador e prefeito,
// o número de 2 dígitos já é o do candidato.
function registrarPartido(partidos, cargo, numero, nome) {
  if (numero.length === 2 && !ehBrancoOuNulo(numero) && DIGITOS_DO_CANDIDATO[cargo] > 2) partidos[numero] ||= nome;
}

function candidatoDoRegistro(campos, colunas, ano) {
  const turno = campos[colunas.NR_TURNO], cargo = campos[colunas.CD_CARGO], nr = campos[colunas.NR_VOTAVEL];
  const chave = `${chaveDoCargo(ano, turno, cargo)}|${nr}`;
  return { key: chave, ano, turno, cargo, cargoNome: campos[colunas.DS_CARGO], nr, nome: campos[colunas.NM_VOTAVEL] };
}
