// Monta a tabela de um ano a partir das linhas de Bayeux na tabela "Eleitorado por local de votação":
// a lista de locais (com bairro, coordenadas e eleitores) e, para cada seção, a posição do seu local.
import { normalizarNome } from '../lib/texto.mjs';
import { inteiro } from '../lib/csv.mjs';
import { grafiasDosBairros } from './bairros.mjs';
import { lerCoordenada, estaNaCaixa } from './coordenadas.mjs';

const COLUNAS_OBRIGATORIAS = ['NR_ZONA', 'NR_SECAO', 'NR_LOCAL_VOTACAO', 'NM_LOCAL_VOTACAO', 'NM_BAIRRO'];

export function montarTabelaDeSecoes({ ano, municipio, linhas, colunas, caixa }) {
  exigirColunas(colunas, ano);
  const doTurno1 = linhas.filter(campos => colunas.NR_TURNO == null || campos[colunas.NR_TURNO] === '1');
  const grafias = grafiasDosBairros(doTurno1.map(campos => campos[colunas.NM_BAIRRO]));
  const locais = [], posicaoDoLocal = new Map(), secoes = {}, rejeitadas = [];
  for (const campos of doTurno1) {
    const zona = campos[colunas.NR_ZONA], chaveDoLocal = `${zona}|${campos[colunas.NR_LOCAL_VOTACAO]}`;
    if (!posicaoDoLocal.has(chaveDoLocal)) {
      posicaoDoLocal.set(chaveDoLocal, locais.length);
      locais.push(novoLocal(campos, colunas, grafias, caixa, rejeitadas));
    }
    const posicao = posicaoDoLocal.get(chaveDoLocal);
    locais[posicao].eleitores += inteiro(campos[colunas.QT_ELEITOR_SECAO]);
    secoes[`${zona}|${campos[colunas.NR_SECAO]}`] = posicao;
  }
  return { tabela: { ano: +ano, municipio, locais, secoes }, rejeitadas };
}

function exigirColunas(colunas, ano) {
  const ausentes = COLUNAS_OBRIGATORIAS.filter(nome => colunas[nome] == null);
  if (ausentes.length) throw new Error(`${ano}: colunas ausentes ${ausentes.join(', ')}`);
}

function novoLocal(campos, colunas, grafias, caixa, rejeitadas) {
  const lat = lerCoordenada(campos[colunas.NR_LATITUDE]), lon = lerCoordenada(campos[colunas.NR_LONGITUDE]);
  const coordenadaValida = estaNaCaixa(caixa, lon, lat);
  if (!coordenadaValida) rejeitadas.push({ lat: campos[colunas.NR_LATITUDE], lon: campos[colunas.NR_LONGITUDE] });
  return {
    zona: +campos[colunas.NR_ZONA], nr: +campos[colunas.NR_LOCAL_VOTACAO],
    nome: campos[colunas.NM_LOCAL_VOTACAO].trim(), endereco: (campos[colunas.DS_ENDERECO] || '').trim(),
    bairro: grafias.get(normalizarNome(campos[colunas.NM_BAIRRO])) || '',
    lat: coordenadaValida ? lat : null, lon: coordenadaValida ? lon : null, eleitores: 0,
  };
}
