// Valores atípicos nos pagamentos de um ano, agrupados por tipo, com a ressalva de que são uma conta do site
// e não avaliam a legalidade de nenhuma despesa.
import { pct, dinheiro, sentence, nf } from '../formato.mjs';
import { comprasQueDobraram, contratacoesEmAnoDeEleicao, mesAno } from './calculos-perfil.mjs';
import { nomeProprio } from './pecas.mjs';
const { html } = window.htmPreact;

const vezes = (a, b) => `${(a / b).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}×`;
const GRUPOS = {
  semDisputaAcimaDaReferencia: {
    titulo: 'Pagamentos sem licitação acima do valor de referência',
    explicacao: limite => `Soma, por fornecedor e tipo de compra, dos pagamentos que a Prefeitura registrou no Sagres como "sem licitação" ou "dispensa", comparada ao valor de referência da dispensa por valor (${dinheiro(limite)} no ano). É uma conta do site, não o critério legal, que considera o órgão e o objeto. Há contratações sem licitação com regras próprias (emergência, inexigibilidade, adesão a ata) e contratos licitados registrados com outra modalidade.`,
    item: ([, credor, objeto, v, n]) => [nomeProprio(credor), `${sentence(objeto)} · ${nf.format(n)} pagamento${n > 1 ? 's' : ''}`, dinheiro(v)],
  },
  pico: {
    titulo: 'Meses acima de 3 vezes a mediana mensal',
    explicacao: () => 'Meses em que um tipo de despesa somou mais de 3 vezes a mediana mensal do mesmo tipo no ano. Pagamentos concentrados num mês são comuns (obras pagas por medição, parcelas anuais).',
    item: ([, elemento, mes, v, mediana], ano) => [sentence(elemento), `${mesAno(ano + mes)} · ${vezes(v, mediana)} a mediana mensal (${dinheiro(mediana)})`, dinheiro(v)],
  },
  concentracao: {
    titulo: 'Tipos de despesa com 70% ou mais pagos a um fornecedor',
    explicacao: () => 'Tipos de despesa de R$ 1 milhão ou mais em que um fornecedor recebeu 70% ou mais do total. Contratos únicos de serviço contínuo (limpeza, merenda, transporte) costumam ter esse perfil.',
    item: ([, elemento, credor, v, total]) => [nomeProprio(credor), `${pct(v / total, 0)} de “${sentence(elemento)}” (${dinheiro(total)})`, dinheiro(v)],
  },
  contratacoes: {
    titulo: 'Variação de vínculos comissionados e temporários (janeiro → junho)',
    explicacao: () => 'Tipos de vínculo que cresceram 20% e 50 pessoas ou mais entre janeiro e junho, pela folha enviada ao TCE-PB. A variação pode vir do início do ano letivo, de programas com prazo, de substituições ou de reclassificação de vínculos.',
    item: ([, tipo, jan, jun], ano) => [tipo, `${nf.format(jan)} em 01/${ano} → ${nf.format(jun)} em 06/${ano}`, `+${nf.format(jun - jan)}`],
  },
  crescimento: {
    titulo: 'Tipos de compra que dobraram em relação ao ano anterior',
    explicacao: () => 'Tipos de compra que pelo menos dobraram em relação ao ano anterior completo. Obras e aquisições pontuais costumam explicar saltos de um ano para o outro.',
    item: ([, elemento, antes, depois], ano) => [sentence(elemento), `${dinheiro(antes)} em ${Number(ano) - 1} · ${vezes(depois, antes)}`, dinheiro(depois)],
  },
};
// Arquivos gerados antes da troca de nome ainda trazem a chave antiga.
const NOMES_ANTIGOS = { fracionamento: 'semDisputaAcimaDaReferencia' };
const comNomeAtual = ([tipo, ...resto]) => [NOMES_ANTIGOS[tipo] || tipo, ...resto];

function Grupo({ tipo, alertas, ano }) {
  const g = GRUPOS[tipo];
  return html`<div class="grupo-alertas"><h3><span class="tipo">${g.titulo}</span></h3><p class="hint">${g.explicacao(alertas[0][5])}</p>
    <ul class="locais">${alertas.map(a => { const [quem, detalhe, valor] = g.item(a, ano);
      return html`<li><span class="ln">${quem}<small>${detalhe}</small></span><span class="lv">${valor}</span></li>`; })}</ul></div>`;
}

export function Alertas({ a, anos }) {
  const lista = [...(a.alertas || []).map(comNomeAtual), ...contratacoesEmAnoDeEleicao(a).map(c => ['contratacoes', ...c]),
    ...comprasQueDobraram(anos, a.ano).map(c => ['crescimento', ...c])];
  return html`<div class="alertas">
    <p class="ressalva" role="note"><b>Valores atípicos, calculados pelo site.</b> Comparamos os pagamentos registrados no Sagres (TCE-PB) com a mediana do próprio município. Valores assim costumam ter causas legítimas (contrato único, pagamento concentrado, forma de registro), e o site não avalia a legalidade de nenhuma despesa. Para conferir, consulte o dado de origem no <a href="https://dados-abertos.tce.pb.gov.br/" target="_blank" rel="noopener">portal de dados abertos do TCE-PB</a>.</p>
    ${lista.length ? Object.keys(GRUPOS).map(tipo => { const doTipo = lista.filter(x => x[0] === tipo);
      return doTipo.length ? html`<${Grupo} tipo=${tipo} alertas=${doTipo} ano=${a.ano} />` : null; })
      : html`<p class="hint">Nenhum valor atípico pelos critérios do site neste ano.</p>`}
    <details class="hint"><summary>Como calculamos</summary>
      <p>Só entram compras, serviços, obras e locações (salários e previdência não). Pagamentos sem licitação acima do valor de referência: o mesmo fornecedor, no mesmo tipo de compra, recebeu sem licitação ou por dispensa mais que o valor de referência da dispensa por valor da Lei 14.133 (comparado de 2024 em diante); a soma é por fornecedor, não pelo critério da lei. Meses acima da mediana: mais de 3 vezes a mediana mensal do mesmo tipo de despesa e pelo menos R$ 300 mil. Fornecedor com 70% ou mais: 70% ou mais de um tipo de despesa de R$ 1 milhão ou mais. Vínculos comissionados e temporários: tipos que cresceram 20% e 50 pessoas entre janeiro e junho de ano de eleição municipal. Compras que dobraram: um tipo de compra que dobrou e cresceu R$ 1 milhão em relação ao ano anterior completo. Energia, água, telefone, tarifas e a publicação de atos oficiais ficam de fora.</p></details>
  </div>`;
}
