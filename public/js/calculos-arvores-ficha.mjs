// "Quem doou" na ficha como árvore: doador → outras campanhas do cargo que ele também financiou.
import { nomeDeQuem } from './formato.mjs';
import { parcelaDe } from './calculos-arvores-dinheiro.mjs';

const quantasOutras = n => `também doou a ${n} ${n === 1 ? 'outra campanha' : 'outras campanhas'}`;

// doacoes: f.doa ([nome, tipo, valor, índice?]); rede: redeDoCandidato(...) com os outros candidatos de cada doador.
export function arvoreDeDoadores(doacoes, rede, recebido) {
  const outrosDe = new Map(rede.map(r => [r.n, r.outros]));
  const filhos = doacoes.map(([n, tipo, v]) => {
    const outros = outrosDe.get(n) || [], nome = nomeDeQuem(n) + (tipo === 'pj' ? ' (empresa)' : '');
    return [nome, v, outros.length ? outros.map(o => [{ cand: o.cand }, o.v, null, 'também recebeu']) : null,
      recebido ? `${parcelaDe(v / recebido)} do recebido` : quantasOutras(outros.length)];
  });
  return { v: filhos.reduce((s, f) => s + f[1], 0), filhos };
}
