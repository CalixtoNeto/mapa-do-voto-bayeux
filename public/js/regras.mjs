// Situação, cor e gênero como o TSE escreve, com ou sem acento.
const normalizar = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();

export const ehEleito = situacao => /^ELEITO/.test(normalizar(situacao));
export const ehNegro = cor => /^(PRETA|PARDA)$/.test(normalizar(cor));
export const ehMulher = genero => normalizar(genero) === 'FEMININO';
