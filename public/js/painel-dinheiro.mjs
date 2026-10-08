// Dinheiro da campanha de um candidato: números principais, origem do dinheiro, posição no cargo,
// despesas por categoria, doadores e fornecedores. cfg é o mesmo de painel-candidato.mjs.
import { pct, sentence, dinheiro, centavos } from './formato.mjs';
import { BarraDeOrigens } from './componentes.mjs';
import { resumoFinanceiro, custoPorVoto, posicoesNoCargo } from './calculos.mjs';
import { PosicaoNoCargo, DespesasDoCandidato, DoadoresDoCandidato, FornecedoresDoCandidato } from './listas-dinheiro.mjs';
import { PagoEDependencia, RitmoDaArrecadacao, RedeDaCampanha, DinheiroEntreEleicoes } from './extras-dinheiro.mjs';
const { html, useMemo } = window.htmPreact;

function semPrestacao(financas, ano) {
  if (financas) return 'O TSE não tem prestação de contas deste candidato.';
  return +ano < 2018 ? 'O TSE publica a prestação de contas dos candidatos neste formato a partir de 2018.'
    : 'A prestação de contas desta eleição ainda não foi gerada para o site.';
}

function NumerosDoDinheiro({ r, custo, posicao, cand }) {
  return html`<dl class="stats">
    <div><dt>Recebido</dt><dd>${dinheiro(r.recebido)}</dd></div>
    <div><dt>Gasto declarado</dt><dd>${dinheiro(r.gasto)}</dd></div>
    <div><dt>Custo por voto${cand.turno !== '1' ? ' (2º turno)' : ''}</dt><dd>${custo != null ? centavos(custo) : '—'}</dd>
      ${posicao.posicao > 0 ? html`<small>${posicao.posicao}º menor entre ${posicao.de}</small>` : null}</div>
    <div><dt>Fundo eleitoral</dt><dd>${dinheiro(r.fefc)}</dd>${r.recebido ? html`<small>${pct(r.fefc / r.recebido, 0)} do recebido</small>` : null}</div>
  </dl>`;
}

function notasDoDinheiro(r, financas, cfg, cand) {
  return [
    !financas.final && 'Prestação de contas parcial: a final é entregue até 30 dias depois da eleição.',
    'Gasto: despesas contratadas declaradas ao TSE' + (r.repasses ? `, sem ${dinheiro(r.repasses)} doados a outras campanhas.` : '.'),
    `Custo por voto: gasto dividido pelos votos ${cfg.regiao}.`,
    cfg.ehMajoritario(cand) && 'Em cargos majoritários, o dinheiro é da chapa (com vice ou suplentes) e, quando há 2º turno, cobre os dois.',
    r.deCandidatos ? `${dinheiro(r.deCandidatos)} vieram de outros candidatos (podem incluir fundo eleitoral repassado).` : '',
  ].filter(Boolean);
}

export function criarDinheiro(cfg) {
  return function Dinheiro({ cand, financas, ano, linhasDoCargo, ctx, onPick }) {
    const chave = cfg.chaveDe(cand), f = financas?.c?.[chave];
    const posicoes = useMemo(() => posicoesNoCargo(linhasDoCargo, cand), [linhasDoCargo, cand]);
    const cab = html`<h2 id="din">Dinheiro da campanha</h2>`;
    const fora = cfg.foraDasFinancas(cand);
    if (fora || !f) return html`<section class="analise" aria-labelledby="din">${cab}<p class="hint">${fora || semPrestacao(financas, ano)}</p></section>`;
    const r = resumoFinanceiro(f), custo = custoPorVoto(r.gasto, cand.total);
    return html`<section class="analise" aria-labelledby="din">${cab}
      <${NumerosDoDinheiro} r=${r} custo=${custo} posicao=${posicoes.custo} cand=${cand} />
      <${PagoEDependencia} f=${f} perfil=${ctx?.perfis?.c?.[chave]} recebido=${r.recebido} />
      <${BarraDeOrigens} grupos=${r.grupos} total=${r.recebido} />
      <${PosicaoNoCargo} posicoes=${posicoes} nomeDoCargo=${sentence(cfg.nomeDoCargo[cand.cargo] || '').toLowerCase()} />
      <${DespesasDoCandidato} categorias=${r.categorias} />
      <${DoadoresDoCandidato} doacoes=${f.doa} quantos=${f.nd} recebido=${r.recebido} />
      <${FornecedoresDoCandidato} fornecedores=${f.fo} quantos=${f.nf} gasto=${r.gasto} />
      ${ctx && html`<${RedeDaCampanha} f=${f} chave=${chave} ctx=${ctx} onPick=${onPick} />`}
      <${RitmoDaArrecadacao} semanas=${f.rs} />
      ${ctx && html`<${DinheiroEntreEleicoes} cand=${cand} ctx=${ctx} nomeDoCargo=${cfg.nomeDoCargo} />`}
      ${notasDoDinheiro(r, financas, cfg, cand).map(n => html`<p class="hint">${n}</p>`)}
    </section>`;
  };
}
