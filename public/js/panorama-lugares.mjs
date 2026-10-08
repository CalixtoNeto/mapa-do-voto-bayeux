// Panorama do cargo por lugar (município ou bairro): onde o voto mais se dividiu, as disputas mais apertadas,
// a variação da abstenção desde a eleição anterior e o eleitorado de onde vêm os votos dos mais votados.
import { pct, sentence, pontos } from './formato.mjs';
import { fragmentacao, margens, variacaoDaAbstencao, eleitoradoDosVotos } from './calculos.mjs';
import { nomeDe } from './componentes.mjs';
const { html, useMemo } = window.htmPreact;

const casas = v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const MOSTRAR = 6;

function Lista({ titulo, itens }) {
  return html`<h3>${titulo}</h3><ul class="posicoes">${itens.map(([nm, vv, sm]) => html`<li><span class="nm">${nm}</span><span class="vv">${vv}</span><small>${sm}</small></li>`)}</ul>`;
}

function Disputa({ cfg, ctx, lugares }) {
  const frag = useMemo(() => fragmentacao(ctx.cands, lugares, cfg.votosDe).sort((a, b) => b.efetivo - a.efetivo), [ctx, lugares]);
  const apertadas = useMemo(() => margens(ctx.cands, lugares, cfg.votosDe).sort((a, b) => a.margem - b.margem).slice(0, MOSTRAR), [ctx, lugares]);
  if (frag.length < 4) return null;
  const nome = l => cfg.nomeDoLugar(l, ctx.ds);
  return html`<${Lista} titulo="Disputas mais apertadas" itens=${apertadas.map(m => [nome(m.lugar), pct(m.margem), `${nomeDe(m.primeiro)} à frente de ${nomeDe(m.segundo)}`])} />
    <${Lista} titulo="Onde o voto mais se dividiu" itens=${frag.slice(0, MOSTRAR).map(f => [nome(f.lugar), casas(f.efetivo), 'candidatos efetivos'])} />
    <${Lista} titulo="Onde o voto mais se concentrou" itens=${frag.slice(-MOSTRAR).reverse().map(f => [nome(f.lugar), casas(f.efetivo), 'candidatos efetivos'])} />
    <p class="hint">Margem: diferença entre o primeiro e o segundo colocados, sobre os votos nominais do ${cfg.lugarNome}. Candidatos efetivos: perto de 1, um só levou quase tudo; quanto maior, mais dividido.</p>`;
}

function Abstencao({ cfg, ctx }) {
  const lista = useMemo(() => variacaoDaAbstencao(ctx.comparecimento, ctx.comparecimentoAnterior).sort((a, b) => b.diferenca - a.diferenca), [ctx]);
  if (lista.length < 4) return null;
  const item = v => [cfg.nomeDoLugar(v.lugar, ctx.ds), pontos(v.diferenca), `${pct(v.antes)} → ${pct(v.agora)}`];
  const altas = lista.filter(v => v.diferenca > 0).slice(0, MOSTRAR), quedas = lista.filter(v => v.diferenca < 0).slice(-MOSTRAR).reverse();
  return html`${altas.length > 0 && html`<${Lista} titulo=${`Abstenção: maiores altas desde ${ctx.ds.ano - 4}`} itens=${altas.map(item)} />`}
    ${quedas.length > 0 && html`<${Lista} titulo=${`Abstenção: maiores quedas desde ${ctx.ds.ano - 4}`} itens=${quedas.map(item)} />`}`;
}

function EleitoradoDosMaisVotados({ cfg, ctx }) {
  const linhas = useMemo(() => ctx.eleitorado ? [...ctx.cands].sort((a, b) => b.total - a.total).slice(0, 8)
    .map(cand => ({ cand, perfil: eleitoradoDosVotos(cfg.votosDe(cand), ctx.eleitorado) })).filter(l => l.perfil.length) : [], [ctx]);
  if (!linhas.length) return null;
  return html`<h3>Eleitorado de onde vêm os votos dos mais votados</h3><ul class="posicoes">${linhas.map(({ cand, perfil }) => html`<li>
    <span class="nm">${nomeDe(cand)}</span><span class="vv"></span>
    <small>${perfil.map(p => `${sentence(p.nome)} ${pontos(p.dosVotos - p.geral)}`).join(' · ')}</small></li>`)}</ul>
    <p class="hint">Diferença entre o perfil dos eleitores dos ${cfg.lugaresNome} de onde vêm os votos de cada um (ponderado pelos votos) e o de todos os eleitores ${cfg.regiao}. Fonte: perfil do eleitorado por seção, do TSE.</p>`;
}

export function criarLugaresDoCargo(cfg) {
  return function LugaresDoCargo({ ctx }) {
    const lugares = useMemo(() => cfg.lugares(ctx.ds), [ctx]);
    return html`<section class="analise" aria-labelledby="lg"><h2 id="lg">Por ${cfg.lugarNome}</h2>
      <${Disputa} cfg=${cfg} ctx=${ctx} lugares=${lugares} />
      <${Abstencao} cfg=${cfg} ctx=${ctx} />
      <${EleitoradoDosMaisVotados} cfg=${cfg} ctx=${ctx} /></section>`;
  };
}
