// "Fora da curva" na ficha do candidato: o que destoa na campanha em relação aos outros candidatos ao mesmo cargo.
import { pct, dinheiro, sentence, titleCase, centavos } from './formato.mjs';
import { alertasDaCampanha } from './calculos-alertas.mjs';
const { html, useMemo } = window.htmPreact;

const vezes = (a, b) => `${(a / b).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} vezes`;
const TEXTO = {
  categoria: ([, nome, v, m, n]) => html`Gastou <b>${dinheiro(v)}</b> com “${sentence(nome)}”, ${vezes(v, m)} a mediana dos ${n} outros candidatos que também gastaram nisso (${dinheiro(m)}).`,
  custo: ([, meu, m]) => html`Cada voto custou <b>${centavos(meu)}</b>, ${vezes(meu, m)} a mediana do cargo (${centavos(m)}).`,
  proprios: ([, v, bens]) => html`Pôs <b>${dinheiro(v)}</b> de recursos próprios na campanha, mais que os bens declarados ao TSE (${dinheiro(bens)}). O dinheiro pode vir de renda ou de bens que não precisam ser declarados.`,
  doador: ([, nome, v, total]) => html`<b>${titleCase(nome)}</b> sozinho(a) doou ${pct(v / total, 0)} de todo o dinheiro recebido (${dinheiro(v)} de ${dinheiro(total)}).`,
  fornecedor: ([, nome, v, total]) => html`<b>${titleCase(nome)}</b> recebeu ${pct(v / total, 0)} de tudo o que a campanha gastou (${dinheiro(v)} de ${dinheiro(total)}).`,
  doadorFornecedor: ([, nome, doou, recebeu]) => html`<b>${titleCase(nome)}</b> doou ${dinheiro(doou)} à campanha e também recebeu ${dinheiro(recebeu)} dela como fornecedor.`,
  naoPago: ([, divida, total]) => html`Ficaram <b>${dinheiro(divida)}</b> sem pagar, ${pct(divida / total, 0)} das despesas contratadas.`,
};

export function criarForaDaCurva(cfg) {
  return function ForaDaCurva({ cand, ctx }) {
    const alertas = useMemo(() => ctx && !cfg.foraDasFinancas(cand) ? alertasDaCampanha(cand, ctx) : [], [cand, ctx]);
    if (!alertas.length) return null;
    return html`<section class="analise" aria-labelledby="fc"><h2 id="fc">Fora da curva</h2>
      <p class="ressalva" role="note"><b>Comportamento fora da curva não é irregularidade.</b> Comparamos esta campanha com as dos outros candidatos a ${sentence(cfg.nomeDoCargo[cand.cargo] || '').toLowerCase()} na mesma eleição e mostramos só o que destoa muito. Pode haver explicação; quem fiscaliza as contas de campanha é a Justiça Eleitoral.</p>
      <ul class="lista-alertas">${alertas.map(a => html`<li><p>${TEXTO[a[0]](a)}</p></li>`)}</ul>
      <details class="hint"><summary>Como é calculado</summary><p>Categoria de gasto ou custo por voto 3 vezes ou mais a mediana dos outros candidatos ao cargo (com pelo menos 5 para comparar e R$ 5 mil na categoria). Um só doador ou fornecedor com metade ou mais do dinheiro, numa campanha de R$ 10 mil ou mais. Recursos próprios acima dos bens declarados. Doador que também foi fornecedor (pelo nome). 30% ou mais das despesas sem pagar.</p></details>
    </section>`;
  };
}
