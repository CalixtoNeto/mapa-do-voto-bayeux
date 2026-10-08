// Evolução patrimonial: bens declarados em cada eleição, a variação entre elas, de que é feito o patrimônio
// e quanto do próprio dinheiro o candidato pôs na campanha.
import { pct, sentence, dinheiro, NORM } from './formato.mjs';
import { ListaDeBarras } from './componentes.mjs';
import { evolucaoPatrimonial } from './calculos.mjs';
const { html } = window.htmPreact;

const variacao = v => v == null ? '' : `${v >= 0 ? '+' : '−'}${pct(Math.abs(v), 0)}`;

function Evolucao({ declaracoes }) {
  const e = evolucaoPatrimonial(declaracoes);
  return html`<dl class="stats"><div><dt>De ${e.pontos[0].ano} a ${e.pontos[e.pontos.length - 1].ano}</dt><dd>${variacao(e.total)}</dd></div>
      <div><dt>Por ano, em média</dt><dd>${variacao(e.aoAno)}</dd></div></dl>
    <${ListaDeBarras} itens=${e.pontos.map(p => ({ n: p.ano, v: p.v, rotulo: `${dinheiro(p.v)}${p.variacao != null ? ' · ' + variacao(p.variacao) : ''}` }))} />`;
}

function Composicao({ tipos, total }) {
  if (!tipos?.length) return null;
  return html`<h3>De que são os bens</h3>
    <${ListaDeBarras} itens=${tipos.map(([tipo, v]) => ({ n: sentence(tipo), v, rotulo: `${dinheiro(v)} · ${pct(v / total, 0)}` }))} />`;
}

export function criarPatrimonio(cfg) {
  return function EvolucaoPatrimonial({ cand, ctx }) {
    const perfil = ctx?.perfis?.c?.[cfg.chaveDe(cand)];
    const declaracoes = ctx?.patrimonio?.[NORM(cand?.nome || cand?.urna)] || [];
    if (!perfil || (perfil.b == null && declaracoes.length < 2)) return null;
    const proprios = ctx.financas?.c?.[cfg.chaveDe(cand)]?.r?.prop || 0;
    return html`<section class="analise" aria-labelledby="ep"><h2 id="ep">Evolução patrimonial</h2>
      ${perfil.b != null && html`<dl class="stats"><div><dt>Bens declarados em ${cand.ano}</dt><dd>${dinheiro(perfil.b)}</dd></div>
        ${proprios > 0 && html`<div><dt>Pôs na própria campanha</dt><dd>${dinheiro(proprios)}</dd>${perfil.b ? html`<small>${pct(proprios / perfil.b, 1)} dos bens</small>` : null}</div>`}</dl>`}
      ${declaracoes.length > 1 && html`<h3>Bens declarados em cada eleição</h3><${Evolucao} declaracoes=${declaracoes} />`}
      <${Composicao} tipos=${perfil.bt} total=${perfil.b} />
      <p class="hint">Valores declarados ao TSE na candidatura, nominais (sem correção pela inflação); a ligação entre eleições é pelo nome completo. ${declaracoes.length < 2 ? 'Só há declaração de bens desta eleição para esta pessoa.' : ''}</p>
    </section>`;
  };
}
