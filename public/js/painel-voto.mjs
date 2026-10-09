// Força do voto de um candidato: quociente eleitoral e peso no partido (cargos proporcionais), onde ele vai
// melhor do que no conjunto e o perfil do eleitorado dos lugares de onde vêm os votos.
import { nf, pct, parcela, titleCase, pontos, vezes } from './formato.mjs';
import { quocienteEleitoral, puxadorDeVotos, forcaPorLugar, eleitoradoDosVotos } from './calculos.mjs';
import { legendaDoCargo } from './contexto.mjs';
const { html, useMemo } = window.htmPreact;

const PROPORCIONAIS = ['6', '7', '8', '13'];
// O quociente só faz sentido quando os votos do site são os da circunscrição inteira (deputado na Paraíba,
// vereador em Bayeux); cfg.cargosComQuociente restringe os cargos.
const temQuociente = (cfg, cargo) => (cfg.cargosComQuociente || PROPORCIONAIS).includes(cargo);

function Puxador({ cand, ctx, cfg }) {
  if (!temQuociente(cfg, cand.cargo)) return null;
  const q = quocienteEleitoral(ctx.cands, ctx.eleito, legendaDoCargo(ctx.comparecimento));
  if (!q) return null;
  const p = puxadorDeVotos(cand, ctx.cands, ctx.eleito);
  return html`<h3>Votos e vagas</h3><dl class="stats">
    <div><dt>Do quociente eleitoral</dt><dd>${parcela(cand.total / q.quociente)}</dd><small>quociente: ${nf.format(Math.round(q.quociente))} votos${q.comLegenda ? '' : ' (sem legenda)'}</small></div>
    <div><dt>Dos votos do partido</dt><dd>${pct(p.parcelaNoPartido, 0)}</dd><small>${p.posicaoNoPartido}º de ${p.noPartido} no ${cand.partido}</small></div></dl>
    <p class="hint">${q.vagas} vagas. O eleito com menos votos teve ${nf.format(p.ultimoEleito)}; o não eleito com mais votos, ${nf.format(p.primeiroNaoEleito)}. Nos cargos proporcionais as vagas vão primeiro aos partidos (pelo quociente) e depois aos mais votados de cada um, por isso um candidato com mais votos pode ficar de fora.</p>`;
}

function OndeVaiMelhor({ cand, cfg, ctx }) {
  const lista = useMemo(() => forcaPorLugar(cfg.votosDe(cand), cfg.totDe(ctx.ds, cand), { minimo: Math.max(10, cand.total * 0.002) }), [cand, ctx]);
  if (!lista.length) return null;
  return html`<h3>Onde vai melhor</h3><ul class="posicoes">${lista.map(f => html`<li><span class="nm">${cfg.nomeDoLugar(f.lugar, ctx.ds)}</span>
    <span class="vv">${parcela(f.parcela)}</span><small>${vezes(f.indice)} a parcela dele ${cfg.regiao} · ${nf.format(f.votos)} votos</small></li>`)}</ul>`;
}

function EleitoradoDosVotos({ cand, cfg, ctx }) {
  const linhas = useMemo(() => ctx.eleitorado ? eleitoradoDosVotos(cfg.votosDe(cand), ctx.eleitorado) : [], [cand, ctx]);
  if (!linhas.length) return null;
  return html`<h3>Quem vota onde ele é votado</h3><ul class="posicoes">${linhas.map(l => html`<li><span class="nm">${l.nome}</span>
    <span class="vv">${pct(l.dosVotos, 0)}</span><small>${pontos(l.dosVotos - l.geral)} em relação a todos os eleitores ${cfg.regiao} (${pct(l.geral, 0)})</small></li>`)}</ul>
    <p class="hint">Perfil do eleitorado dos ${cfg.lugaresNome} de onde vêm os votos de ${titleCase(cand.urna || cand.nome)}, ponderado pelos votos. Mostra o eleitorado dos lugares, não quem votou nele (o voto é secreto).</p>`;
}

export function criarForcaDoVoto(cfg) {
  return function ForcaDoVoto({ cand, ctx }) {
    if (!cand || !ctx) return null;
    return html`<section class="analise" aria-labelledby="fv"><h2 id="fv">Força do voto</h2>
      <${Puxador} cand=${cand} ctx=${ctx} cfg=${cfg} />
      <${OndeVaiMelhor} cand=${cand} cfg=${cfg} ctx=${ctx} />
      <${EleitoradoDosVotos} cand=${cand} cfg=${cfg} ctx=${ctx} /></section>`;
  };
}
