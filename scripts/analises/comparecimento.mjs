// Comparecimento de cada lugar (município ou local de votação) por turno e cargo:
// [aptos, comparecimento, brancos, nulos] e, quando o arquivo traz, os votos de legenda (para o quociente
// eleitoral, que conta nominais e legenda). A abstenção é aptos − comparecimento.
import { campo, inteiro } from '../lib/csv.mjs';

export const COLUNAS_DO_COMPARECIMENTO = ['QT_APTOS', 'QT_COMPARECIMENTO'];

// Os arquivos novos separam o nulo do eleitor (QT_VOTOS_NULOS) do nulo técnico; os antigos só têm o total.
export function numerosDoComparecimento(campos, colunas) {
  const numero = nome => inteiro(campo(campos, colunas, nome));
  const nulos = colunas.QT_VOTOS_NULOS != null ? numero('QT_VOTOS_NULOS') : numero('QT_TOTAL_VOTOS_NULOS');
  const numeros = [numero('QT_APTOS'), numero('QT_COMPARECIMENTO'), numero('QT_VOTOS_BRANCOS'), nulos];
  const legenda = COLUNAS_DA_LEGENDA.find(nome => colunas[nome] != null);
  return legenda ? [...numeros, numero(legenda)] : numeros;
}

// O nome da coluna mudou ao longo dos anos; as válidas vêm primeiro (as outras podem incluir anulados).
const COLUNAS_DA_LEGENDA = ['QT_VOTOS_LEGENDA_VALIDOS', 'QT_VOTOS_LEG_VALIDOS', 'QT_VOTOS_LEGENDA'];

export function somarComparecimento(porTurno, { turno, cargo, lugar }, numeros) {
  const doLugar = ((porTurno[turno] ||= {})[cargo] ||= {})[lugar] ||= numeros.map(() => 0);
  numeros.forEach((valor, i) => { doLugar[i] += valor; });
}

export function exigirColunasDoComparecimento(colunas, ano) {
  const ausentes = COLUNAS_DO_COMPARECIMENTO.filter(nome => colunas[nome] == null);
  if (ausentes.length) throw new Error(`Colunas ausentes no comparecimento de ${ano}: ${ausentes.join(', ')}`);
}
