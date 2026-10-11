// Evolução patrimonial: bens declarados em cada eleição, a variação entre elas, de que é feito o patrimônio
// e quanto do próprio dinheiro o candidato pôs na campanha.
import { pct, sentence, dinheiro, NORM } from './formato.mjs';
import { evolucaoPatrimonial } from './calculos.mjs';
import { Colunas, Pilha } from './graficos.mjs';
import { partesComResto } from './calculos-graficos.mjs';
const { html } = window.htmPreact;

const variacao = v => v == null ? '' : `${v >= 0 ? '+' : '−'}${pct(Math.abs(v), 0)}`;

function Evolucao({ declaracoes }) {
  const e = evolucaoPatrimonial(declaracoes);
  return html`<dl class="stats"><div><dt>De ${e.pontos[0].ano} a ${e.pontos[e.pontos.length - 1].ano}</dt><dd>${variacao(e.total)}</dd></div>
      <div><dt>Por ano, em média</dt><dd>${variacao(e.aoAno)}</dd></div></dl>
    <${Colunas} itens=${e.pontos.map(p => ({ n: p.ano, v: p.v, rotulo: dinheiro(p.v) }))} descricao=${'Bens declarados em cada candidatura: ' + e.pontos.map(p => `${p.ano}, ${dinheiro(p.v)}`).join('; ')} />`;
}

function Composicao({ tipos, total }) {
  if (!tipos?.length) return null;
  const partes = partesComResto(tipos.map(([tipo, v]) => ({ nome: sentence(tipo), v })), ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'], 'var(--s0)')
    .map(p => ({ ...p, rotulo: `${dinheiro(p.v)} · ${pct(p.v / total, 0)}` }));
  return html`<h3>De que são os bens</h3><${Pilha} partes=${partes} descricao=${'Composição dos bens: ' + partes.map(p => `${p.nome} ${p.rotulo}`).join('; ')} />`;
}

export function criarPatrimonio(cfg) {
  return function EvolucaoPatrimonial({ cand, ctx }) {
    const perfil = ctx?.perfis?.c?.[cfg.chaveDe(cand)];
    const declaracoes = ctx?.patrimonio?.[NORM(cand?.nome || cand?.urna)] || [];
    if (!perfil || (perfil.b == null && declaracoes.length < 2)) return null;
    const proprios = ctx.financas?.c?.[cfg.chaveDe(cand)]?.r?.prop || 0;
    return html`<section class="analise" aria-labelledby="ep"><h2 id="ep">Bens declarados ao TSE</h2>
      ${declaracoes.length > 1 && html`<p class="ressalva" role="note">As declarações de outras eleições foram ligadas pelo nome completo e podem ser de outra pessoa com o mesmo nome. Valores nominais, informados pelo próprio candidato na candidatura.</p>`}
      ${perfil.b != null && html`<dl class="stats"><div><dt>Bens declarados em ${cand.ano}</dt><dd>${dinheiro(perfil.b)}</dd></div>
        ${proprios > 0 && html`<div><dt>Recursos próprios na campanha</dt><dd>${dinheiro(proprios)}</dd>${perfil.b ? html`<small>${pct(proprios / perfil.b, 1)} dos bens</small>` : null}</div>`}</dl>`}
      ${declaracoes.length > 1 && html`<h3>Total declarado em cada candidatura</h3><${Evolucao} declaracoes=${declaracoes} />`}
      <${Composicao} tipos=${perfil.bt} total=${perfil.b} />
      <p class="hint">Valores declarados ao TSE na candidatura, nominais (sem correção pela inflação); a ligação entre eleições é pelo nome completo. ${declaracoes.length < 2 ? 'Só há declaração de bens desta eleição para esta pessoa.' : ''}</p>
    </section>`;
  };
}
