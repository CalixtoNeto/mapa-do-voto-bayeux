// Listas de emendas: execução (pago × empenhado, com barra) e convênios (valor e data, função em etiqueta, objeto).
import { dinheiro, sentence } from '../formato.mjs';
import { usarLimite } from '../componentes.mjs';
import { execucaoDoEmpenho } from './calculos-perfil.mjs';
import { nomeProprio } from './pecas.mjs';
const { html } = window.htmPreact;

// itens: [{ nome, detalhe, empenhado, pago }]
export function ListaDeExecucao({ itens }) {
  const [limite, botao] = usarLimite(itens.length);
  return html`<ul class="execucao">${itens.slice(0, limite).map(i => { const { fracao, faixa } = execucaoDoEmpenho(i.empenhado, i.pago);
    return html`<li><div class="ex-quem"><b>${i.nome}</b><small>${i.detalhe}</small></div>
      <div class="ex-valores"><span>Pago: <b>${dinheiro(i.pago)}</b></span><b>Total: ${dinheiro(i.empenhado)}</b></div>
      <span class=${'ex-barra ' + faixa} role="img" aria-label=${`${Math.round(fracao * 100)}% pago`}><i style=${`width:${(fracao * 100).toFixed(1)}%`}></i></span></li>`; })}</ul>${botao}`;
}

// convenios: [[data, autor, objeto, valor, funcao]]
export function ListaDeConvenios({ convenios }) {
  const [limite, botao] = usarLimite(convenios.length);
  return html`<ul class="convenios">${convenios.slice(0, limite).map(([data, autor, objeto, valor, funcao]) => html`<li>
    <div class="cv-valor"><b>${dinheiro(valor)}</b><small>${data.split('-').reverse().join('/')}</small></div>
    <div class="cv-corpo"><span class="tag">${funcao}</span><p>${sentence(objeto)}</p>${autor && html`<small>Autor: ${nomeProprio(autor)}</small>`}</div></li>`)}</ul>${botao}`;
}
