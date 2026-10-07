// Junta grafias que só diferem em acento, caixa ou pontuação ("São Bento", "SAO BENTO").
export const normalizarNome = nome => String(nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
