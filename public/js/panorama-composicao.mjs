// "Como cada eleição se divide": barras 100% (válidos, brancos e nulos, abstenção) por eleição do mesmo tipo e a pizza de uma só.
import { pct } from './formato.mjs';
import { Cartao } from './cartao.mjs';
import { Bloco } from './estrutura.mjs';
import { Pilhas100 } from './colunas-pilhas.mjs';
import { PizzaDoEleitorado } from './panorama-pizza.mjs';
import { composicaoDoEleitorado } from './calculos-votos.mjs';
const { html } = window.htmPreact;

function linhaDaEleicao(e) {
  const c = composicaoDoEleitorado(e), p = v => v / c.aptos;
  const parte = (nome, v, cor) => ({ nome, v, cor, texto: pct(p(v), 1) });
  return { nome: e.ano, rotulo: `${pct(p(c.validos), 1)} válidos · ${pct(p(c.brancosENulos), 1)} brancos e nulos · ${pct(p(c.abstencao), 1)} abstenção`,
    partes: [parte('Votos válidos', c.validos, 'var(--s1)'), parte('Brancos e nulos', c.brancosENulos, 'var(--s4)'), parte('Abstenção', c.abstencao, 'var(--s0)')] };
}

export function ComposicaoPorEleicao({ eleicoes, tipo, comparecimento, ano, cargoNome }) {
  const lista = eleicoes.filter(e => e.tipo === tipo && e.aptos > 0).sort((a, b) => a.ano - b.ano);
  if (!lista.length) return null;
  const nomeTipo = tipo === 'municipal' ? 'municipal' : 'geral', ref = tipo === 'municipal' ? 'prefeito' : 'governador';
  return html`<${Bloco} id="b-composicao" titulo=${`Como cada eleição ${nomeTipo} se divide`} colunas="dois-tercos"
      lede="Barras 100% empilhadas para comparar a composição; pizza para destrinchar uma só eleição.">
    <${Cartao} tipo="Barras 100% empilhadas · composição por eleição" titulo="Votos válidos, brancos e nulos, e abstenção"
        nota=${`Cada barra é o eleitorado inteiro daquele ano (os mesmos 100%). Brancos e nulos: votos para ${ref}.`}>
      <ul class="legenda-linha"><li><i style="background:var(--s1)"></i>Votos válidos</li><li><i style="background:var(--s4)"></i>Brancos e nulos</li><li><i style="background:var(--s0)"></i>Abstenção</li></ul>
      <div class="pilhas-texto"><${Pilhas100} linhas=${lista.map(linhaDaEleicao)} descricao=${`Composição do eleitorado nas eleições ${nomeTipo}s, em % dos aptos`} /></div><//>
    ${comparecimento && html`<${PizzaDoEleitorado} comparecimento=${comparecimento} tipo="Pizza · uma eleição" cargo=${cargoNome}
      titulo=${`Os eleitores aptos de ${ano}`} />`}<//>`;
}
