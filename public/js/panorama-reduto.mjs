// Voto de reduto ou espalhado: o número efetivo de lugares de cada candidato (perto de 1, o voto vem de um lugar só);
// cada candidato abre nos lugares de onde vieram os votos.
import { nf } from './formato.mjs';
import { concentracao } from './calculos.mjs';
import { usarLimite } from './componentes.mjs';
import { Cartao } from './cartao.mjs';
import { ArvoreDoCargo, opcoesDosLugares } from './arvore-do-cargo.mjs';
import { arvoreDeCandidatos } from './calculos-arvores-votos.mjs';
const { html, useMemo, useState } = window.htmPreact;

const casas = v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

export function Redutos({ cfg, cands, selecionado, onPick, ctx }) {
  const [ordem, setOrdem] = useState('reduto');
  const linhas = useMemo(() => {
    const soma = cands.reduce((s, c) => s + c.total, 0);
    return cands.filter(c => c.total >= soma * 0.005).slice(0, 60).map(cand => ({ cand, ...concentracao(cfg.votosDe(cand)) }));
  }, [cands]);
  const lista = useMemo(() => [...linhas].sort((a, b) => ordem === 'reduto' ? a.efetivo - b.efetivo : b.efetivo - a.efetivo), [linhas, ordem]);
  const [limite, botao] = usarLimite(lista.length);
  const arvore = useMemo(() => ctx && arvoreDeCandidatos(lista.slice(0, limite).map(l => ({ cand: l.cand,
    nota: `${casas(l.efetivo)} efetivos · metade em ${l.metade} ${l.metade === 1 ? cfg.lugarNome : cfg.lugaresNome}` })), opcoesDosLugares(cfg, ctx.ds)), [lista, limite, ctx]);
  if (linhas.length < 2 || !arvore) return null;
  return html`<${Cartao} tipo="Árvore de barras · número efetivo" titulo="Voto de reduto ou espalhado"
      nota=${`Número efetivo de ${cfg.lugaresNome} ao lado de cada candidato: perto de 1, o voto vem quase todo de um lugar; quanto maior, mais espalhado. A barra mede os votos. Só candidatos com pelo menos 0,5% dos votos do cargo.`}>
    <select aria-label="Ordenar" value=${ordem} onChange=${e => setOrdem(e.target.value)}><option value="reduto">Mais concentrados</option><option value="espalhado">Mais espalhados</option></select>
    <${ArvoreDoCargo} arvore=${arvore} formato=${nf.format} onPick=${onPick} ativo=${k => k === selecionado}
      legenda=${`Candidato → ${cfg.lugarNome} · votos · % dos votos`} />${botao}<//>`;
}
