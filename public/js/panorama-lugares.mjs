// Panorama do cargo por lugar (município ou bairro): onde o voto mais se dividiu, as disputas mais apertadas e o eleitorado
// de onde vêm os votos dos mais votados. Cada peça é um cartão; a variação da abstenção está em panorama-lugares-abstencao.mjs.
import { pct, sentence, pontos } from './formato.mjs';
import { fragmentacao, margens, eleitoradoDosVotos } from './calculos.mjs';
import { nomeDe } from './componentes.mjs';
import { Cartao } from './cartao.mjs';
import { ListaDePosicoes } from './lista-posicoes.mjs';
const { html, useMemo } = window.htmPreact;

const casas = v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const MOSTRAR = 6;

export function criarLugares(cfg) {
  function Disputas({ ctx }) {
    const lugares = useMemo(() => cfg.lugares(ctx.ds), [ctx]);
    const frag = useMemo(() => fragmentacao(ctx.cands, lugares, cfg.votosDe).sort((a, b) => b.efetivo - a.efetivo), [ctx, lugares]);
    const apertadas = useMemo(() => margens(ctx.cands, lugares, cfg.votosDe).sort((a, b) => a.margem - b.margem).slice(0, MOSTRAR), [ctx, lugares]);
    if (frag.length < 4) return null;
    const nome = l => cfg.nomeDoLugar(l, ctx.ds), efetivos = f => [nome(f.lugar), casas(f.efetivo), 'candidatos efetivos'];
    return html`<${Cartao} tipo="Lista · margem" titulo="Disputas mais apertadas" sub=${`Diferença entre o 1º e o 2º colocados em cada ${cfg.lugarNome}`}>
        <${ListaDePosicoes} itens=${apertadas.map(m => [nome(m.lugar), pct(m.margem), `${nomeDe(m.primeiro)} à frente de ${nomeDe(m.segundo)}`])} /><//>
      <${Cartao} tipo="Lista · candidatos efetivos" titulo=${`Onde o voto mais se dividiu`} sub="Quanto maior o número, mais candidatos dividiram o voto">
        <${ListaDePosicoes} itens=${frag.slice(0, MOSTRAR).map(efetivos)} /><//>
      <${Cartao} tipo="Lista · candidatos efetivos" titulo=${`Onde o voto mais se concentrou`} sub="Perto de 1, um só candidato levou quase tudo"
          nota=${`Margem: diferença entre o primeiro e o segundo colocados, sobre os votos nominais do ${cfg.lugarNome}. Candidatos efetivos: o inverso da soma dos quadrados das parcelas.`}>
        <${ListaDePosicoes} itens=${frag.slice(-MOSTRAR).reverse().map(efetivos)} /><//>`;
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
