// Prefeitura: folha por vínculo, servidores mês a mês, licitações por modalidade e maiores credores.
import { nf, dinheiro, sentence } from '../formato.mjs';
import { Bloco } from '../estrutura.mjs';
import { Cartao, Aviso } from '../cartao.mjs';
import { Pilha } from '../graficos.mjs';
import { Sparkline } from '../sparkline.mjs';
import { Ranking } from '../ranking.mjs';
import { ArvoreDeBarras } from '../arvore.mjs';
import { partesComResto } from '../calculos-graficos.mjs';
import { mesAno } from './calculos-perfil.mjs';
import { maioresCredores } from './calculos-municipio.mjs';
import { comParticipacao } from './calculos-fatias.mjs';
import { participacao } from './formato-perfil.mjs';
import { Desdobrar } from './desdobrar.mjs';
import { nomeProprio } from './pecas.mjs';
const { html } = window.htmPreact;

const CORES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
const arvoreDe = (detalhe, id) => detalhe?.arvores?.[id]?.v > 0 ? detalhe.arvores[id] : null;
const rotuloDoVencedor = (nome, nivel) => nivel === 1 && !/^Outros \(/.test(nome) ? nomeProprio(nome) : sentence(nome);

function Folha({ a, detalhe }) {
  const total = a.servidores.tipos.reduce((s, t) => s + t[2], 0), arvore = arvoreDe(detalhe, 'folha');
  const partes = partesComResto(a.servidores.tipos.map(([nome, , v]) => ({ nome, v })), CORES, 'var(--s0)')
    .map(p => ({ ...p, rotulo: `${dinheiro(p.v)} · ${participacao(p.v, total)}` }));
  return html`<${Cartao} tipo="Barra empilhada · composição" titulo="Folha por tipo de vínculo" sub=${`${dinheiro(total)} pagos em ${a.ano}. Cada cor é uma parte do total.`}
    nota=${`Pessoas no último mês publicado: ${a.servidores.tipos.map(([tipo, n]) => `${tipo.toLowerCase()} ${nf.format(n)}`).join(' · ')}.`}>
    <${Pilha} partes=${partes} descricao=${'Folha por tipo de vínculo: ' + partes.map(p => `${p.nome} ${p.rotulo}`).join('; ')} />
    ${arvore && html`<${Desdobrar} titulo="Abrir por tipo de cargo e órgão"><${ArvoreDeBarras} arvore=${arvore} /><//>`}<//>`;
}

function Servidores({ a }) {
  const meses = a.servidores.meses, [primeiro, ultimo] = [meses[0], meses[meses.length - 1]];
  return html`<${Cartao} tipo="Sparkline · tendência" titulo="Servidores pagos por mês" sub=${`${mesAno(primeiro[0])} a ${mesAno(ultimo[0])}`}
    nota=${`Sem eixos nem grade: serve para mostrar a direção ao lado de um número. De ${nf.format(primeiro[1])} em ${mesAno(primeiro[0])} a ${nf.format(ultimo[1])} em ${mesAno(ultimo[0])}.`}>
    <div class="numero-grande"><div><b>${nf.format(ultimo[1])}</b><small>em ${mesAno(ultimo[0])}</small></div>
      <${Sparkline} valores=${meses.map(m => m[1])} descricao=${`Servidores pagos por mês: ${meses.map(m => `${mesAno(m[0])}, ${nf.format(m[1])}`).join('; ')}`} /></div><//>`;
}

function Licitacoes({ a, detalhe }) {
  const lista = comParticipacao(a.licitacoes.modalidades.map(([n, processos, v]) => ({ n, v, processos }))), total = lista.reduce((s, m) => s + m.v, 0);
  const arvore = arvoreDe(detalhe, 'licitacoes');
  return html`<${Cartao} tipo="Barra horizontal · ranking" titulo="Licitações por modalidade" sub=${`${dinheiro(total)} em propostas vencedoras. A barra compara o valor.`}>
    <${Ranking} descricao="Licitações por modalidade" itens=${lista.map(m => ({ n: m.n, nota: `${nf.format(m.processos)} ${m.processos === 1 ? 'processo' : 'processos'}`, v: m.v, rotulo: dinheiro(m.v), lado: m.v ? participacao(m.v, total) : '—' }))} />
    ${arvore && html`<${Desdobrar} titulo="Ver quem venceu, por modalidade"><${ArvoreDeBarras} arvore=${arvore} rotulo=${rotuloDoVencedor} /><//>`}<//>`;
}

function Credores({ a }) {
  const lista = maioresCredores(a.despesas?.credores || [], 40);
  return html`<${Cartao} classe="largo" tipo="Barra horizontal · ranking" titulo="Maiores credores" sub=${`Valores pagos em ${a.ano}, sem contar a própria Prefeitura`}>
    <${Ranking} descricao="Maiores credores" itens=${lista.map(c => ({ n: nomeProprio(c.n), nota: c.vezes > 1 ? `${nf.format(c.vezes)} pagamentos` : null, v: c.v, rotulo: dinheiro(c.v) }))} />
    <${Aviso}>Valores atípicos são contas do site sobre os dados do TCE-PB, não julgamento sobre os fornecedores.<//><//>`;
}

export function FolhaLicitacoesCredores({ a, detalhe }) {
  return html`<${Bloco} id="pf" titulo="Folha, licitações e quem recebe" colunas="tres"
    lede="A folha dividida por vínculo, os servidores mês a mês, as licitações por modalidade e quem mais recebeu da Prefeitura.">
    ${a.servidores && html`<${Folha} a=${a} detalhe=${detalhe} />`}${a.servidores?.meses?.length > 0 && html`<${Servidores} a=${a} />`}
    ${a.licitacoes?.modalidades.length > 0 && html`<${Licitacoes} a=${a} detalhe=${detalhe} />`}${a.despesas?.credores?.length > 0 && html`<${Credores} a=${a} />`}<//>`;
}
