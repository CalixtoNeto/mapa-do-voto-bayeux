// Emendas parlamentares para Bayeux: o dinheiro que chegou a quem está na cidade (município, fundos, entidades),
// quem mandou, e as emendas que têm Bayeux como destino, com os convênios assinados.
import { dinheiro } from '../formato.mjs';
import { ListaDeBarras, usarLimite } from '../componentes.mjs';
import { ArvoreDeBarras } from '../arvore.mjs';
import { Colunas } from '../graficos.mjs';
import { ListaDeExecucao, ListaDeConvenios } from './execucao.mjs';
import { Voltar, Topo, Estatisticas, Secao, nomeProprio } from './pecas.mjs';
const { html } = window.htmPreact;

function Lista({ itens }) {
  const [limite, botao] = usarLimite(itens.length);
  return html`<${ListaDeBarras} itens=${itens.slice(0, limite)} />${botao}`;
}

const emendas = n => `${n} emenda${n > 1 ? 's' : ''}`;

// Autor → quem recebeu → ano, quando o arquivo já traz a árvore; senão, as listas de autores e de quem recebeu.
const rotuloDoRecebido = (nome, nivel) => nivel < 2 ? nomeProprio(nome) : nome;

function Recebido({ r }) {
  if (!r?.porAutor.length) return null;
  return html`<${Secao} id="er" titulo="Quem mandou o dinheiro que chegou">
      ${r.arvore?.v > 0 ? html`<p class="hint">Autor da emenda → quem recebeu → ano. Toque num item para abrir. Pagamentos a pessoas físicas aparecem somados, sem os nomes.</p>
        <div class="arvore"><${ArvoreDeBarras} arvore=${r.arvore} rotulo=${rotuloDoRecebido} /></div>`
      : html`<${Lista} itens=${r.porAutor.map(([autor, v, n]) => ({ n: html`${nomeProprio(autor)} <small>${emendas(n)}</small>`, v, rotulo: dinheiro(v) }))} />
        <h3>Quem recebeu</h3><${Lista} itens=${r.porFavorecido.map(([nome, natureza, v]) => ({ n: html`${nomeProprio(nome)} <small>${natureza}</small>`, v, rotulo: dinheiro(v) }))} />`}
      <h3>Por ano</h3><${Colunas} itens=${r.porAno.map(([a, v]) => ({ n: a, v, rotulo: dinheiro(v) }))} descricao=${'Emendas recebidas por ano: ' + r.porAno.map(([a, v]) => `${a}, ${dinheiro(v)}`).join('; ')} />
    <//>`;
}

function Destinadas({ e }) {
  return html`<${Secao} id="ed" titulo="Emendas com Bayeux como destino">
    <${ListaDeExecucao} itens=${e.porAutor.map(([autor, empenhado, pago, n, de, ate]) =>
      ({ nome: nomeProprio(autor), detalhe: `${emendas(n)} · ${de === ate ? de : `${de}–${ate}`}`, empenhado, pago }))} />
    ${e.convenios.length > 0 && html`<h3>Convênios mais recentes</h3><${ListaDeConvenios} convenios=${e.convenios} />`}
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
