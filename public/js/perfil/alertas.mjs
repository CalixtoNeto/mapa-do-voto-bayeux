// Gastos fora do padrão em um ano, com a ressalva de que não são acusação de irregularidade.
import { pct, dinheiro, sentence, nf } from '../formato.mjs';
import { crescimentosAnormais, mesAno } from './calculos-perfil.mjs';
import { nomeProprio } from './pecas.mjs';
const { html } = window.htmPreact;

const vezes = (a, b) => `${(a / b).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} vezes`;
const TEXTO = {
  fracionamento: ([, credor, objeto, v, n, limite]) => [`Pagamentos sem licitação acima do limite de dispensa`,
    html`<b>${nomeProprio(credor)}</b> recebeu ${dinheiro(v)} em ${nf.format(n)} pagamentos sem licitação ou por dispensa em “${sentence(objeto)}”, acima do limite de dispensa por valor (${dinheiro(limite)}). Somar compras do mesmo objeto acima do limite pode indicar fracionamento, mas dispensas por emergência e outras hipóteses legais não têm esse limite.`],
  pico: ([, elemento, mes, v, mediana], ano) => [`Mês fora do padrão`,
    html`Em ${mesAno(ano + mes)}, “${sentence(elemento)}” somou ${dinheiro(v)}, ${vezes(v, mediana)} o valor de um mês típico do ano (${dinheiro(mediana)}).`],
  concentracao: ([, elemento, credor, v, total]) => [`Um fornecedor com quase tudo`,
    html`<b>${nomeProprio(credor)}</b> ficou com ${pct(v / total, 0)} de tudo o que foi pago em “${sentence(elemento)}” (${dinheiro(v)} de ${dinheiro(total)}).`],
  crescimento: ([, elemento, antes, depois], ano) => [`Crescimento fora do padrão`,
    html`“${sentence(elemento)}” passou de ${dinheiro(antes)} em ${Number(ano) - 1} para ${dinheiro(depois)} em ${ano} (${vezes(depois, antes)}).`],
};

export function Alertas({ a, anos }) {
  const lista = [...(a.alertas || []), ...crescimentosAnormais(anos, a.ano).map(c => ['crescimento', ...c])];
  return html`<div class="alertas">
    <p class="ressalva" role="note"><b>Isto não é acusação.</b> Os alertas mostram gastos fora do padrão nos dados públicos do TCE-PB. Podem ter explicação (emergência, contrato pago de uma vez, erro de lançamento) e não indicam irregularidade. Para apurar, procure a Prefeitura, a Câmara ou o TCE-PB.</p>
    ${lista.length ? html`<ul class="lista-alertas">${lista.map(alerta => {
      const [titulo, texto] = TEXTO[alerta[0]](alerta, a.ano);
      return html`<li><span class="tipo">${titulo}</span><p>${texto}</p></li>`;
    })}</ul>` : html`<p class="hint">Nenhum gasto fora do padrão pelos critérios usados neste ano.</p>`}
    <details class="hint"><summary>Como os alertas são calculados</summary>
      <p>Só entram compras, serviços, obras e locações (salários e previdência não). Fracionamento: o mesmo fornecedor, no mesmo objeto, recebeu sem licitação ou por dispensa mais que o limite de dispensa por valor da Lei 14.133 (comparado de 2024 em diante). Mês fora do padrão: mais de 3 vezes a mediana mensal do mesmo tipo de despesa e pelo menos R$ 300 mil. Um fornecedor com quase tudo: 70% ou mais de um tipo de despesa de R$ 1 milhão ou mais. Crescimento: um tipo de compra que dobrou e cresceu R$ 1 milhão em relação ao ano anterior completo. Energia, água, telefone e tarifas ficam de fora.</p></details>
  </div>`;
}
