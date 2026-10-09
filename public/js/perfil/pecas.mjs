// Peças comuns às páginas de perfil.
import { dinheiro, titleCase } from '../formato.mjs';
import { usarLimite } from '../componentes.mjs';
import { agruparLigacoes } from './calculos-perfil.mjs';
const { html } = window.htmPreact;

export const ano = data => String(data || '').slice(0, 4);
export const nomeProprio = nome => titleCase(nome);

export function Voltar({ para = '#perfis', texto = 'Todos os perfis' }) {
  return html`<a class="voltar" href=${para}>← ${texto}</a>`;
}

export function Topo({ foto, titulo, linhas = [], children }) {
  return html`<header class="perfil-topo">
    ${foto && html`<img src=${foto.replace(/^http:/, 'https:')} alt="" width="88" height="88" loading="lazy" onError=${e => { e.target.hidden = true; }} />`}
    <div class="who"><h1>${titulo}</h1>${linhas.filter(Boolean).map((l, i) => html`<p class=${i ? 'sub' : ''}>${l}</p>`)}${children}</div>
  </header>`;
}

export function Estatisticas({ itens }) {
  const visiveis = itens.filter(i => i && i.valor != null && i.valor !== '');
  return visiveis.length ? html`<dl class="stats">${visiveis.map(i => html`<div><dt>${i.rotulo}</dt><dd>${i.valor}</dd>${i.nota && html`<small>${i.nota}</small>`}</div>`)}</dl>` : null;
}

export function Secao({ id, titulo, children }) {
  return html`<section class="analise" aria-labelledby=${id}><h2 id=${id}>${titulo}</h2>${children}</section>`;
}

const PAPEL = { doou: 'doou', recebeu: 'recebeu' };
const periodo = anos => anos.length > 1 ? `${anos[0]}–${anos[anos.length - 1]}` : anos[0];
const campanha = (c, comCandidato) => `${PAPEL[c.papel]} ${dinheiro(c.valor)}${comCandidato && c.quem ? ` · ${nomeProprio(c.quem)} (${c.eleicao})` : ` em ${c.eleicao}`}`;

// Credores do município ligados a campanhas, um por linha: { ano, credor, pago, valor, papel, quem?, eleicao }
export function Ligacoes({ ligacoes, comCandidato }) {
  const grupos = agruparLigacoes(ligacoes), [limite, botao] = usarLimite(grupos.length);
  if (!grupos.length) return html`<p class="hint">Nenhum doador ou fornecedor desta campanha aparece, com o mesmo documento, entre os credores do município.</p>`;
  return html`<ul class="locais ligacoes">${grupos.slice(0, limite).map(g => html`<li><span class="ln">${nomeProprio(g.credor)}
      ${g.campanhas.map(c => html`<small>${campanha(c, comCandidato)}</small>`)}</span>
    <span class="lv">${dinheiro(g.pago)}<small>${periodo(g.anos)}</small></span></li>`)}</ul>${botao}
    <p class="ressalva" role="note">Cruzamento automático entre a prestação de contas (TSE) e os pagamentos do município (TCE-PB) pelo documento: empresa pelo CNPJ; pessoa física pelos dígitos centrais do CPF (os que o TCE-PB publica) e pelo nome completo. À esquerda, o valor na campanha; à direita, o que o município pagou. Aparecer nas duas bases não indica relação entre a doação ou o serviço e o pagamento: pessoas e empresas atendem campanhas e órgãos públicos ao mesmo tempo por razões comuns (trabalho, comércio, serviço público).</p>`;
}
