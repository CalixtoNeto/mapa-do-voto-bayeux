// Comparecimento de cada lugar (município ou local de votação) por turno e cargo:
// [aptos, comparecimento, brancos, nulos]. A abstenção é aptos − comparecimento.
import { campo, inteiro } from '../lib/csv.mjs';

export const COLUNAS_DO_COMPARECIMENTO = ['QT_APTOS', 'QT_COMPARECIMENTO'];

// Os arquivos novos separam o nulo do eleitor (QT_VOTOS_NULOS) do nulo técnico; os antigos só têm o total.
export function numerosDoComparecimento(campos, colunas) {
  const numero = nome => inteiro(campo(campos, colunas, nome));
  const nulos = colunas.QT_VOTOS_NULOS != null ? numero('QT_VOTOS_NULOS') : numero('QT_TOTAL_VOTOS_NULOS');
  return [numero('QT_APTOS'), numero('QT_COMPARECIMENTO'), numero('QT_VOTOS_BRANCOS'), nulos];
}

export function somarComparecimento(porTurno, { turno, cargo, lugar }, numeros) {
  const doLugar = ((porTurno[turno] ||= {})[cargo] ||= {})[lugar] ||= [0, 0, 0, 0];
  numeros.forEach((valor, i) => { doLugar[i] += valor; });
}

export function exigirColunasDoComparecimento(colunas, ano) {
  const ausentes = COLUNAS_DO_COMPARECIMENTO.filter(nome => colunas[nome] == null);
  if (ausentes.length) throw new Error(`Colunas ausentes no comparecimento de ${ano}: ${ausentes.join(', ')}`);
}
