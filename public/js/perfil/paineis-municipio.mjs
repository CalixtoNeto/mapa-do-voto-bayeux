// O dinheiro do município num ano, pelos dados do TCE-PB: quanto pagou, em que área, a quem, a folha,
// as licitações e as emendas recebidas.
import { pct, nf, dinheiro } from '../formato.mjs';
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

export function GastosDoAno({ a }) {
  if (!a.despesas) return null;
  return html`<${Secao} id="mg" titulo=${`Onde o dinheiro foi gasto em ${a.ano}`}>
    <h3>Por área</h3>${barras(a.despesas.funcoes.slice(0, 10))}
    <h3>Por órgão</h3>${barras(a.despesas.orgaos, 2)}
    <h3>Quem mais recebeu</h3><${Recebedores} lista=${a.despesas.credores} />
  <//>`;
}

export function FolhaDoAno({ a }) {
  if (!a.servidores) return null;
  const itens = a.servidores.tipos.map(([tipo, pessoas, total]) => ({ n: tipo, v: total, rotulo: `${dinheiro(total)} · ${nf.format(pessoas)} pessoas` }));
  return html`<${Secao} id="mf" titulo="Folha de pessoal"><h3>Por tipo de cargo</h3><${ListaDeBarras} itens=${itens} />
    <p class="hint">Pessoas no último mês publicado e total pago no ano.</p><//>`;
}

export function LicitacoesDoAno({ a }) {
  if (!a.licitacoes?.modalidades.length) return null;
  const itens = a.licitacoes.modalidades.map(([m, n, v]) => ({ n: m, v, rotulo: `${dinheiro(v)} · ${n}` }));
  return html`<${Secao} id="ml" titulo="Licitações"><${ListaDeBarras} itens=${itens} />
    <h3>Quem mais venceu</h3><${Recebedores} lista=${a.licitacoes.vencedores} />
    <p class="hint">Valor das propostas vencedoras e número de licitações por modalidade.</p><//>`;
}

export function EmendasRecebidas({ a }) {
  if (!a.receitas?.origensDasEmendas.length) return null;
  return html`<${Secao} id="me" titulo="Emendas parlamentares que entraram no caixa">${barras(a.receitas.origensDasEmendas)}
    <p class="hint">Receitas que a Prefeitura registrou como vindas de emendas, por origem e tipo. Veja quem as mandou em <a href="#perfil/emendas">Emendas para Bayeux</a>.</p><//>`;
}
