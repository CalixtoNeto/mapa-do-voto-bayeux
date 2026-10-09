// Análises de um candidato: quem é e concentração do voto; o que está fora da curva (painel-alertas.mjs), o dinheiro (painel-dinheiro.mjs), a força do voto
// (painel-voto.mjs), a evolução patrimonial (painel-patrimonio.mjs) e as dobradinhas (painel-dobradinhas.mjs)
// vêm dos outros painéis.
// cfg diz como cada site identifica o candidato e os lugares (municípios ou bairros); ver analises.mjs.
import { fichaDoPerfil } from './ficha.mjs';
import { concentracao } from './calculos.mjs';
import { criarDinheiro } from './painel-dinheiro.mjs';
import { criarForcaDoVoto } from './painel-voto.mjs';
import { criarPatrimonio } from './painel-patrimonio.mjs';
import { criarDobradinhas } from './painel-dobradinhas.mjs';
import { criarForaDaCurva } from './painel-alertas.mjs';
const { html, useMemo } = window.htmPreact;

export function criarPainelDoCandidato(cfg) {
  // A evolução dos bens fica em Evolução patrimonial (painel-patrimonio.mjs).
  function QuemE({ cand, perfis }) {
    const p = perfis?.c?.[cfg.chaveDe(cand)];
    if (!p) return null;
    return html`<section class="analise" aria-labelledby="qe"><h2 id="qe">Quem é</h2>
      <dl class="ficha">${fichaDoPerfil(p).map(([dt, dd]) => html`<div><dt>${dt}</dt><dd>${dd}</dd></div>`)}</dl>
    </section>`;
  }

  function Concentracao({ cand }) {
    const c = useMemo(() => concentracao(cfg.votosDe(cand)), [cand]);
    if (!c.lugares) return null;
    const efetivo = c.efetivo.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    return html`<p class="hint concentracao">Metade dos votos veio de <strong>${c.metade} ${c.metade === 1 ? cfg.lugarNome : cfg.lugaresNome}</strong>${` (de ${c.lugares} com voto). Número efetivo de ${cfg.lugaresNome}: `}<strong>${efetivo}</strong>${' — perto de 1 é voto de reduto; quanto maior, mais espalhado.'}</p>`;
  }

  return { ForaDaCurva: criarForaDaCurva(cfg), Dinheiro: criarDinheiro(cfg), QuemE, Concentracao, Dobradinhas: criarDobradinhas(cfg), ForcaDoVoto: criarForcaDoVoto(cfg), Patrimonio: criarPatrimonio(cfg) };
}
