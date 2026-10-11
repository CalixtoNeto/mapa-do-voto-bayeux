// Estrutura das telas no sistema visual: cabeçalho da página, indicadores, abas, pílulas e blocos com título.
const { html } = window.htmPreact;

// rotulo: linha pequena em caixa-alta acima do título (ex.: "VEREADOR · 2024"); lede: o que a página mostra.
export function Cabecalho({ rotulo, titulo, lede, children }) {
  return html`<div class="who">
    ${rotulo && html`<p class="rotulo-pagina">${rotulo}</p>`}<h1>${titulo}</h1>
    ${lede && html`<p class="lede">${lede}</p>`}${children}</div>`;
}

// itens: [{ rotulo, valor, nota, classe }]: um número grande por indicador, abaixo de um fio de 2px; classe 'up' ou 'down' põe ▲ ou ▼.
export function Indicadores({ itens }) {
  const visiveis = itens.filter(i => i && i.valor != null && i.valor !== '');
  return visiveis.length ? html`<dl class=${'indicadores' + (visiveis.length > 3 ? ' denso' : '')} style=${`--n:${visiveis.length}`}>${visiveis.map(i => html`<div>
    <dt>${i.rotulo}</dt><dd class=${i.classe || ''}>${i.valor}</dd>${i.nota && html`<small>${i.nota}</small>`}</div>`)}</dl>` : null;
}

// itens: [[id, rotulo]]. estilo "aba": sublinhado vermelho na ativa; "pilula": botões arredondados.
export function Abas({ itens, valor, aoMudar, rotulo, estilo = 'aba' }) {
  return html`<div class=${'abas ' + estilo} role="tablist" aria-label=${rotulo}>${itens.map(([id, nome]) =>
    html`<button type="button" role="tab" id=${'aba-' + id} aria-selected=${valor === id} onClick=${() => aoMudar(id)}>${nome}</button>`)}</div>`;
}

// Bloco de página: título de seção em Faustina, uma frase de apresentação e os cartões numa grade.
export function Bloco({ id, titulo, lede, colunas = '', children }) {
  return html`<section class="bloco" aria-labelledby=${id}><h2 id=${id}>${titulo}</h2>
    ${lede && html`<p class="lede">${lede}</p>`}<div class=${('grade ' + colunas).trim()}>${children}</div></section>`;
}
