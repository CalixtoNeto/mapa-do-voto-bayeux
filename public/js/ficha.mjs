// Ficha do candidato (cadastro do TSE).
import { sentence, dinheiro } from './formato.mjs';

export function fichaDoPerfil(p) {
  return [
    ['Gênero', p.g && sentence(p.g)], ['Cor ou raça', p.r && sentence(p.r)], ['Idade', p.i && `${p.i} anos`],
    ['Escolaridade', p.e && sentence(p.e)], ['Ocupação', p.o && sentence(p.o)],
    ['Bens declarados', p.b != null ? dinheiro(p.b) : 'Não declarou'], ['Reeleição', p.re ? 'Tentou a reeleição' : null],
    ['Situação', p.s && sentence(p.s)],
  ].filter(([, dd]) => dd);
}
