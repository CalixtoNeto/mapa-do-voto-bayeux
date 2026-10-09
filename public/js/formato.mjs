// Formatação usada pelos painéis de análise (a mesma de app.js).
export const nf = new Intl.NumberFormat('pt-BR');
export const pct = (v, casas = 1) => (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) + '%';
const LOWER = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'di', 'du']);
export const titleCase = s => String(s || '').toLowerCase().split(/\s+/)
  .map((w, i) => (i && LOWER.has(w)) ? w : w.replace(/^(\p{L})/u, c => c.toUpperCase())).join(' ');
export const sentence = s => { s = String(s || '').toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); };
export const NORM = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();

const casas = (v, n) => v.toLocaleString('pt-BR', { maximumFractionDigits: n });
// R$ 23,9 bi · R$ 2,3 mi · R$ 450 mil · R$ 980
export function dinheiro(v) {
  if (v >= 1e9) return `R$ ${casas(v / 1e9, 1)} bi`;
  if (v >= 1e6) return `R$ ${casas(v / 1e6, 1)} mi`;
  if (v >= 1e4) return `R$ ${casas(v / 1e3, 0)} mil`;
  return `R$ ${nf.format(Math.round(v))}`;
}
export const centavos = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
// 2022-08-15 → 15/08
export const diaEMes = iso => String(iso || '').slice(5).split('-').reverse().join('/');
// +3,2 p.p. · −1,0 p.p. (diferença entre duas parcelas)
export const pontos = v => {
  const p = Math.round(v * 1000) / 10;
  return p ? `${p > 0 ? '+' : '−'}${casas(Math.abs(p), 1)} p.p.` : '0 p.p.';
};
export const vezes = v => `${casas(v, 1)}×`;
// Parcelas pequenas (de candidatos com poucos votos) precisam de mais casas para não virar 0,0%.
export const parcela = v => pct(v, v > 0 && v < 0.01 ? 2 : 1);
