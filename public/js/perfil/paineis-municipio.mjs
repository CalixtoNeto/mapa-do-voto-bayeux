// O dinheiro do município num ano, pelos dados do TCE-PB: números do ano, folha, licitações e emendas recebidas.
// Área, órgão e fornecedor ficam na árvore de "Para onde foi o dinheiro" (arvore.mjs).
import { pct, nf, dinheiro, sentence } from '../formato.mjs';
import { ArvoreDeBarras } from '../arvore.mjs';
import { ListaDeBarras, usarLimite } from '../componentes.mjs';
import { mesAno } from './calculos-perfil.mjs';
import { Estatisticas, Secao, nomeProprio } from './pecas.mjs';
const { html } = window.htmPreact;

const soma = (lista, i) => (lista || []).reduce((s, l) => s + l[i], 0);
const ultimoMes = a => a.despesas?.meses?.length ? a.despesas.meses[a.despesas.meses.length - 1][0] : null;

export function NumerosDoAno({ a }) {
  const pago = soma(a.despesas?.orgaos, 2), folha = soma(a.servidores?.orgaos, 2), pessoas = soma(a.servidores?.orgaos, 1);
  return html`<${Estatisticas} itens=${[
    { rotulo: 'Pago no ano', valor: a.despesas ? dinheiro(pago) : null, nota: ultimoMes(a) && `até ${mesAno(a.ano + ultimoMes(a))}` },
    { rotulo: 'Compras e serviços sem licitação', valor: a.despesas?.compras ? pct(a.despesas.semLicitacao / a.despesas.compras, 0) : null,
      nota: a.despesas?.compras ? `${dinheiro(a.despesas.semLicitacao)} de ${dinheiro(a.despesas.compras)}` : null },
    { rotulo: 'Folha de pessoal', valor: a.servidores ? dinheiro(folha) : null, nota: a.servidores && `${nf.format(pessoas)} pessoas no último mês` },
    { rotulo: 'Emendas recebidas', valor: a.receitas ? dinheiro(a.receitas.emendas) : null, nota: a.receitas?.total ? `${pct(a.receitas.emendas / a.receitas.total, 1)} da receita` : null }]} />`;
}

function Recebedores({ lista }) {
  const [limite, botao] = usarLimite(lista.length);
  return html`<${ListaDeBarras} itens=${lista.slice(0, limite).map(([nome, , v, n]) => ({ n: nomeProprio(nome), v, rotulo: `${dinheiro(v)}${n > 1 ? ` · ${n}×` : ''}` }))} />${botao}`;
}

const barras = (lista, i = 1) => html`<${ListaDeBarras} itens=${lista.map(l => ({ n: l[0], v: l[i], rotulo: dinheiro(l[i]) }))} />`;

// Folha e licitações em árvore (tipo de cargo → órgão; modalidade → vencedor) quando o detalhe do ano já tem;
// senão, as listas do resumo, que não cruzam os dois níveis.
const arvoreDe = (detalhe, id) => detalhe?.arvores?.[id]?.v > 0 ? detalhe.arvores[id] : null;

export function FolhaDoAno({ a, detalhe }) {
  if (!a.servidores) return null;
  const arvore = arvoreDe(detalhe, 'folha');
  const itens = a.servidores.tipos.map(([tipo, pessoas, total]) => ({ n: tipo, v: total, rotulo: `${dinheiro(total)} · ${nf.format(pessoas)} pessoas` }));
  return html`<${Secao} id="mf" titulo="Folha de pessoal">
    ${arvore ? html`<p class="hint">Tipo de cargo → órgão. Toque num item para abrir.</p><div class="arvore"><${ArvoreDeBarras} arvore=${arvore} /></div>`
      : html`<h3>Por tipo de cargo</h3><${ListaDeBarras} itens=${itens} />`}
    <p class="hint">Total pago no ano. Pessoas no último mês publicado: ${a.servidores.tipos.map(([tipo, pessoas]) => `${tipo.toLowerCase()} ${nf.format(pessoas)}`).join(' · ')}.</p><//>`;
}

export function LicitacoesDoAno({ a, detalhe }) {
  if (!a.licitacoes?.modalidades.length) return null;
  const arvore = arvoreDe(detalhe, 'licitacoes');
  const itens = a.licitacoes.modalidades.map(([m, n, v]) => ({ n: m, v, rotulo: `${dinheiro(v)} · ${n}` }));
  return html`<${Secao} id="ml" titulo="Licitações">
    ${arvore ? html`<p class="hint">Modalidade → vencedor. Toque num item para abrir.</p><div class="arvore"><${ArvoreDeBarras} arvore=${arvore} rotulo=${(nome, nivel) => nivel === 1 && !/^Outros \(/.test(nome) ? nomeProprio(nome) : sentence(nome)} /></div>`
      : html`<${ListaDeBarras} itens=${itens} /><h3>Quem mais venceu</h3><${Recebedores} lista=${a.licitacoes.vencedores} />`}
    <p class="hint">Valor das propostas vencedoras. Licitações por modalidade: ${a.licitacoes.modalidades.map(([m, n]) => `${m.toLowerCase()} ${nf.format(n)}`).join(' · ')}.</p><//>`;
}

export function EmendasRecebidas({ a }) {
  if (!a.receitas?.origensDasEmendas.length) return null;
  return html`<${Secao} id="me" titulo="Emendas parlamentares que entraram no caixa">${barras(a.receitas.origensDasEmendas)}
    <p class="hint">Receitas que a Prefeitura registrou como vindas de emendas, por origem e tipo. Veja quem as mandou em <a href="#perfil/emendas">Emendas para Bayeux</a>.</p><//>`;
}
