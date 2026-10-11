// Prefeitura: quem governa, valores atípicos, emendas que entraram no caixa e credores ligados a campanhas.
import { nf, dinheiro, sentence } from '../formato.mjs';
import { Bloco } from '../estrutura.mjs';
import { Cartao } from '../cartao.mjs';
import { resumoDaRemuneracao, ligacoesDoCandidato, ligacoesDoAno, mesAno } from './calculos-perfil.mjs';
import { Estatisticas, Ligacoes, nomeProprio } from './pecas.mjs';
import { OrigemDasEmendas } from './origem-das-emendas.mjs';
import { Alertas } from './alertas.mjs';
const { html } = window.htmPreact;

export function Atipicos({ a, anos }) {
  return html`<${Bloco} id="px" titulo=${`Valores atípicos nos pagamentos de ${a.ano}`}
    lede="Contas do site sobre os pagamentos registrados no TCE-PB. Mostram onde olhar com mais atenção; não dizem que algo esteja errado.">
    <${Cartao} classe="largo" tipo="Valores atípicos · conta do site" titulo=${`Pagamentos que se destacam em ${a.ano}`}><${Alertas} a=${a} anos=${anos} /><//><//>`;
}

export function EmendasNoCaixa({ a }) {
  const origens = a.receitas?.origensDasEmendas || [];
  if (!origens.length) return null;
  return html`<${Bloco} id="me" titulo="Emendas que entraram no caixa" colunas="metade"
    lede="Receitas que a Prefeitura registrou como vindas de emendas parlamentares, por origem e tipo.">
    <${Cartao} tipo="Barra empilhada · composição" titulo=${`Origem do que entrou em ${a.ano}`} sub=${`${dinheiro(a.receitas.emendas)}. Cada cor é uma origem.`}
      nota=${html`Veja quem mandou esse dinheiro em <a href="#perfil/emendas">Emendas para Bayeux</a>.`}><${OrigemDasEmendas} origens=${origens} /><//>
  <//>`;
}

function Remuneracao({ p }) {
  const rem = resumoDaRemuneracao(p.remuneracao);
  return html`<${Cartao} tipo="Quem governa" titulo=${nomeProprio(p.nome)} sub=${`Eleito(a) em ${p.ano} com ${nf.format(p.votos)} votos`}>
    ${rem ? html`<${Estatisticas} itens=${[{ rotulo: `Recebido em ${mesAno(rem.mes)}`, valor: dinheiro(rem.valor), nota: sentence(rem.cargo) }]} />`
      : html`<p class="hint">Remuneração não encontrada na folha do TCE-PB.</p>`}<//>`;
}

export function Campanhas({ a, anos, prefeito }) {
  return html`<${Bloco} id="pd" titulo="Campanhas e pagamentos do município" colunas="metade"
    lede="Quem doou ou prestou serviço a campanhas e também aparece entre os credores do município, cruzado pelo documento.">
    ${prefeito && html`<${Remuneracao} p=${prefeito} />`}
    ${prefeito && html`<${Cartao} tipo="Lista · campanha do prefeito(a)" titulo="Da campanha de quem governa" sub="Doadores e fornecedores que também receberam do município">
      <${Ligacoes} ligacoes=${ligacoesDoCandidato(anos, prefeito.chave, prefeito.ano)} /><//>`}
    <${Cartao} classe="largo" tipo="Lista · todas as campanhas" titulo=${`Em ${a.ano}`} sub="Doadores e fornecedores de campanhas que também receberam do município">
      <${Ligacoes} ligacoes=${ligacoesDoAno(a)} comCandidato /><//><//>`;
}
