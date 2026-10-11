// Perfil da Prefeitura: o dinheiro do município em cada ano publicado pelo TCE-PB, quem governa e as campanhas ligadas aos credores.
import { nf } from '../formato.mjs';
import { Aviso } from '../cartao.mjs';
import { anoParcial } from './calculos-municipio.mjs';
import { CabecalhoDoPerfil } from './cabecalho-perfil.mjs';
import { indicadoresDoAno } from './indicadores-prefeitura.mjs';
import { ParaOndeVai, AoLongoDoTempo } from './prefeitura-dinheiro.mjs';
import { FolhaLicitacoesCredores } from './prefeitura-pessoas.mjs';
import { Atipicos, EmendasNoCaixa, Campanhas } from './prefeitura-governo.mjs';
import { nomeProprio } from './pecas.mjs';
import { usarDetalhe } from './dados-perfil.mjs';
const { html, useState } = window.htmPreact;

function Anos({ anos, ano, setAno }) {
  return html`<div class="chips seletor-ano" role="radiogroup" aria-label="Ano">${anos.map(a =>
    html`<button type="button" role="radio" aria-checked=${a.ano === ano} onClick=${() => setAno(a.ano)}>${a.ano}</button>`)}</div>`;
}

const ledeDoPrefeito = p => p ? `${nomeProprio(p.nome)}, eleito(a) em ${p.ano} com ${nf.format(p.votos)} votos. Gastos, folha, licitações e campanha, com dados do TCE-PB.`
  : 'Gastos, folha, licitações e campanha, com dados do TCE-PB.';

export function PerfilPrefeitura({ anos, aoVerNoMapa }) {
  const [ano, setAno] = useState(anos[0]?.ano);
  const a = anos.find(x => x.ano === ano) || anos[0], prefeito = anos[0]?.prefeito, detalhe = usarDetalhe(a?.ano);
  if (!a) return html`<article class="perfil"><${CabecalhoDoPerfil} pagina="prefeitura" rotulo="Perfil do município · Prefeitura" titulo="Prefeitura de Bayeux" /><${Aviso}>O TCE-PB ainda não tem dados de Bayeux.<//></article>`;
  return html`<article class="perfil">
    <${CabecalhoDoPerfil} pagina="prefeitura" rotulo=${`Perfil do município · Prefeitura · ${a.ano}${anoParcial(a) ? ', parcial' : ''}`} titulo="Prefeitura de Bayeux"
      lede=${ledeDoPrefeito(prefeito)} indicadores=${indicadoresDoAno(a)}>
      ${prefeito && html`<button type="button" class="link" onClick=${() => aoVerNoMapa(prefeito.ano, prefeito.chave)}>Ver os votos de ${prefeito.ano} no mapa</button>`}
      <${Anos} anos=${anos} ano=${a.ano} setAno=${setAno} /><//>
    ${a.prefeito && a.prefeito.chave !== prefeito?.chave && html`<${Aviso}>Em ${a.ano}, o prefeito eleito era ${nomeProprio(a.prefeito.nome)} (eleição de ${a.prefeito.ano}).<//>`}
    <${ParaOndeVai} a=${a} detalhe=${detalhe} /><${AoLongoDoTempo} anos=${anos} a=${a} />
    <${FolhaLicitacoesCredores} a=${a} detalhe=${detalhe} /><${Atipicos} a=${a} anos=${anos} />
    <${EmendasNoCaixa} a=${a} /><${Campanhas} a=${a} anos=${anos} prefeito=${prefeito} />
    <p class="fonte">Fonte: TCE-PB (Sagres: despesas, folha, receitas e licitações da Prefeitura, da Câmara e dos demais órgãos municipais) e TSE. Valores em reais correntes. Mudanças de prefeito no meio do mandato (cassação, renúncia) não aparecem aqui.</p>
  </article>`;
}
