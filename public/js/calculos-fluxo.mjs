// Monta os grafos do diagrama de fluxo (sem DOM) a partir de listas de { n, v }: um nó central (de onde vem → por onde passa → para onde vai)
// ou pares origem → destino. O que passa do limite de cada coluna vira "Outros (n)".
import { agruparRestante } from './calculos-sankey.mjs';

const positivos = itens => itens.filter(i => i.v > 0);
const coluna = (itens, prefixo, limite, rotulo) => agruparRestante(positivos(itens), limite, rotulo).map((i, k) => ({ ...i, id: prefixo + k }));
const fluxosDoMeio = (nos, entrando) => nos.map(n => entrando ? { de: n.id, para: 'meio', v: n.v } : { de: 'meio', para: n.id, v: n.v });

// origens e destinos: [{ n, v, alerta? }]; meio: nome do nó central.
export function grafoComMeio({ origens, meio, destinos, limite = 8, rotulo = 'Outros' }) {
  const de = coluna(origens, 'o', limite, rotulo), para = coluna(destinos, 'd', limite, rotulo);
  return { colunas: [de, [{ id: 'meio', n: meio }], para], fluxos: [...fluxosDoMeio(de, true), ...fluxosDoMeio(para, false)] };
}

const somar = (mapa, chave, v) => mapa.set(chave, (mapa.get(chave) || 0) + v);

// Quem sobra depois dos maiores é trocado por "Outros (n)"; devolve nome → nome na coluna.
function nomesDaColuna(totais, limite, rotulo) {
  const ordem = [...totais].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  if (ordem.length <= limite) return new Map(ordem.map(n => [n, n]));
  const resto = ordem.slice(limite - 1), junto = `${rotulo} (${resto.length})`;
  return new Map([...ordem.slice(0, limite - 1).map(n => [n, n]), ...resto.map(n => [n, junto])]);
}

// pares: [[origem, destino, valor]]
export function grafoEmPares({ pares, limiteDe = 6, limitePara = 6, rotulo = 'Outros' }) {
  const validos = pares.filter(p => p[2] > 0), deTotais = new Map(), paraTotais = new Map();
  validos.forEach(([d, p, v]) => { somar(deTotais, d, v); somar(paraTotais, p, v); });
  const nomeDe = nomesDaColuna(deTotais, limiteDe, rotulo), nomePara = nomesDaColuna(paraTotais, limitePara, rotulo);
  const juntos = new Map();
  validos.forEach(([d, p, v]) => somar(juntos, nomeDe.get(d) + '\u0000' + nomePara.get(p), v));
  const ids = (nomes, prefixo) => new Map([...new Set(nomes.values())].map((n, k) => [n, prefixo + k]));
  const [idDe, idPara] = [ids(nomeDe, 'e'), ids(nomePara, 's')];
  const ehResto = n => n.startsWith(rotulo + ' (');
  const listar = (ids, totais, nomes) => [...ids].map(([n, id]) => ({ id, n, v: [...totais].filter(([q]) => nomes.get(q) === n).reduce((s, [, v]) => s + v, 0) }))
    .sort((a, b) => ehResto(a.n) - ehResto(b.n) || b.v - a.v);
  return { colunas: [listar(idDe, deTotais, nomeDe), listar(idPara, paraTotais, nomePara)],
    fluxos: [...juntos].map(([chave, v]) => { const [d, p] = chave.split('\u0000'); return { de: idDe.get(d), para: idPara.get(p), v }; }) };
}
