// Formatação usada pelos painéis de análise (a mesma de app.js).
export const nf = new Intl.NumberFormat('pt-BR');
export const pct = (v, casas = 1) => (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) + '%';
const LOWER = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'di', 'du']);
export const titleCase = s => String(s || '').toLowerCase().split(/\s+/)
  .map((w, i) => (i && LOWER.has(w)) ? w : w.replace(/^(\p{L})/u, c => c.toUpperCase())).join(' ');
export const sentence = s => { s = String(s || '').toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); };
export const NORM = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();

const casas = (v, n) => v.toLocaleString('pt-BR', { maximumFractionDigits: n });
// R$ 2,3 mi · R$ 450 mil · R$ 980
export function dinheiro(v) {
  if (v >= 1e6) return `R$ ${casas(v / 1e6, 1)} mi`;
  if (v >= 1e4) return `R$ ${casas(v / 1e3, 0)} mil`;
  return `R$ ${nf.format(Math.round(v))}`;
}
export const centavos = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
