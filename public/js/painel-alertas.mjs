// Valores distantes da mediana do cargo, na ficha do candidato: comparação estatística da prestação de contas
// com a dos outros candidatos ao mesmo cargo, sem juízo sobre as contas.
import { pct, dinheiro, sentence, titleCase, centavos } from './formato.mjs';
import { alertasDaCampanha } from './calculos-alertas.mjs';
const { html, useMemo } = window.htmPreact;

const vezes = (a, b) => `${(a / b).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} vezes`;
const TEXTO = {
  categoria: ([, nome, v, m, n]) => html`Despesa declarada de <b>${dinheiro(v)}</b> em “${sentence(nome)}”: ${vezes(v, m)} a mediana dos ${n} outros candidatos ao cargo com despesa nessa categoria (${dinheiro(m)}).`,
  custo: ([, meu, m]) => html`Gasto declarado por voto recebido: <b>${centavos(meu)}</b>, ${vezes(meu, m)} a mediana do cargo (${centavos(m)}).`,
  proprios: ([, v, bens]) => html`Recursos próprios declarados na campanha (<b>${dinheiro(v)}</b>) acima do total de bens declarados na candidatura (${dinheiro(bens)}). A declaração de bens não inclui a renda do período.`,
  doador: ([, nome, v, total]) => html`O maior doador (${titleCase(nome)}) responde por ${pct(v / total, 0)} das receitas declaradas (${dinheiro(v)} de ${dinheiro(total)}).`,
  fornecedor: ([, nome, v, total]) => html`O maior fornecedor (${titleCase(nome)}) responde por ${pct(v / total, 0)} das despesas declaradas (${dinheiro(v)} de ${dinheiro(total)}).`,
  doadorFornecedor: ([, nome, doou, recebeu]) => html`O mesmo nome (${titleCase(nome)}) aparece como doador (${dinheiro(doou)}) e como fornecedor (${dinheiro(recebeu)}) na prestação de contas; a coincidência é pelo nome.`,
  naoPago: ([, divida, total]) => html`Despesas contratadas sem pagamento registrado até a prestação de contas: <b>${dinheiro(divida)}</b> (${pct(divida / total, 0)} do total).`,
};

export function criarForaDaCurva(cfg) {
  return function ForaDaCurva({ cand, ctx }) {
    const alertas = useMemo(() => ctx && !cfg.foraDasFinancas(cand) ? alertasDaCampanha(cand, ctx) : [], [cand, ctx]);
    if (!alertas.length) return null;
    return html`<section class="analise" aria-labelledby="fc"><h2 id="fc">Valores distantes da mediana do cargo</h2>
      <p class="ressalva" role="note"><b>Comparação estatística, calculada pelo site.</b> Comparamos a prestação de contas desta candidatura com as dos outros candidatos a ${sentence(cfg.nomeDoCargo[cand.cargo] || '').toLowerCase()} na mesma eleição e listamos valores muito acima da mediana. Isso é comum e tem causas legítimas (tamanho e tipo da campanha, estrutura do partido, forma de registro). O site não avalia as contas; isso cabe à Justiça Eleitoral.</p>
      <ul class="lista-alertas">${alertas.map(a => html`<li><p>${TEXTO[a[0]](a)}</p></li>`)}</ul>
      <details class="hint"><summary>Como calculamos</summary><p>Categoria de gasto ou custo por voto 3 vezes ou mais a mediana dos outros candidatos ao cargo (com pelo menos 5 para comparar e R$ 5 mil na categoria). O maior doador ou fornecedor com metade ou mais do dinheiro, numa campanha de R$ 10 mil ou mais. Recursos próprios acima dos bens declarados. Doador que também foi fornecedor (pelo nome). 30% ou mais das despesas contratadas sem pagamento registrado.</p></details>
    </section>`;
  };
}
