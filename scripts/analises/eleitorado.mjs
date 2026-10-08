// Perfil do eleitorado de cada lugar (município ou local de votação), para cruzar com o voto:
// [eleitores, mulheres, jovens (16 a 24 anos), idosos (60 anos ou mais), superior completo,
//  até o fundamental incompleto (inclui analfabetos e quem só lê e escreve)].
import { campo, inteiro } from '../lib/csv.mjs';
import { normalizarNome } from '../lib/texto.mjs';

export const COLUNAS_DO_ELEITORADO = ['DS_GENERO', 'DS_FAIXA_ETARIA', 'DS_GRAU_ESCOLARIDADE'];

// O nome da quantidade mudou entre os anos; QT_ELEITORES_BIOMETRIA e afins contam outra coisa.
const COLUNAS_DA_QUANTIDADE = ['QT_ELEITORES_PERFIL', 'QT_ELEITORES', 'QT_ELEITOR_PERFIL', 'QT_ELEITOR'];
const colunaDaQuantidade = colunas => COLUNAS_DA_QUANTIDADE.find(nome => colunas[nome] != null);

const POUCO_ESTUDO = /ANALFABETO|LE E ESCREVE|FUNDAMENTAL INCOMPLETO/;

// A faixa etária vem como texto ("16 anos", "21 a 24 anos", "100 anos ou mais"); o primeiro número basta.
export function numerosDoEleitor(campos, colunas) {
  const qtd = inteiro(campo(campos, colunas, colunaDaQuantidade(colunas)));
  const idade = parseInt(campo(campos, colunas, 'DS_FAIXA_ETARIA').match(/\d+/)?.[0], 10);
  const escolaridade = normalizarNome(campo(campos, colunas, 'DS_GRAU_ESCOLARIDADE'));
  const se = condicao => condicao ? qtd : 0;
  return [qtd, se(/FEMININO/i.test(campo(campos, colunas, 'DS_GENERO'))), se(idade <= 24), se(idade >= 60),
    se(/SUPERIOR COMPLETO/.test(escolaridade)), se(POUCO_ESTUDO.test(escolaridade))];
}

export function somarEleitorado(lugares, lugar, numeros) {
  const doLugar = lugares[lugar] ||= numeros.map(() => 0);
  numeros.forEach((valor, i) => { doLugar[i] += valor; });
}

export function exigirColunasDoEleitorado(colunas, ano) {
  const ausentes = COLUNAS_DO_ELEITORADO.filter(nome => colunas[nome] == null);
  if (!colunaDaQuantidade(colunas)) ausentes.push(COLUNAS_DA_QUANTIDADE[0]);
  if (ausentes.length) {
    throw new Error(`Colunas ausentes no perfil do eleitorado de ${ano}: ${ausentes.join(', ')} (colunas do arquivo: ${Object.keys(colunas).join(', ')})`);
  }
}
