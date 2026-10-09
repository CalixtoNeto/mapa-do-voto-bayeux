// Perfil da Prefeitura: quem governa (eleição, votos, remuneração, credores ligados à campanha) e o dinheiro
// do município em cada ano publicado pelo TCE-PB.
import { nf, dinheiro, sentence } from '../formato.mjs';
import { resumoDaRemuneracao, ligacoesDoCandidato, ligacoesDoAno, mesAno } from './calculos-perfil.mjs';
import { Voltar, Topo, Estatisticas, Secao, Ligacoes, nomeProprio } from './pecas.mjs';
import { NumerosDoAno, GastosDoAno, FolhaDoAno, LicitacoesDoAno, EmendasRecebidas } from './paineis-municipio.mjs';
const { html, useState } = window.htmPreact;

function Prefeito({ p, anos, aoVerNoMapa }) {
  const rem = resumoDaRemuneracao(p.remuneracao);
  return html`<${Topo} titulo=${nomeProprio(p.nome)} linhas=${[`Prefeito(a) eleito(a) em ${p.ano}`, `${nf.format(p.votos)} votos`]}>
      <button type="button" class="link" onClick=${() => aoVerNoMapa(p.ano, p.chave)}>Ver os votos de ${p.ano} no mapa</button><//>
    <${Estatisticas} itens=${[rem && { rotulo: `Recebido em ${mesAno(rem.mes)}`, valor: dinheiro(rem.valor), nota: sentence(rem.cargo) }]} />
    <${Secao} id="pc" titulo="Campanha e credores do município"><${Ligacoes} ligacoes=${ligacoesDoCandidato(anos, p.chave, p.ano)} /><//>`;
}

function Anos({ anos, ano, setAno }) {
  return html`<div class="chips" role="radiogroup" aria-label="Ano">${anos.map(a =>
    html`<button type="button" role="radio" aria-checked=${a.ano === ano} onClick=${() => setAno(a.ano)}>${a.ano}</button>`)}</div>`;
}

export function PerfilPrefeitura({ anos, aoVerNoMapa }) {
  const [ano, setAno] = useState(anos[0]?.ano);
  const a = anos.find(x => x.ano === ano) || anos[0], prefeito = anos[0]?.prefeito;
  if (!a) return html`<article class="perfil"><${Voltar} /><p class="hint">O TCE-PB ainda não tem dados de Bayeux.</p></article>`;
  return html`<article class="perfil">
    <${Voltar} />
    ${prefeito ? html`<${Prefeito} p=${prefeito} anos=${anos} aoVerNoMapa=${aoVerNoMapa} />` : html`<${Topo} titulo="Prefeitura de Bayeux" />`}
    <h2 class="perfil-ano">O município em</h2><${Anos} anos=${anos} ano=${a.ano} setAno=${setAno} />
    ${a.prefeito && a.prefeito.chave !== prefeito?.chave && html`<p class="hint">Em ${a.ano}, o prefeito eleito era ${nomeProprio(a.prefeito.nome)} (eleição de ${a.prefeito.ano}).</p>`}
    <${NumerosDoAno} a=${a} /><${GastosDoAno} a=${a} /><${FolhaDoAno} a=${a} /><${LicitacoesDoAno} a=${a} /><${EmendasRecebidas} a=${a} />
    <${Secao} id="pd" titulo=${`Doadores e fornecedores de campanhas que receberam do município em ${a.ano}`}><${Ligacoes} ligacoes=${ligacoesDoAno(a)} comCandidato /><//>
    <p class="hint">Fontes: TCE-PB (Sagres: despesas, folha, receitas e licitações da Prefeitura, da Câmara e dos demais órgãos municipais) e TSE. Mudanças de prefeito no meio do mandato (cassação, renúncia) não aparecem aqui.</p>
  </article>`;
}
