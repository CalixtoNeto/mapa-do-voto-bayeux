// Para arquivos com muitas colunas de nomes longos: cada linha vira uma função de leitura por nome de coluna,
// ler('NOME_CREDOR'). O BOM do UTF-8, quando vem, grudaria no nome da primeira coluna.
import { porRegistro, campo } from '../lib/csv.mjs';

export function leitorPorColuna(aoRegistro) {
  const leitor = porRegistro({ aoRegistro: (campos, colunas) => aoRegistro(nome => campo(campos, colunas, nome).trim()) });
  return (linha, ehCabecalho) => leitor(ehCabecalho ? linha.replace(/^﻿/, '') : linha, ehCabecalho);
}
