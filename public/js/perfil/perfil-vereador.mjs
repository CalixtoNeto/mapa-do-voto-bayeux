// Perfil de um vereador: mandato, presença, votos nominais, com quem vota junto, matérias, partidos,
// remuneração e credores do município ligados à campanha dele.
import { pct, nf, dinheiro, sentence } from '../formato.mjs';
import { ListaDeBarras } from '../componentes.mjs';
import { taxa, resumoDaRemuneracao, extremosDaAfinidade, ligacoesDoCandidato, mesAno } from './calculos-perfil.mjs';
import { Voltar, Topo, Estatisticas, Secao, Ligacoes, ano, nomeProprio } from './pecas.mjs';
const { html } = window.htmPreact;
const SAPL = 'https://sapl.bayeux.pb.leg.br';

function Materias({ m }) {
  if (!m.total) return html`<p class="hint">Nenhuma matéria de autoria registrada no SAPL nesta legislatura.</p>`;
  return html`<${ListaDeBarras} itens=${m.porTipo.map(([tipo, n]) => ({ n: tipo, v: n, rotulo: nf.format(n) }))} />
    <h3>Mais recentes</h3>
    <ul class="materias">${m.recentes.map(([id, tipo, numero, a, ementa, data]) => html`<li>
      <a href=${`${SAPL}/materia/${id}`} target="_blank" rel="noopener">${tipo} nº ${numero}/${a}</a>
      <small>${data ? data.split('-').reverse().join('/') : ''}</small><p>${sentence(ementa)}</p></li>`)}</ul>`;
}

function Afinidade({ titulo, itens, nomes }) {
  return itens.length ? html`<h3>${titulo}</h3><${ListaDeBarras} itens=${itens.map(([id, iguais, comuns]) =>
    ({ n: nomes.get(id) || '?', v: iguais / comuns, rotulo: `${pct(iguais / comuns, 0)} de ${comuns}` }))} />` : null;
}

function Votacoes({ v, nomes }) {
  const t = v.votacoes, total = t.sim + t.nao + t.abstencao + t.outros;
  if (!total) return html`<p class="hint">Nenhum voto nominal registrado no SAPL para este vereador. Votações simbólicas só registram o resultado.</p>`;
  const { mais, menos } = extremosDaAfinidade(v.afinidade);
  return html`<${Estatisticas} itens=${[{ rotulo: 'Sim', valor: nf.format(t.sim) }, { rotulo: 'Não', valor: nf.format(t.nao) },
      { rotulo: 'Abstenção', valor: nf.format(t.abstencao) },
      { rotulo: 'Votou com a maioria', valor: t.comMaioriaDe ? pct(t.comMaioria / t.comMaioriaDe, 0) : null, nota: `de ${t.comMaioriaDe} votações` }]} />
    <${Afinidade} titulo="Vota mais junto com" itens=${mais} nomes=${nomes} />
    <${Afinidade} titulo="Vota menos junto com" itens=${menos} nomes=${nomes} />`;
}

function Partidos({ partidos }) {
  if (partidos.length < 2) return null;
  return html`<h3>Partidos</h3><ul class="locais">${partidos.map(([sigla, desde, ate]) =>
    html`<li><span class="ln">${sigla}</span><span class="lv">${ano(desde)}–${ate ? ano(ate) : 'hoje'}</span></li>`)}</ul>`;
}

function Remuneracao({ rem }) {
  if (!rem) return html`<p class="hint">Nome não encontrado na folha da Câmara publicada pelo TCE-PB.</p>`;
  return html`<${Estatisticas} itens=${[{ rotulo: `Recebido em ${mesAno(rem.mes)}`, valor: dinheiro(rem.valor), nota: sentence(rem.cargo) },
    { rotulo: 'Total no mandato', valor: dinheiro(rem.total), nota: `${rem.meses} meses` }]} />`;
}

export function PerfilVereador({ v, camara, anos, aoVerNoMapa }) {
  const nomes = new Map(camara.vereadores.map(x => [x.id, x.nome])), presenca = taxa(v.presenca);
  const mandato = `Vereador(a) · ${v.partido || 'sem partido'} · ${ano(v.inicio)}–${ano(v.fim)}${v.titular ? '' : ' · suplente'}`;
  return html`<article class="perfil">
    <${Voltar} />
    <${Topo} foto=${v.foto} titulo=${v.nome} linhas=${[mandato, nomeProprio(v.completo), !v.emExercicio && `Fora do mandato desde ${v.fim.split('-').reverse().join('/')}`]}>
      ${v.chave && html`<button type="button" class="link" onClick=${() => aoVerNoMapa(camara.eleicao, v.chave)}>Ver os votos de ${camara.eleicao} no mapa</button>`}
    <//>
    <${Estatisticas} itens=${[{ rotulo: 'Presença nas sessões', valor: presenca == null ? null : pct(presenca, 0), nota: `${v.presenca[0]} de ${v.presenca[1]}` },
      { rotulo: 'Matérias apresentadas', valor: nf.format(v.materias.total) }, { rotulo: `Votos em ${camara.eleicao}`, valor: v.eleicao == null ? null : nf.format(v.eleicao) }]} />
    <${Secao} id="vm" titulo="Matérias de autoria"><${Materias} m=${v.materias} /><//>
    <${Secao} id="vv" titulo="Votos nominais"><${Votacoes} v=${v} nomes=${nomes} /><//>
    <${Secao} id="vr" titulo="Remuneração"><${Remuneracao} rem=${resumoDaRemuneracao(v.remuneracao)} /><//>
    <${Secao} id="vp" titulo="Partido"><p class="hint">${v.partido ? `Filiado ao ${v.partido}.` : 'Sem filiação registrada no SAPL.'}</p><${Partidos} partidos=${v.partidos} /><//>
    ${v.chave && html`<${Secao} id="vc" titulo="Campanha e credores do município"><${Ligacoes} ligacoes=${ligacoesDoCandidato(anos, v.chave, camara.eleicao)} /><//>`}
    <p class="hint">Fontes: SAPL da Câmara Municipal de Bayeux (legislatura ${camara.legislatura.numero}, desde ${ano(camara.legislatura.inicio)}), TCE-PB (folha e despesas) e TSE.</p>
  </article>`;
}
