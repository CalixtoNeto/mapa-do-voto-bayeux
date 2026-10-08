// Perfil de um candidato no cadastro do TSE (consulta_cand). Os nomes curtos são o formato que o site lê:
// g gênero, r cor/raça, i idade, e escolaridade, o ocupação, re tentando a reeleição, s situação, p partido.
import { campo } from '../lib/csv.mjs';
import { informado } from '../lib/texto.mjs';

export function perfilDoRegistro(campos, colunas, ano) {
  const valor = nome => informado(campo(campos, colunas, nome));
  return semVazios({
    g: valor('DS_GENERO'), r: valor('DS_COR_RACA'), i: idade(valor, ano), e: valor('DS_GRAU_INSTRUCAO'),
    o: valor('DS_OCUPACAO'), re: valor('ST_REELEICAO') === 'S' ? 1 : 0, s: valor('DS_SIT_TOT_TURNO'), p: valor('SG_PARTIDO'),
  });
}

// Desde 2024 o TSE deixou de publicar a idade na posse em alguns arquivos; a data de nascimento resolve.
function idade(valor, ano) {
  const naPosse = parseInt(valor('NR_IDADE_DATA_POSSE'), 10);
  if (naPosse > 0) return naPosse;
  const [dia, mes, anoNascimento] = valor('DT_NASCIMENTO').split('/').map(Number);
  if (!anoNascimento) return 0;
  return ano - anoNascimento - (mes > 10 || (mes === 10 && dia > 1) ? 1 : 0);
}

const semVazios = objeto => Object.fromEntries(Object.entries(objeto).filter(([, v]) => v !== '' && v !== 0));
