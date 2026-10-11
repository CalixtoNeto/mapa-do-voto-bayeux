// Cartão de gráfico do sistema visual: tipo do gráfico em caixa-alta, título, subtítulo, o gráfico e uma nota que explica a escala.
const { html } = window.htmPreact;

export function Cartao({ tipo, titulo, sub, nota, classe = '', children }) {
  return html`<figure class=${('cartao ' + classe).trim()}>
    ${tipo && html`<span class="kicker">${tipo}</span>`}
    ${titulo && html`<h3>${titulo}</h3>`}${sub && html`<p class="sub">${sub}</p>`}
    ${children}
    ${nota && html`<figcaption>${nota}</figcaption>`}
  </figure>`;
}

// Texto longo sob demanda: o dado vem primeiro e a explicação fica recolhida.
export function ComoLer({ titulo = 'Como ler estes números', children }) {
  return html`<details class="como-ler"><summary>${titulo}</summary><div>${children}</div></details>`;
}

// Aviso com fio vermelho à esquerda (ressalvas, limitações dos dados).
export const Aviso = ({ children }) => html`<p class="aviso" role="note">${children}</p>`;
