// Emendas parlamentares para Bayeux: o dinheiro que chegou a quem está na cidade (município, fundos, entidades),
// quem mandou, e as emendas que têm Bayeux como destino, com os convênios assinados.
import { dinheiro, sentence } from '../formato.mjs';
import { ListaDeBarras, usarLimite } from '../componentes.mjs';
import { Voltar, Topo, Estatisticas, Secao, nomeProprio } from './pecas.mjs';
const { html } = window.htmPreact;

function Lista({ itens }) {
  const [limite, botao] = usarLimite(itens.length);
  return html`<${ListaDeBarras} itens=${itens.slice(0, limite)} />${botao}`;
}

const emendas = n => `${n} emenda${n > 1 ? 's' : ''}`;

function Convenios({ convenios }) {
  if (!convenios.length) return null;
  return html`<h3>Convênios mais recentes</h3><ul class="materias">${convenios.map(([data, autor, objeto, valor, funcao]) => html`<li>
    <strong>${dinheiro(valor)}</strong> <small>${data.split('-').reverse().join('/')} · ${funcao}${autor ? ` · ${nomeProprio(autor)}` : ''}</small>
    <p>${sentence(objeto)}</p></li>`)}</ul>`;
}

function Recebido({ r }) {
  if (!r?.porAutor.length) return null;
  return html`<${Secao} id="er" titulo="Quem mandou o dinheiro que chegou">
      <${Lista} itens=${r.porAutor.map(([autor, v, n]) => ({ n: html`${nomeProprio(autor)} <small>${emendas(n)}</small>`, v, rotulo: dinheiro(v) }))} />
      <h3>Quem recebeu</h3><${Lista} itens=${r.porFavorecido.map(([nome, natureza, v]) => ({ n: html`${nomeProprio(nome)} <small>${natureza}</small>`, v, rotulo: dinheiro(v) }))} />
      <h3>Por ano</h3><${ListaDeBarras} itens=${r.porAno.map(([a, v]) => ({ n: a, v, rotulo: dinheiro(v) }))} />
    <//>`;
}

function Destinadas({ e }) {
  return html`<${Secao} id="ed" titulo="Emendas com Bayeux como destino">
    <${Lista} itens=${e.porAutor.map(([autor, empenhado, pago, n, de, ate]) =>
      ({ n: html`${nomeProprio(autor)} <small>${emendas(n)} · ${de === ate ? de : `${de}–${ate}`}</small>`, v: empenhado, rotulo: `${dinheiro(empenhado)} · pago ${dinheiro(pago)}` }))} />
    <${Convenios} convenios=${e.convenios} />
    <p class="hint">Emendas em que o Portal registra Bayeux como local de aplicação: valor empenhado e pago (com restos a pagar).</p><//>`;
}

export function PerfilEmendas({ emendas: e }) {
  if (!e) return html`<article class="perfil"><${Voltar} /><p class="hint">As emendas ainda não foram baixadas do Portal da Transparência.</p></article>`;
  const recebido = (e.recebido?.porAno || []).reduce((s, a) => s + a[1], 0), empenhado = e.porAno.reduce((s, a) => s + a[1], 0);
  return html`<article class="perfil">
    <${Voltar} />
    <${Topo} titulo="Emendas para Bayeux" linhas=${['Dinheiro do Orçamento federal que deputados, senadores, bancadas e comissões mandaram para a cidade']} />
    <${Estatisticas} itens=${[{ rotulo: 'Recebido por quem está em Bayeux', valor: dinheiro(recebido) },
      { rotulo: 'Empenhado com Bayeux como destino', valor: dinheiro(empenhado) }, { rotulo: 'Autores', valor: String(e.recebido?.porAutor.length || e.porAutor.length) }]} />
    <${Recebido} r=${e.recebido} />
    <${Destinadas} e=${e} />
    <p class="hint">Fonte: Portal da Transparência (CGU). O recebido soma os pagamentos ao Município, a fundos municipais e a entidades sem fins lucrativos de Bayeux; empresas da cidade que venderam a outros lugares não entram. Emendas do Orçamento estadual não estão aqui (veja as receitas no perfil da Prefeitura).</p>
  </article>`;
}
