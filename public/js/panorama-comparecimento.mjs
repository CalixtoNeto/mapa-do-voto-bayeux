// Página Comparecimento do panorama: abstenção no tempo, composição de cada eleição, eleitorado por lugar e variação da abstenção.
import { Bloco } from './estrutura.mjs';
import { tipoDaEleicao } from './calculos-series.mjs';
import { usarComparecimentos, usarEleitoradoPorLugar } from './dados-series.mjs';
import { AbstencaoAoLongoDoTempo } from './panorama-abstencao.mjs';
import { ComposicaoPorEleicao } from './panorama-composicao.mjs';
import { EleitoradoPorLugar } from './panorama-eleitorado.mjs';
import { criarAbstencaoPorLugar } from './panorama-lugares-abstencao.mjs';
const { html, useMemo } = window.htmPreact;

export function criarComparecimento(cfg) {
  const AbstencaoPorLugar = criarAbstencaoPorLugar(cfg);
  return function Comparecimento({ ctx }) {
    const eleicoes = usarComparecimentos(cfg), serie = usarEleitoradoPorLugar(cfg);
    const tipo = tipoDaEleicao(ctx?.ds?.cargos || []);
    const anos = useMemo(() => (eleicoes || []).filter(e => e.tipo === tipo && serie?.porAno?.[e.ano]).map(e => e.ano).sort(), [eleicoes, serie, tipo]);
    if (eleicoes === undefined) return html`<p class="hint" role="status">Carregando as eleições…</p>`;
    if (!eleicoes?.length) return html`<p class="hint">Os arquivos de comparecimento das outras eleições não estão disponíveis.</p>`;
    return html`<${AbstencaoAoLongoDoTempo} eleicoes=${eleicoes} />
      <${ComposicaoPorEleicao} eleicoes=${eleicoes} tipo=${tipo} comparecimento=${ctx?.comparecimento} ano=${ctx?.ds?.ano} cargoNome=${String(ctx?.cands?.[0]?.cargoNome || '').toLowerCase()} />
      <${EleitoradoPorLugar} cfg=${cfg} serie=${serie} anos=${anos} />
      ${ctx?.comparecimento && ctx.comparecimentoAnterior && html`<${Bloco} id="b-abstencao-lugar" titulo=${`Abstenção por ${cfg.lugarNome}`}
          lede=${`Quanto a abstenção mudou em cada ${cfg.lugarNome} desde a eleição anterior da mesma disputa.`}><${AbstencaoPorLugar} ctx=${ctx} /><//>`}`;
  };
}
