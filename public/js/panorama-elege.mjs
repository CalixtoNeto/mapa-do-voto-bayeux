// "O dinheiro elege?": dispersão gasto × votos e a taxa de eleitos por faixa de gasto (faixas com o mesmo número de candidatos).
import { nf, pct } from './formato.mjs';
import { Cartao, ComoLer } from './cartao.mjs';
import { Bloco } from './estrutura.mjs';
import { Colunas } from './graficos.mjs';
import { GraficoGastoVotos } from './grafico-gasto.mjs';
import { eleitosENaoEleitos } from './calculos.mjs';
import { gastoDosEleitos } from './calculos-campanha.mjs';
const { html, useMemo } = window.htmPreact;

const reais = v => `R$ ${nf.format(Math.round(v))}`;
const MINIMO = 8;

function textoDosEleitos(g) {
  if (!g.eleitos) return 'Nenhum dos candidatos com gasto declarado aparece como eleito.';
  const faixa = `Os ${g.eleitos} eleitos gastaram de ${reais(g.minimo)} a ${reais(g.maximo)}.`;
  return `${faixa} O maior gasto do gráfico, ${reais(g.maior.gasto)}, ${g.maior.eleito ? 'elegeu' : 'não elegeu'}. Há muitos candidatos com pouco gasto e pouco voto no canto inferior esquerdo.`;
}

function TaxaPorFaixa({ faixas }) {
  const itens = faixas.map(f => ({ n: `até ${nf.format(Math.round(f.ate))}`, v: f.eleitos / f.candidatos, rotulo: pct(f.eleitos / f.candidatos, 1) }));
  return html`<${Cartao} tipo="Colunas · taxa por faixa" titulo="% de eleitos por faixa de gasto" sub=${`${faixas.length} faixas com o mesmo número de candidatos`}
      nota=${`Em cada coluna: eleitos sobre candidatos da faixa. Faixas pelo gasto, em reais: ${faixas.map(f => `${f.eleitos} de ${f.candidatos}`).join(', ')}.`}>
    <${Colunas} itens=${itens} descricao=${`Taxa de eleitos por faixa de gasto: ${faixas.map(f => `até ${reais(f.ate)}, ${f.eleitos} de ${f.candidatos}`).join('; ')}`} /><//>`;
}

export function DinheiroElege({ linhas, ctx, selecionado, onPick }) {
  const r = useMemo(() => eleitosENaoEleitos(linhas, ctx.eleito), [linhas, ctx]);
  const g = useMemo(() => gastoDosEleitos(linhas, ctx.eleito), [linhas, ctx]);
  if (linhas.filter(l => l.gasto > 0).length < MINIMO || !r.eleitos.n || r.faixas.length < 2) return null;
  const cargo = String(ctx.cands[0].cargoNome || 'candidato').toLowerCase();
  return html`<${Bloco} id="b-elege" titulo="O dinheiro elege?" colunas="dois-tercos"
      lede="Cada ponto é um candidato. Quanto mais à direita, mais gastou; quanto mais alto, mais votos teve. Escala de gasto em log, porque os valores vão de centenas a dezenas de milhares de reais.">
    <${Cartao} tipo="Dispersão · gasto × votos" titulo=${`Gasto e votos de cada candidato a ${cargo}`} nota=${textoDosEleitos(g)}>
      <${GraficoGastoVotos} linhas=${linhas} selecionado=${selecionado} onPick=${k => onPick(ctx.cands.find(c => c.key === k))} eleito=${ctx.eleito} /><//>
    <${TaxaPorFaixa} faixas=${r.faixas} />
    <div class="larga"><${ComoLer} titulo="Como ler: o dinheiro elege?">Mostra associação, não causa: quem já tem mais chance também atrai mais dinheiro.
      Só entram candidatos que declararam gasto. Cada faixa tem o mesmo número de candidatos (quartis de gasto), então as colunas são comparáveis entre si.<//></div><//>`;
}
