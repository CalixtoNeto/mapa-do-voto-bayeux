// Panorama do cargo por lugar (município ou bairro): onde o voto mais se dividiu, as disputas mais apertadas e o eleitorado
// de onde vêm os votos dos mais votados. Cada peça é um cartão; a variação da abstenção está em panorama-lugares-abstencao.mjs.
import { nf, pct, sentence, pontos } from './formato.mjs';
import { fragmentacao, margens, eleitoradoDosVotos } from './calculos.mjs';
import { nomeDe } from './componentes.mjs';
import { Cartao } from './cartao.mjs';
import { ListaDePosicoes } from './lista-posicoes.mjs';
import { ArvoreDoCargo, opcoesDosLugares } from './arvore-do-cargo.mjs';
import { arvoreDeLugares } from './calculos-arvores-votos.mjs';
const { html, useMemo } = window.htmPreact;

const casas = v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const MOSTRAR = 6, LIMITE_DE_CANDIDATOS = 6;

export function criarLugares(cfg) {
  function Disputas({ ctx, onPick }) {
    const lugares = useMemo(() => cfg.lugares(ctx.ds), [ctx]);
    const frag = useMemo(() => fragmentacao(ctx.cands, lugares, cfg.votosDe).sort((a, b) => b.efetivo - a.efetivo), [ctx, lugares]);
    const apertadas = useMemo(() => margens(ctx.cands, lugares, cfg.votosDe).sort((a, b) => a.margem - b.margem).slice(0, MOSTRAR), [ctx, lugares]);
    if (frag.length < 4) return null;
    const efetivos = f => ({ lugar: f.lugar, nota: `${casas(f.efetivo)} candidatos efetivos` });
    const cartao = (tipo, titulo, sub, entradas, nota) => html`<${Cartao} tipo=${tipo} titulo=${titulo} sub=${sub} nota=${nota}>
      <${ArvoreDoCargo} arvore=${arvoreDeLugares(entradas, ctx.cands, opcoesDosLugares(cfg, ctx.ds, { limite: LIMITE_DE_CANDIDATOS }))} formato=${nf.format} onPick=${onPick}
        legenda=${`${sentence(cfg.lugarNome)} → candidato · votos · % dos votos`} /><//>`;
    return html`${cartao('Árvore de barras · margem', 'Disputas mais apertadas', `Diferença entre o 1º e o 2º colocados em cada ${cfg.lugarNome}. Toque para ver os candidatos.`,
        apertadas.map(m => ({ lugar: m.lugar, nota: `margem de ${pct(m.margem)} · ${nomeDe(m.primeiro)} à frente de ${nomeDe(m.segundo)}` })))}
      ${cartao('Árvore de barras · candidatos efetivos', 'Onde o voto mais se dividiu', 'Quanto maior o número, mais candidatos dividiram o voto', frag.slice(0, MOSTRAR).map(efetivos))}
      ${cartao('Árvore de barras · candidatos efetivos', 'Onde o voto mais se concentrou', 'Perto de 1, um só candidato levou quase tudo', frag.slice(-MOSTRAR).reverse().map(efetivos),
        `Margem: diferença entre o primeiro e o segundo colocados, sobre os votos nominais do ${cfg.lugarNome}. Candidatos efetivos: o inverso da soma dos quadrados das parcelas. A barra mede os votos nominais do ${cfg.lugarNome}.`)}`;
  }

  function EleitoradoDosMaisVotados({ ctx }) {
    const linhas = useMemo(() => ctx.eleitorado ? [...ctx.cands].sort((a, b) => b.total - a.total).slice(0, 8)
      .map(cand => ({ cand, perfil: eleitoradoDosVotos(cfg.votosDe(cand), ctx.eleitorado) })).filter(l => l.perfil.length) : [], [ctx]);
    if (!linhas.length) return null;
    return html`<${Cartao} tipo="Lista · perfil do eleitorado" titulo="Eleitorado de onde vêm os votos" sub="Os oito mais votados"
        nota=${`Diferença entre o perfil dos eleitores dos ${cfg.lugaresNome} de onde vêm os votos de cada um (ponderado pelos votos) e o de todos os eleitores ${cfg.regiao}. Fonte: perfil do eleitorado por seção, do TSE.`}>
      <${ListaDePosicoes} itens=${linhas.map(({ cand, perfil }) => [nomeDe(cand), '', perfil.map(p => `${sentence(p.nome)} ${pontos(p.dosVotos - p.geral)}`).join(' · ')])} /><//>`;
  }
  return { Disputas, EleitoradoDosMaisVotados };
}
