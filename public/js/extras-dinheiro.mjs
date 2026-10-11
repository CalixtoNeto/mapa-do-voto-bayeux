// Mais sobre o dinheiro de um candidato: pago e dívida, de quem ele depende, ritmo da arrecadação,
// com quem divide doadores e fornecedores e o dinheiro dele em outras eleições.
import { nf, pct, dinheiro, centavos, diaEMes, NORM } from './formato.mjs';
import { ArvoreDoCargo } from './arvore-do-cargo.mjs';
import { arvoreDeParticipantes } from './calculos-arvores-dinheiro.mjs';
import { Colunas } from './graficos.mjs';
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
    <${Colunas} itens=${r.semanas.map(s => ({ n: diaEMes(s.semana), v: s.v, rotulo: dinheiro(s.v) }))} descricao=${'Dinheiro recebido por semana: ' + r.semanas.map(s => `semana de ${diaEMes(s.semana)}, ${dinheiro(s.v)}`).join('; ')} />
    <p class="hint">Metade do dinheiro tinha chegado até a semana de ${diaEMes(r.metade)}. Receitas pela data registrada na prestação de contas.</p>`;
}

// Quem se liga a mais de uma campanha: o valor do ramo é o que ele deu ou recebeu das outras campanhas.
function ArvoreDaRede({ titulo, legenda, rede, deste, de, onPick }) {
  const arvore = useMemo(() => arvoreDeParticipantes(rede.map(r => ({ n: r.n, v: r.outros.reduce((s, o) => s + o.v, 0), para: r.outros, deste: r.v })),
    { nota: r => `${dinheiro(r.deste)} ${deste}`, de }), [rede]);
  if (!rede.length) return null;
  return html`<h3>${titulo}</h3><${ArvoreDoCargo} arvore=${arvore} formato=${dinheiro} onPick=${onPick} ordenar=${true} legenda=${legenda} />`;
}

export function RedeDaCampanha({ f, chave, ctx, onPick }) {
  const jaListados = new Set((f.doa || []).map(d => d[0]));
  const doadores = useMemo(() => redeDoCandidato(f.doa, ctx.financas.doadores, chave, ctx.candPorChave).filter(r => !jaListados.has(r.n)), [f, ctx]);
  const fornecedores = useMemo(() => redeDoCandidato(f.fo, ctx.financas.fornecedores, chave, ctx.candPorChave), [f, ctx]);
  if (!doadores.length && !fornecedores.length) return null;
  return html`<${ArvoreDaRede} titulo="Outros doadores em comum com outras campanhas" legenda="Doador → outras campanhas que financiou · R$" rede=${doadores} deste="a este candidato" de="do que ele doou nas outras" onPick=${onPick} />
    <${ArvoreDaRede} titulo="Fornecedores em comum com outras campanhas" legenda="Fornecedor → outras campanhas que atendeu · R$" rede=${fornecedores} deste="deste candidato" de="do que ele recebeu nas outras" onPick=${onPick} />
    <p class="hint">Mostra quem se liga a mais de uma campanha nesta eleição; não indica, por si só, irregularidade nem acordo. Toque para ver as outras campanhas.</p>`;
}

export function DinheiroEntreEleicoes({ cand, ctx, nomeDoCargo }) {
  const campanhas = ctx.dinheiro[NORM(cand.nome || cand.urna)] || [];
  if (campanhas.length < 2) return null;
  const ordenadas = [...campanhas].sort((a, b) => a[0] - b[0]);
  return html`<h3>Em cada eleição</h3><${Colunas} itens=${ordenadas.map(c => ({ n: c[0], v: c[3], rotulo: dinheiro(c[3]) }))} descricao=${'Gasto declarado em cada eleição: ' + ordenadas.map(c => `${c[0]}, ${dinheiro(c[3])}`).join('; ')} /><ul class="posicoes">${[...campanhas].sort((a, b) => a[0] - b[0]).map(([ano, cargo, recebido, gasto, votos]) => html`<li>
    <span class="nm">${ano} · ${nomeDoCargo[cargo] || cargo}</span><span class="vv">${dinheiro(gasto)}</span>
    <small>recebeu ${dinheiro(recebido)} · ${nf.format(votos)} votos${gasto && votos ? ` · ${centavos(gasto / votos)} por voto` : ''}</small></li>`)}</ul>
    <p class="hint">Gasto declarado em cada eleição; a ligação entre eleições é pelo nome completo. Valores nominais.</p>`;
}
