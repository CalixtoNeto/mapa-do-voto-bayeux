// Árvores das emendas (sem DOM): quem recebeu → quem mandou → ano, e a execução de cada autor.
import { parteTexto, parteDoPai, soma, plural, periodo } from './arvores-ramos.mjs';
import { pct } from '../formato.mjs';

// A árvore chega como autor → favorecido → ano; aqui ela é virada: favorecido → autor → ano.
function viraPorFavorecido(arvore) {
  const favorecidos = new Map();
  for (const [autor, , lista] of arvore?.filhos || []) for (const [favorecido, v, anos] of lista || []) {
    favorecidos.set(favorecido, [...(favorecidos.get(favorecido) || []), [autor, v, anos]]);
  }
  return favorecidos;
}

// porFavorecido: [[nome, natureza, valor]] só para escrever a natureza jurídica na nota.
export function arvoreDosFavorecidos(arvore, porFavorecido) {
  const naturezas = new Map(porFavorecido.map(f => [f[0], f[1]])), total = arvore?.v || 0;
  const filhos = [...viraPorFavorecido(arvore)].map(([nome, autores]) => {
    const v = soma(autores), parte = parteTexto(v, total), natureza = naturezas.get(nome);
    const doAutor = autores.map(([autor, valor, anos]) => [autor, valor, parteDoPai(anos, valor, 'do autor')]);
    return [nome, v, parteDoPai(doAutor, v, 'do favorecido'), natureza ? `${natureza} · ${parte}` : parte];
  });
  return { v: soma(filhos), filhos };
}

// porAutor: [[autor, empenhado, pago, emendas, de, até]] → autor → pago e ainda não pago.
export function arvoreDaExecucao(porAutor) {
  const filhos = porAutor.filter(a => a[1] > 0).map(([autor, empenhado, pago, n, de, ate]) => {
    const aberto = empenhado - pago, nota = `${plural(n, 'emenda', 'emendas')} · ${periodo(de, ate)} · ${pct(Math.min(1, pago / empenhado), 0)} pago`;
    return [autor, empenhado, parteDoPai([['Pago', pago], ['Ainda não pago', aberto]].filter(r => r[1] > 0), empenhado, 'do empenhado'), nota];
  });
  return { v: soma(filhos), filhos };
}
