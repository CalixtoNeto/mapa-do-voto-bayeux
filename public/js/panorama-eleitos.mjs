// Partidos em hierarquia: partido → candidato → lugares onde teve voto.
import { nf, dinheiro, centavos } from './formato.mjs';
import { porPartido } from './calculos.mjs';
import { usarLimite } from './componentes.mjs';
import { Cartao } from './cartao.mjs';
import { ArvoreDoCargo, opcoesDosLugares } from './arvore-do-cargo.mjs';
import { arvoreDosPartidos } from './calculos-arvores-votos.mjs';
import { parcelaDe } from './calculos-arvores-dinheiro.mjs';
const { html, useMemo } = window.htmPreact;

const resumoDoPartido = p => `${p.eleitos} ${p.eleitos === 1 ? 'eleito' : 'eleitos'} de ${p.candidatos} candidatos${p.gasto ? ` · gastou ${dinheiro(p.gasto)} · ${centavos(p.custo)} por voto` : ''}${p.fefc ? ` · fundo eleitoral ${dinheiro(p.fefc)}` : ''}`;
const resumoDoCandidato = (l, eleito) => `${eleito ? 'eleito · ' : ''}${l.gasto ? `gastou ${dinheiro(l.gasto)}` : 'sem gasto declarado'}${l.custo != null ? ` · ${centavos(l.custo)} por voto` : ''}${l.fefc ? ` · fundo eleitoral ${dinheiro(l.fefc)}` : ''}`;

export function Partidos({ cfg, linhas, ctx, onPick }) {
  const lista = useMemo(() => porPartido(linhas, ctx.eleito), [linhas, ctx]);
  const [limite, botao] = usarLimite(lista.length);
  const total = lista.reduce((s, x) => s + x.votos, 0), porCand = useMemo(() => new Map(linhas.map(l => [l.cand.key, l])), [linhas]);
  const arvore = useMemo(() => arvoreDosPartidos(lista.slice(0, limite).map(p => ({ partido: p.partido, votos: p.votos, nota: `${parcelaDe(p.votos / total)} · ${resumoDoPartido(p)}` })),
    linhas.map(l => l.cand), { ...opcoesDosLugares(cfg, ctx.ds), notaDoCandidato: (c, p) => `${parcelaDe(c.total / p.votos)} do partido · ${resumoDoCandidato(porCand.get(c.key), ctx.eleito(c))}` }), [lista, limite, linhas, ctx]);
  if (lista.length < 2) return null;
  return html`<${Cartao} tipo="Árvore de barras · hierarquia" titulo="Partidos e seus candidatos" sub=${`${nf.format(total)} votos nominais. Toque num partido para abrir os candidatos dele.`}
      nota=${`Votos nominais dos candidatos de cada partido (sem os de legenda); a porcentagem é sobre os votos nominais do cargo. Dentro do partido, a porcentagem é a parcela dele; dentro do candidato, a dos votos dele em cada ${cfg.lugarNome}.`}>
    <${ArvoreDoCargo} arvore=${arvore} formato=${nf.format} onPick=${onPick} legenda=${`Partido → candidato → ${cfg.lugarNome} · votos`} />${botao}<//>`;
}
