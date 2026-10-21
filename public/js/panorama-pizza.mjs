// Pizza do eleitorado inteiro de uma eleição: válidos, abstenção e brancos e nulos (três partes que somam os aptos).
import { nf, pct } from './formato.mjs';
import { Cartao } from './cartao.mjs';
import { Rosca } from './graficos.mjs';
import { Sankey } from './sankey.mjs';
import { Alternar } from './alternar.mjs';
import { grafoDoEleitorado } from './calculos-fluxo-eleitorado.mjs';
import { composicaoDoEleitorado } from './calculos-votos.mjs';
import { somaDoComparecimento } from './calculos.mjs';
const { html } = window.htmPreact;

const comParcela = (v, total) => html`${nf.format(v)} <small>${pct(v / total, 1)}</small>`;

// comparecimento: { lugar: [aptos, comparecimento, brancos, nulos] } do cargo; titulo opcional troca o título do cartão.
export function PizzaDoEleitorado({ comparecimento, titulo, tipo = 'Pizza', cargo }) {
  const soma = somaDoComparecimento(comparecimento), c = composicaoDoEleitorado(soma);
  const parte = (nome, v, cor) => ({ nome, v, cor, rotulo: comParcela(v, c.aptos) });
  const partes = [parte('Votos válidos', c.validos, 'var(--s1)'), parte('Abstenção', c.abstencao, 'var(--s0)'), parte('Brancos e nulos', c.brancosENulos, 'var(--s4)')];
  const rosca = html`<${Rosca} cheia partes=${partes} descricao=${`Do eleitorado: ${partes.map(p => `${p.nome} ${nf.format(p.v)}`).join(', ')}`} />`;
  const fluxo = html`<${Sankey} grafo=${grafoDoEleitorado(soma)} formato=${nf.format} altura=${260} descricao="Do eleitorado aos votos válidos, brancos e nulos" />`;
  return html`<${Cartao} tipo=${tipo} titulo=${titulo || `O que fizeram os ${nf.format(c.aptos)} eleitores`} sub=${cargo ? `Três partes que somam o eleitorado inteiro. Votos para ${cargo}.` : 'Três partes que somam o eleitorado inteiro'}
      nota="Pizza só com até três partes. Acima disso, barra empilhada. Abstenção: aptos menos comparecimento; brancos e nulos somados.">
    <${Alternar} rotulo="Forma de ver o eleitorado" visoes=${[{ id: 'pizza', rotulo: 'Pizza', corpo: rosca }, { id: 'fluxo', rotulo: 'Fluxo', corpo: fluxo }]} /><//>`;
}
