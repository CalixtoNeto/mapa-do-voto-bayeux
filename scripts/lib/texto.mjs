// Junta grafias que só diferem em acento, caixa ou pontuação ("São Bento", "SAO BENTO").
export const normalizarNome = nome => String(nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();

// O TSE preenche "#NULO#", "#NE#" ou "#NULO" quando o dado não foi informado.
export const informado = texto => {
  const limpo = String(texto ?? '').trim();
  return limpo.startsWith('#') ? '' : limpo;
};
