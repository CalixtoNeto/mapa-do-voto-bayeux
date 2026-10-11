// Árvores da Câmara e do vereador (sem DOM): votos iguais e diferentes, matérias por tipo e remuneração por ano e mês.
import { sentence } from '../formato.mjs';
import { mesAno } from './calculos-perfil.mjs';
import { parteTexto, soma, plural } from './arvores-ramos.mjs';

// itens: [{ nome, parte, total }] → vereador (fração) → votos iguais e diferentes (fração do total de votações).
export function arvoreDeConcordancia(itens, [igual, diferente]) {
  const votacoes = n => plural(n, 'votação', 'votações');
  const filhos = itens.filter(i => i.total > 0).map(({ nome, parte, total }) => [nome, parte / total,
    [[igual, parte / total, null, votacoes(parte)], [diferente, (total - parte) / total, null, votacoes(total - parte)]].filter(r => r[1] > 0), votacoes(total)]);
  return { v: 1, filhos };
}

const dataBr = data => data ? data.split('-').reverse().join('/') : '';
export const rotuloDaMateria = ([, tipo, numero, ano]) => `${tipo} nº ${numero}/${ano}`;

// porTipo: [[tipo, quantas]]; recentes: [[id, tipo, número, ano, ementa, data]]: só as mais recentes ficam abaixo do tipo.
export function arvoreDasMaterias(porTipo, recentes, total) {
  const filhos = porTipo.map(([tipo, n]) => [tipo, n, recentes.filter(r => r[1] === tipo).map(r => [rotuloDaMateria(r), 1, null, dataBr(r[5])]), parteTexto(n, total)]);
  return { v: total, filhos };
}

// remuneracao: [[aaaamm, valor, cargo, órgão]] → ano (do mais novo ao mais antigo) → mês.
export function arvoreDaRemuneracao(remuneracao) {
  const anos = [...new Set(remuneracao.map(r => r[0].slice(0, 4)))].sort().reverse();
  const filhos = anos.map(ano => {
    const meses = remuneracao.filter(r => r[0].startsWith(ano)).sort((a, b) => a[0].localeCompare(b[0]));
    return [ano, soma(meses.map(m => [0, m[1]])), meses.map(m => [mesAno(m[0]), m[1], null, sentence(m[2])]), plural(meses.length, 'mês', 'meses')];
  });
  return { v: soma(filhos), filhos };
}
