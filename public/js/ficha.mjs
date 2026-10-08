// Ficha do candidato (cadastro do TSE) e a variação dos bens declarados entre eleições.
import { pct, sentence, dinheiro } from './formato.mjs';

export function fichaDoPerfil(p) {
  return [
    ['Gênero', p.g && sentence(p.g)], ['Cor ou raça', p.r && sentence(p.r)], ['Idade', p.i && `${p.i} anos`],
    ['Escolaridade', p.e && sentence(p.e)], ['Ocupação', p.o && sentence(p.o)],
    ['Bens declarados', p.b != null ? dinheiro(p.b) : 'Não declarou'], ['Reeleição', p.re ? 'Tentou a reeleição' : null],
    ['Situação', p.s && sentence(p.s)],
  ].filter(([, dd]) => dd);
}

export function variacaoDoPatrimonio(evolucao) {
  const ordem = [...evolucao].sort((a, b) => a[0] - b[0]), [anoA, a] = ordem[0], [anoB, b] = ordem[ordem.length - 1];
  if (!a) return '';
  const v = (b - a) / a;
  return `De ${anoA} a ${anoB}, ${v >= 0 ? 'cresceu' : 'caiu'} ${pct(Math.abs(v), 0)}.`;
}
