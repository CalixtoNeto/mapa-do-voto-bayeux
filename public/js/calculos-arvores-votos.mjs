// Árvores dos votos do cargo: candidato → lugares onde teve voto, lugar → candidatos e partido → candidato → lugares.
// Cada ramo é [nome, votos, filhos, nota, chave]; o nome pode ser um objeto ({ cand } ou { ficha }) que a tela escreve como botão.

// Linha sem valor no fim do ramo do candidato: a tela a escreve como o botão que leva à ficha dele.
export const linkParaFicha = cand => [{ ficha: cand }, 0, null, ''];

const comVoto = cands => cands.filter(c => c.total > 0);
const soma = ramos => ramos.reduce((s, r) => s + r[1], 0);

function ramosDosLugares(cand, { votosDe, nomeDoLugar, parcela }) {
  return Object.entries(votosDe(cand) || {}).filter(([, v]) => v > 0).map(([k, v]) => [nomeDoLugar(k), v, null, parcela(v / cand.total)]);
}

function ramoDoCandidato(cand, nota, op) {
  const lugares = ramosDosLugares(cand, op);
  return [op.nomeDe(cand), cand.total, [...lugares, ...(op.ficha ? [linkParaFicha(cand)] : [])], nota, cand.key];
}

// itens: [{ cand, nota }] na ordem em que devem aparecer.
export function arvoreDeCandidatos(itens, op) {
  const filhos = itens.filter(i => i.cand.total > 0).map(i => ramoDoCandidato(i.cand, i.nota, op));
  return { v: soma(filhos), filhos };
}

const somaDe = votos => votos.reduce((s, x) => s + x.v, 0);

function ramoDoLugar({ lugar, nota }, cands, op) {
  const votos = cands.map(c => ({ cand: c, v: op.votosDe(c)?.[lugar] || 0 })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const total = somaDe(votos), resto = votos.slice(op.limite);
  const filhos = votos.slice(0, op.limite).map(x => [{ cand: x.cand }, x.v, null, op.parcela(x.v / total)]);
  if (resto.length) filhos.push([`Demais candidatos (${resto.length})`, somaDe(resto), null, op.parcela(somaDe(resto) / total)]);
  return total > 0 && [op.nomeDoLugar(lugar), total, filhos, nota, lugar];
}

// entradas: [{ lugar, nota }]; o valor do lugar é a soma dos votos dos candidatos nele e a nota diz por que ele está na lista.
export function arvoreDeLugares(entradas, cands, op) {
  const filhos = entradas.map(e => ramoDoLugar(e, cands, op)).filter(Boolean);
  return { v: soma(filhos), filhos };
}

// partidos: [{ partido, votos, nota }] na ordem de exibição; notaDoCandidato(cand, partido) escreve a nota de cada candidato.
export function arvoreDosPartidos(partidos, cands, op) {
  const filhos = partidos.map(p => {
    const dele = comVoto(cands).filter(c => (c.partido || '?') === p.partido).sort((a, b) => b.total - a.total);
    return [p.partido, p.votos, dele.map(c => ramoDoCandidato(c, op.notaDoCandidato(c, p), op)), p.nota, p.partido];
  });
  return { v: soma(filhos), filhos };
}

// forca: [{ lugar, votos, nota }] na ordem de exibição; locaisDe(lugar) → [{ nome, v }] ou nada, se o site não separa o lugar em locais.
export function arvoreDosLugaresDoCandidato(forca, { nomeDoLugar, locaisDe, parcela }) {
  const filhos = forca.map(f => {
    const locais = (locaisDe?.(f.lugar) || []).filter(l => l.v > 0);
    return [nomeDoLugar(f.lugar), f.votos, locais.length ? locais.map(l => [l.nome, l.v, null, parcela(l.v / f.votos)]) : null, f.nota, f.lugar];
  });
  return { v: filhos.reduce((s, f) => s + f[1], 0), filhos };
}
