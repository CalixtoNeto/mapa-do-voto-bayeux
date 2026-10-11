// Seções da página de um vereador: matérias de autoria, votos nominais, afinidade, partidos e remuneração.
import { pct, nf, dinheiro, sentence } from '../formato.mjs';
import { Pilha } from '../graficos.mjs';
import { Ranking } from '../ranking.mjs';
import { extremosDaAfinidade, resumoDaRemuneracao, mesAno } from './calculos-perfil.mjs';
import { Estatisticas, ano } from './pecas.mjs';
const { html } = window.htmPreact;
const SAPL = 'https://sapl.bayeux.pb.leg.br';

export function Materias({ m }) {
  if (!m.total) return html`<p class="hint">Nenhuma matéria de autoria registrada no SAPL nesta legislatura.</p>`;
  return html`<${Ranking} descricao="Matérias por tipo" itens=${m.porTipo.map(([tipo, n]) => ({ n: tipo, v: n, rotulo: nf.format(n) }))} />
    <h4>Mais recentes</h4>
    <ul class="materias">${m.recentes.map(([id, tipo, numero, a, ementa, data]) => html`<li>
      <a href=${`${SAPL}/materia/${id}`} target="_blank" rel="noopener">${tipo} nº ${numero}/${a}</a>
      <small>${data ? data.split('-').reverse().join('/') : ''}</small><p>${sentence(ementa)}</p></li>`)}</ul>`;
}

function Afinidade({ titulo, itens, nomes }) {
  return itens.length ? html`<h4>${titulo}</h4><${Ranking} descricao=${titulo} itens=${itens.map(([id, iguais, comuns]) =>
    ({ n: nomes.get(id) || '?', v: iguais / comuns, rotulo: pct(iguais / comuns, 0), lado: `${iguais} de ${comuns}` }))} />` : null;
}

export function Votacoes({ v, nomes }) {
  const t = v.votacoes, total = t.sim + t.nao + t.abstencao + t.outros;
  if (!total) return html`<p class="hint">Nenhum voto nominal registrado no SAPL para este vereador. Votações simbólicas só registram o resultado.</p>`;
  const { mais, menos } = extremosDaAfinidade(v.afinidade);
  const partes = [['Sim', t.sim, 'var(--s1)'], ['Não', t.nao, 'var(--s2)'], ['Abstenção', t.abstencao, 'var(--s3)'], ['Outros', t.outros, 'var(--s4)']]
    .filter(p => p[1] > 0).map(([nome, n, cor]) => ({ nome, v: n, cor, rotulo: `${nf.format(n)} · ${pct(n / total, 0)}` }));
  return html`<${Pilha} partes=${partes} descricao=${'Votos nominais: ' + partes.map(p => `${p.nome} ${p.rotulo}`).join('; ')} />
    <${Estatisticas} itens=${[{ rotulo: 'Votou com a maioria', valor: t.comMaioriaDe ? pct(t.comMaioria / t.comMaioriaDe, 0) : null, nota: `de ${t.comMaioriaDe} votações` }]} />
    <${Afinidade} titulo="Vota mais junto com" itens=${mais} nomes=${nomes} /><${Afinidade} titulo="Vota menos junto com" itens=${menos} nomes=${nomes} />`;
}

export function Partidos({ v }) {
  return html`<p class="hint">${v.partido ? `Filiado ao ${v.partido}.` : 'Sem filiação registrada no SAPL.'}</p>
    ${v.partidos.length > 1 && html`<ul class="locais">${v.partidos.map(([sigla, desde, ate]) =>
      html`<li><span class="ln">${sigla}</span><span class="lv">${ano(desde)}–${ate ? ano(ate) : 'hoje'}</span></li>`)}</ul>`}`;
}

export function Remuneracao({ rem }) {
  if (!rem) return html`<p class="hint">Nome não encontrado na folha da Câmara publicada pelo TCE-PB.</p>`;
  return html`<${Estatisticas} itens=${[{ rotulo: `Recebido em ${mesAno(rem.mes)}`, valor: dinheiro(rem.valor), nota: sentence(rem.cargo) },
    { rotulo: 'Total no mandato', valor: dinheiro(rem.total), nota: `${rem.meses} meses` }]} />`;
}

export const remuneracaoDe = v => resumoDaRemuneracao(v.remuneracao);
