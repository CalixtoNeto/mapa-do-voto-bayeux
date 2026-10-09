// Gastos fora do padrão em um ano, agrupados por tipo, com a ressalva de que não são acusação de irregularidade.
import { pct, dinheiro, sentence, nf } from '../formato.mjs';
import { crescimentosAnormais, contratacoesEmAnoDeEleicao, mesAno } from './calculos-perfil.mjs';
import { nomeProprio } from './pecas.mjs';
const { html } = window.htmPreact;

const vezes = (a, b) => `${(a / b).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}×`;
const GRUPOS = {
  fracionamento: {
    titulo: 'Sem licitação acima do limite',
    explicacao: limite => `Fornecedores que, somando os pagamentos registrados sem licitação ou por dispensa no mesmo tipo de compra, passaram do valor até o qual a lei permite contratar sem licitação só pelo valor (${dinheiro(limite)} no ano). Pode haver explicação legal: emergência, inexigibilidade, contrato licitado registrado com outra modalidade.`,
    item: ([, credor, objeto, v, n]) => [nomeProprio(credor), `${sentence(objeto)} · ${nf.format(n)} pagamento${n > 1 ? 's' : ''}`, dinheiro(v)],
  },
  pico: {
    titulo: 'Mês fora do padrão',
    explicacao: () => 'Meses em que um tipo de despesa somou mais de 3 vezes o valor de um mês típico do ano.',
    item: ([, elemento, mes, v, mediana], ano) => [sentence(elemento), `${mesAno(ano + mes)} · ${vezes(v, mediana)} um mês típico (${dinheiro(mediana)})`, dinheiro(v)],
  },
  concentracao: {
    titulo: 'Um fornecedor com quase tudo',
    explicacao: () => 'Tipos de despesa de R$ 1 milhão ou mais em que um só fornecedor ficou com 70% ou mais.',
    item: ([, elemento, credor, v, total]) => [nomeProprio(credor), `${pct(v / total, 0)} de “${sentence(elemento)}” (${dinheiro(total)})`, dinheiro(v)],
  },
  contratacoes: {
    titulo: 'Contratações em ano de eleição',
    explicacao: () => 'Em ano de eleição municipal a lei proíbe contratar nos 3 meses antes da eleição. Aqui, tipos de cargo (comissionados, temporários) que cresceram 20% e 50 pessoas ou mais entre janeiro e junho.',
    item: ([, tipo, jan, jun], ano) => [tipo, `${nf.format(jan)} em 01/${ano} → ${nf.format(jun)} em 06/${ano}`, `+${nf.format(jun - jan)}`],
  },
  crescimento: {
    titulo: 'Crescimento fora do padrão',
    explicacao: () => 'Tipos de compra que pelo menos dobraram em relação ao ano anterior completo.',
    item: ([, elemento, antes, depois], ano) => [sentence(elemento), `${dinheiro(antes)} em ${Number(ano) - 1} · ${vezes(depois, antes)}`, dinheiro(depois)],
  },
};

function Grupo({ tipo, alertas, ano }) {
  const g = GRUPOS[tipo];
  return html`<div class="grupo-alertas"><h3><span class="tipo">${g.titulo}</span></h3><p class="hint">${g.explicacao(alertas[0][5])}</p>
    <ul class="locais">${alertas.map(a => { const [quem, detalhe, valor] = g.item(a, ano);
      return html`<li><span class="ln">${quem}<small>${detalhe}</small></span><span class="lv">${valor}</span></li>`; })}</ul></div>`;
}

export function Alertas({ a, anos }) {
  const lista = [...(a.alertas || []), ...contratacoesEmAnoDeEleicao(a).map(c => ['contratacoes', ...c]),
    ...crescimentosAnormais(anos, a.ano).map(c => ['crescimento', ...c])];
  return html`<div class="alertas">
    <p class="ressalva" role="note"><b>Comportamento fora da curva não é irregularidade.</b> Os alertas mostram gastos que destoam do padrão nos dados públicos do TCE-PB. Podem ter explicação (emergência, contrato pago de uma vez, erro de lançamento) e não indicam irregularidade. Para apurar, procure a Prefeitura, a Câmara ou o TCE-PB.</p>
    ${lista.length ? Object.keys(GRUPOS).map(tipo => { const doTipo = lista.filter(x => x[0] === tipo);
      return doTipo.length ? html`<${Grupo} tipo=${tipo} alertas=${doTipo} ano=${a.ano} />` : null; })
      : html`<p class="hint">Nenhum gasto fora do padrão pelos critérios usados neste ano.</p>`}
    <details class="hint"><summary>Como os alertas são calculados</summary>
      <p>Só entram compras, serviços, obras e locações (salários e previdência não). Sem licitação acima do limite: o mesmo fornecedor, no mesmo tipo de compra, recebeu sem licitação ou por dispensa mais que o limite de dispensa por valor da Lei 14.133 (comparado de 2024 em diante). Mês fora do padrão: mais de 3 vezes a mediana mensal do mesmo tipo de despesa e pelo menos R$ 300 mil. Um fornecedor com quase tudo: 70% ou mais de um tipo de despesa de R$ 1 milhão ou mais. Contratações em ano de eleição: comissionados ou temporários que cresceram 20% e 50 pessoas entre janeiro e junho de ano de eleição municipal. Crescimento: um tipo de compra que dobrou e cresceu R$ 1 milhão em relação ao ano anterior completo. Energia, água, telefone, tarifas e a publicação de atos oficiais ficam de fora.</p></details>
  </div>`;
}
