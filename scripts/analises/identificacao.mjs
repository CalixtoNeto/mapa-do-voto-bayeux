// As colunas que identificam o candidato são as mesmas em todos os arquivos de candidatos do TSE
// (cadastro, bens, receitas, despesas). SG_UE é o município numa eleição municipal e a UF numa geral.
import { campo } from '../lib/csv.mjs';

export function identificacao(campos, colunas) {
  const valor = nome => campo(campos, colunas, nome);
  return {
    ano: valor('ANO_ELEICAO'), uf: valor('SG_UF'), ue: valor('SG_UE'), cargo: valor('CD_CARGO'),
    sq: valor('SQ_CANDIDATO'), nr: valor('NR_CANDIDATO'),
  };
}

export const ehDoAno = (candidato, ano) => !candidato.ano || candidato.ano === ano;
