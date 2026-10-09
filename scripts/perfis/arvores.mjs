// Árvore de decomposição do gasto (área → tipo de despesa → fornecedor…): soma cada caminho em todos os níveis
// e, para o site, guarda só os maiores ramos de cada nível, com o resto somado em "Outros".
import { centavos } from './somas.mjs';

export const novaArvore = () => ({ v: 0, filhos: new Map() });

export function somarNaArvore(raiz, caminho, valor) {
  if (!valor) return;
  let no = raiz;
  no.v += valor;
  for (const nome of caminho) {
    const rotulo = nome || 'Não informado';
    if (!no.filhos.has(rotulo)) no.filhos.set(rotulo, novaArvore());
    no = no.filhos.get(rotulo);
    no.v += valor;
  }
}

// Cada ramo vira [nome, valor] ou [nome, valor, filhos].
function podarFilhos(no, limite) {
  const filhos = [...no.filhos].filter(([, f]) => f.v > 0).sort((a, b) => b[1].v - a[1].v);
  const mostrados = filhos.slice(0, limite).map(([nome, f]) => f.filhos.size ? [nome, centavos(f.v), podarFilhos(f, limite)] : [nome, centavos(f.v)]);
  const resto = filhos.slice(limite);
  if (resto.length) mostrados.push([`Outros (${resto.length})`, centavos(resto.reduce((s, [, f]) => s + f.v, 0))]);
  return mostrados;
}

export const arvorePodada = (raiz, limite = 8) => ({ v: centavos(raiz.v), filhos: podarFilhos(raiz, limite) });
