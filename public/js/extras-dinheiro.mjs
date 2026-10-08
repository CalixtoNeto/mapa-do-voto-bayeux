// Mais sobre o dinheiro de um candidato: pago e dívida, de quem ele depende, ritmo da arrecadação,
// com quem divide doadores e fornecedores e o dinheiro dele em outras eleições.
import { nf, pct, titleCase, dinheiro, centavos, diaEMes, NORM } from './formato.mjs';
import { ListaDeBarras, nomeDe } from './componentes.mjs';
import { ritmoDaArrecadacao, dividaDeCampanha, dependencia, redeDoCandidato } from './calculos.mjs';
const { html, useMemo } = window.htmPreact;

export function PagoEDependencia({ f, perfil, recebido }) {
  const divida = dividaDeCampanha(f), dep = dependencia(f, perfil, recebido);
  const itens = [
    divida != null && ['Ficou sem pagar', dinheiro(divida), `pago: ${dinheiro(f.pg || 0)}`],
    dep.maiorDoador != null && ['Maior doador', pct(dep.maiorDoador, 0), 'do dinheiro recebido'],
    dep.proprios ? ['Recursos próprios', pct(dep.proprios, 0), 'do dinheiro recebido'] : null,
  ].filter(Boolean);
  if (!itens.length) return null;
  return html`<dl class="stats">${itens.map(([dt, dd, sm]) => html`<div><dt>${dt}</dt><dd>${dd}</dd><small>${sm}</small></div>`)}</dl>
    ${divida > 0 && html`<p class="hint">Despesa contratada e não paga até a prestação de contas vira dívida de campanha, que o partido pode assumir.</p>`}`;
}

export function RitmoDaArrecadacao({ semanas }) {
  const r = useMemo(() => ritmoDaArrecadacao(semanas), [semanas]);
  if (r.semanas.length < 2) return null;
  return html`<h3>Quando o dinheiro chegou</h3>
    <${ListaDeBarras} itens=${r.semanas.map(s => ({ n: `Semana de ${diaEMes(s.semana)}`, v: s.v, rotulo: `${dinheiro(s.v)} · ${pct(s.acumulado, 0)} até aqui` }))} />
    <p class="hint">Metade do dinheiro tinha chegado até a semana de ${diaEMes(r.metade)}. Receitas pela data registrada na prestação de contas.</p>`;
}

function ListaDaRede({ titulo, rede, verbo, onPick }) {
  if (!rede.length) return null;
  return html`<h3>${titulo}</h3><ul class="rede">${rede.map(r => html`<li><span class="nm">${titleCase(r.n)}</span> ${verbo}${' '}${r.outros.slice(0, 4).map((o, i) => html`${i ? ', ' : ''}<button type="button" class="link" onClick=${() => onPick(o.cand)}>${nomeDe(o.cand)}</button> (${dinheiro(o.v)})`)}${r.outros.length > 4 ? ` e mais ${r.outros.length - 4}` : ''}</li>`)}</ul>`;
}

export function RedeDaCampanha({ f, chave, ctx, onPick }) {
  const doadores = useMemo(() => redeDoCandidato(f.doa, ctx.financas.doadores, chave, ctx.candPorChave), [f, ctx]);
  const fornecedores = useMemo(() => redeDoCandidato(f.fo, ctx.financas.fornecedores, chave, ctx.candPorChave), [f, ctx]);
  if (!doadores.length && !fornecedores.length) return null;
  return html`<${ListaDaRede} titulo="Doadores em comum com outras campanhas" rede=${doadores} verbo="também doou a" onPick=${onPick} />
    <${ListaDaRede} titulo="Fornecedores em comum com outras campanhas" rede=${fornecedores} verbo="também atendeu" onPick=${onPick} />
    <p class="hint">Mostra quem se liga a mais de uma campanha nesta eleição; não indica, por si só, irregularidade nem acordo.</p>`;
}

export function DinheiroEntreEleicoes({ cand, ctx, nomeDoCargo }) {
  const campanhas = ctx.dinheiro[NORM(cand.nome || cand.urna)] || [];
  if (campanhas.length < 2) return null;
  return html`<h3>Em cada eleição</h3><ul class="posicoes">${[...campanhas].sort((a, b) => a[0] - b[0]).map(([ano, cargo, recebido, gasto, votos]) => html`<li>
    <span class="nm">${ano} · ${nomeDoCargo[cargo] || cargo}</span><span class="vv">${dinheiro(gasto)}</span>
    <small>recebeu ${dinheiro(recebido)} · ${nf.format(votos)} votos${gasto && votos ? ` · ${centavos(gasto / votos)} por voto` : ''}</small></li>`)}</ul>
    <p class="hint">Gasto declarado em cada eleição; a ligação entre eleições é pelo nome completo. Valores nominais.</p>`;
}
