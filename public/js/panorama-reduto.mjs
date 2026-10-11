// Voto de reduto ou espalhado: o número efetivo de lugares de cada candidato (perto de 1, o voto vem de um lugar só).
import { nf } from './formato.mjs';
import { concentracao } from './calculos.mjs';
import { nomeDe, usarLimite } from './componentes.mjs';
import { Cartao } from './cartao.mjs';
const { html, useMemo, useState } = window.htmPreact;

const casas = v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

export function Redutos({ cfg, cands, selecionado, onPick }) {
  const [ordem, setOrdem] = useState('reduto');
  const linhas = useMemo(() => {
    const soma = cands.reduce((s, c) => s + c.total, 0);
    return cands.filter(c => c.total >= soma * 0.005).slice(0, 60).map(cand => ({ cand, ...concentracao(cfg.votosDe(cand)) }));
  }, [cands]);
  const lista = useMemo(() => [...linhas].sort((a, b) => ordem === 'reduto' ? a.efetivo - b.efetivo : b.efetivo - a.efetivo), [linhas, ordem]);
  const [limite, botao] = usarLimite(lista.length);
  if (linhas.length < 2) return null;
  return html`<${Cartao} tipo="Lista · número efetivo" titulo="Voto de reduto ou espalhado"
      nota=${`Número efetivo de ${cfg.lugaresNome}: perto de 1, o voto vem quase todo de um lugar; quanto maior, mais espalhado. Só candidatos com pelo menos 0,5% dos votos do cargo.`}>
    <select aria-label="Ordenar" value=${ordem} onChange=${e => setOrdem(e.target.value)}><option value="reduto">Mais concentrados</option><option value="espalhado">Mais espalhados</option></select>
    <ol class="lista-cands">${lista.slice(0, limite).map((l, i) => html`<li class=${l.cand.key === selecionado ? 'on' : ''}><button type="button" onClick=${() => onPick(l.cand)}>
      <span class="pos">${i + 1}</span><span class="nm">${nomeDe(l.cand)}</span>
      <span class="meta">${nf.format(l.cand.total)} votos · metade em ${l.metade} ${l.metade === 1 ? cfg.lugarNome : cfg.lugaresNome}</span><span class="vv">${casas(l.efetivo)}</span></button></li>`)}</ol>${botao}<//>`;
}
