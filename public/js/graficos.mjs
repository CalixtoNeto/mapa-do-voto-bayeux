// Gráficos de CSS puro, sem biblioteca: rosca, waffle, haltere e colunas. As contas estão em calculos-graficos.mjs.
import { gradienteDaRosca, celulasDoWaffle, trechoDoHaltere, alturasDasColunas, rotulosDoEixo } from './calculos-graficos.mjs';
const { html } = window.htmPreact;

// partes: [{ nome, v, cor, rotulo }]; o centro mostra o total. A legenda em texto repete o que a rosca desenha.
export function Rosca({ partes, centro, descricao }) {
  return html`<figure class="rosca">
    <div class="rosca-aro" role="img" aria-label=${descricao} style=${`background:${gradienteDaRosca(partes)}`}>
      <div class="rosca-miolo"><span>${centro.rotulo}</span><b>${centro.valor}</b></div></div>
    <ul class="leg">${partes.map(p => html`<li><i style=${`background:${p.cor}`}></i><span>${p.nome}</span><b>${p.rotulo}</b></li>`)}</ul>
  </figure>`;
}

// grupos: [{ id, nome, n, cor }]: um quadrado por assento.
export function Waffle({ grupos, descricao }) {
  const cor = new Map(grupos.map(g => [g.id, g.cor]));
  return html`<figure class="waffle">
    <div class="waffle-grade" role="img" aria-label=${descricao}>${celulasDoWaffle(grupos).map(id => html`<i style=${`background:${cor.get(id)}`}></i>`)}</div>
    <ul class="leg">${grupos.filter(g => g.n > 0).map(g => html`<li><i style=${`background:${g.cor}`}></i><span>${g.nome}</span><b>${g.n}</b></li>`)}</ul>
  </figure>`;
}

// Régua de 0 a max com um ponto no valor de antes (cinza) e outro no de depois (azul).
export function Haltere({ antes, depois, max, descricao }) {
  const t = trechoDoHaltere(antes, depois, max);
  return html`<span class=${'haltere ' + t.sentido} role="img" aria-label=${descricao}>
    <u style=${`left:${t.esquerda}%;width:${t.largura}%`}></u>
    <b class="antes" style=${`left:${t.de}%`}></b><b class="depois" style=${`left:${t.ate}%`}></b></span>`;
}

// itens: [{ n, v, rotulo }]; o último fica em destaque. Passe o valor já formatado em rotulo.
export function Colunas({ itens, descricao }) {
  const alturas = alturasDasColunas(itens.map(i => i.v)), eixo = rotulosDoEixo(itens.map(i => String(i.n))), densa = itens.length > 8;
  return html`<div class=${'colunas' + (densa ? ' densa' : '')} role="img" aria-label=${descricao}>${itens.map((i, k) => html`<div class=${k === itens.length - 1 ? 'ultima' : ''}>
    <span class="cv">${i.rotulo}</span><i style=${`height:${alturas[k]}%`}></i><span class="cn">${eixo[k]}</span></div>`)}</div>`;
}

// partes: [{ nome, v, cor, rotulo }]: uma barra só, dividida em proporção, com legenda em texto.
export function Pilha({ partes, descricao }) {
  return html`<figure class="pilha-fig"><div class="pilha" role="img" aria-label=${descricao}>
    ${partes.map(p => html`<i style=${`flex-grow:${p.v};background:${p.cor}`} title=${`${p.nome}: ${p.rotulo}`}></i>`)}</div>
    <ul class="leg">${partes.map(p => html`<li><i style=${`background:${p.cor}`}></i><span>${p.nome}</span><b>${p.rotulo}</b></li>`)}</ul></figure>`;
}
