// Página de perfis: a lista (#perfis) e o perfil de cada um (#perfil/prefeitura, #perfil/camara,
// #perfil/emendas, #perfil/nome-do-vereador). Só existe no site de Bayeux.
import { nf, pct, dinheiro } from '../formato.mjs';
import { usarPerfis, usarRota } from './dados-perfil.mjs';
import { slug, taxa, vereadoresEmOrdem } from './calculos-perfil.mjs';
import { Secao, nomeProprio } from './pecas.mjs';
import { PerfilVereador } from './perfil-vereador.mjs';
import { PerfilPrefeitura } from './perfil-prefeitura.mjs';
import { PerfilCamara } from './perfil-camara.mjs';
import { PerfilEmendas } from './perfil-emendas.mjs';
export { ehRotaDePerfil } from './dados-perfil.mjs';
const { html } = window.htmPreact;

function ListaDeVereadores({ vereadores }) {
  return html`<ul class="lista-perfis">${vereadoresEmOrdem(vereadores).map(v => html`<li><a href=${'#perfil/' + slug(v.nome)} class=${v.emExercicio ? '' : 'fora'}>
    <span class="n">${v.nome}<small>${v.partido || 'sem partido'}${v.emExercicio ? '' : ' · fora do mandato'}</small></span>
    <span class="m">${taxa(v.presenca) == null ? '' : `${pct(taxa(v.presenca), 0)} de presença`}<small>${nf.format(v.materias.total)} matérias</small></span></a></li>`)}</ul>`;
}

function Inicio({ dados }) {
  const { camara, emendas, anos } = dados, prefeito = anos[0]?.prefeito;
  const recebido = emendas ? (emendas.recebido?.porAno || emendas.porAno).reduce((s, a) => s + a[1], 0) : 0;
  return html`<article class="perfil">
    <header class="who"><h1>Quem governa Bayeux</h1><p>Prefeitura, Câmara e as emendas que chegam à cidade, com os dados do TCE-PB, da Câmara Municipal e do Portal da Transparência.</p></header>
    <ul class="lista-perfis destaque">
      ${anos.length > 0 && html`<li><a href="#perfil/prefeitura"><span class="n">${prefeito ? nomeProprio(prefeito.nome) : 'Prefeitura'}<small>Prefeitura · gastos, folha, licitações e campanha</small></span><span class="m">${dinheiro(anos[0].despesas?.orgaos.reduce((s, o) => s + o[2], 0) || 0)}<small>pagos em ${anos[0].ano}</small></span></a></li>`}
      ${camara && html`<li><a href="#perfil/camara"><span class="n">Câmara Municipal<small>${camara.vereadores.filter(v => v.emExercicio).length} vereadores em exercício</small></span><span class="m">${nf.format(camara.sessoes)} sessões<small>${nf.format(camara.votacoesNominais)} votações nominais</small></span></a></li>`}
      ${emendas && html`<li><a href="#perfil/emendas"><span class="n">Emendas para Bayeux<small>quem mandou e quem recebeu</small></span><span class="m">${dinheiro(recebido)}<small>${emendas.recebido ? 'recebidos' : 'empenhados'}</small></span></a></li>`}
    </ul>
    ${camara && html`<${Secao} id="iv" titulo="Vereadores"><${ListaDeVereadores} vereadores=${camara.vereadores} /><//>`}
  </article>`;
}

export function PaginaDePerfis({ aoVerNoMapa }) {
  const dados = usarPerfis(), rota = usarRota();
  if (!dados) return html`<p class="hint">Carregando os perfis…</p>`;
  if (dados.vazio) return html`<p class="hint">Os perfis ainda não foram gerados.</p>`;
  const alvo = rota.replace(/^perfil\//, '');
  if (alvo === 'prefeitura') return html`<${PerfilPrefeitura} anos=${dados.anos} aoVerNoMapa=${aoVerNoMapa} />`;
  if (alvo === 'camara') return html`<${PerfilCamara} camara=${dados.camara} anos=${dados.anos} />`;
  if (alvo === 'emendas') return html`<${PerfilEmendas} emendas=${dados.emendas} />`;
  const v = dados.camara?.vereadores.find(x => slug(x.nome) === alvo);
  return v ? html`<${PerfilVereador} v=${v} camara=${dados.camara} anos=${dados.anos} aoVerNoMapa=${aoVerNoMapa} />` : html`<${Inicio} dados=${dados} />`;
}
