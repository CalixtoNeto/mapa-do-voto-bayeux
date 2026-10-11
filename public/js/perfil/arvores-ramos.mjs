// Peça comum das árvores dos perfis (sem DOM): a nota de cada ramo com a parte que ele tem do valor do pai.
import { pct } from '../formato.mjs';

export const parteTexto = (v, total) => pct(total ? v / total : 0, total && v / total < 0.01 ? 1 : 0);

// filhos: [[nome, valor, filhos?]] → mesmos ramos com a nota "25% da modalidade".
export const parteDoPai = (filhos, pai, texto) => (filhos || []).map(([nome, v, sub]) => [nome, v, sub, `${parteTexto(v, pai)} ${texto}`]);

export const soma = ramos => ramos.reduce((s, r) => s + r[1], 0);
export const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
export const periodo = (de, ate) => de === ate ? de : `${de}–${ate}`;
