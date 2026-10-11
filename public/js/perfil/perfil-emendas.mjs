// Emendas parlamentares para Bayeux: o dinheiro que chegou a quem está na cidade (município, fundos, entidades),
// quem mandou, e as emendas que têm Bayeux como destino, com os convênios assinados.
import { dinheiro, pct } from '../formato.mjs';
import { Aviso } from '../cartao.mjs';
import { CabecalhoDoPerfil } from './cabecalho-perfil.mjs';
import { totalRecebido, maiorOrigem } from './calculos-emendas.mjs';
import { QuantoChegou, QuemMandou } from './emendas-chegada.mjs';
import { Execucao } from './emendas-execucao.mjs';
import { nomeProprio } from './pecas.mjs';
const { html } = window.htmPreact;

function indicadores(e, recente) {
  const origem = maiorOrigem(e.recebido?.porAutor || e.porAutor), desde = e.recebido?.porAno[0]?.[0];
  return [
    { rotulo: desde ? `Recebido desde ${desde}` : 'Empenhado', valor: dinheiro(e.recebido ? totalRecebido(e.recebido) : e.porAno.reduce((s, a) => s + a[1], 0)), nota: e.recebido ? 'por todas as origens' : 'com Bayeux como destino' },
    { rotulo: recente ? `Entrou no caixa em ${recente.ano}` : null, valor: recente?.receitas?.emendas ? dinheiro(recente.receitas.emendas) : null, nota: 'receitas registradas pela Prefeitura' },
    { rotulo: 'Maior origem', valor: origem && pct(origem.fracao, 1), nota: origem && `${nomeProprio(origem.nome)} · ${dinheiro(origem.v)}` }];
}

export function PerfilEmendas({ emendas: e, anos }) {
  const cabecalho = props => html`<${CabecalhoDoPerfil} pagina="emendas" rotulo="Perfil do município · Emendas" titulo="Emendas para Bayeux" ...${props} />`;
  if (!e) return html`<article class="perfil">${cabecalho({})}<${Aviso}>As emendas ainda não foram baixadas do Portal da Transparência.<//></article>`;
  const recente = anos.find(a => a.receitas?.origensDasEmendas?.length) || anos[0];
  return html`<article class="perfil">
    ${cabecalho({ lede: 'Quem mandou o dinheiro, quem recebeu e quanto foi pago. Dados do Portal da Transparência e do TCE-PB.', indicadores: indicadores(e, recente) })}
    ${e.recebido?.porAutor.length > 0 && html`<${QuantoChegou} r=${e.recebido} recente=${recente} /><${QuemMandou} r=${e.recebido} />`}
    <${Execucao} e=${e} />
    <p class="fonte">Fonte: Portal da Transparência (CGU), TCE-PB e receitas registradas pela Prefeitura. O recebido soma os pagamentos ao Município, a fundos municipais e a entidades sem fins lucrativos de Bayeux; empresas da cidade que venderam a outros lugares não entram. Emendas do Orçamento estadual não estão aqui (veja as receitas no perfil da Prefeitura). Percentuais calculados pelo site sobre os valores informados.</p>
  </article>`;
}
