// Panorama de um cargo numa eleição, em três páginas feitas de Blocos e Cartões: Votos (mais votados, quem votou em quem, série,
// distribuição, partidos, lugares), Dinheiro (receitas, gastos, o dinheiro elege?, financiadores) e Comparecimento (abstenção e
// eleitorado). Os cartões ficam em panorama-*.mjs. cands: os candidatos do cargo no turno mostrado, como o site os monta (com
// partido); ctx: contexto.mjs.
import { linhasFinanceiras } from './calculos.mjs';
import { Bloco } from './estrutura.mjs';
import { QuemVotouEmQuem } from './panorama-quem-votou.mjs';
import { DistribuicaoDosVotos } from './panorama-distribuicao.mjs';
import { Partidos } from './panorama-eleitos.mjs';
import { PerfilDoCargo } from './panorama-partidos.mjs';
import { Redutos } from './panorama-reduto.mjs';
import { criarLugares } from './panorama-lugares.mjs';
import { criarAbertura } from './panorama-abertura.mjs';
import { criarDinheiro } from './panorama-dinheiro.mjs';
import { criarComparecimento } from './panorama-comparecimento.mjs';
import { MaisVotados } from './panorama-ranking.mjs';
const { html, useMemo } = window.htmPreact;

const MUITOS_CANDIDATOS = 12;

export function criarPanorama(cfg) {
  const { Disputas, EleitoradoDosMaisVotados } = criarLugares(cfg);
  const usarLinhas = (cands, financas) => useMemo(() => linhasFinanceiras(cands, financas, cfg.chaveDe), [cands, financas]);
  function Votos({ cands, perfis, selecionado, onPick, ctx }) {
    const linhas = usarLinhas(cands, ctx?.financas);
    if (!cands.length) return null;
    return html`<${QuemVotouEmQuem} cfg=${cfg} cands=${cands} ctx=${ctx} />
      ${!cfg.ehMajoritario(cands[0]) && cands.length > MUITOS_CANDIDATOS && html`<${DistribuicaoDosVotos} cands=${cands} ctx=${ctx} />`}
      <${Bloco} id="b-partidos" titulo="Partidos e candidatos" colunas="metade" lede="Os partidos em hierarquia e quem disputou e quem se elegeu.">
        ${ctx && html`<${Partidos} linhas=${linhas} ctx=${ctx} onPick=${onPick} />`}
        ${perfis && html`<${PerfilDoCargo} cfg=${cfg} cands=${cands} perfis=${perfis} />`}<//>
      ${ctx && html`<${Bloco} id="b-lugares" titulo=${`Onde o voto está, por ${cfg.lugarNome}`}
          lede=${`Quem tem voto de reduto, onde as disputas foram mais apertadas e o perfil do eleitorado de onde vêm os votos.`}>
        <${Redutos} cfg=${cfg} cands=${cands} selecionado=${selecionado} onPick=${onPick} />
        <${Disputas} ctx=${ctx} /><${EleitoradoDosMaisVotados} ctx=${ctx} /><//>`}`;
  }
  return { Abertura: criarAbertura(cfg), MaisVotados, Votos, Dinheiro: criarDinheiro(cfg), Comparecimento: criarComparecimento(cfg) };
}
